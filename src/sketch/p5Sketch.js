import { lerp, constrain, map } from '../utils/helpers.js';

// Global p5.js instance
let p5Instance;

// Initialize control panel visibility
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  const controlPanel = document.getElementById('controlPanel');
  const showPanelButton = document.getElementById('showPanel');
  const hidePanelButton = document.getElementById('hidePanel');

  console.log('Control Panel:', controlPanel);
  console.log('Show Panel Button:', showPanelButton);
  console.log('Hide Panel Button:', hidePanelButton);

  if (showPanelButton) {
    showPanelButton.addEventListener('click', function() {
      console.log('Show panel clicked');
      if (controlPanel) {
        controlPanel.style.display = 'block';
        showPanelButton.style.display = 'none';
      }
    });
  }

  if (hidePanelButton) {
    hidePanelButton.addEventListener('click', function() {
      console.log('Hide panel clicked');
      if (controlPanel) {
        controlPanel.style.display = 'none';
        showPanelButton.style.display = 'block';
      }
    });
  }
});

// Wait for both DOM and config to be ready
function initializeSketch() {
  console.log('Initializing sketch...');
  console.log('window.config:', window.config);
  if (window.config) {
    console.log('Creating p5 instance...');
    p5Instance = new p5(sketch);
    console.log('P5 sketch initialized:', p5Instance);
  } else {
    console.log('Waiting for config...');
    setTimeout(initializeSketch, 100);
  }
}

// Initialize when DOM is ready
window.addEventListener('load', function() {
  console.log('Window loaded');
  initializeSketch();
});

// Define the sketch
function sketch(p) {
  console.log('Sketch function called');
  // ===== Runtime Variables =====
  let needsUpdate = true;
  let lastScrollY = 0;
  let lastMouseX, lastMouseY;
  let currentDepth = window.config.startDepth;
  let mirror = false;
  let zoomFactor = 1.0;
  let targetZoom = 1.0;
  let renderTime = 0;
  let squaresDrawn = 0;
  let lastFrameTime = 0;
  
  // Function to update intermediate colors when base or brand colors change
  function updateIntermediateColors() {
    console.log('Updating intermediate colors');
    console.log('Base color:', window.config.baseColor);
    console.log('Brand color:', window.config.brandColor);
    
    window.config.intermediateColors = [
      window.config.baseColor,
      [80, 30, 80],  // Purple
      [120, 40, 70], // Maroon
      [180, 60, 60], // Dark Red
      window.config.brandColor
    ];
    needsUpdate = true;
  }
  
  // Function to load saved preset
  function loadSavedPreset() {
    const savedPreset = localStorage.getItem('boxcurveTreePreset');
    if (savedPreset) {
      try {
        const preset = JSON.parse(savedPreset);
        Object.assign(window.config, preset);
        if (window.controlPanel) {
          window.controlPanel.updateControlsFromConfig();
        }
      } catch (e) {
        console.error('Error loading saved preset:', e);
      }
    }
  }

  // Function to save current settings as preset
  function saveCurrentPreset() {
    try {
      localStorage.setItem('boxcurveTreePreset', JSON.stringify(window.config));
    } catch (e) {
      console.error('Error saving preset:', e);
    }
  }

  // Function to update all control values from config
  function updateControlsFromConfig() {
    // Update all input elements to match config values
    Object.keys(window.config).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = window.config[key];
        } else if (element.type === 'color') {
          const color = window.config[key];
          const hexColor = `#${(color[0] << 16 | color[1] << 8 | color[2]).toString(16).padStart(6, '0')}`;
          element.value = hexColor;
        } else {
          element.value = window.config[key];
        }
        
        // Update associated number input and value display if they exist
        const numberElement = document.getElementById(`${key}Number`);
        if (numberElement) {
          numberElement.value = window.config[key];
        }
        
        const valueElement = document.getElementById(`${key}Value`);
        if (valueElement) {
          let displayValue = window.config[key];
          // Add units where appropriate
          if (key.toLowerCase().includes('angle')) {
            displayValue += '°';
          } else if (key.toLowerCase().includes('position') && !key.includes('z')) {
            displayValue += '%';
          }
          valueElement.textContent = displayValue;
        }
      }
    });
  }

  // Function to setup control panel event listeners
  function setupControlPanel() {
    // Add color change listener
    window.addEventListener('colorChanged', function() {
      console.log('Color change event received');
      updateIntermediateColors();
      needsUpdate = true;
    });

    // Helper function to update config and trigger redraw
    function updateConfig(key, value) {
      window.config[key] = value;
      needsUpdate = true;
      saveCurrentPreset();
    }

    // Helper function to handle number inputs
    function setupNumberInput(id, isInteger = true) {
      const element = document.getElementById(id);
      const numberElement = document.getElementById(`${id}Number`);
      const valueElement = document.getElementById(`${id}Value`);
      
      if (element && numberElement) {
        // Sync the number input with the range input
        element.addEventListener('input', function() {
          const value = isInteger ? parseInt(this.value) : parseFloat(this.value);
          numberElement.value = value;
          if (valueElement) {
            let displayValue = value;
            if (id.toLowerCase().includes('angle')) {
              displayValue += '°';
            } else if (id.toLowerCase().includes('position') && !id.includes('z')) {
              displayValue += '%';
            }
            valueElement.textContent = displayValue;
          }
          updateConfig(id, value);
        });

        numberElement.addEventListener('input', function() {
          const value = isInteger ? parseInt(this.value) : parseFloat(this.value);
          element.value = value;
          if (valueElement) {
            let displayValue = value;
            if (id.toLowerCase().includes('angle')) {
              displayValue += '°';
            } else if (id.toLowerCase().includes('position') && !id.includes('z')) {
              displayValue += '%';
            }
            valueElement.textContent = displayValue;
          }
          updateConfig(id, value);
        });
      }
    }

    // Helper function to handle checkbox inputs
    function setupCheckbox(id) {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', function() {
          updateConfig(id, this.checked);
        });
      }
    }

    // Helper function to handle color inputs
    function setupColorInput(id) {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', function() {
          const hex = this.value.substring(1);
          const rgb = [
            parseInt(hex.substring(0, 2), 16),
            parseInt(hex.substring(2, 4), 16),
            parseInt(hex.substring(4, 6), 16)
          ];
          updateConfig(id.replace('Color', ''), rgb);
          document.getElementById(`${id}Hex`).textContent = this.value.toUpperCase();
        });
      }
    }

    // Setup all number inputs
    setupNumberInput('maxDepth', true);
    setupNumberInput('startDepth', true);
    setupNumberInput('branchAngle', true);
    setupNumberInput('angleSpeed', false);
    setupNumberInput('scaleFactor', false);
    setupNumberInput('xPosition', true);
    setupNumberInput('yPosition', true);
    setupNumberInput('zPosition', true);
    setupNumberInput('moveSpeed', false);
    setupNumberInput('startingSize', true);
    setupNumberInput('rotationX', true);
    setupNumberInput('rotationY', true);
    setupNumberInput('rotationZ', true);
    setupNumberInput('rotationSpeed', false);
    setupNumberInput('maxZoom', false);
    setupNumberInput('zoomSpeed', false);
    setupNumberInput('growthStart', true);
    setupNumberInput('growthEnd', true);
    setupNumberInput('strokeWeight', true);
    setupNumberInput('pixelDepth', true);
    setupNumberInput('lightAngleX', true);
    setupNumberInput('lightAngleY', true);
    setupNumberInput('lightIntensity', true);

    // Setup all checkboxes
    setupCheckbox('autoAngle');
    setupCheckbox('autoMove');
    setupCheckbox('autoRotate');
    setupCheckbox('autoDepth');
    setupCheckbox('depthByLevel');
    setupCheckbox('enableLighting');

    // Setup color inputs
    setupColorInput('baseColor');
    setupColorInput('brandColor');

    // Setup fill type selector
    const fillTypeSelect = document.getElementById('fillType');
    if (fillTypeSelect) {
      fillTypeSelect.addEventListener('change', function() {
        updateConfig('fillType', this.value);
      });
    }

    // Setup preset buttons
    ['preset1', 'preset2', 'preset3'].forEach(presetId => {
      const button = document.getElementById(presetId);
      if (button) {
        button.addEventListener('click', function() {
          Object.assign(window.config, window.presets[presetId]);
          updateControlsFromConfig();
          needsUpdate = true;
        });
      }
    });

    // Initial update of all controls
    updateControlsFromConfig();
  }
  
  p.setup = function() {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    canvas.id('treeCanvas');
    
    // Initialize mouse position
    lastMouseX = p.mouseX;
    lastMouseY = p.mouseY;
    lastFrameTime = p.millis();
    
    // Load saved preset if available
    loadSavedPreset();
    
    // Update intermediate colors to match current config
    updateIntermediateColors();
    
    // Set up control panel event listeners
    setupControlPanel();
    
    // Force first update
    needsUpdate = true;
    
    // Show the control panel by default
    const controlPanel = document.getElementById('controlPanel');
    const showPanelButton = document.getElementById('showPanel');
    if (controlPanel && showPanelButton) {
      controlPanel.style.display = 'block';
      showPanelButton.style.display = 'none';
    }
    
    // Explicitly console log that initialization is complete
    console.log("Boxcurve Tree setup complete");
  };
  
  // Update function to check if control panel needs update
  function checkForUpdates() {
    if (window.controlPanel && window.controlPanel.isUpdateNeeded()) {
      needsUpdate = true;
      window.controlPanel.resetUpdateFlag();
    }
  }

  p.draw = function() {
    checkForUpdates();
    const currentTime = p.millis();
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    
    if (window.config.autoRotate || window.config.autoMove || window.config.autoAngle || window.config.autoDepth) {
      if (window.config.autoRotate) {
        window.config.rotationY += window.config.rotationSpeed * deltaTime * 15;
        window.config.rotationZ += window.config.rotationSpeed * deltaTime * 5;
        
        if (window.config.rotationY > 180) window.config.rotationY -= 360;
        if (window.config.rotationZ > 180) window.config.rotationZ -= 360;
        
        document.getElementById('rotationY').value = window.config.rotationY;
        document.getElementById('rotationYValue').textContent = Math.round(window.config.rotationY) + '°';
        
        document.getElementById('rotationZ').value = window.config.rotationZ;
        document.getElementById('rotationZValue').textContent = Math.round(window.config.rotationZ) + '°';
      }
      
      if (window.config.autoMove) {
        window.config.movePhase += window.config.moveSpeed * deltaTime;
        if (window.config.movePhase > Math.PI * 2) window.config.movePhase -= Math.PI * 2;
        
        const xRange = 30;
        const yRange = 8;
        const zRange = 100;
        
        const newX = 50 + xRange * Math.sin(window.config.movePhase);
        const newY = 50 + yRange * Math.cos(window.config.movePhase * 0.3);
        const newZ = zRange * Math.sin(window.config.movePhase * 0.5);
        
        const xzLerpFactor = Math.min(0.05 * (60 * deltaTime), 0.2);
        const yLerpFactor = Math.min(0.02 * (60 * deltaTime), 0.08);
        
        window.config.xPosition = lerp(window.config.xPosition, newX, xzLerpFactor);
        window.config.yPosition = lerp(window.config.yPosition, newY, yLerpFactor);
        window.config.zPosition = lerp(window.config.zPosition, newZ, xzLerpFactor);
        
        if (p.frameCount % 5 === 0) {
          document.getElementById('xPosition').value = Math.round(window.config.xPosition);
          document.getElementById('xPositionValue').textContent = Math.round(window.config.xPosition) + '%';
          
          document.getElementById('yPosition').value = Math.round(window.config.yPosition);
          document.getElementById('yPositionValue').textContent = Math.round(window.config.yPosition) + '%';
          
          document.getElementById('zPosition').value = Math.round(window.config.zPosition);
          document.getElementById('zPositionValue').textContent = Math.round(window.config.zPosition);
        }
      }
      
      if (window.config.autoAngle) {
        window.config.anglePhase += window.config.angleSpeed * deltaTime;
        if (window.config.anglePhase > Math.PI * 2) window.config.anglePhase -= Math.PI * 2;
        
        const minAngle = 15;
        const maxAngle = 75;
        const range = maxAngle - minAngle;
        
        const newAngle = minAngle + range * (0.5 + 0.5 * Math.sin(window.config.anglePhase));
        window.config.branchAngle = newAngle;
        
        document.getElementById('branchAngle').value = Math.round(newAngle);
        document.getElementById('branchAngleValue').textContent = Math.round(newAngle) + '°';
      }
      
      if (window.config.autoDepth) {
        window.config.depthPhase += 0.2 * deltaTime;
        if (window.config.depthPhase > Math.PI * 2) window.config.depthPhase -= Math.PI * 2;
        
        const minDepth = 5;
        const maxDepth = 25;
        const rangeDepth = maxDepth - minDepth;
        
        const newDepth = minDepth + rangeDepth * (0.5 + 0.5 * Math.sin(window.config.depthPhase));
        window.config.pixelDepth = newDepth;
        
        document.getElementById('pixelDepth').value = Math.round(newDepth);
        document.getElementById('pixelDepthValue').textContent = Math.round(newDepth);
      }
      
      needsUpdate = true;
    }
    
    if (!needsUpdate) return;
    
    const startTime = performance.now();
    squaresDrawn = 0;
    
    p.clear();
    
    const scrollProgress = constrain(window.scrollY / (document.body.scrollHeight - p.windowHeight), 0, 1);
    
    const growthRange = window.config.growthEnd - window.config.growthStart;
    const normalizedScrollProgress = constrain(
      map(scrollProgress * 100, window.config.growthStart, window.config.growthEnd, 0, 1), 
      0, 
      1
    );
    
    currentDepth = Math.floor(map(normalizedScrollProgress, 0, 1, window.config.startDepth, window.config.maxDepth));
    targetZoom = map(scrollProgress, 0, 1, 1.0, window.config.maxZoom);
    
    zoomFactor += (targetZoom - zoomFactor) * window.config.zoomSpeed;
    
    if (scrollProgress < 0.01) {
      zoomFactor = lerp(zoomFactor, 1.0, 0.1);
      if (Math.abs(zoomFactor - 1.0) < 0.01) {
        zoomFactor = 1.0;
      }
    }
    
    p.push();
    
    // Calculate the position in screen coordinates
    const xPos = map(window.config.xPosition, 0, 100, -p.width/2, p.width/2);
    const yPos = map(window.config.yPosition, 0, 100, -p.height/2, p.height/2);
    
    // Apply position
    p.translate(xPos, yPos, window.config.zPosition);
    
    // Apply rotations
    p.rotateX(p.radians(window.config.rotationX));
    p.rotateY(p.radians(window.config.rotationY));
    p.rotateZ(p.radians(window.config.rotationZ));
    
    // Scale based on zoom factor
    p.scale(zoomFactor);
    
    // Draw the tree
    drawBoxcurveTree(0, 0, window.config.startingSize, currentDepth, scrollProgress);
    
    p.pop();
    
    // Update render time
    renderTime = performance.now() - startTime;
    
    // Update metrics in the control panel
    updateMetrics(scrollProgress);
    
    // Mark update as complete
    needsUpdate = false;
    
    // Log success
    if (squaresDrawn > 0) {
      console.log(`Frame rendered with ${squaresDrawn} squares`);
    }
  };
  
  function drawBoxcurveTree(x, y, size, depth, scrollProgress) {
    p.push();
    p.translate(x, y);
    
    if (depth > 0) {
      const p1 = [-size / 2, -size / 2];
      const p2 = [size / 2, -size / 2];
      generateTree([p1, p2], 0, depth, scrollProgress);
    }
    
    p.pop();
  }
  
  function generateTree(coordSet, depth, maxDepth, scrollProgress) {
    if (depth >= maxDepth) return;
    
    const p1 = coordSet[0];
    const p2 = coordSet[1];
    
    // Draw the cube (square)
    const cubeCoordSet = drawCube(p1, p2, depth, scrollProgress);
    
    // Calculate next squares
    const size = p.dist(p1[0], p1[1], p2[0], p2[1]);
    const nextSize = size * window.config.scaleFactor;
    
    // Draw the triangle for branch connection
    const triangleCoordSets = drawTriangle(cubeCoordSet[0], cubeCoordSet[1], depth, window.config.branchAngle, mirror, scrollProgress);
    
    // Continue with recursion for next branches
    for (let nextCoordSet of triangleCoordSets) {
      generateTree(nextCoordSet, depth + 1, maxDepth, scrollProgress);
    }
  }
  
  function drawCube(p1, p2, depth, scrollProgress) {
    // Calculate the other two points of the square
    const p1_to_p2 = [p1[0] - p2[0], p1[1] - p2[1]];
    const p1_to_p4 = [-p1_to_p2[1], p1_to_p2[0]];
    
    const p3 = [p2[0] + p1_to_p4[0], p2[1] + p1_to_p4[1]];
    const p4 = [p1[0] + p1_to_p4[0], p1[1] + p1_to_p4[1]];
    
    // Get style based on settings
    const style = getStyle(depth, "cube", scrollProgress);
    
    // Calculate actual depth based on settings
    let actualDepth = window.config.pixelDepth;
    
    // Vary depth by level if enabled
    if (window.config.depthByLevel) {
      actualDepth = window.config.pixelDepth * (1.0 - (depth / window.config.maxDepth) * 0.5);
    }
    
    // Calculate lighting effect if enabled
    let shadeFactor = 1.0;
    
    if (window.config.enableLighting) {
      // Convert light angles to radians
      const lightX = p.radians(window.config.lightAngleX);
      const lightY = p.radians(window.config.lightAngleY);
      
      // Calculate light direction vector (simplified)
      const lightDirX = Math.cos(lightY) * Math.sin(lightX);
      const lightDirY = Math.sin(lightY);
      const lightDirZ = Math.cos(lightY) * Math.cos(lightX);
      
      // We'll use a simple directional lighting model
      // The face normal is just (0, 0, 1) for the front face
      const dotProduct = lightDirZ; // Simplified dot product for front face
      
      // Map the dot product to shade
      const lightIntensityFactor = window.config.lightIntensity / 100;
      shadeFactor = 0.3 + 0.7 * Math.max(0, dotProduct) * lightIntensityFactor;
    }
    
    // Only draw the front face if not using sidewalls only style
    if (style.fillType !== 'sidewalls') {
      // Draw the 3D cube - first the front face
      p.beginShape();
      
      // Set fill color if specified
      if (style.fill) {
        const r = style.fill[0] * shadeFactor;
        const g = style.fill[1] * shadeFactor;
        const b = style.fill[2] * shadeFactor;
        p.fill(r, g, b);
      } else {
        p.noFill();
      }
      
      // Set stroke if specified
      if (style.outline) {
        if (style.outline.length > 3) {
          p.stroke(style.outline[0], style.outline[1], style.outline[2], style.outline[3]);
        } else {
          p.stroke(style.outline[0], style.outline[1], style.outline[2]);
        }
        p.strokeWeight(window.config.strokeWeight);
      } else {
        p.noStroke();
      }
      
      // Front face
      p.vertex(p1[0], p1[1], 0);
      p.vertex(p2[0], p2[1], 0);
      p.vertex(p3[0], p3[1], 0);
      p.vertex(p4[0], p4[1], 0);
      p.endShape(p.CLOSE);
    }
    
    // Only draw the other faces if we have actual depth
    if (actualDepth > 0) {
      // Calculate back points
      const backZ = -actualDepth;
      
      // Calculate darker shade for side faces
      const sideShadeFactor = shadeFactor * 0.8; // Make sides slightly darker
      
      // Side faces (only if the cube has depth)
      // Left face
      p.beginShape();
      if (style.fill) {
        const r = style.fill[0] * sideShadeFactor;
        const g = style.fill[1] * sideShadeFactor;
        const b = style.fill[2] * sideShadeFactor;
        p.fill(r, g, b);
      }
      if (style.outline) {
        p.strokeWeight(window.config.strokeWeight);
      }
      p.vertex(p1[0], p1[1], 0);
      p.vertex(p4[0], p4[1], 0);
      p.vertex(p4[0], p4[1], backZ);
      p.vertex(p1[0], p1[1], backZ);
      p.endShape(p.CLOSE);
      
      // Right face
      p.beginShape();
      if (style.outline) {
        p.strokeWeight(window.config.strokeWeight);
      }
      p.vertex(p2[0], p2[1], 0);
      p.vertex(p3[0], p3[1], 0);
      p.vertex(p3[0], p3[1], backZ);
      p.vertex(p2[0], p2[1], backZ);
      p.endShape(p.CLOSE);
      
      // Top face
      p.beginShape();
      const topShadeFactor = shadeFactor * 0.9; // Slightly darker
      if (style.fill) {
        const r = style.fill[0] * topShadeFactor;
        const g = style.fill[1] * topShadeFactor;
        const b = style.fill[2] * topShadeFactor;
        p.fill(r, g, b);
      }
      if (style.outline) {
        p.strokeWeight(window.config.strokeWeight);
      }
      p.vertex(p1[0], p1[1], 0);
      p.vertex(p2[0], p2[1], 0);
      p.vertex(p2[0], p2[1], backZ);
      p.vertex(p1[0], p1[1], backZ);
      p.endShape(p.CLOSE);
      
      // Bottom face
      p.beginShape();
      if (style.outline) {
        p.strokeWeight(window.config.strokeWeight);
      }
      p.vertex(p4[0], p4[1], 0);
      p.vertex(p3[0], p3[1], 0);
      p.vertex(p3[0], p3[1], backZ);
      p.vertex(p4[0], p4[1], backZ);
      p.endShape(p.CLOSE);
      
      // Only draw the back face if not using sidewalls only style
      if (style.fillType !== 'sidewalls') {
        // Back face
        p.beginShape();
        const backShadeFactor = shadeFactor * 0.7; // Make back face darker
        if (style.fill) {
          const r = style.fill[0] * backShadeFactor;
          const g = style.fill[1] * backShadeFactor;
          const b = style.fill[2] * backShadeFactor;
          p.fill(r, g, b);
        }
        if (style.outline) {
          p.strokeWeight(window.config.strokeWeight);
        }
        p.vertex(p1[0], p1[1], backZ);
        p.vertex(p2[0], p2[1], backZ);
        p.vertex(p3[0], p3[1], backZ);
        p.vertex(p4[0], p4[1], backZ);
        p.endShape(p.CLOSE);
      }
    }
    
    squaresDrawn++;
    
    return [p3, p4];
  }
  
  function drawTriangle(p1, p2, depth, angle, mirror, scrollProgress) {
    // Convert angle to radians
    let angle1 = p.PI * ((90 - angle) / 180);
    let angle2 = p.PI * (angle / 180);
    
    if (mirror) {
      [angle1, angle2] = [angle2, angle1];
    }
    
    const angle3 = p.PI - angle1 - angle2;
    
    // Calculate vectors and lengths
    const p1_to_p2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const length_p1_to_p2 = Math.sqrt(p1_to_p2[0] * p1_to_p2[0] + p1_to_p2[1] * p1_to_p2[1]);
    const length_p1_to_p3 = length_p1_to_p2 * Math.sin(angle2) / Math.sin(angle3);
    
    const x = p1_to_p2[0];
    const y = p1_to_p2[1];
    
    // Calculate third point using the equations
    const equation_1 = p1[0] * x + p1[1] * y + length_p1_to_p3 * length_p1_to_p2 * Math.cos(angle1);
    const equation_2 = p2[1] * x - p2[0] * y + length_p1_to_p3 * length_p1_to_p2 * Math.sin(angle1);
    
    const factor = 1 / (length_p1_to_p2 * length_p1_to_p2);
    const x3 = factor * (x * equation_1 - y * equation_2);
    const y3 = factor * (y * equation_1 + x * equation_2);
    
    const p3 = [x3, y3];
    
    // Return the coordinates for the next branches
    return [[p3, p1], [p2, p3]];
  }
  
  function getStyle(depth, shape, scrollProgress) {
    // Determine color based on depth and settings
    let fillColor, outlineColor;
    
    switch(window.config.fillType) {
      case 'outline':
        // Just outlines, no fill
        fillColor = null;
        outlineColor = window.config.brandColor;
        break;
        
      case 'solid':
        // Solid fill based on depth
        fillColor = (depth === 0) ? window.config.baseColor : window.config.brandColor;
        outlineColor = null;
        break;
        
      case 'sidewalls':
        // Side walls only - use fill color but no outline
        fillColor = (depth === 0) ? window.config.baseColor : window.config.brandColor;
        outlineColor = window.config.brandColor; // Still need outline for the edges
        break;
        
      case 'gradient':
      default:
        // Gradient fill based on depth
        const colorIndex = constrain(map(depth, 0, window.config.maxDepth, 0, window.config.intermediateColors.length - 1), 0, window.config.intermediateColors.length - 1);
        const lowerIndex = Math.floor(colorIndex);
        const upperIndex = Math.ceil(colorIndex);
        const blendFactor = colorIndex - lowerIndex;
        
        if (lowerIndex === upperIndex) {
          fillColor = window.config.intermediateColors[lowerIndex];
        } else {
          // Blend between colors
          fillColor = [
            lerp(window.config.intermediateColors[lowerIndex][0], window.config.intermediateColors[upperIndex][0], blendFactor),
            lerp(window.config.intermediateColors[lowerIndex][1], window.config.intermediateColors[upperIndex][1], blendFactor),
            lerp(window.config.intermediateColors[lowerIndex][2], window.config.intermediateColors[upperIndex][2], blendFactor)
          ];
        }
        
        // Progressively remove outline as we scroll
        const outlineOpacity = map(scrollProgress, 0.3, 0.7, 255, 0);
        outlineColor = (outlineOpacity > 0) ? [...window.config.brandColor, outlineOpacity] : null;
        break;
    }
    
    return {
      fill: fillColor,
      outline: outlineColor,
      fillType: window.config.fillType
    };
  }
  
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    needsUpdate = true;
  };
  
  function updateMetrics(scrollProgress) {
    const metricsElem = document.getElementById('metrics');
    
    metricsElem.innerHTML = `
      <h4>Debug Information</h4>
      Current Depth: ${currentDepth}/${window.config.maxDepth}<br>
      Squares Drawn: ${squaresDrawn}<br>
      Render Time: ${renderTime.toFixed(2)}ms<br>
      Zoom Factor: ${zoomFactor.toFixed(2)}x<br>
      Scroll Progress: ${(scrollProgress * 100).toFixed(1)}%<br>
      Growth: ${window.config.growthStart}% to ${window.config.growthEnd}%<br>
      Branch Angle: ${Math.round(window.config.branchAngle)}° (Auto: ${window.config.autoAngle ? "On" : "Off"})<br>
      Position: X:${Math.round(window.config.xPosition)}%, Y:${Math.round(window.config.yPosition)}%, Z:${Math.round(window.config.zPosition)} (Auto: ${window.config.autoMove ? "On" : "Off"})<br>
      Rotation: X:${Math.round(window.config.rotationX)}°, Y:${Math.round(window.config.rotationY)}°, Z:${Math.round(window.config.rotationZ)}° (Auto: ${window.config.autoRotate ? "On" : "Off"})<br>
      Pixel Depth: ${Math.round(window.config.pixelDepth)} (Auto: ${window.config.autoDepth ? "On" : "Off"})<br>
      Light Angle: X:${Math.round(window.config.lightAngleX)}°, Y:${Math.round(window.config.lightAngleY)}° (Intensity: ${window.config.lightIntensity}%)
    `;
  }
  
  // Event listeners
  window.addEventListener('scroll', function() {
    needsUpdate = true;
    lastScrollY = window.scrollY;
  });
} 