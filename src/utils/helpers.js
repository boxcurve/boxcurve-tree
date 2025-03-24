// Color conversion utilities
function rgbToHex(rgb) {
  if (Array.isArray(rgb)) {
    return '#' + rgb.map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  return rgb;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

// Math and interpolation utilities
function lerp(start, end, amt) {
  return start + (end - start) * amt;
}

function constrain(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

// Angle conversion utilities
function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Export all utility functions
export {
  rgbToHex,
  hexToRgb,
  lerp,
  constrain,
  map,
  radiansToDegrees,
  degreesToRadians
}; 