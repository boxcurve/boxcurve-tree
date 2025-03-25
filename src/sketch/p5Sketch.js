import { lerp, constrain, map } from '../utils/helpers.js';
import './q5Sketch.js';

// Global p5.js instance
let p5Instance;

// Initialize control panel visibility
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  const controlPanel = document.getElementById('controlPanel');
  const showPanelButton = document.getElementById('showPanel');
  const hidePanelButton = document.getElementById('hidePanel');
  const rendererModeSelect = document.getElementById('rendererMode');

  console.log('Control Panel:', controlPanel);
  console.log('Show Panel Button:', showPanelButton);
  console.log('Hide Panel Button:', hidePanelButton);
  console.log('Renderer Mode Select:', rendererModeSelect);

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

  if (rendererModeSelect) {
    rendererModeSelect.addEventListener('change', function() {
      console.log('Renderer mode changed:', this.value);
      switchRenderer(this.value);
    });
  }
});

// Function to switch between renderers
function switchRenderer(mode) {
  console.log('Switching renderer to:', mode);
  
  // Clean up existing renderer
  if (p5Instance) {
    console.log('Cleaning up p5.js instance');
    p5Instance.remove();
    p5Instance = null;
  }

  // Initialize new renderer
  if (mode === 'p5') {
    console.log('Initializing p5.js renderer');
    initializeSketch();
  } else if (mode === 'q5') {
    console.log('Initializing q5.js renderer');
    initializeQ5Sketch();
  }
}

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
  let frameCount = 0;
  let fps = 0;
  let lastFpsUpdate = 0;

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
    console.log('Attempting to load saved preset...');
    const savedPreset = localStorage.getItem('boxcurveTreePreset');
    
    if (!savedPreset) {
      console.log('No saved preset found');
      return;
    }

    try {
      const preset = JSON.parse(savedPreset);
      Object.assign(window.config, preset);
      console.log('Preset loaded successfully:', preset);
      
      if (window.controlPanel) {
        window.controlPanel.updateControlsFromConfig();
        console.log('Control panel updated with preset values');
      } else {
        console.log('Control panel not found, skipping update');
      }
    } catch (error) {
      console.error('Error loading saved preset:', error);
    }
  }

  // Function to save current settings as preset
  function saveCurrentPreset() {
    try {
      const preset = JSON.stringify(window.config);
      localStorage.setItem('boxcurveTreePreset', preset);
      console.log('Current settings saved as preset');
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  }

  // Function to update all control values from config
  function updateControlsFromConfig() {
    console.log('Updating control values from config...');
    
    try {
      Object.keys(window.config).forEach(key => {
        const element = document.getElementById(key);
        if (!element) {
          console.warn(`Control element not found for key: ${key}`);
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
          console.error(`Error updating control for key ${key}:`, error);
        }
      });
      console.log('Control values updated successfully');
    } catch (error) {
      console.error('Failed to update control values:', error);
    }
  }

  // Function to setup control panel event listeners
  function setupControlPanel() {
    console.log('Setting up control panel event listeners...');
    
    try {
      // Add color change listener
      window.addEventListener('colorChanged', function() {
        console.log('Color change event received');
        updateIntermediateColors();
        needsUpdate = true;
      });

      // Helper function to update config and trigger redraw
      function updateConfig(key, value) {
        console.log(`Updating config: ${key} = ${value}`);
        window.config[key] = value;
        needsUpdate = true;
        saveCurrentPreset();
      }

      // Helper function to handle number inputs
      function setupNumberInput(id, isInteger = true) {
        console.log(`Setting up number input: ${id}`);
        const element = document.getElementById(id);
        const numberElement = document.getElementById(`${id}Number`);
        const valueElement = document.getElementById(`${id}Value`);
        
        if (!element || !numberElement) {
          console.warn(`Missing elements for number input: ${id}`);
          return;
        }

        try {
          // Sync the number input with the range input
          element.addEventListener('input', function() {
            const value = isInteger ? parseInt(this.value) : parseFloat(this.value);
            if (isNaN(value)) {
              console.warn(`Invalid number input for ${id}:`, this.value);
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
              console.warn(`Invalid number input for ${id}:`, this.value);
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
          console.error(`Error setting up number input ${id}:`, error);
        }
      }

      // Helper function to handle checkboxes
      function setupCheckbox(id) {
        console.log(`Setting up checkbox: ${id}`);
        const element = document.getElementById(id);
        if (!element) {
          console.warn(`Checkbox not found: ${id}`);
          return;
        }

        try {
          element.addEventListener('change', function() {
            updateConfig(id, this.checked);
          });
        } catch (error) {
          console.error(`Error setting up checkbox ${id}:`, error);
        }
      }

      // Helper function to handle color inputs
      function setupColorInput(id) {
        console.log(`Setting up color input: ${id}`);
        const element = document.getElementById(id);
        if (!element) {
          console.warn(`Color input not found: ${id}`);
          return;
        }

        try {
          element.addEventListener('input', function() {
            const hexColor = this.value;
            if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
              console.warn(`Invalid hex color for ${id}:`, hexColor);
              return;
            }
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            updateConfig(id, [r, g, b]);
            window.dispatchEvent(new Event('colorChanged'));
          });
        } catch (error) {
          console.error(`Error setting up color input ${id}:`, error);
        }
      }

      // Setup all control inputs
      console.log('Setting up all control inputs...');
      
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
        console.log(`Setting up select input: ${id}`);
        const element = document.getElementById(id);
        if (!element) {
          console.warn(`Select input not found: ${id}`);
          return;
        }

        try {
          element.addEventListener('change', function() {
            updateConfig(id, this.value);
          });
        } catch (error) {
          console.error(`Error setting up select input ${id}:`, error);
        }
      });

      console.log('Control panel setup completed successfully');
    } catch (error) {
      console.error('Failed to setup control panel:', error);
    }
  }

  // Function to check for updates and redraw if needed
  function checkForUpdates() {
    if (needsUpdate) {
      console.log('Update needed, triggering redraw');
      p.redraw();
      needsUpdate = false;
    }
  }

  // Function to update performance metrics
  function updateMetrics(scrollProgress) {
    frameCount++;
    const currentTime = performance.now();
    
    // Update FPS every second
    if (currentTime - lastFpsUpdate >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFpsUpdate = currentTime;
    }

    const metricsElement = document.getElementById('metrics');
    if (metricsElement) {
      // Ensure the metrics element has the correct class
      metricsElement.className = 'metrics';
      metricsElement.innerHTML = `
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
  }

  // Setup function
  p.setup = function() {
    console.log('P5 setup called');
    try {
      p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
      p.colorMode(p.RGB, 255); // Set to p5's default color mode
      p.rectMode(p.CENTER);
      p.noStroke();
      setupControlPanel();
      loadSavedPreset();
      console.log('P5 setup completed successfully');
    } catch (error) {
      console.error('Failed to complete P5 setup:', error);
    }
  };

  // Draw function
  p.draw = function() {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    try {
      // Clear background
      p.background(255); // Using p5's default color mode (0-255)

      // Update scroll position
      const scrollY = window.scrollY;
      const scrollProgress = (scrollY - lastScrollY) / window.innerHeight;
      lastScrollY = scrollY;

      // Update zoom
      if (window.config.autoMove) {
        targetZoom = p.lerp(targetZoom, window.config.maxZoom, window.config.zoomSpeed);
      }
      zoomFactor = p.lerp(zoomFactor, targetZoom, window.config.zoomSpeed);

      // Update rotation
      if (window.config.autoRotate) {
        window.config.rotationX += window.config.rotationSpeed * deltaTime;
        window.config.rotationY += window.config.rotationSpeed * deltaTime;
        window.config.rotationZ += window.config.rotationSpeed * deltaTime;
      }

      // Update position
      if (window.config.autoMove) {
        window.config.xPosition = (window.config.xPosition + window.config.moveSpeed * deltaTime) % 100;
        window.config.yPosition = (window.config.yPosition + window.config.moveSpeed * deltaTime) % 100;
        window.config.zPosition = p.sin(p.frameCount * window.config.moveSpeed * 0.001) * 50;
      }

      // Update branch angle
      if (window.config.autoAngle) {
        window.config.branchAngle += window.config.angleSpeed * deltaTime;
      }

      // Reset squares drawn counter
      squaresDrawn = 0;

      // Draw tree
      p.push();
      
      // Calculate center position
      const centerX = p.map(window.config.xPosition, 0, 100, -p.width/2, p.width/2);
      const centerY = p.map(window.config.yPosition, 0, 100, -p.height/2, p.height/2);
      
      // Apply transformations
      p.translate(centerX, centerY, window.config.zPosition);
      p.rotateX(p.radians(window.config.rotationX));
      p.rotateY(p.radians(window.config.rotationY));
      p.rotateZ(p.radians(window.config.rotationZ));
      p.scale(zoomFactor);

      const startTime = performance.now();
      drawBoxcurveTree(0, 0, window.config.startingSize, window.config.startDepth, scrollProgress);
      renderTime = performance.now() - startTime;

      p.pop();

      // Update metrics
      updateMetrics(scrollProgress);

      // Check for updates
      checkForUpdates();
    } catch (error) {
      console.error('Error in draw loop:', error);
    }
  };

  // Window resize handler
  p.windowResized = function() {
    console.log('Window resize detected');
    try {
      p.resizeCanvas(window.innerWidth, window.innerHeight);
      console.log('Canvas resized successfully');
    } catch (error) {
      console.error('Failed to resize canvas:', error);
    }
  };

  // Function to draw the boxcurve tree
  function drawBoxcurveTree(x, y, size, depth, scrollProgress) {
    console.log(`Drawing boxcurve tree at (${x}, ${y}) with size ${size} and depth ${depth}`);
    try {
      p.push();
      p.translate(x, y);
      
      if (depth > 0) {
        const p1 = [-size / 2, -size / 2];
        const p2 = [size / 2, -size / 2];
        generateTree([p1, p2], 0, depth, scrollProgress);
      }
      
      p.pop();
    } catch (error) {
      console.error('Error in drawBoxcurveTree:', error);
    }
  }

  // Function to generate the tree structure
  function generateTree(coordSet, depth, maxDepth, scrollProgress) {
    if (depth >= maxDepth) return;
    
    try {
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
    } catch (error) {
      console.error('Error in generateTree:', error);
    }
  }

  // Function to draw a cube
  function drawCube(p1, p2, depth, scrollProgress) {
    try {
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
        p.vertex(p1[0], p1[1], 0);
        p.vertex(p4[0], p4[1], 0);
        p.vertex(p4[0], p4[1], backZ);
        p.vertex(p1[0], p1[1], backZ);
        p.endShape(p.CLOSE);
        
        // Right face
        p.beginShape();
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
        p.vertex(p1[0], p1[1], 0);
        p.vertex(p2[0], p2[1], 0);
        p.vertex(p2[0], p2[1], backZ);
        p.vertex(p1[0], p1[1], backZ);
        p.endShape(p.CLOSE);
        
        // Bottom face
        p.beginShape();
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
          p.vertex(p1[0], p1[1], backZ);
          p.vertex(p2[0], p2[1], backZ);
          p.vertex(p3[0], p3[1], backZ);
          p.vertex(p4[0], p4[1], backZ);
          p.endShape(p.CLOSE);
        }
      }
      
      squaresDrawn++;
      
      return [p3, p4];
    } catch (error) {
      console.error('Error in drawCube:', error);
      return [p2, p1]; // Return a fallback coordinate set
    }
  }

  // Function to draw a triangle
  function drawTriangle(p1, p2, depth, angle, mirror, scrollProgress) {
    try {
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
    } catch (error) {
      console.error('Error in drawTriangle:', error);
      return [[p1, p2]]; // Return a fallback coordinate set
    }
  }

  // Function to get style for a shape
  function getStyle(depth, shape, scrollProgress) {
    try {
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
    } catch (error) {
      console.error('Error in getStyle:', error);
      return {
        fill: window.config.baseColor,
        outline: null,
        fillType: 'solid'
      };
    }
  }
} 