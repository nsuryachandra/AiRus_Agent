import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcPayload = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcPayload), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  const width = size;
  const height = size;

  // IHDR: width(4), height(4), bitDepth(1), colorType(1 = 6 RGBA), comp(1), filter(1), interlace(1)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines: 1 filter byte (0) + width * 4 bytes RGBA
  const rawBytes = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2;

  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded app icon shape
      const cornerR = width * 0.22;
      const nx = Math.abs(dx) - (cx - cornerR);
      const ny = Math.abs(dy) - (cy - cornerR);
      let inBox = true;
      if (nx > 0 && ny > 0) {
        if (Math.sqrt(nx * nx + ny * ny) > cornerR) {
          inBox = false;
        }
      }

      if (!inBox) {
        rawBytes[offset++] = 0;
        rawBytes[offset++] = 0;
        rawBytes[offset++] = 0;
        rawBytes[offset++] = 0;
        continue;
      }

      // Draw glowing gradient orb
      const ratio = Math.min(1, dist / maxR);
      if (dist < maxR * 0.35) {
        // Bright cyan-blue core
        rawBytes[offset++] = 56;  // R
        rawBytes[offset++] = 189; // G
        rawBytes[offset++] = 248; // B
        rawBytes[offset++] = 255; // A
      } else if (dist < maxR * 0.7) {
        // Indigo ring
        rawBytes[offset++] = 99;  // R
        rawBytes[offset++] = 102; // G
        rawBytes[offset++] = 241; // B
        rawBytes[offset++] = 255;
      } else {
        // Dark background
        rawBytes[offset++] = 9;   // R
        rawBytes[offset++] = 13;  // G
        rawBytes[offset++] = 22;  // B
        rawBytes[offset++] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawBytes);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve(__dirname, '../client/public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), generatePng(192));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), generatePng(512));
console.log('Successfully generated valid 192x192 and 512x512 PWA icons.');
