import { lerp, constrain, map } from '../utils/helpers.js';

// Global q5.js instance
let q5Instance;

// Debug logging utility
const debug = {
  log: (message, data = null) => {
    console.log(`[Q5 Debug] ${message}`, data || '');
  },
  error: (message, error = null) => {
    console.error(`[Q5 Error] ${message}`, error || '');
  },
  warn: (message, data = null) => {
    console.warn(`[Q5 Warning] ${message}`, data || '');
  },
  info: (message, data = null) => {
    console.info(`[Q5 Info] ${message}`, data || '');
  }
};

// Initialize q5.js sketch
async function initializeQ5Sketch() {
  debug.info('Starting q5.js sketch initialization...');
  
  if (!window.config) {
    debug.warn('Config not found, waiting for config to be available...');
    setTimeout(initializeQ5Sketch, 100);
    return;
  }

  debug.info('Config found, proceeding with initialization...');
  
  // First check if Q5 is available
  if (typeof Q5 === 'undefined') {
    debug.error('Q5 library not found! Make sure q5.js is properly loaded.');
    document.body.innerHTML += '<div style="color:red;background:black;padding:20px;position:fixed;top:0;left:0;right:0;z-index:9999">Q5 library not found. Make sure q5.js is properly loaded.</div>';
    return;
  }
  
  try {
    debug.info('Checking for WebGPU support...');
    
    // Initialize Q5 - try WebGPU method first if it exists
    let q;
    if (typeof Q5.WebGPU === 'function') {
      try {
        debug.info('Attempting to use WebGPU renderer...');
        q = await Q5.WebGPU();
        debug.info('WebGPU renderer initialized successfully!');
      } catch (webgpuError) {
        debug.warn('WebGPU not available:', webgpuError);
        debug.info('Falling back to standard Q5 renderer');
        q = new Q5();
      }
    } else {
      debug.info('WebGPU method not available, using standard Q5 renderer');
      q = new Q5();
    }
    
    // Run the sketch with the q instance
    sketch(q);
    
    debug.info('Q5 sketch initialized successfully');
  } catch (error) {
    debug.error('Failed to initialize Q5:', error);
    document.body.innerHTML += `<div style="color:red;background:black;padding:20px;position:fixed;top:0;left:0;right:0;z-index:9999">Failed to initialize Q5 renderer: ${error.message}</div>`;
  }
}

// Define the q5.js sketch
function sketch(q) {
  debug.info('Q5 sketch function called');
  
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
  let frameCount = 0;
  let fps = 0;
  let lastFpsUpdate = 0;

  // Function to update intermediate colors when base or brand colors change
  function updateIntermediateColors() {
    debug.info('Updating intermediate colors');
    debug.info('Base color:', window.config.baseColor);
    debug.info('Brand color:', window.config.brandColor);
    
    try {
      window.config.intermediateColors = [
        window.config.baseColor,
        [80, 30, 80],  // Purple
        [120, 40, 70], // Maroon
        [180, 60, 60], // Dark Red
        window.config.brandColor
      ];
      needsUpdate = true;
      debug.info('Intermediate colors updated successfully');
    } catch (error) {
      debug.error('Failed to update intermediate colors:', error);
    }
  }

  // Function to load saved preset
  function loadSavedPreset() {
    debug.info('Attempting to load saved preset...');
    const savedPreset = localStorage.getItem('boxcurveTreePreset');
    
    if (!savedPreset) {
      debug.info('No saved preset found');
      return;
    }

    try {
      const preset = JSON.parse(savedPreset);
      Object.assign(window.config, preset);
      debug.info('Preset loaded successfully:', preset);
      
      if (window.controlPanel) {
        window.controlPanel.updateControlsFromConfig();
        debug.info('Control panel updated with preset values');
      } else {
        debug.warn('Control panel not found, skipping update');
      }
    } catch (error) {
      debug.error('Error loading saved preset:', error);
    }
  }

  // Function to save current settings as preset
  function saveCurrentPreset() {
    try {
      const preset = JSON.stringify(window.config);
      localStorage.setItem('boxcurveTreePreset', preset);
      debug.info('Current settings saved as preset');
    } catch (error) {
      debug.error('Error saving preset:', error);
    }
  }

  // Function to update all control values from config
  function updateControlsFromConfig() {
    debug.info('Updating control values from config...');
    
    try {
      Object.keys(window.config).forEach(key => {
        const element = document.getElementById(key);
        if (!element) {
          debug.warn(`Control element not found for key: ${key}`);
          return;
        }

        try {
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
        } catch (error) {
          debug.error(`Error updating control for key ${key}:`, error);
        }
      });
      debug.info('Control values updated successfully');
    } catch (error) {
      debug.error('Failed to update control values:', error);
    }
  }

  // Function to setup control panel event listeners
  function setupControlPanel() {
    debug.info('Setting up control panel event listeners...');
    
    try {
      // Add color change listener
      window.addEventListener('colorChanged', function() {
        debug.info('Color change event received');
        updateIntermediateColors();
        needsUpdate = true;
      });

      // Helper function to update config and trigger redraw
      function updateConfig(key, value) {
        debug.info(`Updating config: ${key} = ${value}`);
        window.config[key] = value;
        needsUpdate = true;
        saveCurrentPreset();
      }

      // Helper function to handle number inputs
      function setupNumberInput(id, isInteger = true) {
        debug.info(`Setting up number input: ${id}`);
        const element = document.getElementById(id);
        const numberElement = document.getElementById(`${id}Number`);
        const valueElement = document.getElementById(`${id}Value`);
        
        if (!element || !numberElement) {
          debug.warn(`Missing elements for number input: ${id}`);
          return;
        }

        try {
          // Sync the number input with the range input
          element.addEventListener('input', function() {
            const value = isInteger ? parseInt(this.value) : parseFloat(this.value);
            if (isNaN(value)) {
              debug.warn(`Invalid number input for ${id}:`, this.value);
              return;
            }
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
            if (isNaN(value)) {
              debug.warn(`Invalid number input for ${id}:`, this.value);
              return;
            }
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
        } catch (error) {
          debug.error(`Error setting up number input ${id}:`, error);
        }
      }

      // Helper function to handle checkboxes
      function setupCheckbox(id) {
        debug.info(`Setting up checkbox: ${id}`);
        const element = document.getElementById(id);
        if (!element) {
          debug.warn(`Checkbox not found: ${id}`);
          return;
        }

        try {
          element.addEventListener('change', function() {
            updateConfig(id, this.checked);
          });
        } catch (error) {
          debug.error(`Error setting up checkbox ${id}:`, error);
        }
      }

      // Helper function to handle color inputs
      function setupColorInput(id) {
        debug.info(`Setting up color input: ${id}`);
        const element = document.getElementById(id);
        if (!element) {
          debug.warn(`Color input not found: ${id}`);
          return;
        }

        try {
          element.addEventListener('input', function() {
            const hexColor = this.value;
            if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
              debug.warn(`Invalid hex color for ${id}:`, hexColor);
              return;
            }
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            updateConfig(id, [r, g, b]);
            window.dispatchEvent(new Event('colorChanged'));
          });
        } catch (error) {
          debug.error(`Error setting up color input ${id}:`, error);
        }
      }

      // Setup all control inputs
      debug.info('Setting up all control inputs...');
      
      // Number inputs
      const numberInputs = [
        'maxDepth', 'startDepth', 'branchAngle', 'angleSpeed', 'scaleFactor',
        'xPosition', 'yPosition', 'zPosition', 'moveSpeed', 'startingSize',
        'rotationX', 'rotationY', 'rotationZ', 'rotationSpeed', 'maxZoom',
        'zoomSpeed', 'growthStart', 'growthEnd', 'pixelDepth', 'lightAngleX',
        'lightAngleY', 'lightIntensity', 'strokeWeight'
      ];
      
      numberInputs.forEach(id => setupNumberInput(id, !id.includes('Speed') && !id.includes('Factor')));

      // Checkboxes
      const checkboxes = [
        'autoAngle', 'autoMove', 'autoRotate', 'autoDepth',
        'depthByLevel', 'enableLighting'
      ];
      checkboxes.forEach(id => setupCheckbox(id));

      // Color inputs
      const colorInputs = ['baseColor', 'brandColor'];
      colorInputs.forEach(id => setupColorInput(id));

      // Select inputs
      const selectInputs = {
        'fillType': ['gradient', 'solid', 'outline', 'sidewalls'],
        'exportQuality': ['standard', 'high']
      };

      Object.entries(selectInputs).forEach(([id, options]) => {
        debug.info(`Setting up select input: ${id}`);
        const element = document.getElementById(id);
        if (!element) {
          debug.warn(`Select input not found: ${id}`);
          return;
        }

        try {
          element.addEventListener('change', function() {
            updateConfig(id, this.value);
          });
        } catch (error) {
          debug.error(`Error setting up select input ${id}:`, error);
        }
      });

      debug.info('Control panel setup completed successfully');
    } catch (error) {
      debug.error('Failed to setup control panel:', error);
    }
  }

  // Function to check for updates and redraw if needed
  function checkForUpdates() {
    if (needsUpdate) {
      debug.info('Update needed, triggering redraw');
      q.redraw();
      needsUpdate = false;
    }
  }

  // Function to update performance metrics
  function updateMetrics(scrollProgress) {
    const metricsElem = document.getElementById('metrics');
    if (!metricsElem) return;
    
    metricsElem.innerHTML = `
      <h4>Debug Information</h4>
      <div class="metrics-container">
        <div class="metric-row">Current Depth: ${currentDepth}/${window.config.maxDepth}</div>
        <div class="metric-row">Squares Drawn: ${squaresDrawn}</div>
        <div class="metric-row">Render Time: ${renderTime.toFixed(2)}ms</div>
        <div class="metric-row">Zoom Factor: ${zoomFactor.toFixed(2)}x</div>
        <div class="metric-row">Scroll Progress: ${(scrollProgress * 100).toFixed(1)}%</div>
        <div class="metric-row">Growth: ${window.config.growthStart}% to ${window.config.growthEnd}%</div>
        <div class="metric-row">Branch Angle: ${Math.round(window.config.branchAngle)}° (Auto: ${window.config.autoAngle ? "On" : "Off"})</div>
        <div class="metric-row">Position: X:${Math.round(window.config.xPosition)}%, Y:${Math.round(window.config.yPosition)}%, Z:${Math.round(window.config.zPosition)} (Auto: ${window.config.autoMove ? "On" : "Off"})</div>
        <div class="metric-row">Rotation: X:${Math.round(window.config.rotationX)}°, Y:${Math.round(window.config.rotationY)}°, Z:${Math.round(window.config.rotationZ)}° (Auto: ${window.config.autoRotate ? "On" : "Off"})</div>
        <div class="metric-row">Pixel Depth: ${Math.round(window.config.pixelDepth)} (Auto: ${window.config.autoDepth ? "On" : "Off"})</div>
        <div class="metric-row">Light Angle: X:${Math.round(window.config.lightAngleX)}°, Y:${Math.round(window.config.lightAngleY)}° (Intensity: ${window.config.lightIntensity}%)</div>
        <div class="metric-row">Renderer: q5.js</div>
      </div>
    `;
  }

  // Add these placeholder functions for drawing the tree
  function drawBoxcurveTree(x, y, size, depth, scrollProgress) {
    // Simple 2D version for testing
    q.push();
    q.translate(x, y);
    
    // Draw a simple square for testing
    q.fill(0.8, 0.4, 0.2); // Orange in RGB float mode
    q.rect(0, 0, size, size);
    
    q.pop();
    
    // Record that we drew a square
    squaresDrawn = 1;
  }

  // REPLACE WITH THESE ACTUAL TREE GENERATION FUNCTIONS:

  function drawBoxcurveTree(x, y, size, depth, scrollProgress) {
    q.push();
    q.translate(x, y);
    
    if (depth > 0) {
      const p1 = [-size / 2, -size / 2];
      const p2 = [size / 2, -size / 2];
      generateTree([p1, p2], 0, depth, scrollProgress);
    }
    
    q.pop();
  }
  
  function generateTree(coordSet, depth, maxDepth, scrollProgress) {
    if (depth >= maxDepth) return;
    
    const p1 = coordSet[0];
    const p2 = coordSet[1];
    
    // Draw the cube (square in 2D mode)
    const cubeCoordSet = drawCube(p1, p2, depth, scrollProgress);
    
    // Calculate next squares
    const size = Math.sqrt(
      Math.pow(p1[0] - p2[0], 2) + 
      Math.pow(p1[1] - p2[1], 2)
    );
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
    
    // Calculate actual depth based on settings (used for shading)
    let actualDepth = window.config.pixelDepth;
    
    // Vary depth by level if enabled
    if (window.config.depthByLevel) {
      actualDepth = window.config.pixelDepth * (1.0 - (depth / window.config.maxDepth) * 0.5);
    }
    
    // Calculate lighting effect if enabled
    let shadeFactor = 1.0;
    
    if (window.config.enableLighting) {
      // Convert light angles to radians
      const lightX = q.radians(window.config.lightAngleX);
      const lightY = q.radians(window.config.lightAngleY);
      
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
    
    // In 2D mode, we just draw a square
    q.beginShape();
    
    // Set fill color if specified
    if (style.fill) {
      const r = style.fill[0] * shadeFactor / 255;
      const g = style.fill[1] * shadeFactor / 255;
      const b = style.fill[2] * shadeFactor / 255;
      q.fill(r, g, b);
    } else {
      q.noFill();
    }
    
    // Set stroke if specified
    if (style.outline) {
      if (style.outline.length > 3) {
        q.stroke(
          style.outline[0] / 255, 
          style.outline[1] / 255, 
          style.outline[2] / 255, 
          style.outline[3] / 255
        );
      } else {
        q.stroke(
          style.outline[0] / 255, 
          style.outline[1] / 255, 
          style.outline[2] / 255
        );
      }
      q.strokeWeight(window.config.strokeWeight);
    } else {
      q.noStroke();
    }
    
    // Draw the square with 4 vertices
    q.vertex(p1[0], p1[1]);
    q.vertex(p2[0], p2[1]);
    q.vertex(p3[0], p3[1]);
    q.vertex(p4[0], p4[1]);
    q.endShape(q.CLOSE);
    
    squaresDrawn++;
    
    return [p3, p4];
  }
  
  function drawTriangle(p1, p2, depth, angle, mirror, scrollProgress) {
    // Convert angle to radians
    let angle1 = Math.PI * ((90 - angle) / 180);
    let angle2 = Math.PI * (angle / 180);
    
    if (mirror) {
      [angle1, angle2] = [angle2, angle1];
    }
    
    const angle3 = Math.PI - angle1 - angle2;
    
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

  // Also add a helper function to safely call q5 methods that might not exist
  function safeCall(object, methodName, ...args) {
    if (typeof object[methodName] === 'function') {
      return object[methodName](...args);
    }
    debug.warn(`Method ${methodName} is not available in this q5 instance`);
    return null;
  }

  // Setup function
  q.setup = function() {
    debug.info('Q5 setup called');
    try {
      // Force 2D context (no WEBGL) as 3D functions aren't fully supported
      q.createCanvas(window.innerWidth, window.innerHeight);
      debug.info('Canvas created with 2D renderer');
      
      // Set color mode
      q.colorMode(q.RGB, 1); // Set to q5's default float-based color mode
      
      // Center rectangle mode
      if (typeof q.rectMode === 'function') {
        q.rectMode(q.CENTER);
      }
      
      q.noStroke();
      setupControlPanel();
      loadSavedPreset();
      debug.info('Q5 setup completed successfully');
    } catch (error) {
      debug.error('Failed to complete Q5 setup:', error);
    }
  };

  // Draw function
  q.draw = function() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = currentTime;
    frameCount++;

    try {
      // Check for updates first
      checkForUpdates();
      
      // Handle auto-animations
      if (window.config.autoRotate || window.config.autoMove || window.config.autoAngle || window.config.autoDepth) {
        if (window.config.autoRotate) {
          window.config.rotationY += window.config.rotationSpeed * deltaTime * 15;
          window.config.rotationZ += window.config.rotationSpeed * deltaTime * 5;
          
          if (window.config.rotationY > 180) window.config.rotationY -= 360;
          if (window.config.rotationZ > 180) window.config.rotationZ -= 360;
          
          const rotYElement = document.getElementById('rotationY');
          const rotYValueElement = document.getElementById('rotationYValue');
          if (rotYElement) rotYElement.value = window.config.rotationY;
          if (rotYValueElement) rotYValueElement.textContent = Math.round(window.config.rotationY) + '°';
          
          const rotZElement = document.getElementById('rotationZ');
          const rotZValueElement = document.getElementById('rotationZValue');
          if (rotZElement) rotZElement.value = window.config.rotationZ;
          if (rotZValueElement) rotZValueElement.textContent = Math.round(window.config.rotationZ) + '°';
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
          
          if (frameCount % 5 === 0) {
            const xPosElement = document.getElementById('xPosition');
            const xPosValueElement = document.getElementById('xPositionValue');
            if (xPosElement) xPosElement.value = Math.round(window.config.xPosition);
            if (xPosValueElement) xPosValueElement.textContent = Math.round(window.config.xPosition) + '%';
            
            const yPosElement = document.getElementById('yPosition');
            const yPosValueElement = document.getElementById('yPositionValue');
            if (yPosElement) yPosElement.value = Math.round(window.config.yPosition);
            if (yPosValueElement) yPosValueElement.textContent = Math.round(window.config.yPosition) + '%';
            
            const zPosElement = document.getElementById('zPosition');
            const zPosValueElement = document.getElementById('zPositionValue');
            if (zPosElement) zPosElement.value = Math.round(window.config.zPosition);
            if (zPosValueElement) zPosValueElement.textContent = Math.round(window.config.zPosition);
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
          
          const branchAngleElement = document.getElementById('branchAngle');
          const branchAngleValueElement = document.getElementById('branchAngleValue');
          if (branchAngleElement) branchAngleElement.value = Math.round(newAngle);
          if (branchAngleValueElement) branchAngleValueElement.textContent = Math.round(newAngle) + '°';
        }
        
        if (window.config.autoDepth) {
          window.config.depthPhase += 0.2 * deltaTime;
          if (window.config.depthPhase > Math.PI * 2) window.config.depthPhase -= Math.PI * 2;
          
          const minDepth = 5;
          const maxDepth = 25;
          const rangeDepth = maxDepth - minDepth;
          
          const newDepth = minDepth + rangeDepth * (0.5 + 0.5 * Math.sin(window.config.depthPhase));
          window.config.pixelDepth = newDepth;
          
          const pixelDepthElement = document.getElementById('pixelDepth');
          const pixelDepthValueElement = document.getElementById('pixelDepthValue');
          if (pixelDepthElement) pixelDepthElement.value = Math.round(newDepth);
          if (pixelDepthValueElement) pixelDepthValueElement.textContent = Math.round(newDepth);
        }
        
        needsUpdate = true;
      }
      
      if (!needsUpdate) return;
      
      // Start measuring rendering time
      const startTime = performance.now();
      squaresDrawn = 0;
      
      // Clear the canvas
      q.background(1); // Clear with white in float-based color mode
      
      // Calculate scroll progress (0-1 based on page scroll position)
      const scrollProgress = constrain(window.scrollY / (document.body.scrollHeight - window.innerHeight), 0, 1);
      
      // Calculate normalized scroll progress based on growth start/end settings
      const growthRange = window.config.growthEnd - window.config.growthStart;
      const normalizedScrollProgress = constrain(
        map(scrollProgress * 100, window.config.growthStart, window.config.growthEnd, 0, 1), 
        0, 
        1
      );
      
      // Map the normalized scroll progress to determine tree depth
      currentDepth = Math.floor(map(normalizedScrollProgress, 0, 1, window.config.startDepth, window.config.maxDepth));
      
      // Calculate target zoom based on scroll
      targetZoom = map(scrollProgress, 0, 1, 1.0, window.config.maxZoom);
      
      // Smoothly adjust zoom
      zoomFactor += (targetZoom - zoomFactor) * window.config.zoomSpeed;
      
      // Ensure zoom is exactly 1.0 when at the top of the page (with a small tolerance)
      if (scrollProgress < 0.01) {
        zoomFactor = lerp(zoomFactor, 1.0, 0.1);  // Faster convergence to 1.0 when near top
        if (Math.abs(zoomFactor - 1.0) < 0.01) {
          zoomFactor = 1.0;  // Snap to exactly 1.0 when very close
        }
      }
      
      // Apply transformations and draw the tree
      q.push();
      
      // Position in screen coordinates
      const xPos = map(window.config.xPosition, 0, 100, -q.width/2, q.width/2);
      const yPos = map(window.config.yPosition, 0, 100, -q.height/2, q.height/2);
      q.translate(xPos, yPos);
      
      // Apply 2D rotation (only Z rotation works in 2D mode)
      q.rotate(q.radians(window.config.rotationZ));
      
      // Scale based on zoom factor
      q.scale(zoomFactor);
      
      // Draw the tree with current depth
      drawBoxcurveTree(0, 0, window.config.startingSize, currentDepth, scrollProgress);
      
      q.pop();
      
      // Update render time
      renderTime = performance.now() - startTime;
      
      // Update metrics in UI
      updateMetrics(scrollProgress);
      
      // Mark update as complete
      needsUpdate = false;
      
      // Log success
      if (squaresDrawn > 0 && frameCount % 60 === 0) {
        debug.info(`Frame rendered with ${squaresDrawn} squares`);
      }
    } catch (error) {
      debug.error('Error in draw loop:', error);
    }
  };

  // Window resize handler
  q.windowResized = function() {
    debug.info('Window resize detected');
    try {
      q.resizeCanvas(window.innerWidth, window.innerHeight);
      debug.info('Canvas resized successfully');
    } catch (error) {
      debug.error('Failed to resize canvas:', error);
    }
  };
}

// Export the initialization function at the module level
window.initializeQ5Sketch = initializeQ5Sketch;
console.log('initializeQ5Sketch function exported to window object');

// Auto-initialize after a brief delay to ensure all modules are loaded
setTimeout(() => {
  console.log('Auto-initializing Q5 sketch...');
  if (typeof initializeQ5Sketch === 'function') {
    initializeQ5Sketch();
  }
}, 10); 