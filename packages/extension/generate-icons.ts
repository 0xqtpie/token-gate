#!/usr/bin/env bun

// Simple script to generate placeholder icons for the extension
// Run with: bun run generate-icons.ts

const sizes = [16, 48, 128];

async function generateIcon(size: number): Promise<Uint8Array> {
  // Create a simple PNG with a gradient background and "TG" text
  // Using a minimal PNG encoder approach
  
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  
  // Gradient background (purple to blue)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#6366f1");
  gradient.addColorStop(1, "#8b5cf6");
  ctx.fillStyle = gradient;
  
  // Rounded rectangle
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Text "TG"
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.45}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TG", size / 2, size / 2 + size * 0.05);
  
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
