import React, { useState, useEffect, useRef } from 'react';
import { partData } from '../partData.js';
import DroneViewer from './DroneViewer.jsx';

// WebSocket connection URL
const WS_URL = 'ws://localhost:8002/ws/uas_builder';

const partCategories = [
  'Frames',
  'Motors',
  'Propellers',
  'LiPo / LiHV Batteries',
  'Flight Controllers',
  'ESCs',
  'Video Transmitters',
  'FPV Cameras',
  'Receivers',
  'Antennas',
  'GPS',
  'Accessories'
];

const UASBuilder = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [simState, setSimState] = useState(null);
  const [selectedParts, setSelectedParts] = useState({});
  const [windEnabled, setWindEnabled] = useState(false);
  const [windSpeed, setWindSpeed] = useState(8.0); // Default wind speed
  const ws = useRef(null);

  const totalPrice = Object.values(selectedParts).reduce((sum, part) => sum + (part?.price || 0), 0);

  // Calculate UAV Performance Stats
  const calculateStats = () => {
    const parts = Object.values(selectedParts);
    
    // Total Weight (grams)
    let totalWeight = 0;
    
    Object.entries(selectedParts).forEach(([category, part]) => {
      if (!part) return;
      let partWeight = part.weight || 0;
      
      // Special handling for individual ESCs (multiply by 4)
      if (part.type === 'Individual' && category === 'ESCs') {
        partWeight *= 4;
      }
      // Special handling for propellers (multiply by 4)
      else if (category === 'Propellers') {
        partWeight *= 4;
      }
      
      totalWeight += partWeight;
    });

    // Add estimated wiring and hardware weight
    if (parts.length > 0) totalWeight += 25; // ~25g for wires, screws, etc.

    // Max Thrust (grams) - 4 motors × motor thrust × prop efficiency
    const motor = selectedParts['Motors'];
    const prop = selectedParts['Propellers'];
    let maxThrust = 0;
    if (motor && prop) {
      maxThrust = 4 * motor.maxThrust * (prop.thrustMultiplier || 1.0);
    }

    // Thrust-to-Weight Ratio
    const thrustToWeight = totalWeight > 0 ? maxThrust / totalWeight : 0;

    // Estimated Max Velocity (km/h) based on propeller top speed and drag
    const frame = selectedParts['Frames'];
    let maxVelocity = 0;
    if (prop && frame) {
      const dragFactor = frame.dragCoefficient || 0.8;
      maxVelocity = prop.topSpeed * (1 / dragFactor) * Math.min(thrustToWeight / 2, 1.2);
    }

    // Total Power Consumption (watts)
    let totalPowerConsumption = 0;
    
    Object.entries(selectedParts).forEach(([category, part]) => {
      if (!part) return;
      let partPower = part.powerConsumption || 0;
      
      // Motors consume power based on their rated power (4 motors total)
      if (category === 'Motors' && part.power) {
        partPower = part.power * 0.7 * 4; // Average consumption (70% of max) × 4 motors
      }
      
      totalPowerConsumption += partPower;
    });

    // Flight Time (minutes) based on battery capacity vs power consumption
    const battery = selectedParts['LiPo / LiHV Batteries'];
    let flightTime = 0;
    if (battery && totalPowerConsumption > 0) {
      const batteryWh = (battery.capacity * battery.voltage) / 1000; // Convert to Wh
      const safeCapacity = batteryWh * 0.8; // Use 80% of battery for safety
      flightTime = (safeCapacity / totalPowerConsumption) * 60; // Convert to minutes
    }

    return {
      totalWeight,
      maxThrust,
      thrustToWeight,
      maxVelocity,
      flightTime,
      totalPowerConsumption
    };
  };

  const stats = calculateStats();

  const selectedIndex = selectedCategory ? partCategories.indexOf(selectedCategory) + 1 : 0;
  const formattedIndex = String(selectedIndex).padStart(2, '0');

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'state') {
        setSimState(message.data);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleSelectPart = (category, part) => {
    const newSelectedParts = { ...selectedParts, [category]: part };
    setSelectedParts(newSelectedParts);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        cmd: 'add_part',
        part_type: category,
        part_info: part,
      }));
    }
  };

  const toggleWind = () => {
    const newWindState = !windEnabled;
    setWindEnabled(newWindState);
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        cmd: 'toggle_wind',
        enabled: newWindState,
      }));
    }
  };

  const handleWindSpeedChange = (speed) => {
    setWindSpeed(speed);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        cmd: 'set_wind_speed',
        speed: parseFloat(speed),
      }));
    }
  };

  return (
    <div id="wrapper" className="counter-scroll" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Background Elements */}
      <div className="line_page"></div>
      <div className="overlay_body"></div>
      <div className="texture_page">
        <div className="temp">
          <div className="bg-texture"></div>
          <div className="bg-texture"></div>
        </div>
      </div>

      {/* Fullscreen 3D Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        background: 'var(--black)'
      }}>
        <div style={{
          position: 'fixed',
          top: '0',
          left: '420px',
          width: 'calc(100vw - 260px)',
          height: '100vh',
          zIndex: 1
        }}>
            <DroneViewer 
              simState={simState} 
              windEnabled={simState?.wind_enabled} 
              windSpeed={windSpeed}
              onWindSpeedChange={handleWindSpeedChange}
            />
        </div>
        
        {/* 3D Scene Overlay Controls */}
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'flex-end',
          zIndex: 100
        }}>
          {/* Wind Toggle Button */}
          <button
            className="tf-btn style-2"
            onClick={toggleWind}
            style={{
              padding: '0px 16px',
              minHeight: 'auto',
              fontSize: '10px',
              backgroundColor: windEnabled ? 'var(--primary)' : 'var(--bg-2)',
              borderColor: windEnabled ? 'var(--primary)' : 'var(--line)',
              color: windEnabled ? 'var(--white)' : 'var(--text-main)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: windEnabled ? 'var(--white)' : 'var(--primary)',
                animation: windEnabled ? 'flicker 1s infinite' : 'none'
              }}></div>
              <span className="text-caption font-2">WIND</span>
            </div>
          </button>
        </div>

        {/* Performance Stats Display */}
        {Object.keys(selectedParts).length > 0 && (
          <div style={{
              position: 'fixed',
              bottom: '32px',
              left: '620px',
              background: 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '16px',
              zIndex: 100,
              minWidth: '280px',
              boxShadow: '0px 4px 16px 0px var(--shadow-1)'
          }}>
              <div className="text-caption font-2" style={{ color: 'var(--text-main)', marginBottom: '12px' }}>
                PERFORMANCE STATS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                {/* Weight */}
                <div>
                  <div className="text-caption font-2" style={{ color: 'var(--text-2)', marginBottom: '2px' }}>
                    Weight
                  </div>
                  <div className="font-2" style={{ color: 'var(--white)', fontSize: '16px', fontWeight: '600' }}>
                    {stats.totalWeight.toFixed(0)}g
                  </div>
                </div>
                
                {/* Max Thrust */}
                <div>
                  <div className="text-caption font-2" style={{ color: 'var(--text-2)', marginBottom: '2px' }}>
                    Max Thrust
                  </div>
                  <div className="font-2" style={{ color: 'var(--white)', fontSize: '16px', fontWeight: '600' }}>
                    {stats.maxThrust > 0 ? `${(stats.maxThrust / 1000).toFixed(1)}kg` : '--'}
                  </div>
                </div>

                {/* Thrust-to-Weight Ratio */}
                <div>
                  <div className="text-caption font-2" style={{ color: 'var(--text-2)', marginBottom: '2px' }}>
                    T/W Ratio
                  </div>
                  <div className="font-2" style={{ 
                    color: stats.thrustToWeight >= 2 ? 'var(--green)' : stats.thrustToWeight >= 1.5 ? 'var(--primary)' : 'var(--red)', 
                    fontSize: '16px', 
                    fontWeight: '600' 
                  }}>
                    {stats.thrustToWeight > 0 ? `${stats.thrustToWeight.toFixed(1)}:1` : '--'}
                  </div>
                </div>

                {/* Max Velocity */}
                <div>
                  <div className="text-caption font-2" style={{ color: 'var(--text-2)', marginBottom: '2px' }}>
                    Max Speed
                  </div>
                  <div className="font-2" style={{ color: 'var(--white)', fontSize: '16px', fontWeight: '600' }}>
                    {stats.maxVelocity > 0 ? `${stats.maxVelocity.toFixed(0)} km/h` : '--'}
                  </div>
                </div>

                {/* Flight Time */}
                <div>
                  <div className="text-caption font-2" style={{ color: 'var(--text-2)', marginBottom: '2px' }}>
                    Flight Time
                  </div>
                  <div className="font-2" style={{ color: 'var(--white)', fontSize: '16px', fontWeight: '600' }}>
                    {stats.flightTime > 0 ? `${stats.flightTime.toFixed(1)} min` : '--'}
                  </div>
                </div>

                {/* Power Draw */}
                <div>
                  <div className="text-caption font-2" style={{ color: 'var(--text-2)', marginBottom: '2px' }}>
                    Power Draw
                  </div>
                  <div className="font-2" style={{ color: 'var(--white)', fontSize: '16px', fontWeight: '600' }}>
                    {stats.totalPowerConsumption > 0 ? `${stats.totalPowerConsumption.toFixed(0)}W` : '--'}
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* Total Price Display */}
        {totalPrice > 0 && (
          <div style={{
              position: 'absolute',
              bottom: '80px',
              right: '32px',
              background: 'var(--bg-2)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px 16px',
              zIndex: 100,
              textAlign: 'right',
              boxShadow: '0px 4px 16px 0px var(--shadow-1)'
          }}>
              <div className="text-caption font-2" style={{ color: 'var(--text-main)', marginBottom: '4px' }}>EST. TOTAL</div>
              <div className="font-2" style={{ color: 'var(--white)', fontSize: '22px', fontWeight: '600', lineHeight: 1 }}>
                  ${totalPrice.toFixed(2)}
              </div>
          </div>
        )}

        {/* Status Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          right: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-2)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '8px 12px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: simState ? 'var(--green)' : 'var(--text-4)',
            animation: simState ? 'flicker 2s infinite' : 'none'
          }}></div>
          <div className="text-caption font-2" style={{ color: 'var(--text-main)' }}>
            {simState ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="sect-header" style={{ position: 'fixed', top: '0', left: '0', zIndex: 100, width: '100vw', background: 'transparent' }}>
        <div className="container">
          <div className="s-meta text-caption font-2">
            <p className="s-number_order wg-counter">
              [ <span className="text-white">{formattedIndex}</span> / {partCategories.length} ]
            </p>
            <p className="s-label">
              [ <span className="text-white hacker-text_transform">UAS BUILDER</span> ]
            </p>
          </div>
        </div>
      </div>
      <span className="br-line" style={{ position: 'relative', zIndex: 10 }}></span>

      {/* Component Slots Sidebar */}
      <div className="sidebar-panel" style={{ 
        position: 'fixed',
        top: '0px',
        left: '0',
        width: '240px',
        height: 'calc(100vh)',
        background: 'var(--bg-2)',
        backdropFilter: 'blur(32px)',
        border: '1px solid var(--line)',
        padding: '60px 10px 10px 10px',
        overflow: 'auto',
        zIndex: 20,
        boxShadow: '0px 4px 16px 0px var(--shadow-1)'
      }}>
        <div className="f-col" style={{ gap: '8px' }}>
          {partCategories.map((category) => {
            const isSelected = selectedCategory === category;
            
            return (
              <div
                key={category}
                style={{
                  width: '190px',
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  border: '1px solid transparent',
                  background: isSelected 
                    ? 'linear-gradient(135deg, var(--primary) 0%, rgba(var(--primary-rgb), 0.8) 100%)'
                    : 'transparent',
                  borderColor: isSelected ? 'var(--primary)' : 'transparent',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSelected ? 'translateX(4px)' : 'translateX(0)',
                  boxShadow: isSelected 
                    ? '0 4px 12px rgba(var(--primary-rgb), 0.25)' 
                    : 'none'
                }}
                onClick={() => setSelectedCategory(category)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.background = 'rgba(var(--primary-rgb), 0.1)';
                    e.target.style.borderColor = 'rgba(var(--primary-rgb), 0.3)';
                    e.target.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = 'transparent';
                    e.target.style.transform = 'translateX(0)';
                  }
                }}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="text-body-3" style={{ 
                    color: isSelected ? 'var(--white)' : 'var(--text-2)',
                    fontWeight: isSelected ? '600' : '400',
                    transition: 'all 0.2s ease'
                  }}>
                    {category}
                  </div>
                  {selectedParts[category] && (
                    <div className="text-caption" style={{ 
                      color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--primary)', 
                      marginTop: '4px',
                      transition: 'all 0.2s ease'
                    }}>
                      {selectedParts[category].name}
                    </div>
                  )}
                </div>
                {selectedParts[category] && (
                  <i className="icon-check" style={{ 
                    color: isSelected ? 'var(--white)' : 'var(--green)', 
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}></i>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Parts Selection Sidebar */}
      <div className="sidebar-panel" style={{ 
        position: 'fixed',
        top: '0px',
        left: '260px',
        width: '320px',
        height: 'calc(100vh)',
        background: 'var(--bg-2)',
        backdropFilter: 'blur(32px)',
        border: '1px solid var(--line)',
        padding: '60px 10px 10px 10px',
        overflow: 'auto',
        zIndex: 19,
        boxShadow: '0px 4px 16px 0px var(--shadow-1)'
      }}>
        
        <div className="f-col" style={{ gap: '8px' }}>
          {selectedCategory ? (
            partData[selectedCategory].map(part => (
              <div
                key={part.id}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: selectedParts[selectedCategory]?.id === part.id ? 'var(--primary)' : 'transparent',
                  borderColor: selectedParts[selectedCategory]?.id === part.id ? 'var(--primary)' : 'var(--line)',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => handleSelectPart(selectedCategory, part)}
              >
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div className="text-body-3" style={{ color: 'var(--text-2)', marginBottom: '4px' }}>
                    {part.name}
                  </div>
                  <div className="text-caption font-2" style={{ color: 'var(--text-main)' }}>
                    {part.description}
                  </div>
                </div>
                <div className="text-body-3 font-2" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                  ${part.price.toFixed(2)}
                </div>
              </div>
            ))
          ) : (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 120px)',
                textAlign: 'center', 
                color: 'var(--text-4)',
                fontFamily: 'var(--font-2)',
                fontSize: '14px',
                opacity: 0.5
            }}>
                <i className="icon-layers" style={{fontSize: '32px', marginBottom: '16px'}}></i>
                <p className="text-body-3" style={{color: 'var(--text-3)'}}>Select a category</p>
                <p className="text-caption" style={{color: 'var(--text-4)'}}>to view available parts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UASBuilder; 