// Utility Functions Module

// Color conversion functions
export function rgbToHex(rgb) {
  if (Array.isArray(rgb)) {
    return '#' + rgb.map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  return rgb;
}

export function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex to RGB
  const bigint = parseInt(hex, 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255
  ];
}

// Interpolation functions
export function lerp(start, end, amt) {
  return start * (1 - amt) + end * amt;
}

export function lerpColor(color1, color2, amt) {
  return [
    lerp(color1[0], color2[0], amt),
    lerp(color1[1], color2[1], amt),
    lerp(color1[2], color2[2], amt)
  ];
}

// Easing functions
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

// Angle conversion functions
export function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

export function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

// Math helper functions
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// DOM helper functions
export function createNumberInput(id, min, max, value, step = 1) {
  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.min = min;
  input.max = max;
  input.value = value;
  input.step = step;
  return input;
}

export function createRangeInput(id, min, max, value, step = 1) {
  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = min;
  input.max = max;
  input.value = value;
  input.step = step;
  return input;
}

// SVG helper functions
export function createSVGElement(type) {
  return document.createElementNS('http://www.w3.org/2000/svg', type);
}

export function setSVGAttributes(element, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

// Animation helper functions
export function calculateFrameRate(lastFrameTime) {
  const now = performance.now();
  const delta = now - lastFrameTime;
  return Math.round(1000 / delta);
}

// Debug helper functions
export function debugLog(message, data = null) {
  if (window.config && window.config.debug) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

// Export all functions as a single object for non-module usage
window.helpers = {
  rgbToHex,
  hexToRgb,
  lerp,
  lerpColor,
  easeInOutQuad,
  easeInOutCubic,
  degToRad,
  radToDeg,
  clamp,
  map,
  createNumberInput,
  createRangeInput,
  createSVGElement,
  setSVGAttributes,
  calculateFrameRate,
  debugLog
}; 