#!/usr/bin/env node
// =============================================================================
// AURITY PWA - Icon Generator Script
// =============================================================================
// Generates PWA icons in multiple sizes from a source image
// Usage: node scripts/generate-pwa-icons.js
// Requires: sharp (npm install sharp --save-dev)
// =============================================================================

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// SVG template for placeholder icons (AURITY branded)
function generateSVGIcon(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.1 : 0; // 10% safe zone for maskable
  const innerSize = size - (padding * 2);
  const fontSize = Math.floor(size * 0.25);
  const subFontSize = Math.floor(size * 0.08);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.3)"/>
      <stop offset="50%" style="stop-color:rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${isMaskable ? '#3b82f6' : 'url(#bg)'}" rx="${isMaskable ? 0 : size * 0.15}"/>

  <!-- Shine effect -->
  <rect width="${size}" height="${size}" fill="url(#shine)" rx="${isMaskable ? 0 : size * 0.15}"/>

  <!-- Logo text -->
  <text x="${size/2}" y="${size * 0.45}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="white"
        text-anchor="middle">FI</text>

  <!-- Subtitle -->
  <text x="${size/2}" y="${size * 0.65}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${subFontSize}"
        font-weight="500"
        fill="rgba(255,255,255,0.8)"
        text-anchor="middle">AURITY</text>

  <!-- Medical cross accent -->
  <g transform="translate(${size * 0.7}, ${size * 0.2})">
    <rect x="0" y="${size * 0.03}" width="${size * 0.08}" height="${size * 0.02}" fill="rgba(255,255,255,0.6)" rx="1"/>
    <rect x="${size * 0.03}" y="0" width="${size * 0.02}" height="${size * 0.08}" fill="rgba(255,255,255,0.6)" rx="1"/>
  </g>
</svg>`;
}

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Generating PWA icons...\n');

// Generate regular icons
ICON_SIZES.forEach(size => {
  const svg = generateSVGIcon(size, false);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`Created: ${filename}`);
});

// Generate maskable icons
MASKABLE_SIZES.forEach(size => {
  const svg = generateSVGIcon(size, true);
  const filename = `icon-maskable-${size}x${size}.svg`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`Created: ${filename} (maskable)`);
});

// Generate badge icon
const badgeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <circle cx="36" cy="36" r="36" fill="#3b82f6"/>
  <text x="36" y="44" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="white" text-anchor="middle">FI</text>
</svg>`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'badge-72x72.svg'), badgeSvg);
console.log('Created: badge-72x72.svg');

// Generate shortcut icons
const shortcutChatSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#3b82f6" rx="14"/>
  <path d="M24 32C24 27.58 27.58 24 32 24H64C68.42 24 72 27.58 72 32V56C72 60.42 68.42 64 64 64H56L48 72L40 64H32C27.58 64 24 60.42 24 56V32Z" fill="white"/>
  <circle cx="36" cy="44" r="4" fill="#3b82f6"/>
  <circle cx="48" cy="44" r="4" fill="#3b82f6"/>
  <circle cx="60" cy="44" r="4" fill="#3b82f6"/>
</svg>`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'shortcut-chat.svg'), shortcutChatSvg);
console.log('Created: shortcut-chat.svg');

const shortcutDashboardSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#8b5cf6" rx="14"/>
  <rect x="20" y="20" width="24" height="24" fill="white" rx="4"/>
  <rect x="52" y="20" width="24" height="24" fill="white" rx="4"/>
  <rect x="20" y="52" width="24" height="24" fill="white" rx="4"/>
  <rect x="52" y="52" width="24" height="24" fill="white" rx="4"/>
</svg>`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'shortcut-dashboard.svg'), shortcutDashboardSvg);
console.log('Created: shortcut-dashboard.svg');

console.log('\n✓ All PWA icons generated successfully!');
console.log('\nNote: These are SVG placeholders. For production, convert them to PNG using:');
console.log('  - https://realfavicongenerator.net/');
console.log('  - Or install sharp: npm install sharp --save-dev');
console.log('  - Then update this script to output PNG files');
