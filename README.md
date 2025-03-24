# Boxcurve Tree Animation

An interactive, modular 3D tree animation system built with p5.js that creates beautiful, customizable recursive tree structures.

## Features

### Core Functionality
- Recursive tree generation with customizable depth and branching
- Real-time 3D rendering with p5.js
- Smooth animations and transitions
- Scroll-based growth and zoom effects
- Interactive control panel for real-time customization

### Visualization Options
- Multiple fill types: gradient, solid, outline, sidewalls
- Dynamic color system with base and brand colors
- Adjustable stroke weight and style
- 3D depth controls with level-based variation
- Advanced lighting system with adjustable angles and intensity

### Animation Controls
- Auto-rotation with customizable speed and axes
- Automated movement patterns
- Dynamic angle changes
- Automatic depth variations
- Smooth zoom transitions

### Presets
- Classic Tree
- Spiral Galaxy
- Static Display
- Preset saving and loading system

## Project Structure

```
src/
├── assets/
│   └── styles/
│       └── main.css
├── config/
│   └── config.js
├── sketch/
│   └── p5Sketch.js
├── svg/
│   └── svgExport.js
├── ui/
│   └── controlPanel.js
└── utils/
    └── helpers.js
```

### Module Descriptions

- **config.js**: Central configuration management
- **p5Sketch.js**: Core rendering and animation logic
- **controlPanel.js**: Interactive UI controls
- **svgExport.js**: SVG export functionality
- **helpers.js**: Utility functions for color conversion and math operations
- **main.css**: Core styling for UI elements

## Recent Improvements

1. Modularized Codebase
   - Separated concerns into distinct modules
   - Improved code organization and maintainability
   - Implemented ES6 module system

2. Enhanced Control Panel
   - Added real-time parameter updates
   - Improved UI responsiveness
   - Fixed color picker functionality
   - Added stroke weight controls

3. Utility Functions
   - Centralized helper functions
   - Improved color conversion system
   - Added mathematical utility functions
   - Enhanced code reusability

4. Configuration System
   - Centralized config management
   - Added preset system
   - Implemented local storage for settings
   - Added intermediate color management

## Known Issues and TODOs

### Bugs to Fix
- SVG export functionality needs repair (currently not working correctly)

### Future Enhancements
- Add more preset variations
- Implement touch controls for mobile
- Add animation sequence recording
- Create more export options (PNG, GIF)

## Usage

1. Open index.html in a modern web browser
2. Use the control panel to customize the tree:
   - Adjust structural parameters (depth, angles, scale)
   - Modify colors and fill styles
   - Control animations and movements
   - Experiment with lighting and 3D effects
3. Scroll to see the tree grow and transform
4. Save your favorite configurations as presets

## Browser Compatibility

Tested and working in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)

## Dependencies

- p5.js v1.4.0
- Modern browser with ES6 module support

## Development

To modify or enhance the project:
1. Clone the repository
2. Make changes to the relevant modules
3. Test in a local server (required for ES6 modules)
4. Submit pull requests for improvements

## License

MIT License - Feel free to use and modify for your own projects.