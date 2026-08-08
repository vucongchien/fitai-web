import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
/**
 * Generates the PWA icons in public/icons/ from the Triple Lane brand marks.
 *
 * These are PLACEHOLDERS. They exist because a manifest that 404s its icons
 * makes Chrome reject the install prompt and stops iOS offering "Add to Home
 * Screen" — which is the only way iOS grants notification permission, so push
 * cannot work at all without them. Replace with the real mark when design ships
 * one; the sizes and file names are what matter.
 *
 * Written as a raw PNG encoder rather than pulling in sharp: three flat-colour
 * rectangles need no image library, and the dependency would be dead weight
 * once the real assets land.
 *
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { deflateSync } from "node:zlib";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "public", "icons");

// Src/shared/design-system/tokens.css
const PAPER = [0xF7, 0xF8, 0xF6];
const RELAY_BLUE = [0x4B, 0x57, 0xF2];
const SPRINT_CORAL = [0xFF, 0x5A, 0x47];
const FIELD_GREEN = [0x25, 0xC7, 0x7A];

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xED_B8_83_20 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (const byte of buf) {
    c = crcTable[(c ^ byte) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Colour type: RGBA
  // 10..12 stay zero: deflate, adaptive filtering, no interlace.

  // One filter byte (0 = None) per scanline, ahead of its RGBA run.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Three stacked lanes on paper — Relay Blue (planning), Sprint Coral (effort),
 * Field Green (recovery), the order DESIGN.md gives them.
 *
 * `inset` is the fraction of the canvas left as margin. Maskable icons get a
 * larger one so the mark survives being cropped to a circle.
 */
function drawIcon(size, inset) {
  const px = Buffer.alloc(size * size * 4);
  const margin = Math.round(size * inset);
  const laneGap = Math.round(size * 0.045);
  const laneHeight = Math.round((size - margin * 2 - laneGap * 2) / 3);
  const lanes = [RELAY_BLUE, SPRINT_CORAL, FIELD_GREEN];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let colour = PAPER;

      if (x >= margin && x < size - margin) {
        for (let lane = 0; lane < 3; lane += 1) {
          const top = margin + lane * (laneHeight + laneGap);
          if (y >= top && y < top + laneHeight) {
            colour = lanes[lane];
            break;
          }
        }
      }

      const i = (y * size + x) * 4;
      px[i] = colour[0];
      px[i + 1] = colour[1];
      px[i + 2] = colour[2];
      px[i + 3] = 255;
    }
  }
  return px;
}

await mkdir(outDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192, inset: 0.18 },
  { name: "icon-512.png", size: 512, inset: 0.18 },
  // Maskable safe zone is the middle 80%, so the mark sits further in.
  { name: "icon-512-maskable.png", size: 512, inset: 0.28 },
];

for (const { inset, name, size } of targets) {
  const png = encodePng(size, drawIcon(size, inset));
  await writeFile(join(outDir, name), png);
  console.log(`[pwa-icons] ${name} — ${size}x${size}, ${png.length} bytes`);
}
