#!/usr/bin/env bun

const sizes = [16, 48, 128];
const ORANGE = "#ff3e00";
const BLACK = "#050505";
const DARK_GRAY = "#1a1a1a";

async function generateIcon(size: number): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, size, size);
  
  const borderWidth = Math.max(1, Math.floor(size / 16));
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, size - borderWidth, size - borderWidth);
  
  const padding = size * 0.12;
  ctx.fillStyle = DARK_GRAY;
  ctx.fillRect(padding, padding, size - padding * 2, size - padding * 2);
  
  ctx.fillStyle = ORANGE;
  const barWidth = Math.max(2, size * 0.08);
  const barHeight = size * 0.5;
  const startY = (size - barHeight) / 2;
  
  ctx.fillRect(size * 0.25, startY, barWidth, barHeight);
  ctx.fillRect(size * 0.5 - barWidth / 2, startY - size * 0.08, barWidth, barHeight + size * 0.16);
  ctx.fillRect(size * 0.75 - barWidth, startY, barWidth, barHeight);
  
  const crossY = size * 0.5 - barWidth / 2;
  ctx.fillRect(size * 0.2, crossY, size * 0.6, barWidth);
  
  const accentSize = Math.max(2, size * 0.06);
  ctx.fillRect(padding, padding, accentSize, accentSize);
  ctx.fillRect(size - padding - accentSize, padding, accentSize, accentSize);
  ctx.fillRect(padding, size - padding - accentSize, accentSize, accentSize);
  ctx.fillRect(size - padding - accentSize, size - padding - accentSize, accentSize, accentSize);
  
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
}

async function main() {
  for (const size of sizes) {
    const iconData = await generateIcon(size);
    const path = `./icons/icon-${size}.png`;
    await Bun.write(path, iconData);
    console.log(`Generated ${path}`);
  }
  console.log("Done!");
}

main().catch(console.error);
