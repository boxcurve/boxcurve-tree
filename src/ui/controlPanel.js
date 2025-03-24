import { rgbToHex, hexToRgb } from '../utils/helpers.js';

// Control Panel Module
class ControlPanel {
  constructor() {
    this.needsUpdate = false;
    this.setupControlPanelVisibility();
    this.setupControlPanel();
  }

  setupControlPanelVisibility() {
    const controlPanel = document.getElementById('controlPanel');
    const showPanelButton = document.getElementById('showPanel');
    const hidePanelButton = document.getElementById('hidePanel');

    if (showPanelButton) {
      showPanelButton.addEventListener('click', () => {
        if (controlPanel) {
          controlPanel.style.display = 'block';
          showPanelButton.style.display = 'none';
        }
      });
    }

    if (hidePanelButton) {
      hidePanelButton.addEventListener('click', () => {
        if (controlPanel) {
          controlPanel.style.display = 'none';
          showPanelButton.style.display = 'block';
        }
      });
    }
  }

  // Function to load saved preset
  loadSavedPreset() {
    const savedPreset = localStorage.getItem('boxcurveTreePreset');
    if (savedPreset) {
      try {
        const preset = JSON.parse(savedPreset);
        Object.assign(window.config, preset);
        this.updateControlsFromConfig();
      } catch (e) {
        console.error('Error loading saved preset:', e);
      }
    }
  }

  // Function to save current settings as preset
  saveCurrentPreset() {
    try {
      localStorage.setItem('boxcurveTreePreset', JSON.stringify(window.config));
    } catch (e) {
      console.error('Error saving preset:', e);
    }
  }

  // Function to update all control values from config
  updateControlsFromConfig() {
    Object.keys(window.config).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = window.config[key];
        } else if (element.type === 'color') {
          const color = window.config[key];
          element.value = rgbToHex(color);
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
  setupControlPanel() {
    // Helper function to update config and trigger redraw
    const updateConfig = (key, value) => {
      window.config[key] = value;
      this.needsUpdate = true;
      this.saveCurrentPreset();
      
      // Dispatch color change event if a color was updated
      if (key === 'baseColor' || key === 'brandColor') {
        console.log('Color updated:', key, value);
        window.dispatchEvent(new Event('colorChanged'));
      }
    };

    // Helper function to handle number inputs
    const setupNumberInput = (id, isInteger = true) => {
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
    };

    // Helper function to handle checkbox inputs
    const setupCheckbox = (id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', function() {
          updateConfig(id, this.checked);
        });
      }
    };

    // Helper function to handle color inputs
    const setupColorInput = (id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', function() {
          const rgb = hexToRgb(this.value);
          if (rgb) {
            updateConfig(id, rgb);
            document.getElementById(`${id}Hex`).textContent = this.value.toUpperCase();
          }
        });
      }
    };

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

    // Setup stroke weight control
    const strokeWeightInput = document.getElementById('strokeWeight');
    const strokeWeightNumber = document.getElementById('strokeWeightNumber');
    const strokeWeightValue = document.getElementById('strokeWeightValue');

    if (strokeWeightInput && strokeWeightNumber && strokeWeightValue) {
      strokeWeightInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        strokeWeightNumber.value = value;
        strokeWeightValue.textContent = value;
        updateConfig('strokeWeight', value);
      });

      strokeWeightNumber.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value >= 1 && value <= 10) {
          strokeWeightInput.value = value;
          strokeWeightValue.textContent = value;
          updateConfig('strokeWeight', value);
        }
      });
    }

    // Setup preset buttons
    ['preset1', 'preset2', 'preset3'].forEach(presetId => {
      const button = document.getElementById(presetId);
      if (button) {
        button.addEventListener('click', () => {
          Object.assign(window.config, window.presets[presetId]);
          this.updateControlsFromConfig();
          this.needsUpdate = true;
        });
      }
    });

    // Initial update of all controls
    this.updateControlsFromConfig();
  }

  // Method to check if an update is needed
  isUpdateNeeded() {
    return this.needsUpdate;
  }

  // Method to reset the update flag
  resetUpdateFlag() {
    this.needsUpdate = false;
  }
}

// Create and export a singleton instance
window.controlPanel = new ControlPanel(); 