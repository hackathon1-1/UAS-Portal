export const partData = {
  Frames: [
    { 
      id: 'f1', 
      name: 'Armattan Badger', 
      description: 'Ultra-durable freestyle frame with titanium hardware and lifetime warranty',
      price: 114.00, 
      type: 'Freestyle',
      weight: 65, // grams
      motorSize: '2207',
      dragCoefficient: 0.85
    },
    { 
      id: 'f2', 
      name: 'iFlight Nazgul5', 
      description: 'Lightweight carbon fiber frame optimized for high-speed racing',
      price: 45.99, 
      type: 'Racing',
      weight: 48, // grams
      motorSize: '2207',
      dragCoefficient: 0.75
    },
    { 
      id: 'f3', 
      name: 'GEPRC Mark5', 
      description: 'Versatile 5-inch frame perfect for both freestyle and racing',
      price: 69.99, 
      type: 'Hybrid',
      weight: 52, // grams
      motorSize: '2207',
      dragCoefficient: 0.80
    },
    { 
      id: 'f4', 
      name: 'TBS Source One V5', 
      description: 'Open-source modular frame with excellent crash resistance',
      price: 39.95, 
      type: 'Freestyle',
      weight: 58, // grams
      motorSize: '2207',
      dragCoefficient: 0.88
    },
    { 
      id: 'f5', 
      name: 'Holybro Kopis 2', 
      description: 'Premium racing frame with optimized aerodynamics',
      price: 89.99, 
      type: 'Racing',
      weight: 44, // grams
      motorSize: '2207',
      dragCoefficient: 0.72
    }
  ],
  Motors: [
    { 
      id: 'm1', 
      name: 'T-Motor F60 Pro V', 
      description: 'High-performance brushless motor with titanium shaft',
      price: 25.99, 
      kv: 1750,
      power: 420, // watts max
      weight: 32, // grams
      maxThrust: 650, // grams per motor
      efficiency: 0.85
    },
    { 
      id: 'm2', 
      name: 'iFlight XING2', 
      description: 'Smooth and efficient motor with N52SH magnets',
      price: 22.99, 
      kv: 1855,
      power: 380, // watts max
      weight: 30, // grams
      maxThrust: 620, // grams per motor
      efficiency: 0.87
    },
    { 
      id: 'm3', 
      name: 'BrotherHobby Avenger', 
      description: 'Affordable yet reliable motor for everyday flying',
      price: 20.49, 
      kv: 1920,
      power: 360, // watts max
      weight: 28, // grams
      maxThrust: 580, // grams per motor
      efficiency: 0.82
    },
    { 
      id: 'm4', 
      name: 'Emax Eco II', 
      description: 'Budget-friendly motor with surprising performance',
      price: 18.95, 
      kv: 1700,
      power: 340, // watts max
      weight: 29, // grams
      maxThrust: 560, // grams per motor
      efficiency: 0.80
    },
    { 
      id: 'm5', 
      name: 'RCinPower GTS V2', 
      description: 'Professional grade motor with ceramic bearings',
      price: 28.50, 
      kv: 1800,
      power: 450, // watts max
      weight: 33, // grams
      maxThrust: 720, // grams per motor
      efficiency: 0.88
    }
  ],
  Propellers: [
    { 
      id: 'p1', 
      name: 'HQProp 5x4.3x3 V1S', 
      description: 'Tri-blade propeller optimized for speed and efficiency',
      price: 3.99, 
      diameter: '5 inch',
      pitch: '4.3',
      blades: 3,
      weight: 4, // grams each
      thrustMultiplier: 1.05, // efficiency factor
      topSpeed: 95 // km/h
    },
    { 
      id: 'p2', 
      name: 'Gemfan 51466 Hurricane', 
      description: 'Durable polycarbonate props perfect for beginners',
      price: 2.49, 
      diameter: '5 inch',
      pitch: '4.6',
      blades: 3,
      weight: 5, // grams each
      thrustMultiplier: 0.95, // efficiency factor
      topSpeed: 88 // km/h
    },
    { 
      id: 'p3', 
      name: 'DAL Cyclone T5040C', 
      description: 'Lightweight racing props with excellent thrust-to-weight ratio',
      price: 4.25, 
      diameter: '5 inch',
      pitch: '4.0',
      blades: 3,
      weight: 3, // grams each
      thrustMultiplier: 1.10, // efficiency factor
      topSpeed: 92 // km/h
    },
    { 
      id: 'p4', 
      name: 'Azure Power 5040', 
      description: 'Smooth flight characteristics with minimal vibration',
      price: 3.75, 
      diameter: '5 inch',
      pitch: '4.0',
      blades: 3,
      weight: 4, // grams each
      thrustMultiplier: 1.02, // efficiency factor
      topSpeed: 89 // km/h
    },
    { 
      id: 'p5', 
      name: 'Ethix S4 Cinewhoops', 
      description: 'Quiet propellers designed for indoor and cinematic flights',
      price: 5.99, 
      diameter: '3 inch',
      pitch: '3.1',
      blades: 4,
      weight: 2, // grams each
      thrustMultiplier: 0.75, // efficiency factor
      topSpeed: 45 // km/h
    }
  ],
  'LiPo / LiHV Batteries': [
    { 
      id: 'b1', 
      name: 'Tattu R-Line 4S 1550mAh', 
      description: 'High discharge racing battery with 95C rating',
      price: 42.99, 
      capacity: 1550, // mAh
      voltage: 14.8, // V nominal
      cells: 4,
      cRating: 95,
      weight: 185, // grams
      maxVoltage: 16.8 // V fully charged
    },
    { 
      id: 'b2', 
      name: 'CNHL G+Plus 4S 1300mAh', 
      description: 'Lightweight LiHV battery for extended flight times',
      price: 35.50, 
      capacity: 1300, // mAh
      voltage: 15.2, // V nominal
      cells: 4,
      cRating: 100,
      weight: 158, // grams
      maxVoltage: 17.2 // V fully charged
    },
    { 
      id: 'b3', 
      name: 'GNB 4S 1500mAh', 
      description: 'Reliable everyday battery with consistent power delivery',
      price: 28.99, 
      capacity: 1500, // mAh
      voltage: 14.8, // V nominal
      cells: 4,
      cRating: 80,
      weight: 178, // grams
      maxVoltage: 16.8 // V fully charged
    },
    { 
      id: 'b4', 
      name: 'Turnigy Graphene 6S 1000mAh', 
      description: 'High voltage battery for maximum power output',
      price: 49.99, 
      capacity: 1000, // mAh
      voltage: 22.2, // V nominal
      cells: 6,
      cRating: 90,
      weight: 195, // grams
      maxVoltage: 25.2 // V fully charged
    },
    { 
      id: 'b5', 
      name: 'Gens Ace 4S 1800mAh', 
      description: 'Long flight time battery perfect for aerial photography',
      price: 38.75, 
      capacity: 1800, // mAh
      voltage: 14.8, // V nominal
      cells: 4,
      cRating: 70,
      weight: 212, // grams
      maxVoltage: 16.8 // V fully charged
    }
  ],
  'Flight Controllers': [
    { 
      id: 'fc1', 
      name: 'Betaflight F7 HD', 
      description: 'Latest generation FC with built-in BlackBox and Bluetooth',
      price: 89.99, 
      processor: 'STM32F722',
      gyro: 'ICM42688',
      osd: 'Built-in',
      blackbox: 'Included',
      weight: 8, // grams
      powerConsumption: 2 // watts
    },
    { 
      id: 'fc2', 
      name: 'Matek F405-CTR', 
      description: 'Compact flight controller with integrated current sensor',
      price: 45.50, 
      processor: 'STM32F405',
      gyro: 'MPU6000',
      osd: 'Built-in',
      blackbox: 'MicroSD',
      weight: 6, // grams
      powerConsumption: 1.5 // watts
    },
    { 
      id: 'fc3', 
      name: 'Holybro Kakute F7', 
      description: 'Premium FC with advanced filtering and low noise design',
      price: 65.99, 
      processor: 'STM32F745',
      gyro: 'ICM20689',
      osd: 'Built-in',
      blackbox: 'Flash',
      weight: 7, // grams
      powerConsumption: 1.8 // watts
    },
    { 
      id: 'fc4', 
      name: 'Speedybee F7 V3', 
      description: 'Feature-rich controller with WiFi configuration capability',
      price: 55.99, 
      processor: 'STM32F722',
      gyro: 'BMI270',
      osd: 'Built-in',
      blackbox: 'WiFi + Flash',
      weight: 9, // grams
      powerConsumption: 2.2 // watts
    },
    { 
      id: 'fc5', 
      name: 'MAMBA F405 MK4', 
      description: 'Reliable budget option with essential features',
      price: 39.99, 
      processor: 'STM32F405',
      gyro: 'ICM42688',
      osd: 'Built-in',
      blackbox: 'MicroSD',
      weight: 6, // grams
      powerConsumption: 1.4 // watts
    }
  ],
  ESCs: [
    { 
      id: 'esc1', 
      name: 'T-Motor F55A Pro II 4in1', 
      description: 'High-current ESC stack with BLHeli_32 firmware',
      price: 79.99, 
      current: 55, // Amps
      firmware: 'BLHeli_32',
      type: '4-in-1',
      telemetry: 'Yes',
      weight: 28, // grams
      efficiency: 0.95
    },
    { 
      id: 'esc2', 
      name: 'Holybro Tekko32 F4 45A', 
      description: 'Integrated FC and ESC combo for simplified builds',
      price: 89.50, 
      current: 45, // Amps
      firmware: 'BLHeli_32',
      type: 'FC Combo',
      telemetry: 'Yes',
      weight: 35, // grams (includes FC)
      efficiency: 0.93
    },
    { 
      id: 'esc3', 
      name: 'Racerstar REV35 35A', 
      description: 'Budget-friendly 4-in-1 ESC with solid performance',
      price: 35.99, 
      current: 35, // Amps
      firmware: 'BLHeli_S',
      type: '4-in-1',
      telemetry: 'Yes',
      weight: 25, // grams
      efficiency: 0.90
    },
    { 
      id: 'esc4', 
      name: 'iFlight XROTOR 60A', 
      description: 'Heavy-duty ESC for high-power motor configurations',
      price: 95.99, 
      current: 60, // Amps
      firmware: 'BLHeli_32',
      type: '4-in-1',
      telemetry: 'Yes',
      weight: 32, // grams
      efficiency: 0.96
    },
    { 
      id: 'esc5', 
      name: 'MAMBA F40 40A', 
      description: 'Compact ESC with excellent heat dissipation',
      price: 42.99, 
      current: 40, // Amps
      firmware: 'BLHeli_32',
      type: 'Individual',
      telemetry: 'Yes',
      weight: 8, // grams (per ESC, x4 for full set)
      efficiency: 0.92
    }
  ],
  'Video Transmitters': [
    { 
      id: 'vt1', 
      name: 'TBS Unify Pro32 HV', 
      description: 'Industry standard VTX with IRC Tramp protocol',
      price: 49.95, 
      power: '25mW-800mW',
      frequency: '5.8GHz',
      channels: '48 Channels',
      protocol: 'IRC Tramp',
      weight: 5, // grams
      powerConsumption: 8 // watts max
    },
    { 
      id: 'vt2', 
      name: 'Rush Tank II Ultimate', 
      description: 'Ultra-compact VTX with exceptional range',
      price: 35.99, 
      power: '25mW-800mW',
      frequency: '5.8GHz',
      channels: '40 Channels',
      protocol: 'SmartAudio',
      weight: 4, // grams
      powerConsumption: 7 // watts max
    },
    { 
      id: 'vt3', 
      name: 'Eachine TX805S', 
      description: 'Affordable VTX with smart audio control',
      price: 18.99, 
      power: '25mW-800mW',
      frequency: '5.8GHz',
      channels: '40 Channels',
      protocol: 'SmartAudio',
      weight: 6, // grams
      powerConsumption: 6 // watts max
    },
    { 
      id: 'vt4', 
      name: 'ImmersionRC Ghost', 
      description: 'Next-gen digital VTX with ultra-low latency',
      price: 79.99, 
      power: '25mW-1000mW',
      frequency: '5.8GHz',
      channels: 'Digital',
      protocol: 'IRC Ghost',
      weight: 7, // grams
      powerConsumption: 12 // watts max
    },
    { 
      id: 'vt5', 
      name: 'AKK X2-Ultimate', 
      description: 'High-power VTX for long-range applications',
      price: 28.50, 
      power: '25mW-1200mW',
      frequency: '5.8GHz',
      channels: '40 Channels',
      protocol: 'SmartAudio',
      weight: 8, // grams
      powerConsumption: 10 // watts max
    }
  ],
  'FPV Cameras': [
    { 
      id: 'cam1', 
      name: 'Caddx Ratel 2', 
      description: 'High-resolution camera with excellent low-light performance',
      price: 32.99, 
      sensor: '1/1.8" CMOS',
      resolution: '1200TVL',
      fov: '160°',
      wdr: 'Yes',
      weight: 12, // grams
      powerConsumption: 2 // watts
    },
    { 
      id: 'cam2', 
      name: 'RunCam Phoenix 2', 
      description: 'Professional grade camera with dual exposure',
      price: 45.99, 
      sensor: '1/2" CMOS',
      resolution: '1000TVL',
      fov: '155°',
      wdr: 'Advanced',
      weight: 14, // grams
      powerConsumption: 2.5 // watts
    },
    { 
      id: 'cam3', 
      name: 'Foxeer Predator V5', 
      description: 'Popular camera with natural color reproduction',
      price: 29.95, 
      sensor: '1/2.8" CMOS',
      resolution: '1000TVL',
      fov: '160°',
      wdr: 'Yes',
      weight: 11, // grams
      powerConsumption: 1.8 // watts
    },
    { 
      id: 'cam4', 
      name: 'Hawkeye Firefly X Lite', 
      description: 'Ultra-lightweight camera for micro builds',
      price: 24.99, 
      sensor: '1/3" CMOS',
      resolution: '800TVL',
      fov: '150°',
      wdr: 'Basic',
      weight: 8, // grams
      powerConsumption: 1.5 // watts
    },
    { 
      id: 'cam5', 
      name: 'DJI O3 Air Unit', 
      description: 'Digital HD camera system with crystal clear video',
      price: 179.99, 
      sensor: '1/1.7" CMOS',
      resolution: '1080p60',
      fov: '150°',
      wdr: 'Digital',
      weight: 28, // grams
      powerConsumption: 4 // watts
    }
  ],
  Receivers: [
    { 
      id: 'rx1', 
      name: 'FrSky R-XSR', 
      description: 'Compact SBUS receiver with telemetry support',
      price: 24.99, 
      protocol: 'FrSky ACCST',
      channels: '16 Channels',
      output: 'SBUS/CPPM',
      telemetry: 'Yes',
      weight: 3, // grams
      powerConsumption: 0.5 // watts
    },
    { 
      id: 'rx2', 
      name: 'TBS Crossfire Nano RX', 
      description: 'Long-range 900MHz receiver for extreme distances',
      price: 29.95, 
      protocol: 'TBS Crossfire',
      channels: '12 Channels',
      output: 'CRSF',
      telemetry: 'Full',
      weight: 2, // grams
      powerConsumption: 0.3 // watts
    },
    { 
      id: 'rx3', 
      name: 'ExpressLRS EP1', 
      description: 'Open-source 2.4GHz receiver with low latency',
      price: 15.99, 
      protocol: 'ExpressLRS',
      channels: '8 Channels',
      output: 'CRSF',
      telemetry: 'Basic',
      weight: 1, // grams
      powerConsumption: 0.2 // watts
    },
    { 
      id: 'rx4', 
      name: 'Spektrum AR637T', 
      description: 'DSMX receiver with integrated gyro stabilization',
      price: 39.99, 
      protocol: 'DSMX',
      channels: '6 Channels',
      output: 'SRXL2',
      telemetry: 'Yes',
      weight: 4, // grams
      powerConsumption: 0.8 // watts
    },
    { 
      id: 'rx5', 
      name: 'FlySky FS-A8S', 
      description: 'Budget-friendly receiver perfect for beginners',
      price: 8.99, 
      protocol: 'AFHDS-2A',
      channels: '8 Channels',
      output: 'PWM/PPM',
      telemetry: 'Basic',
      weight: 5, // grams
      powerConsumption: 0.6 // watts
    }
  ],
  Antennas: [
    { 
      id: 'ant1', 
      name: 'TrueRC X-AIR 5.8GHz', 
      description: 'Circular polarized antenna with superior multipath rejection',
      price: 19.99, 
      frequency: '5.8GHz',
      polarization: 'RHCP',
      gain: '1.2dBi',
      connector: 'MMCX',
      weight: 2, // grams
      powerConsumption: 0 // watts
    },
    { 
      id: 'ant2', 
      name: 'ImmersionRC SpiroNET', 
      description: 'Flexible cloverleaf antenna with excellent durability',
      price: 15.50, 
      frequency: '5.8GHz',
      polarization: 'RHCP',
      gain: '1.0dBi',
      connector: 'SMA',
      weight: 3, // grams
      powerConsumption: 0 // watts
    },
    { 
      id: 'ant3', 
      name: 'Lumenier AXII HD', 
      description: 'Premium antenna with weather-resistant housing',
      price: 12.99, 
      frequency: '5.8GHz',
      polarization: 'RHCP',
      gain: '1.6dBi',
      connector: 'MMCX',
      weight: 1, // grams
      powerConsumption: 0 // watts
    },
    { 
      id: 'ant4', 
      name: 'Foxeer Lollipop 3', 
      description: 'Omnidirectional antenna with 360° coverage',
      price: 8.99, 
      frequency: '5.8GHz',
      polarization: 'LHCP',
      gain: '2.5dBi',
      connector: 'SMA',
      weight: 2, // grams
      powerConsumption: 0 // watts
    },
    { 
      id: 'ant5', 
      name: 'VAS Crosshair Xtreme', 
      description: 'High-gain directional antenna for long-range flights',
      price: 89.99, 
      frequency: '5.8GHz',
      polarization: 'RHCP',
      gain: '14dBi',
      connector: 'SMA',
      weight: 15, // grams
      powerConsumption: 0 // watts
    }
  ],
  GPS: [
    { 
      id: 'gps1', 
      name: 'Matek M8Q-5883', 
      description: 'GPS module with integrated magnetometer and LED indicator',
      price: 28.99, 
      chipset: 'u-blox M8Q',
      frequency: 'GPS/GLONASS',
      accuracy: '2.5m',
      compass: 'Built-in',
      weight: 8, // grams
      powerConsumption: 1 // watts
    },
    { 
      id: 'gps2', 
      name: 'Holybro M9N GPS', 
      description: 'Next-generation GPS with faster lock times',
      price: 35.50, 
      chipset: 'u-blox M9N',
      frequency: 'GPS/GLONASS/Galileo',
      accuracy: '1.5m',
      compass: 'External',
      weight: 9, // grams
      powerConsumption: 1.2 // watts
    },
    { 
      id: 'gps3', 
      name: 'Beitian BN-220', 
      description: 'Compact GPS module perfect for small builds',
      price: 18.99, 
      chipset: 'u-blox M8N',
      frequency: 'GPS/GLONASS',
      accuracy: '3m',
      compass: 'Built-in',
      weight: 5, // grams
      powerConsumption: 0.8 // watts
    },
    { 
      id: 'gps4', 
      name: 'Here+ RTK GPS', 
      description: 'Centimeter-accurate GPS for precision applications',
      price: 199.99, 
      chipset: 'u-blox F9P',
      frequency: 'Multi-band RTK',
      accuracy: '0.01m',
      compass: 'Professional',
      weight: 22, // grams
      powerConsumption: 2.5 // watts
    },
    { 
      id: 'gps5', 
      name: 'Radiolink SE100 M8N', 
      description: 'Reliable GPS with quick satellite acquisition',
      price: 22.50, 
      chipset: 'u-blox M8N',
      frequency: 'GPS/GLONASS',
      accuracy: '2.5m',
      compass: 'Built-in',
      weight: 7, // grams
      powerConsumption: 0.9 // watts
    }
  ],
  Accessories: [
    { 
      id: 'acc1', 
      name: 'XT60 Battery Connector Set', 
      description: 'High-quality connectors for secure battery connections',
      price: 4.99, 
      type: 'Connectors',
      quantity: '10 pairs',
      rating: '60A',
      weight: 8, // grams per pair
      powerConsumption: 0 // watts
    },
    { 
      id: 'acc2', 
      name: 'Carbon Fiber Prop Guards', 
      description: 'Lightweight protection for indoor and beginner flights',
      price: 12.99, 
      type: 'Protection',
      material: 'Carbon Fiber',
      weight: 15, // grams total
      powerConsumption: 0 // watts
    },
    { 
      id: 'acc3', 
      name: 'FPV Goggles Case', 
      description: 'Protective carrying case with custom foam inserts',
      price: 29.99, 
      type: 'Storage',
      material: 'EVA Foam',
      size: 'Universal',
      weight: 0, // grams (not mounted on drone)
      powerConsumption: 0 // watts
    },
    { 
      id: 'acc4', 
      name: 'LED Strip WS2812B', 
      description: 'Programmable RGB LEDs for customization and visibility',
      price: 8.50, 
      type: 'Lighting',
      quantity: '1 meter',
      voltage: '5V',
      weight: 12, // grams
      powerConsumption: 3 // watts
    },
    { 
      id: 'acc5', 
      name: 'Smoke Stopper', 
      description: 'Essential safety device to prevent magic smoke release',
      price: 15.99, 
      type: 'Safety',
      current: '5A',
      protection: 'Short Circuit',
      weight: 0, // grams (not mounted on drone)
      powerConsumption: 0 // watts
    },
    { 
      id: 'acc6', 
      name: 'Anti-Vibration Balls', 
      description: 'Reduce camera jello and improve flight footage quality',
      price: 3.99, 
      type: 'Dampening',
      material: 'TPU',
      hardness: '90A',
      weight: 2, // grams
      powerConsumption: 0 // watts
    },
    { 
      id: 'acc7', 
      name: 'Heat Shrink Tubing Kit', 
      description: 'Assorted sizes for wire protection and organization',
      price: 12.50, 
      type: 'Wiring',
      sizes: '2-20mm',
      quantity: '100 pieces',
      weight: 0, // grams (negligible)
      powerConsumption: 0 // watts
    },
    { 
      id: 'acc8', 
      name: 'GoPro Session Mount', 
      description: 'Lightweight mount for action camera recording',
      price: 6.99, 
      type: 'Camera Mount',
      compatibility: 'GoPro Session',
      weight: 8, // grams
      powerConsumption: 0 // watts
    }
  ]
}; 