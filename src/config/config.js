// Default configuration object
window.config = {
  // Tree Structure
  maxDepth: 7,
  startDepth: 2,
  branchAngle: 35,
  autoAngle: true,
  angleSpeed: 0.3,
  anglePhase: 0,
  scaleFactor: 0.7,
  
  // Rotation Settings
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  autoRotate: true,
  rotationSpeed: 0.7,
  
  // Animation
  maxZoom: 6.0,
  zoomSpeed: 0.1,
  growthStart: 2, // % scroll when tree starts growing
  growthEnd: 100, // % scroll when tree reaches max depth
  
  // Colors
  baseColor: [20, 40, 100], // Navy Blue #142864
  brandColor: [240, 78, 35], // Boxcurve Orange #F04E23
  fillType: 'outline',
  strokeWeight: 4,
  
  // Position and Size
  xPosition: 50, // percent of screen width
  yPosition: 50, // percent of screen height
  zPosition: 0,  // z-position in 3D space
  autoMove: true,
  moveSpeed: 0.1,
  movePhase: 0,  // Used for cyclic movement patterns
  startingSize: 120,
  
  // 3D Depth Settings
  pixelDepth: 10, // Depth of the cubes in pixels
  autoDepth: true, // Automatically vary depth
  depthPhase: 0, // Used for cyclic depth variation
  depthByLevel: true, // Vary depth by tree level
  
  // Lighting Settings
  lightAngleX: 45, // Light direction X angle
  lightAngleY: 45, // Light direction Y angle
  lightIntensity: 80, // Light intensity percentage
  enableLighting: true // Enable/disable lighting effects
};

// Preset configurations
window.presets = {
  preset1: {
    name: "Classic Tree",
    maxDepth: 7,
    startDepth: 2,
    branchAngle: 35,
    autoAngle: true,
    angleSpeed: 0.3,
    scaleFactor: 0.7,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    autoRotate: true,
    rotationSpeed: 0.7,
    maxZoom: 6.0,
    zoomSpeed: 0.1,
    growthStart: 2,
    growthEnd: 100,
    baseColor: [20, 40, 100],
    brandColor: [240, 78, 35],
    fillType: 'outline',
    strokeWeight: 4,
    xPosition: 50,
    yPosition: 50,
    zPosition: 0,
    autoMove: true,
    moveSpeed: 0.1,
    startingSize: 120,
    pixelDepth: 10,
    autoDepth: true,
    depthByLevel: true,
    lightAngleX: 45,
    lightAngleY: 45,
    lightIntensity: 80,
    enableLighting: true
  },
  preset2: {
    name: "Spiral Galaxy",
    maxDepth: 12,
    startDepth: 3,
    branchAngle: 45,
    autoAngle: true,
    angleSpeed: 0.5,
    scaleFactor: 0.8,
    rotationX: 20,
    rotationY: 15,
    rotationZ: 30,
    autoRotate: true,
    rotationSpeed: 1.2,
    maxZoom: 8.0,
    zoomSpeed: 0.15,
    growthStart: 5,
    growthEnd: 95,
    baseColor: [75, 0, 130], // Indigo
    brandColor: [255, 215, 0], // Gold
    fillType: 'gradient',
    strokeWeight: 2,
    xPosition: 50,
    yPosition: 40,
    zPosition: -50,
    autoMove: true,
    moveSpeed: 0.2,
    startingSize: 150,
    pixelDepth: 15,
    autoDepth: true,
    depthByLevel: true,
    lightAngleX: 60,
    lightAngleY: 30,
    lightIntensity: 90,
    enableLighting: true
  },
  preset3: {
    name: "Static",
    maxDepth: 7,
    startDepth: 2,
    branchAngle: 34,
    autoAngle: false,
    angleSpeed: 0,
    scaleFactor: 0.7,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    autoRotate: false,
    rotationSpeed: 0.7,
    maxZoom: 6.0,
    zoomSpeed: 0.1,
    growthStart: 2,
    growthEnd: 100,
    baseColor: [20, 40, 100], // Navy Blue #142864
    brandColor: [240, 78, 35], // Boxcurve Orange #F04E23
    fillType: 'outline',
    strokeWeight: 4,
    xPosition: 50,
    yPosition: 73,
    zPosition: 0,
    autoMove: false,
    moveSpeed: 0,
    startingSize: 120,
    pixelDepth: 8,
    autoDepth: false,
    depthByLevel: true,
    lightAngleX: 45,
    lightAngleY: 45,
    lightIntensity: 70,
    enableLighting: true
  }
}; 