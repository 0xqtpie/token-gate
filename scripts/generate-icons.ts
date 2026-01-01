import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '../packages/extension/icons');

const PRIMARY_GRADIENT_START = '#818cf8';
const PRIMARY_GRADIENT_END = '#4f46e5';
const TEXT_COLOR = '#ffffff';

async function generateIcon(size: number): Promise<void> {
  const fontSize = Math.floor(size * 0.45);
  const textY = Math.floor(size * 0.65);
  const borderRadius = Math.floor(size * 0.15);
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${PRIMARY_GRADIENT_START};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${PRIMARY_GRADIENT_END};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${borderRadius}" fill="url(#grad)"/>
      <text 
        x="50%" 
        y="${textY}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${fontSize}" 
        font-weight="700"
        fill="${TEXT_COLOR}" 
        text-anchor="middle"
      >TG</text>
    </svg>
  `;

  const outputPath = join(ICONS_DIR, `icon-${size}.png`);
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`✓ Generated ${outputPath}`);
}

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });

  const sizes = [16, 48, 128];
  
  for (const size of sizes) {
    await generateIcon(size);
  }

  console.log('\n✅ All icons generated successfully!');
}

main().catch(console.error);
