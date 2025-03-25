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
  
  try {
    debug.info('Initializing WebGPU via Q5...');
    
    // Initialize Q5 with WebGPU
    const q = await Q5.WebGPU();
    
    // Run the sketch with the q instance
    sketch(q);
    
    debug.info('Q5 WebGPU sketch initialized successfully');
  } catch (error) {
    debug.error('Failed to initialize WebGPU:', error);
    debug.warn('Falling back to standard q5.js renderer...');
    
    try {
      // Fallback to standard q5.js
      const q = new Q5();
      sketch(q);
      debug.info('Q5 fallback sketch initialized successfully');
    } catch (fallbackError) {
      debug.error('Failed to initialize Q5 fallback:', fallbackError);
      document.body.innerHTML += '<div style="color:red;background:black;padding:20px;position:fixed;top:0;left:0;right:0;z-index:9999">Failed to initialize Q5 renderer. Your browser may not support WebGPU or WebGL.</div>';
    }
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
    frameCount++;
    const currentTime = performance.now();
    
    // Update FPS every second
    if (currentTime - lastFpsUpdate >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFpsUpdate = currentTime;
    }

    const metrics = {
      fps,
      renderTime,
      squaresDrawn,
      scrollProgress,
      zoomFactor,
      currentDepth
    };

    const metricsElement = document.getElementById('metrics');
    if (metricsElement) {
      metricsElement.innerHTML = `
        <h4>Debug Information</h4>
        <pre>${JSON.stringify(metrics, null, 2)}</pre>
      `;
    }
  }

  // Setup function
  q.setup = function() {
    debug.info('Q5 setup called');
    try {
      q.createCanvas(window.innerWidth, window.innerHeight, q.WEBGL);
      q.colorMode(q.RGB, 1); // Set to q5's default float-based color mode
      q.rectMode(q.CENTER);
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
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    try {
      // Clear background
      q.background(1); // Using float-based color mode (1 = white)

      // Update scroll position
      const scrollY = window.scrollY;
      const scrollProgress = (scrollY - lastScrollY) / window.innerHeight;
      lastScrollY = scrollY;

      // Update zoom
      if (window.config.autoMove) {
        targetZoom = q.lerp(targetZoom, window.config.maxZoom, window.config.zoomSpeed);
      }
      zoomFactor = q.lerp(zoomFactor, targetZoom, window.config.zoomSpeed);

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
        window.config.zPosition = q.sin(q.frameCount * window.config.moveSpeed * 0.001) * 50;
      }

      // Update branch angle
      if (window.config.autoAngle) {
        window.config.branchAngle += window.config.angleSpeed * deltaTime;
      }

      // Draw tree
      q.push();
      q.translate(
        q.map(window.config.xPosition, 0, 100, -q.width/2, q.width/2),
        q.map(window.config.yPosition, 0, 100, -q.height/2, q.height/2),
        window.config.zPosition
      );
      q.rotateX(q.radians(window.config.rotationX));
      q.rotateY(q.radians(window.config.rotationY));
      q.rotateZ(q.radians(window.config.rotationZ));
      q.scale(zoomFactor);

      const startTime = performance.now();
      drawBoxcurveTree(0, 0, window.config.startingSize, window.config.startDepth, scrollProgress);
      renderTime = performance.now() - startTime;

      q.pop();

      // Update metrics
      updateMetrics(scrollProgress);

      // Check for updates
      checkForUpdates();
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

  // Export the initialization function
  window.initializeQ5Sketch = initializeQ5Sketch;
} 