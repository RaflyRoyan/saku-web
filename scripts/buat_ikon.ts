// Generate ikon PWA dari public/logo.svg: `npm run ikon`.
// - pwa-64/192/512, apple-touch-icon (latar penuh, tanpa sudut transparan untuk iOS), favicon.ico
// - maskable-icon: latar gradien penuh (full-bleed), logo di zona aman 80% sesuai spesifikasi maskable

import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const logo = readFileSync("public/logo.svg", "utf8");

// Versi tanpa sudut membulat: dipakai untuk apple-touch-icon dan maskable
const fullBleed = logo.replace('rx="112" fill="url(#langit)"', 'fill="url(#langit)"');

// Maskable: isi (matahari + cakrawala) diperkecil ke 80% di tengah, latar tetap penuh
const maskable = fullBleed.replace(
  /(<rect width="512" height="512" fill="url\(#langit\)"\/>)([\s\S]*)(<\/svg>)/,
  '$1<g transform="translate(51.2 51.2) scale(0.8)">$2</g>$3',
);

const png = (svg: string, size: number) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

/** ICO berisi satu gambar PNG (didukung semua browser modern). */
function ico(pngData: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngData.length, 8);
  entry.writeUInt32LE(6 + 16, 12);
  return Buffer.concat([header, entry, pngData]);
}

const keluaran: [string, Promise<Buffer>][] = [
  ["public/pwa-64x64.png", png(logo, 64)],
  ["public/pwa-192x192.png", png(logo, 192)],
  ["public/pwa-512x512.png", png(logo, 512)],
  ["public/apple-touch-icon-180x180.png", png(fullBleed, 180)],
  ["public/maskable-icon-512x512.png", png(maskable, 512)],
  ["public/favicon.ico", png(logo, 48).then((b) => ico(b, 48))],
];

for (const [file, data] of keluaran) {
  writeFileSync(file, await data);
  console.log(`Ditulis ${file}`);
}
