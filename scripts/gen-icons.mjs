// Генерация растровых иконок из SVG-исходника (coin + sprout).
// Запуск: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fullSvg = readFileSync(resolve(root, "scripts/icon-full.svg"));

// Маскируемая версия: фон во весь квадрат, знак — в безопасной зоне (~78%).
const inner = readFileSync(resolve(root, "scripts/icon-full.svg"), "utf8")
  // берём только содержимое без внешнего <rect> фона со скруглением
  .replace(/<rect width="512"[^/]*\/>/, "");
const maskableSvg = Buffer.from(
  inner.replace(
    "</defs>",
    `</defs><rect width="512" height="512" fill="url(#bg)"/><g transform="translate(56.32,56.32) scale(0.78)">`,
  ).replace("</svg>", "</g></svg>"),
);

mkdirSync(resolve(root, "public/icons"), { recursive: true });

const jobs = [
  [fullSvg, 192, "public/icons/icon-192.png"],
  [fullSvg, 512, "public/icons/icon-512.png"],
  [maskableSvg, 512, "public/icons/icon-maskable-512.png"],
  [fullSvg, 512, "app/icon.png"],
  [fullSvg, 180, "app/apple-icon.png"],
];

for (const [svg, size, out] of jobs) {
  await sharp(svg).resize(size, size).png().toFile(resolve(root, out));
  console.log("→", out, `${size}x${size}`);
}
