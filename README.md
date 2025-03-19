# Boxcurve Tree Interactive Animation

A highly customizable, interactive 3D recursive tree visualization that uses Boxcurve's design principles to create beautiful, animated tree structures in real-time using the p5.js library.

![Boxcurve Tree Animation](https://github.com/boxcurve/tree-animation/raw/main/preview.png)

## Overview

The Boxcurve Tree animation is a web-based interactive visualization that generates fractal-like tree structures using recursive square patterns. The animation features a complete 3D rendering system with depth, lighting, and advanced movement patterns, all controlled through an intuitive user interface.

## Features

- **Fully Interactive 3D Tree**: Real-time rendering of recursive square-based tree structures with adjustable depth, angles, and dimensions.
- **Comprehensive Control Panel**: Fine-tune every aspect of the visualization from structure to colors.
- **3D Effects**: Pixel depth and light angle adjustments with customizable lighting.
- **Animation Presets**: Quick access to different tree styles (Classic Tree, Spiral Galaxy, Static).
- **Auto-Movement & Rotation**: Smooth organic movements with configurable parameters.
- **Multiple Fill Styles**: Gradient, Solid, Outline Only, and Side Walls Only rendering options.
- **Responsive Design**: Adapts to different screen sizes and scroll positions.
- **SVG Export**: Export high-quality SVG files compatible with Adobe Illustrator.

## Live Demo

Visit [boxcurve.com/tree-animation](https://boxcurve.com/tree-animation) to see the animation in action.

## Usage

1. **Open the HTML file**: Launch the `boxcurvetreebackground.html` file in a modern web browser.
2. **Interact with the Visualization**:
   - Scroll to see zoom effects based on scroll position
   - Use the control panel to customize the tree appearance
   - Click preset buttons for quick configuration changes
   - Export your creation as an SVG for use in design tools

## Control Panel Options

### Tree Structure
- **Max Depth**: Control the maximum recursive depth of the tree (3-15)
- **Start Depth**: Set the initial depth (1-5)
- **Branch Angle**: Adjust the angle between branches (10°-80°)
- **Auto-Change Angle**: Toggle automatic angle variation over time
- **Angle Change Speed**: Control the speed of automatic angle changes (0.1-3)
- **Scale Factor**: Set the scaling between parent and child branches (0.5-0.9)

### Position & Size
- **X/Y/Z Position**: Position the tree in 3D space
- **Auto-Move**: Enable smooth automatic movement patterns
- **Movement Speed**: Control the speed of automatic movements
- **Starting Size**: Set the size of the initial square

### Rotation
- **X/Y/Z-Axis Rotation**: Rotate the tree along each axis (-180° to 180°)
- **Auto-Rotate**: Enable automatic rotation over time
- **Rotation Speed**: Control rotation animation speed

### Animation
- **Max Zoom**: Set maximum zoom level during scroll (1-10)
- **Zoom Speed**: Control the speed of zoom transitions
- **Growth Start/End**: Configure when the tree starts/finishes growing during page scroll

### Colors
- **Base Color**: Set the primary color for the tree
- **Brand Color**: Set the accent color
- **Fill Type**: Choose between Gradient, Solid, Outline Only, or Side Walls Only
- **Stroke Weight**: Adjust the thickness of outlines

### 3D Depth Settings
- **Pixel Depth**: Control the depth of the 3D effect (0-50)
- **Auto Depth Variation**: Enable automatic variation of depth over time
- **Depth by Level**: Vary depth based on tree level

### Lighting Settings
- **Light Angle X/Y**: Control light direction for 3D shading
- **Light Intensity**: Adjust the intensity of lighting effects
- **Enable Lighting**: Toggle lighting effects on/off

### Export Options
- **Export as SVG**: Save the current view as an SVG file
- **Export Quality**: Choose between Standard and High Resolution exports

## Technical Implementation

The visualization uses the following technologies:

- **p5.js**: Core library for creative coding and visual rendering
- **HTML5/CSS3**: Structure and styling
- **JavaScript**: Custom recursive algorithms and interactive controls
- **SVG**: Export format for high-quality graphics

The tree is generated using a recursive algorithm that creates squares and calculates appropriate connection points between them. The 3D effect is achieved by extruding the squares along the Z-axis and applying lighting calculations based on surface normals.

## Code Structure

- **Setup & Initialization**: Configuration of canvas and initial parameters
- **Draw Loop**: Real-time rendering of the tree structure
- **Tree Generation**: Recursive functions for creating the branching structure
- **Interaction Handlers**: Functions for processing user input and scroll events
- **Control Panel**: Interface elements for adjusting parameters
- **Export System**: SVG conversion and download functionality

## Performance Considerations

The visualization is optimized for performance through:
- Conditional rendering based on viewport visibility
- Adaptive detail levels based on system performance
- Throttled UI updates to reduce overhead
- Frame-skipping for smoother experience on lower-end devices

## Customization

The code is fully open to customization:
- Modify the `presets` object to create your own predefined styles
- Adjust the `config` object for default settings
- Edit the `intermediateColors` array to change gradient patterns
- Modify rendering functions for different visual styles

## Browser Compatibility

- Chrome/Edge (recommended): Full support for all features
- Firefox: Good support with minor differences in 3D rendering
- Safari: Compatible with possible performance variations
- Mobile browsers: Functional with touch-based controls

## License

This project is available under the MIT License. See the LICENSE file for details.

## Credits

Created by [Boxcurve](https://boxcurve.com) using p5.js

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue to suggest improvements or report bugs.