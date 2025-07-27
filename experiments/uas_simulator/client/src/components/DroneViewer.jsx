import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Plane, useGLTF, Line, Cone, Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const DynamicGeom = ({ geom }) => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.fromArray(geom.pos);
      meshRef.current.matrix.fromArray(geom.mat);
      meshRef.current.matrix.decompose(meshRef.current.position, meshRef.current.quaternion, meshRef.current.scale);
    }
  });

  const getGeometry = () => {
    switch (geom.type) {
      case 2: // Sphere
        return <sphereGeometry args={[geom.size[0]]} />;
      case 3: // Capsule
        return <capsuleGeometry args={[geom.size[0], geom.size[1]]} />;
      case 5: // Cylinder
        return <cylinderGeometry args={[geom.size[0], geom.size[0], geom.size[1] * 2]} />;
      case 6: // Box
        return <boxGeometry args={[geom.size[0] * 2, geom.size[1] * 2, geom.size[2] * 2]} />;
      default:
        return null;
    }
  };

  return (
    <mesh ref={meshRef}>
      {getGeometry()}
      <meshStandardMaterial color={new THREE.Color(...geom.rgba.slice(0, 3))} wireframe />
    </mesh>
  );
};

const DroneGLB = ({ position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  const { scene } = useGLTF('quad.glb');
  const droneRef = useRef();

  // Apply wireframe to all materials in the scene
  const wireframeScene = useMemo(() => {
    const clonedScene = scene.clone();
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.wireframe = true;
          });
        } else {
          child.material.wireframe = true;
        }
      }
    });
    return clonedScene;
  }, [scene]);

  return (
    <primitive 
      ref={droneRef} 
      object={wireframeScene} 
      scale={[1, 1, 1]}
      rotation={[0, 0, 0]}
      position={[0, 0, 0]}

    />
  );
};

const Arrow = ({ origin, direction, color = "#ffff00" }) => {
  const ref = useRef();
  React.useLayoutEffect(() => {
    if (ref.current) {
      // Point the arrow by looking from its origin to a point along the direction vector
      ref.current.lookAt(new THREE.Vector3().addVectors(origin, direction));
    }
  }, [origin, direction]);

  return (
    <group ref={ref} position={origin}>
      <Cone args={[0.06, 0.2, 8]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
      </Cone>
    </group>
  );
};

// Helper function to check collision with drone geometry
const checkGeometryCollision = (point, geom) => {
  if (!geom || geom.type === 0) return false; // Skip ground plane
  
  const geomPos = new THREE.Vector3(...geom.pos);
  const size = geom.size;
  
  switch (geom.type) {
    case 2: // Sphere
      // Simple distance check for spheres
      const distance = point.distanceTo(geomPos);
      return distance < size[0];
    case 3: // Capsule
      // Transform point to geometry local space for complex shapes
      const geomMat = new THREE.Matrix3().fromArray(geom.mat || [1,0,0,0,1,0,0,0,1]);
      const localPoint = point.clone().sub(geomPos);
      localPoint.applyMatrix3(geomMat.clone().invert());
      const height = size[1];
      const radius = size[0];
      const cylinderDist = Math.sqrt(localPoint.x * localPoint.x + localPoint.y * localPoint.y);
      return cylinderDist < radius && Math.abs(localPoint.z) < height + radius;
    case 5: // Cylinder
      const geomMat2 = new THREE.Matrix3().fromArray(geom.mat || [1,0,0,0,1,0,0,0,1]);
      const localPoint2 = point.clone().sub(geomPos);
      localPoint2.applyMatrix3(geomMat2.clone().invert());
      const cylRadius = size[0];
      const cylHeight = size[1];
      const cylDist = Math.sqrt(localPoint2.x * localPoint2.x + localPoint2.y * localPoint2.y);
      return cylDist < cylRadius && Math.abs(localPoint2.z) < cylHeight;
    case 6: // Box
      const geomMat3 = new THREE.Matrix3().fromArray(geom.mat || [1,0,0,0,1,0,0,0,1]);
      const localPoint3 = point.clone().sub(geomPos);
      localPoint3.applyMatrix3(geomMat3.clone().invert());
      return Math.abs(localPoint3.x) < size[0] && 
             Math.abs(localPoint3.y) < size[1] && 
             Math.abs(localPoint3.z) < size[2];
    default:
      return false;
  }
};

// Helper function to calculate flow deflection around geometry
const calculateFlowDeflection = (position, velocity, geom, deflectionStrength = 2.0) => {
  if (!geom || geom.type === 0) return new THREE.Vector3(); // Skip ground plane
  
  const geomPos = new THREE.Vector3(...geom.pos);
  const toGeom = geomPos.clone().sub(position);
  const distance = toGeom.length();
  
  // Determine effective radius for this geometry type
  let effectiveRadius;
  switch (geom.type) {
    case 2: // Sphere
      effectiveRadius = geom.size[0] * 1.5;
      break;
    case 3: // Capsule
      effectiveRadius = Math.max(geom.size[0], geom.size[1]) * 1.5;
      break;
    case 5: // Cylinder
      effectiveRadius = geom.size[0] * 1.5;
      break;
    case 6: // Box
      effectiveRadius = Math.max(geom.size[0], geom.size[1], geom.size[2]) * 1.5;
      break;
    default:
      effectiveRadius = 1.0;
  }
  
  if (distance > effectiveRadius * 3) return new THREE.Vector3(); // Too far to influence
  
  // Calculate deflection force - stronger closer to geometry
  const influenceRatio = Math.max(0, 1 - distance / (effectiveRadius * 3));
  const deflectionMagnitude = deflectionStrength * influenceRatio * influenceRatio;
  
  // Deflect perpendicular to the direction toward geometry
  const velocityDir = velocity.clone().normalize();
  const toGeomDir = toGeom.clone().normalize();
  
  // Create deflection vector perpendicular to both velocity and direction to geometry
  const deflectionDir = new THREE.Vector3().crossVectors(velocityDir, toGeomDir);
  if (deflectionDir.length() < 0.1) {
    // If vectors are parallel, create arbitrary perpendicular vector
    deflectionDir.set(1, 0, 0).cross(toGeomDir);
  }
  deflectionDir.normalize();
  
  // Add some upward/downward component based on geometry position
  const upwardBias = position.y < geomPos.y ? 0.3 : -0.3;
  deflectionDir.y += upwardBias;
  deflectionDir.normalize();
  
  return deflectionDir.multiplyScalar(deflectionMagnitude);
};

const WindCurves = ({ windParams, windEnabled, simState }) => {
  if (!windEnabled || !simState || !simState.wind_data) return null;

  const { curves, arrows } = useMemo(() => {
    const collisionGeoms = [
      // Drone proxy sphere
      {
        type: 2,
        pos: simState.pos,
        size: [0.75, 0, 0],
      },
      // Static sphere at world origin
      {
        type: 2,
        pos: [0, 0, 0], // MuJoCo coordinates for Three.js (0,0,0)
        size: [3, 0, 0], // Radius 3
      }
    ];

    // Data is now coming directly from the backend
    const curveData = simState.wind_data.curves.map((curve, index) => {
      const points = curve.points.map(p => {
        const mujocoPos = new THREE.Vector3(p[0], p[1], p[2]);
        let displacement = new THREE.Vector3();

        for (const geom of collisionGeoms) {
          if (!geom.pos) continue;
          const geomPos = new THREE.Vector3(...geom.pos);
          const toPoint = mujocoPos.clone().sub(geomPos);
          const dist = toPoint.length();
          const radius = geom.size[0];
          const influenceRadius = radius * 2.5;

          if (dist < influenceRadius) {
            const influence = Math.max(0, 1 - dist / influenceRadius);
            const pushStrength = influence * influence * radius * 1.5;
            const pushDir = toPoint.length() > 0.001 ? toPoint.normalize() : new THREE.Vector3(0, 1, 0);
            displacement.add(pushDir.multiplyScalar(pushStrength));
          }
        }
        const finalPos = mujocoPos.add(displacement);
        // Swizzle points from MuJoCo (Z-up) to Three.js (Y-up)
        return new THREE.Vector3(finalPos.x, finalPos.z, -finalPos.y);
      });

      return {
        key: `curve-${index}`,
        points: points,
        color: new THREE.Color(...curve.color)
      };
    });

    const arrowData = simState.wind_data.arrows.map((arrow, index) => ({
        key: `arrow-${index}`,
        // Swizzle origin and direction from MuJoCo to Three.js coordinates
        origin: new THREE.Vector3(arrow.origin[0], arrow.origin[2], -arrow.origin[1]),
        direction: new THREE.Vector3(arrow.direction[0], arrow.direction[2], -arrow.direction[1]),
        color: arrow.color
    }));

    return { curves: curveData, arrows: arrowData };
  }, [simState.wind_data, simState.pos]);

  return (
    <group>
        {curves.map((c) => (
            <Line key={c.key} points={c.points} color={c.color} lineWidth={1} transparent opacity={0.5} dashed dashSize={0.1} gapSize={0.9} />
        ))}
        {arrows.map((a) => (
            <Arrow key={a.key} origin={a.origin} direction={a.direction} color={a.color} />
        ))}
    </group>
  )
}

const Wind = ({ windParams, windEnabled, simState }) => {
  if (!windEnabled || !simState || !simState.pos) return null;
  
  const particlesRef = useRef();
  const particleState = useRef(null);

  const PARTICLE_COUNT = 20000;
  const TUNNEL_LENGTH = 64;
  const TUNNEL_WIDTH = 64;
  const TUNNEL_HEIGHT = 64;
  
  // Calculate dynamic max life based on wind speed to ensure particles always fill the tunnel
  const windSpeed = simState.wind_speed || 8.0;
  const timeToTraverseTunnel = TUNNEL_LENGTH / (windSpeed * 0.02); // frames needed to cross tunnel
  const MAX_LIFE = Math.max(timeToTraverseTunnel * 1.2, 200); // Add 20% buffer, minimum 200 frames

  // Initialize particles state only once when simState is available
  if (particleState.current === null) {
      const state = {
          positions: new Float32Array(PARTICLE_COUNT * 3),
          velocities: new Float32Array(PARTICLE_COUNT * 3),
          lifetimes: new Float32Array(PARTICLE_COUNT),
      };
      const dronePos = new THREE.Vector3().fromArray(simState.pos); // MuJoCo coordinates

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        // Start particles at the inlet of the wind tunnel (in MuJoCo space)
        state.positions[i3] = dronePos.x - TUNNEL_LENGTH / 2 + THREE.MathUtils.randFloat(-5, 0);
        state.positions[i3+1] = dronePos.y + THREE.MathUtils.randFloatSpread(TUNNEL_WIDTH);
        state.positions[i3+2] = dronePos.z + THREE.MathUtils.randFloatSpread(TUNNEL_HEIGHT);
        
        state.velocities[i3] = simState.wind_speed || 8.0;
        state.velocities[i3+1] = 0;
        state.velocities[i3+2] = 0;
        
        state.lifetimes[i] = Math.random() * MAX_LIFE;
      }
      particleState.current = state;
  }

  useFrame(() => {
    if (!particlesRef.current || !particleState.current) return;

    const droneMuJoCoPos = new THREE.Vector3().fromArray(simState.pos);
    
    const collisionGeoms = [
      // Drone proxy sphere
      {
        type: 2,
        pos: droneMuJoCoPos.toArray(),
        size: [0.75, 0, 0],
        mat: new THREE.Matrix3().identity().toArray(),
      },
      // Static sphere at world origin
      {
        type: 2,
        pos: [0, 0, 0], // MuJoCo coordinates for Three.js (0,0,0)
        size: [3, 0, 0], // Radius 3
        mat: new THREE.Matrix3().identity().toArray(),
      }
    ];

    const simPositions = particleState.current.positions;
    const simVelocities = particleState.current.velocities;
    const lifetimes = particleState.current.lifetimes;
    
    const renderPositions = particlesRef.current.geometry.attributes.position.array;
    const renderColors = particlesRef.current.geometry.attributes.color.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      lifetimes[i] += 1;

      const particlePos = new THREE.Vector3(simPositions[i3], simPositions[i3 + 1], simPositions[i3 + 2]);
      const particleVel = new THREE.Vector3(simVelocities[i3], simVelocities[i3 + 1], simVelocities[i3 + 2]);

      // Reset velocity to uniform wind tunnel flow
      particleVel.set(simState.wind_speed || 8.0, 0, 0);

      // Apply deflection from all geometries
      const totalDeflection = new THREE.Vector3();
      for (const geom of collisionGeoms) {
        const deflection = calculateFlowDeflection(particlePos, particleVel, geom, 5.0);
        totalDeflection.add(deflection);
      }
      particleVel.add(totalDeflection);
      
      let nearGeometry = false;
      for (const geom of collisionGeoms) {
        const distance = particlePos.distanceTo(new THREE.Vector3(...geom.pos));
        if (distance < geom.size[0] * 3) {
          nearGeometry = true;
          break;
        }
      }
      
      // Check collision and relocate if inside any geometry
      for (const geom of collisionGeoms) {
        if (checkGeometryCollision(particlePos, geom)) {
          const awayFromGeom = particlePos.clone().sub(new THREE.Vector3(...geom.pos)).normalize();
          particlePos.copy(new THREE.Vector3(...geom.pos).add(awayFromGeom.multiplyScalar(geom.size[0] * 1.2)));
          particleVel.copy(awayFromGeom).multiplyScalar(6.0);
          particleVel.x = Math.max(particleVel.x, 3.0);
          break; // Handle first collision only
        }
      }

      // Ensure minimum forward velocity
      particleVel.x = Math.max(particleVel.x, 2.0);

      // Update simulation position
      particlePos.add(particleVel.clone().multiplyScalar(0.02));
      simPositions[i3] = particlePos.x;
      simPositions[i3+1] = particlePos.y;
      simPositions[i3+2] = particlePos.z;

      // Update simulation velocity
      simVelocities[i3] = particleVel.x;
      simVelocities[i3+1] = particleVel.y;
      simVelocities[i3+2] = particleVel.z;

      // Color particle based on speed and proximity
      const speed = particleVel.length();
      const color = new THREE.Color();
      if (nearGeometry) {
        const turbulence = Math.min(speed / 10, 1);
        color.setRGB(1, 0.5 - turbulence * 0.3, 0.1);
      } else if (speed > 20) {
        color.setRGB(1, 0.1, 0.1);
      } else if (speed > 10) {
        color.setRGB(0.8, 1, 0.2);
      } else {
        color.setRGB(0.2, 0.5, 1);
      }
      
      // Update render buffers with swizzled coordinates for Three.js (Y-up)
      renderPositions[i3] = particlePos.x;
      renderPositions[i3 + 1] = particlePos.z;
      renderPositions[i3 + 2] = -particlePos.y;
      
      renderColors[i3] = color.r;
      renderColors[i3+1] = color.g;
      renderColors[i3+2] = color.b;

      // Check if particle is out of bounds and reset if necessary
      const outOfBounds =
        particlePos.x > droneMuJoCoPos.x + TUNNEL_LENGTH / 2 ||
        Math.abs(particlePos.y - droneMuJoCoPos.y) > TUNNEL_WIDTH / 2 ||
        Math.abs(particlePos.z - droneMuJoCoPos.z) > TUNNEL_HEIGHT / 2;

      if (outOfBounds || lifetimes[i] > MAX_LIFE) {
        simPositions[i3] = droneMuJoCoPos.x - TUNNEL_LENGTH / 2 + THREE.MathUtils.randFloat(-5, 0);
        simPositions[i3+1] = droneMuJoCoPos.y + THREE.MathUtils.randFloatSpread(TUNNEL_WIDTH);
        simPositions[i3+2] = droneMuJoCoPos.z + THREE.MathUtils.randFloatSpread(TUNNEL_HEIGHT);
        lifetimes[i] = 0;
        simVelocities[i3] = simState.wind_speed || 8.0;
        simVelocities[i3+1] = 0;
        simVelocities[i3+2] = 0;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  });
  
  // Use empty buffers for initialization, they will be populated in useFrame.
  const particlePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const particleColors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={particlePositions}
          itemSize={3}
        />
        <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={particleColors}
            itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} transparent opacity={0.9} vertexColors />
    </points>
  );
};

const DroneModel = ({ simState }) => {
  const groupRef = useRef();
  
  useFrame(() => {
      if (groupRef.current && simState) {
          // MuJoCo uses a Z-up coordinate system, while Three.js uses Y-up.
          // We need to swizzle the coordinates and quaternions.
          const [x, y, z] = simState.pos;
          groupRef.current.position.set(x, z, -y);

          // MuJoCo quaternion is (w, x, y, z), Three.js is (x, y, z, w)
          const [qw, qx, qy, qz] = simState.quat;
          groupRef.current.quaternion.set(qx, qz, -qy, qw);

          // The GLB model itself might have a different default orientation.
          // We add a fixed rotation to align the GLB model with the simulation body.
          groupRef.current.rotation.x += Math.PI; 
      }
  });

  return (
    <>
      {simState && (
         <group ref={groupRef}>
            {/* Render the high-fidelity GLB model */}
            <DroneGLB />
            
            {/* Render any additional physics geoms (e.g., payloads) */}
            {simState.geoms
                .filter(g => g.type !== 0 && g.name !== 'drone_geom') // Filter out the ground plane and the main drone mesh
                .map((geom, index) => (
                  <DynamicGeom key={index} geom={geom} />
            ))}
         </group>
      )}
    </>
  );
};

const DroneViewer = ({ simState, windEnabled = false, windSpeed, onWindSpeedChange }) => {
  const showWind = windEnabled && parseFloat(windSpeed) > 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        .qore-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: var(--line);
          border-radius: 2px;
          outline: none;
          transition: all 0.2s ease;
        }
        .qore-slider:hover {
          background: var(--primary);
        }
        .qore-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--primary);
          border: 3px solid var(--bg-2);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .qore-slider::-webkit-slider-thumb:hover {
          background: var(--white);
          border-color: var(--primary);
        }
        .qore-slider::-moz-range-track {
            background: var(--line);
        }
        .qore-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: var(--primary);
          border: 3px solid var(--bg-2);
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
      <Canvas camera={{ position: [9, 9, -9], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 5]} intensity={2.5} />
        
        {/* Static sphere for wind interaction */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[3, 32, 32]} />
          <meshStandardMaterial color={"#ffffff"} wireframe transparent opacity={0.0} />
        </mesh>

        {/* The DroneModel now handles both the physics visualization and the GLB model */}
        <DroneModel simState={simState} />
        
        {/* Wind Tunnel Effects */}
        <Wind windEnabled={showWind} simState={simState} />
        <WindCurves windEnabled={showWind} simState={simState} />
        
        {/* Infinite Grid */}
        <Grid infiniteGrid cellSize={5} sectionSize={20} sectionColor={"#292929"} fadeDistance={250} />
        
        {/* Post-processing Effects */}
        <EffectComposer>
          <Bloom intensity={1.8} luminanceThreshold={0.1} luminanceSmoothing={0.9} toneMapped={false} />
        </EffectComposer>
        
        <OrbitControls 
          enableDamping={true}
          dampingFactor={0.05}
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          target={[0, 1, 0]}
          maxDistance={200}
        />
      </Canvas>
      {windEnabled && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          padding: '12px 16px',
          background: 'var(--bg-2)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--text-main)',
          zIndex: 1000
        }}>
          <span className="text-caption font-2">Wind Speed</span>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={windSpeed}
            onChange={(e) => onWindSpeedChange(e.target.value)}
            className="qore-slider"
            style={{ flex: 1 }}
          />
          <span className="text-caption font-2">{parseFloat(windSpeed).toFixed(1)} m/s</span>
        </div>
      )}
    </div>
  );
};

// Preload the GLB model
useGLTF.preload('quad.glb');

export default DroneViewer; 