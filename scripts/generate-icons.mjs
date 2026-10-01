/**
 * Generates PWA icons from a shared SVG source.
 * Requires ImageMagick (`magick`) locally; generated bitmap files are committed
 * so Vercel does not need ImageMagick during build.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function createSVG(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = innerSize * 0.32;
  const strokeW = innerSize * 0.04;
  const tile = innerSize * 0.07;
  const tileGap = innerSize * 0.025;
  const gridLeft = cx - (tile * 3 + tileGap * 2) / 2;
  const gridTop = cy - (tile * 3 + tileGap * 2) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a23" rx="${maskable ? 0 : size * 0.15}"/>
  <!-- Ring -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${strokeW}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#g)" stroke-width="${strokeW}"
    stroke-linecap="round" stroke-dasharray="${2 * Math.PI * r}" stroke-dashoffset="${2 * Math.PI * r * 0.35}"
    transform="rotate(-90 ${cx} ${cy})"/>
  <!-- Week-grid mark -->
  ${Array.from({ length: 9 }, (_, index) => {
    const x = gridLeft + (index % 3) * (tile + tileGap);
    const y = gridTop + Math.floor(index / 3) * (tile + tileGap);
    const fill = index < 5 ? "#ffffff" : "rgba(255,255,255,0.18)";
    return `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="${tile * 0.22}" fill="${fill}"/>`;
  }).join("")}
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d4ff"/>
      <stop offset="50%" stop-color="#8e44ad"/>
      <stop offset="100%" stop-color="#ff6b6b"/>
    </linearGradient>
  </defs>
</svg>`;
}

function convertSvgToBitmap(svg, outputPath, size) {
  const dir = mkdtempSync(join(tmpdir(), "liw-icons-"));
  const svgPath = join(dir, "icon.svg");

  try {
    writeFileSync(svgPath, svg);
    execFileSync("magick", [svgPath, "-resize", `${size}x${size}`, outputPath], { stdio: "inherit" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeSvgAndPng(basePath, size, maskable = false) {
  const svg = createSVG(size, maskable);
  writeFileSync(`${basePath}.svg`, svg);
  convertSvgToBitmap(svg, `${basePath}.png`, size);
}

const sizes = [192, 512];
for (const s of sizes) {
  writeSvgAndPng(`public/icons/icon-${s}`, s, false);
}
writeSvgAndPng("public/icons/icon-maskable-512", 512, true);

// Also create apple-touch-icon
convertSvgToBitmap(createSVG(180, false), "public/icons/apple-touch-icon.png", 180);
execFileSync("magick", ["public/icons/icon-192.png", "public/favicon.ico"], { stdio: "inherit" });

console.log("Icons generated.");
