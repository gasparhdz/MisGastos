import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "public/icons/icon.svg");

const outputs = [
  { path: join(root, "public/icons/icon-192.png"), size: 192 },
  { path: join(root, "public/icons/icon-512.png"), size: 512 },
  { path: join(root, "public/icons/apple-touch-icon.png"), size: 180 },
  { path: join(root, "public/favicon.png"), size: 32 },
];

for (const { path, size } of outputs) {
  await sharp(svgPath).resize(size, size).png().toFile(path);
  console.log(`Generated ${path} (${size}x${size})`);
}
