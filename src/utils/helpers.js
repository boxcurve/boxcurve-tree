// Color conversion utilities
function rgbToHex(rgb) {
  if (!Array.isArray(rgb) || rgb.length < 3) return '#000000';
  return `#${(rgb[0] << 16 | rgb[1] << 8 | rgb[2]).toString(16).padStart(6, '0')}`;
}

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16)
  ];
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
function radians(degrees) {
  return degrees * Math.PI / 180;
}

function degrees(radians) {
  return radians * 180 / Math.PI;
}

// Vector utilities
function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// Export all helper functions
export {
  rgbToHex,
  hexToRgb,
  lerp,
  constrain,
  map,
  radians,
  degrees,
  dist
}; 