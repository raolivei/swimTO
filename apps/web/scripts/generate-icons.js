/**
 * Generate placeholder PWA icons
 * Uses node-canvas to create simple wave-themed icons
 */

const fs = require('fs');
const path = require('path');

// Simple SVG icon with wave theme
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <path d="M ${-size * 0.3} 0 Q ${-size * 0.15} ${-size * 0.1}, 0 0 T ${size * 0.3} 0" 
          stroke="white" 
          stroke-width="${size * 0.05}" 
          fill="none" 
          stroke-linecap="round"
          opacity="0.9"/>
    <path d="M ${-size * 0.3} ${size * 0.15} Q ${-size * 0.15} ${size * 0.05}, 0 ${size * 0.15} T ${size * 0.3} ${size * 0.15}" 
          stroke="white" 
          stroke-width="${size * 0.04}" 
          fill="none" 
          stroke-linecap="round"
          opacity="0.7"/>
    <path d="M ${-size * 0.25} ${-size * 0.15} Q ${-size * 0.125} ${-size * 0.25}, 0 ${-size * 0.15} T ${size * 0.25} ${-size * 0.15}" 
          stroke="white" 
          stroke-width="${size * 0.04}" 
          fill="none" 
          stroke-linecap="round"
          opacity="0.6"/>
  </g>
</svg>
`;

const publicDir = path.join(__dirname, '../public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG files
console.log('Generating icon SVGs...');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), createSVG(512));

console.log('✅ Icon SVGs generated!');
console.log('\n⚠️  For production, you should:');
console.log('1. Install sharp or similar: npm install --save-dev sharp');
console.log('2. Convert SVG to PNG at required sizes');
console.log('3. Or use an online tool like https://realfavicongenerator.net/');
console.log('\nFor now, update manifest.json to use SVG or create PNGs manually.');

