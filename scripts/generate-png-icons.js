import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, isMaskable = false) {
  // Simple PNG encoder: creates an RGBA image buffer with cosmic mandala gradient
  const rowSize = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) / 2;
  const safePadding = isMaskable ? 0.75 : 0.9;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normDist = dist / maxR;

      // Base background: #07101d
      let r = 7;
      let g = 16;
      let b = 29;
      let a = 255;

      if (normDist < safePadding) {
        // Gold and cyan mandala rings
        const ring = Math.sin(normDist * 28.0);
        const lotus = Math.cos(Math.atan2(dy, dx) * 6.0);

        if (normDist < 0.12) {
          // Central luminous bindu
          r = 255;
          g = 240;
          b = 180;
        } else if (normDist < 0.28) {
          // Gold core
          r = 245;
          g = 158;
          b = 11;
        } else if (Math.abs(ring) > 0.65 || (lotus > 0.4 && normDist < 0.65)) {
          // Sacred geometry lines
          r = Math.min(255, Math.floor(56 + 180 * (1 - normDist)));
          g = Math.min(255, Math.floor(189 + 50 * (1 - normDist)));
          b = 248;
        } else {
          // Nebula glow
          r = Math.min(255, Math.floor(14 + 100 * (1 - normDist)));
          g = Math.min(255, Math.floor(35 + 80 * (1 - normDist)));
          b = Math.min(255, Math.floor(61 + 90 * (1 - normDist)));
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const payload = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload), 0);

  return Buffer.concat([length, payload, crc]);
}

// CRC32 implementation for PNG chunks
function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = c ^ buf[n];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve(process.cwd(), 'public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
console.log('PNG PWA and Google Play Store icons generated successfully.');
