const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG icon template - DJ headphones with disco theme
const generateSVG = (size) => {
  const padding = Math.round(size * 0.1);
  const innerSize = size - padding * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a2e"/>
      <stop offset="50%" style="stop-color:#16082a"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </linearGradient>
    <linearGradient id="neon-pink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6ec7"/>
      <stop offset="100%" style="stop-color:#d946ef"/>
    </linearGradient>
    <linearGradient id="neon-blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00f5ff"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>

  <!-- Disco ball effect (circles) -->
  <circle cx="${size * 0.25}" cy="${size * 0.25}" r="${size * 0.03}" fill="#ff6ec7" opacity="0.3"/>
  <circle cx="${size * 0.75}" cy="${size * 0.2}" r="${size * 0.02}" fill="#00f5ff" opacity="0.3"/>
  <circle cx="${size * 0.8}" cy="${size * 0.75}" r="${size * 0.025}" fill="#39ff14" opacity="0.3"/>
  <circle cx="${size * 0.15}" cy="${size * 0.8}" r="${size * 0.02}" fill="#fff700" opacity="0.3"/>

  <!-- Headphones -->
  <g transform="translate(${size * 0.15}, ${size * 0.2})">
    <!-- Headband -->
    <path d="M${innerSize * 0.1} ${innerSize * 0.35}
             Q${innerSize * 0.1} ${innerSize * 0.05} ${innerSize * 0.5} ${innerSize * 0.05}
             Q${innerSize * 0.9} ${innerSize * 0.05} ${innerSize * 0.9} ${innerSize * 0.35}"
          fill="none" stroke="url(#neon-pink)" stroke-width="${Math.max(3, size * 0.03)}" stroke-linecap="round"/>

    <!-- Left ear cup -->
    <ellipse cx="${innerSize * 0.12}" cy="${innerSize * 0.45}" rx="${innerSize * 0.12}" ry="${innerSize * 0.18}" fill="url(#neon-blue)"/>
    <ellipse cx="${innerSize * 0.12}" cy="${innerSize * 0.45}" rx="${innerSize * 0.08}" ry="${innerSize * 0.12}" fill="#0a0a0a"/>

    <!-- Right ear cup -->
    <ellipse cx="${innerSize * 0.88}" cy="${innerSize * 0.45}" rx="${innerSize * 0.12}" ry="${innerSize * 0.18}" fill="url(#neon-blue)"/>
    <ellipse cx="${innerSize * 0.88}" cy="${innerSize * 0.45}" rx="${innerSize * 0.08}" ry="${innerSize * 0.12}" fill="#0a0a0a"/>

    <!-- Music note in center -->
    <text x="${innerSize * 0.5}" y="${innerSize * 0.55}" font-size="${innerSize * 0.25}" text-anchor="middle" fill="#fff700" font-family="Arial, sans-serif">
      &#9835;
    </text>
  </g>
</svg>`;
};

async function generateIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Generate PNG files
  for (const size of sizes) {
    const svg = generateSVG(size);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(pngPath);

    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Generate apple-touch-icon (180x180)
  const appleTouchSvg = generateSVG(180);
  await sharp(Buffer.from(appleTouchSvg))
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('Generated: apple-touch-icon.png');

  // Copy to public root for easier access
  fs.copyFileSync(
    path.join(iconsDir, 'apple-touch-icon.png'),
    path.join(__dirname, '..', 'public', 'apple-touch-icon.png')
  );
  console.log('Copied: apple-touch-icon.png to public/');

  // Create favicon.ico (32x32)
  const faviconSvg = generateSVG(32);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));
  console.log('Generated: favicon.png');

  // Create a larger favicon for modern browsers
  const favicon192Svg = generateSVG(192);
  await sharp(Buffer.from(favicon192Svg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon-192.png'));
  console.log('Generated: favicon-192.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
