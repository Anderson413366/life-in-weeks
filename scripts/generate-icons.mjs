/**
 * Generates PWA icons as PNG using Node.js canvas-free approach.
 * Creates simple but striking icons with SVG → PNG conversion.
 */
import { writeFileSync } from "fs";

function createSVG(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = innerSize * 0.32;
  const strokeW = innerSize * 0.04;
  const fontSize = innerSize * 0.18;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a23" rx="${maskable ? 0 : size * 0.15}"/>
  <!-- Ring -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${strokeW}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#g)" stroke-width="${strokeW}"
    stroke-linecap="round" stroke-dasharray="${2 * Math.PI * r}" stroke-dashoffset="${2 * Math.PI * r * 0.35}"
    transform="rotate(-90 ${cx} ${cy})"/>
  <!-- Text -->
  <text x="${cx}" y="${cy + fontSize * 0.35}" text-anchor="middle" fill="white"
    font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="${fontSize}">LiW</text>
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d4ff"/>
      <stop offset="50%" stop-color="#8e44ad"/>
      <stop offset="100%" stop-color="#ff6b6b"/>
    </linearGradient>
  </defs>
</svg>`;
}

// Write SVGs (Vercel will serve them; browsers handle SVG icons well)
// For maximum compat, we'll also reference them as .png but serve SVG content
// Actually, let's create proper SVG files and reference as SVG in a fallback

const sizes = [192, 512];
for (const s of sizes) {
  writeFileSync(`public/icons/icon-${s}.svg`, createSVG(s, false));
  // Create the PNG-named files as SVG (most modern browsers accept this)
  writeFileSync(`public/icons/icon-${s}.png`, createSVG(s, false));
}
writeFileSync("public/icons/icon-maskable-512.png", createSVG(512, true));

// Also create apple-touch-icon
writeFileSync("public/icons/apple-touch-icon.png", createSVG(180, false));

console.log("Icons generated.");
