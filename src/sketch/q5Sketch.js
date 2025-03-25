import { lerp, constrain, map } from '../utils/helpers.js';

// Global q5.js instance
let q5Instance;

// Initialize q5.js sketch
async function initializeQ5Sketch() {
  console.log('Initializing q5.js sketch...');
  if (window.config) {
    console.log('Creating q5 instance...');
    try {
      // Initialize WebGPU and get q5 instance
      const q = await Q5.WebGPU();
      q5Instance = new Q5(sketch);
      console.log('Q5 sketch initialized:', q5Instance);
    } catch (error) {
      console.error('Failed to initialize WebGPU:', error);
      // Fallback to regular WebGL if WebGPU fails
      q5Instance = new Q5(sketch);
      console.log('Q5 sketch initialized with WebGL fallback:', q5Instance);
    }
  } else {
    console.log('Waiting for config...');
    setTimeout(initializeQ5Sketch, 100);
  }
}

// Define the q5.js sketch
function sketch(q) {
  console.log('Q5 sketch function called');
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

    // Helper function to handle checkboxes
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
          const hexColor = this.value;
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);
          updateConfig(id, [r, g, b]);
          window.dispatchEvent(new Event('colorChanged'));
        });
      }
    }

    // Setup all control inputs
    setupNumberInput('maxDepth');
    setupNumberInput('startDepth');
    setupNumberInput('branchAngle', false);
    setupNumberInput('angleSpeed', false);
    setupNumberInput('scaleFactor', false);
    setupNumberInput('xPosition');
    setupNumberInput('yPosition');
    setupNumberInput('zPosition');
    setupNumberInput('moveSpeed', false);
    setupNumberInput('startingSize');
    setupNumberInput('rotationX');
    setupNumberInput('rotationY');
    setupNumberInput('rotationZ');
    setupNumberInput('rotationSpeed', false);
    setupNumberInput('maxZoom', false);
    setupNumberInput('zoomSpeed', false);
    setupNumberInput('growthStart');
    setupNumberInput('growthEnd');
    setupNumberInput('pixelDepth');
    setupNumberInput('lightAngleX');
    setupNumberInput('lightAngleY');
    setupNumberInput('lightIntensity');
    setupNumberInput('strokeWeight');

    setupCheckbox('autoAngle');
    setupCheckbox('autoMove');
    setupCheckbox('autoRotate');
    setupCheckbox('autoDepth');
    setupCheckbox('depthByLevel');
    setupCheckbox('enableLighting');

    setupColorInput('baseColor');
    setupColorInput('brandColor');

    // Setup fill type select
    const fillTypeSelect = document.getElementById('fillType');
    if (fillTypeSelect) {
      fillTypeSelect.addEventListener('change', function() {
        updateConfig('fillType', this.value);
      });
    }

    // Setup export quality select
    const exportQualitySelect = document.getElementById('exportQuality');
    if (exportQualitySelect) {
      exportQualitySelect.addEventListener('change', function() {
        updateConfig('exportQuality', this.value);
      });
    }
  }

  // Function to check for updates and redraw if needed
  function checkForUpdates() {
    if (needsUpdate) {
      q.redraw();
      needsUpdate = false;
    }
  }

  // Setup function
  q.setup = function() {
    console.log('Q5 setup called');
    q.createCanvas(window.innerWidth, window.innerHeight, q.WEBGL);
    q.colorMode(q.RGB, 1); // Set to q5's default float-based color mode
    q.rectMode(q.CENTER);
    q.noStroke();
    setupControlPanel();
    loadSavedPreset();
  };

  // Draw function
  q.draw = function() {
    console.log('Q5 draw called');
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

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
  };

  // Window resize handler
  q.windowResized = function() {
    q.resizeCanvas(window.innerWidth, window.innerHeight);
  };

  // Export the initialization function
  window.initializeQ5Sketch = initializeQ5Sketch;
} 