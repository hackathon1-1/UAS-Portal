import asyncio
import mujoco
import numpy as np
from fastapi import WebSocket
from mujoco import MjModel, MjData, mj_resetData, mj_step

# Base XML structure for the drone
BASE_XML = """
<mujoco model="drone">
  <compiler angle="degree" coordinate="local" inertiafromgeom="true"/>
  <option integrator="RK4" timestep="0.01"/>
  <worldbody>
    <light diffuse=".5 .5 .5" pos="0 0 5" dir="0 0 -1"/>
    <geom type="plane" size="10 10 0.1" rgba=".9 .9 .9 1"/>
    <body name="drone_body" pos="0 0 1" euler="180 0 0">
      <joint type="free"/>
      <geom type="sphere" size="0.25 0.25 0.1" rgba="0.8 0.8 0.8 1" mass="0.5" name="drone_geom"/>
      {geoms}
    </body>
  </worldbody>
</mujoco>
"""

def create_drone_xml(selected_parts):
    """Creates the drone XML model based on selected parts."""
    geoms = ''
    # The main drone body is now the GLB mesh.
    # We can still add other geoms for accessories or components.
    
    # Example: Add a payload placeholder
    if 'Payload' in selected_parts:
        geoms += '<geom name="payload" type="box" size="0.05 0.05 0.05" pos="0 0 -0.1" rgba="0.8 0.2 0.2 1" mass="0.1"/>'

    return BASE_XML.format(geoms=geoms)


def check_geometry_collision(point, geom):
    """Checks if a point collides with a MuJoCo geometry."""
    if geom['type'] == 0:  # Skip plane
        return False

    point = np.array(point)
    geom_pos = np.array(geom['pos'])
    geom_mat = np.array(geom['mat']).reshape(3, 3)

    # Transform point to geometry's local frame
    local_point = point - geom_pos
    # Note: MuJoCo's xmat is a rotation matrix. Its inverse is its transpose.
    # Using transpose is faster than np.linalg.inv().
    local_point = local_point @ geom_mat.T

    size = geom['size']
    geom_type = geom['type']

    if geom_type == 2:  # Sphere / Ellipsoid
        radii = np.array(size)
        # A sphere in MuJoCo has size = [radius, 0, 0]. An ellipsoid has [rx, ry, rz].
        # This logic handles both cases correctly.
        if radii[1] < 1e-6: radii[1] = radii[0]
        if radii[2] < 1e-6: radii[2] = radii[0]
        
        # Avoid division by zero.
        if np.any(radii < 1e-6): return False

        scaled_point = local_point / radii
        return np.sum(scaled_point**2) < 1
    elif geom_type == 3:  # Capsule
        height = size[1]
        radius = size[0]
        # In local coords, capsule is aligned with z-axis.
        # Check radial distance and height.
        cylinder_dist = np.sqrt(local_point[0]**2 + local_point[1]**2)
        # Check against cylinder body
        in_cylinder = cylinder_dist < radius and abs(local_point[2]) < height
        # Check against spherical caps
        in_caps = np.linalg.norm(local_point - np.array([0,0,np.sign(local_point[2])*height])) < radius if abs(local_point[2]) > height else False
        return in_cylinder or in_caps
    elif geom_type == 5:  # Cylinder
        cyl_radius = size[0]
        cyl_height = size[1]
        cyl_dist = np.sqrt(local_point[0]**2 + local_point[1]**2)
        return cyl_dist < cyl_radius and abs(local_point[2]) < cyl_height
    elif geom_type == 6:  # Box
        return all(abs(local_point) < size)
    return False

def calculate_flow_deflection(position, velocity, geom, deflection_strength=2.0):
    """Calculates wind flow deflection around a geometry."""
    if geom['type'] == 0:  # Skip plane
        return np.zeros(3)

    position = np.array(position)
    velocity = np.array(velocity)
    geom_pos = np.array(geom['pos'])
    
    to_geom = geom_pos - position
    distance = np.linalg.norm(to_geom)
    
    geom_type = geom['type']
    size = geom['size']
    
    effective_radius = 1.0
    if geom_type == 2: # Sphere / Ellipsoid
        effective_radius = max(size) * 1.5
    elif geom_type == 3: # Capsule
        effective_radius = max(size[0], size[1]) * 1.5
    elif geom_type == 5: # Cylinder
        effective_radius = size[0] * 1.5
    elif geom_type == 6: # Box
        effective_radius = max(size) * 1.5
    
    if distance > effective_radius * 3 or distance == 0:
        return np.zeros(3)

    influence_ratio = max(0, 1 - distance / (effective_radius * 3))
    deflection_magnitude = deflection_strength * influence_ratio**2
    
    velocity_norm = np.linalg.norm(velocity)
    velocity_dir = velocity / velocity_norm if velocity_norm > 0 else np.array([1, 0, 0])
    to_geom_dir = to_geom / distance

    deflection_dir = np.cross(velocity_dir, to_geom_dir)
    deflection_norm = np.linalg.norm(deflection_dir)
    
    if deflection_norm < 0.1:
        # If vectors are parallel, create arbitrary perpendicular vector
        arbitrary_vec = np.array([1, 0, 0]) if np.allclose(to_geom_dir, [0,1,0]) or np.allclose(to_geom_dir, [0,-1,0]) else np.array([0,1,0])
        deflection_dir = np.cross(arbitrary_vec, to_geom_dir)
        deflection_norm = np.linalg.norm(deflection_dir)

    if deflection_norm > 0:
        deflection_dir /= deflection_norm
        
    # Add some upward/downward component based on geometry position relative to flow
    upward_bias = 0.3 if position[2] < geom_pos[2] else -0.3
    deflection_dir[2] += upward_bias
    
    deflection_norm_final = np.linalg.norm(deflection_dir)
    if deflection_norm_final > 0:
        deflection_dir /= deflection_norm_final

    return deflection_dir * deflection_magnitude

class UASBuilderEnv:
    """
    A MuJoCo-based environment for simulating a UAS build.
    """
    def __init__(self):
        self.selected_parts = {}
        self.wind_enabled = False
        self.wind_speed = 8.0 # Default wind speed

        # Wind particle simulation state
        self.wind_particles = None
        self.wind_particle_velocities = None
        self.wind_particle_lifetimes = None
        self.wind_particle_colors = None
        self.PARTICLE_COUNT = 8000
        self.MAX_LIFE = 400 # frames
        self.TUNNEL_LENGTH = 120
        self.TUNNEL_WIDTH = 120
        self.TUNNEL_HEIGHT = 120
        
        self.rebuild_model()

    def rebuild_model(self):
        xml = create_drone_xml(self.selected_parts)
        try:
            self.model = MjModel.from_xml_string(xml)
            self.data = MjData(self.model)
            print("MuJoCo model rebuilt successfully.")
        except Exception as e:
            print(f"Error rebuilding MuJoCo model: {e}")
            # Fallback to a default empty model
            self.model = MjModel.from_xml_string(create_drone_xml({}))
            self.data = MjData(self.model)

    def _initialize_wind_particles(self):
        """Initializes the wind particles."""
        drone_pos = self.data.body("drone_body").xpos
        
        self.wind_particles = np.zeros((self.PARTICLE_COUNT, 3))
        self.wind_particle_velocities = np.zeros((self.PARTICLE_COUNT, 3))
        self.wind_particle_colors = np.ones((self.PARTICLE_COUNT, 3))
        self.wind_particle_lifetimes = np.random.rand(self.PARTICLE_COUNT) * self.MAX_LIFE

        for i in range(self.PARTICLE_COUNT):
            self.wind_particles[i, 0] = drone_pos[0] - self.TUNNEL_LENGTH / 2 + np.random.uniform(-5, 0)
            self.wind_particles[i, 1] = drone_pos[1] + np.random.uniform(-self.TUNNEL_WIDTH/2, self.TUNNEL_WIDTH/2)
            self.wind_particles[i, 2] = drone_pos[2] + np.random.uniform(-self.TUNNEL_HEIGHT/2, self.TUNNEL_HEIGHT/2)
            self.wind_particle_velocities[i, 0] = self.wind_speed

    def _step_wind_particles(self):
        """Steps the wind particle simulation."""
        if self.wind_particles is None:
            self._initialize_wind_particles()

        drone_geoms = self.get_geoms()
        drone_pos = self.data.body("drone_body").xpos
        dt = 0.02 # Corresponds to frontend sleep and simulation rate

        for i in range(self.PARTICLE_COUNT):
            self.wind_particle_lifetimes[i] += 1
            
            pos = self.wind_particles[i]
            vel = self.wind_particle_velocities[i]
            
            # Reset velocity to uniform wind tunnel flow
            vel[0] = self.wind_speed
            vel[1] = 0
            vel[2] = 0
            
            # Apply deflections
            total_deflection = np.zeros(3)
            near_geometry = False
            for geom in drone_geoms:
                if geom.get('type') != 0:
                    deflection = calculate_flow_deflection(pos, vel, geom, 5.0)
                    total_deflection += deflection

                    # Check for proximity
                    geom_pos_check = np.array(geom['pos'])
                    distance = np.linalg.norm(pos - geom_pos_check)
                    eff_radius = max(geom['size']) * 3
                    if distance < eff_radius:
                        near_geometry = True

            vel += total_deflection
            
            # Collision
            for geom in drone_geoms:
                if check_geometry_collision(pos, geom):
                    geom_pos = np.array(geom['pos'])
                    away_from_geom = pos - geom_pos
                    norm = np.linalg.norm(away_from_geom)
                    if norm > 0:
                        away_from_geom /= norm
                    
                    effective_radius = max(geom['size']) * 1.2
                    pos = geom_pos + away_from_geom * effective_radius
                    
                    vel = away_from_geom * 6.0
                    vel[0] = max(vel[0], 3.0)
                    break
            
            vel[0] = max(vel[0], 2.0)
            
            pos += vel * dt
            
            self.wind_particles[i] = pos
            self.wind_particle_velocities[i] = vel
            
            # Color based on speed and proximity
            speed = np.linalg.norm(vel)
            if near_geometry:
                turbulence = min(speed / 10, 1)
                self.wind_particle_colors[i] = [1.0, 0.5 - turbulence * 0.3, 0.1]
            elif speed > 20:
                self.wind_particle_colors[i] = [1.0, 0.1, 0.1]
            elif speed > 10:
                self.wind_particle_colors[i] = [0.8, 1.0, 0.2]
            else:
                self.wind_particle_colors[i] = [0.2, 0.5, 1.0]

            # Reset condition
            out_of_bounds = (
                pos[0] > drone_pos[0] + self.TUNNEL_LENGTH / 2 or
                abs(pos[1] - drone_pos[1]) > self.TUNNEL_WIDTH / 2 or
                abs(pos[2] - drone_pos[2]) > self.TUNNEL_HEIGHT / 2
            )
            
            if out_of_bounds or self.wind_particle_lifetimes[i] > self.MAX_LIFE:
                self.wind_particles[i, 0] = drone_pos[0] - self.TUNNEL_LENGTH / 2 + np.random.uniform(-5, 0)
                self.wind_particles[i, 1] = drone_pos[1] + np.random.uniform(-self.TUNNEL_WIDTH/2, self.TUNNEL_WIDTH/2)
                self.wind_particles[i, 2] = drone_pos[2] + np.random.uniform(-self.TUNNEL_HEIGHT/2, self.TUNNEL_HEIGHT/2)
                self.wind_particle_lifetimes[i] = 0
                self.wind_particle_velocities[i] = [self.wind_speed, 0, 0]

    def reset(self):
        mj_resetData(self.model, self.data)
        self._initialize_wind_particles()
        return self.get_state()

    def step(self):
        if self.wind_enabled:
            self._step_wind_particles()
        mj_step(self.model, self.data)
        return self.get_state()

    def get_geoms(self):
        """Helper to get a list of all geometries and their current state."""
        geoms = []
        for i in range(self.model.ngeom):
            geom = self.model.geom(i)
            geom_data = self.data.geom(i)
            geoms.append({
                "name": geom.name,
                "type": int(geom.type[0]),
                "pos": geom_data.xpos.tolist(),
                "mat": geom_data.xmat.flatten().tolist(),
                "size": geom.size.tolist(),
                "rgba": geom.rgba.tolist(),
            })
        return geoms

    def calculate_wind_data(self):
        """Calculates wind streamlines and arrows for visualization."""
        if not self.wind_enabled or self.wind_speed <= 0:
            return None

        curves = []
        arrows = []
        num_curves_y = 12
        num_curves_z = 12
        tunnel_length = 120
        tunnel_width = 120
        tunnel_height = 120

        drone_pos = self.data.body("drone_body").xpos
        drone_geoms = self.get_geoms()

        for i in range(num_curves_y):
            for j in range(num_curves_z):
                start_x = drone_pos[0] - tunnel_length / 2
                start_y = (drone_pos[1] - tunnel_width / 2) + (i / (num_curves_y - 1)) * tunnel_width
                start_z = (drone_pos[2] - tunnel_height / 2) + (j / (num_curves_z - 1)) * tunnel_height
                
                points = []
                current_pos = np.array([start_x, start_y, start_z])
                
                num_steps = 80
                dt = 0.3

                for step in range(num_steps):
                    points.append(current_pos.tolist())
                    
                    current_vel = np.array([self.wind_speed, 0.0, 0.0])

                    total_deflection = np.zeros(3)
                    for geom in drone_geoms:
                        if geom.get('type') != 0: # Exclude ground plane
                            deflection = calculate_flow_deflection(current_pos, current_vel, geom, 4.0)
                            total_deflection += deflection
                    
                    current_vel += total_deflection

                    for geom in drone_geoms:
                        if check_geometry_collision(current_pos, geom):
                            geom_pos = np.array(geom['pos'])
                            away_from_geom = (current_pos - geom_pos)
                            norm = np.linalg.norm(away_from_geom)
                            if norm > 0:
                                away_from_geom /= norm
                            current_vel = away_from_geom * 6.0
                            current_vel[0] = max(current_vel[0], 2.0)
                            break
                    
                    current_pos += current_vel * dt
                    
                    if (current_pos[0] > drone_pos[0] + tunnel_length / 2 or
                        abs(current_pos[1] - drone_pos[1]) > tunnel_width / 2 or
                        abs(current_pos[2] - drone_pos[2]) > tunnel_height / 2):
                        break

                    if step > 0 and step % 15 == 0:
                        direction = current_vel.copy()
                        norm = np.linalg.norm(direction)
                        if norm > 0:
                            direction = direction / norm * 0.5
                        wind_strength = np.linalg.norm(current_vel)
                        color = "#ff4444" if wind_strength > 10 else "#ffaa44" if wind_strength > 6 else "#4488ff"
                        arrows.append({"origin": current_pos.tolist(), "direction": direction.tolist(), "color": color})
                
                if len(points) > 2:
                    distances = [np.linalg.norm(np.array(points[k]) - np.array(points[k-1])) for k in range(1, len(points))]
                    if not distances: continue

                    avg_speed = np.mean(distances)
                    speed = avg_speed / dt
                    
                    if speed > 20:
                        color = [1, 0.1, 0.1]
                    elif speed > 10:
                        color = [0.8, 1, 0.2]
                    else:
                        color = [0.2, 0.5, 1]
                        
                    curves.append({"points": points, "color": color})

        return {"curves": curves, "arrows": arrows}

    def get_state(self):
        """Returns the state of the simulation for visualization."""
        # For now, just send the position and orientation of the main body
        body = self.data.body("drone_body")
        
        # Also, return the geometries for rendering on the client
        geoms = self.get_geoms()

        wind_particles_data = None
        if self.wind_enabled and self.wind_particles is not None:
            wind_particles_data = {
                "positions": self.wind_particles.tolist(),
                "colors": self.wind_particle_colors.tolist()
            }

        return {
            "pos": body.xpos.tolist(),
            "quat": body.xquat.tolist(),
            "geoms": geoms,
            "wind_enabled": self.wind_enabled,
            "wind_speed": self.wind_speed,
            "wind_data": self.calculate_wind_data(),
            "wind_particles": wind_particles_data
        }

    def add_part(self, part_type: str, part_info: dict):
        """
        Dynamically rebuilds the MuJoCo model when a new part is added.
        """
        self.selected_parts[part_type] = part_info
        print(f"Added part: {part_type}, {part_info['name']}. Rebuilding model.")
        self.rebuild_model()

    def toggle_wind(self, enabled: bool):
        """Toggles the wind simulation."""
        self.wind_enabled = enabled
        if self.wind_enabled and self.wind_particles is None:
            self._initialize_wind_particles()
        print(f"Wind toggled: {'Enabled' if self.wind_enabled else 'Disabled'}")

    def set_wind_speed(self, speed: float):
        """Sets the wind speed."""
        self.wind_speed = speed
        print(f"Wind speed set to: {self.wind_speed}")


async def uas_builder_websocket_handler(websocket: WebSocket):
    """Handles the WebSocket connection for the UAS Builder."""
    await websocket.accept()
    env = UASBuilderEnv()
    
    # Send initial state
    await websocket.send_json({"type": "state", "data": env.reset()})

    # Simulation loop
    try:
        while True:
            # Listen for incoming commands (like adding a part)
            try:
                message = await asyncio.wait_for(websocket.receive_json(), timeout=0.01)
                if message.get("cmd") == "add_part":
                    env.add_part(message.get("part_type"), message.get("part_info"))
                    await websocket.send_json({"type": "state", "data": env.reset()})
                elif message.get("cmd") == "toggle_wind":
                    env.toggle_wind(message.get("enabled"))
                    await websocket.send_json({"type": "state", "data": env.get_state()})
                elif message.get("cmd") == "set_wind_speed":
                    env.set_wind_speed(message.get("speed"))

            except asyncio.TimeoutError:
                pass # No message from client, proceed with simulation step

            # Step simulation and send state
            state = env.step()
            await websocket.send_json({"type": "state", "data": state})
            
            # Control simulation speed
            await asyncio.sleep(0.02) # ~50 Hz update rate

    except Exception as e:
        print(f"WebSocket Error: {e}")
    finally:
        print("UAS Builder WebSocket connection closed.") 