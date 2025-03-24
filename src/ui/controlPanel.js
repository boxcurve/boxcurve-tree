// Control Panel Module
class ControlPanel {
  constructor() {
    window.helpers.debugLog('Initializing Control Panel');
    this.visible = true;
    this.needsUpdate = false;
    this.initialize();
  }

  initialize() {
    this.setupControlPanel();
    this.loadPresets();
    this.updateControlsFromConfig();
    this.setupEventListeners();
  }

  setupControlPanel() {
    const panel = document.getElementById('controlPanel');
    const toggleButton = document.getElementById('togglePanel');
    
    if (toggleButton && panel) {
      toggleButton.addEventListener('click', () => {
        this.visible = !this.visible;
        panel.style.display = this.visible ? 'block' : 'none';
        toggleButton.textContent = this.visible ? 'Hide Controls' : 'Show Controls';
      });
    }
  }

  loadPresets() {
    try {
      const savedPresets = localStorage.getItem('treePresets');
      if (savedPresets) {
        const presets = JSON.parse(savedPresets);
        const presetSelect = document.getElementById('presetSelect');
        
        if (presetSelect) {
          // Clear existing options
          presetSelect.innerHTML = '<option value="">Select Preset</option>';
          
          // Add saved presets
          Object.keys(presets).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelect.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  }

  updateControlsFromConfig() {
    window.helpers.debugLog('Updating controls from config');
    
    // Update number inputs
    document.querySelectorAll('input[type="number"]').forEach(input => {
      const configKey = input.id;
      if (window.config && configKey in window.config) {
        input.value = window.config[configKey];
      }
    });
    
    // Update range inputs
    document.querySelectorAll('input[type="range"]').forEach(input => {
      const configKey = input.id;
      if (window.config && configKey in window.config) {
        input.value = window.config[configKey];
      }
    });
    
    // Update color inputs
    document.querySelectorAll('input[type="color"]').forEach(input => {
      const configKey = input.id;
      if (window.config && configKey in window.config) {
        input.value = window.helpers.rgbToHex(window.config[configKey]);
      }
    });
    
    // Update checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(input => {
      const configKey = input.id;
      if (window.config && configKey in window.config) {
        input.checked = window.config[configKey];
      }
    });
  }

  setupEventListeners() {
    // Number input event listeners
    document.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('change', () => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
          window.config[input.id] = window.helpers.clamp(
            value,
            parseFloat(input.min || -Infinity),
            parseFloat(input.max || Infinity)
          );
          this.needsUpdate = true;
        }
      });
    });
    
    // Range input event listeners
    document.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', () => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
          window.config[input.id] = value;
          
          // Update corresponding number input if it exists
          const numberInput = document.querySelector(`input[type="number"][id="${input.id}"]`);
          if (numberInput) {
            numberInput.value = value;
          }
          
          this.needsUpdate = true;
        }
      });
    });
    
    // Color input event listeners
    document.querySelectorAll('input[type="color"]').forEach(input => {
      input.addEventListener('input', () => {
        window.config[input.id] = window.helpers.hexToRgb(input.value);
        this.needsUpdate = true;
      });
    });
    
    // Checkbox event listeners
    document.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => {
        window.config[input.id] = input.checked;
        this.needsUpdate = true;
      });
    });
    
    // Preset management
    const savePresetButton = document.getElementById('savePreset');
    const presetNameInput = document.getElementById('presetName');
    const presetSelect = document.getElementById('presetSelect');
    
    if (savePresetButton && presetNameInput && presetSelect) {
      // Save preset
      savePresetButton.addEventListener('click', () => {
        const name = presetNameInput.value.trim();
        if (name) {
          try {
            let presets = {};
            const savedPresets = localStorage.getItem('treePresets');
            if (savedPresets) {
              presets = JSON.parse(savedPresets);
            }
            
            presets[name] = { ...window.config };
            localStorage.setItem('treePresets', JSON.stringify(presets));
            
            // Add new preset to select
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelect.appendChild(option);
            
            // Clear input
            presetNameInput.value = '';
            
            window.helpers.debugLog('Preset saved:', name);
          } catch (error) {
            console.error('Error saving preset:', error);
          }
        }
      });
      
      // Load preset
      presetSelect.addEventListener('change', () => {
        const name = presetSelect.value;
        if (name) {
          try {
            const savedPresets = localStorage.getItem('treePresets');
            if (savedPresets) {
              const presets = JSON.parse(savedPresets);
              if (presets[name]) {
                Object.assign(window.config, presets[name]);
                this.updateControlsFromConfig();
                this.needsUpdate = true;
                window.helpers.debugLog('Preset loaded:', name);
              }
            }
          } catch (error) {
            console.error('Error loading preset:', error);
          }
        }
      });
    }
  }
}

// Create singleton instance
window.controlPanel = new ControlPanel(); 