import { rgbToHex } from '../utils/helpers.js';

// SVG Export Module
class SVGExporter {
  constructor() {
    console.log('SVG Exporter initialized');
    this.setupExportButton();
  }

  setupExportButton() {
    const exportButton = document.getElementById('exportSVG');
    const exportStatus = document.getElementById('exportStatus');
    const exportQuality = document.getElementById('exportQuality');

    console.log('Export button:', exportButton);
    console.log('Export status:', exportStatus);
    console.log('Export quality:', exportQuality);

    if (exportButton) {
      exportButton.addEventListener('click', () => {
        console.log('Export button clicked');
        if (exportStatus) exportStatus.textContent = 'Generating SVG...';
        
        // Verify config is available
        if (!window.config) {
          console.error('Config not found');
          if (exportStatus) exportStatus.textContent = 'Error: Configuration not found';
          return;
        }

        const quality = exportQuality ? exportQuality.value : 'standard';
        console.log('Export quality:', quality);
        
        this.exportTreeAsSVG(quality)
          .then(() => {
            console.log('SVG export completed successfully');
            if (exportStatus) {
              exportStatus.textContent = 'SVG exported successfully!';
              setTimeout(() => {
                exportStatus.textContent = '';
              }, 3000);
            }
          })
          .catch(error => {
            console.error('Error exporting SVG:', error);
            if (exportStatus) {
              exportStatus.textContent = 'Error exporting SVG: ' + error.message;
              setTimeout(() => {
                exportStatus.textContent = '';
              }, 3000);
            }
          });
      });
      console.log('Export button event listener added');
    } else {
      console.error('Export button not found in DOM');
    }
  }

  async exportTreeAsSVG(quality = 'standard') {
    console.log('Starting SVG export with quality:', quality);
    try {
      // Create SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      console.log('SVG element created');
      
      // Set SVG attributes based on quality
      const scale = quality === 'high' ? 2 : 1;
      const width = window.innerWidth * scale;
      const height = window.innerHeight * scale;
      
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      console.log('SVG attributes set:', { width, height, scale });
      
      // Add metadata
      const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
      metadata.textContent = JSON.stringify({
        title: 'Boxcurve Tree',
        creator: 'Boxcurve Tree Generator',
        date: new Date().toISOString(),
        config: window.config
      });
      svg.appendChild(metadata);
      console.log('Metadata added');
      
      // Create definitions for gradients
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      
      // Add base gradient
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.id = 'treeGradient';
      gradient.setAttribute('gradientTransform', 'rotate(90)');
      
      const stops = [
        { offset: '0%', color: this.rgbToHex(window.config.baseColor) },
        { offset: '100%', color: this.rgbToHex(window.config.brandColor) }
      ];
      
      stops.forEach(stop => {
        const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stopElement.setAttribute('offset', stop.offset);
        stopElement.setAttribute('stop-color', stop.color);
        gradient.appendChild(stopElement);
      });
      
      defs.appendChild(gradient);
      svg.appendChild(defs);
      console.log('Gradient definitions added');
      
      // Create main group for the tree with current transformations
      const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      mainGroup.setAttribute('transform', `translate(${width/2} ${height/2})`);
      
      // Apply current rotations
      if (window.config.rotationX || window.config.rotationY || window.config.rotationZ) {
        const transform = `${mainGroup.getAttribute('transform')} 
                         rotate(${window.config.rotationZ}) 
                         rotateX(${window.config.rotationX}) 
                         rotateY(${window.config.rotationY})`;
        mainGroup.setAttribute('transform', transform);
        console.log('Applied rotations:', transform);
      }
      
      // Generate tree structure
      console.log('Generating tree structure with size:', window.config.startingSize * scale);
      const treeGroup = this.generateTreeSVG(0, 0, window.config.startingSize * scale);
      mainGroup.appendChild(treeGroup);
      svg.appendChild(mainGroup);
      
      // Convert SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      console.log('SVG serialized, length:', svgString.length);
      
      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'boxcurve-tree.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('SVG download initiated');
    } catch (error) {
      console.error('Error in SVG export:', error);
      throw new Error(`SVG export failed: ${error.message}`);
    }
  }

  generateTreeSVG(x, y, size, depth = 0) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    if (depth >= window.config.maxDepth) return group;
    
    // Calculate points for the current square
    const points = this.calculateSquarePoints(x, y, size);
    
    // Create and style the square
    const square = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    square.setAttribute('d', this.pointsToPath(points));
    
    // Apply styles based on config
    if (window.config.fillType === 'gradient') {
      square.setAttribute('fill', 'url(#treeGradient)');
    } else if (window.config.fillType === 'solid') {
      square.setAttribute('fill', this.rgbToHex(depth === 0 ? window.config.baseColor : window.config.brandColor));
    } else {
      square.setAttribute('fill', 'none');
    }
    
    if (window.config.fillType === 'outline' || window.config.strokeWeight > 0) {
      square.setAttribute('stroke', this.rgbToHex(window.config.brandColor));
      square.setAttribute('stroke-width', window.config.strokeWeight);
    }
    
    group.appendChild(square);
    
    // Calculate and generate branches
    const nextSize = size * window.config.scaleFactor;
    const angle = window.config.branchAngle;
    const branchPoints = this.calculateBranchPoints(points, angle);
    
    branchPoints.forEach(branch => {
      const branchGroup = this.generateTreeSVG(
        branch.x,
        branch.y,
        nextSize,
        depth + 1
      );
      
      // Apply rotation to branch
      branchGroup.setAttribute(
        'transform',
        `rotate(${branch.angle} ${branch.x} ${branch.y})`
      );
      
      group.appendChild(branchGroup);
    });
    
    return group;
  }

  calculateSquarePoints(x, y, size) {
    const halfSize = size / 2;
    return [
      { x: x - halfSize, y: y - halfSize }, // top-left
      { x: x + halfSize, y: y - halfSize }, // top-right
      { x: x + halfSize, y: y + halfSize }, // bottom-right
      { x: x - halfSize, y: y + halfSize }  // bottom-left
    ];
  }

  calculateBranchPoints(points, angle) {
    const branches = [];
    const angleRad = (angle * Math.PI) / 180;
    
    // Calculate branch points and angles
    const p1 = points[0];
    const p2 = points[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Left branch
    branches.push({
      x: p1.x + length * Math.cos(angleRad),
      y: p1.y + length * Math.sin(angleRad),
      angle: angle
    });
    
    // Right branch
    branches.push({
      x: p2.x + length * Math.cos(-angleRad),
      y: p2.y + length * Math.sin(-angleRad),
      angle: -angle
    });
    
    return branches;
  }

  pointsToPath(points) {
    return `M ${points[0].x} ${points[0].y} ` +
           `L ${points[1].x} ${points[1].y} ` +
           `L ${points[2].x} ${points[2].y} ` +
           `L ${points[3].x} ${points[3].y} Z`;
  }
}

// Create and export a singleton instance
window.svgExporter = new SVGExporter(); 