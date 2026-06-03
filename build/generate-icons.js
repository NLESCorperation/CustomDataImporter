#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const buildDir = __dirname;
const pngPath = path.join(buildDir, 'icon.png');
const icoPath = path.join(buildDir, 'icon.ico');
const icnsPath = path.join(buildDir, 'icon.icns');

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c >>> 0;
}

function crc32(buffer) {
    let c = 0xffffffff;
    for (const byte of buffer) {
        c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const chunk = Buffer.alloc(12 + data.length);
    chunk.writeUInt32BE(data.length, 0);
    typeBuffer.copy(chunk, 4);
    data.copy(chunk, 8);
    chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
    return chunk;
}

function inRoundedRect(x, y, size, radius) {
    const left = radius;
    const right = size - radius - 1;
    const top = radius;
    const bottom = size - radius - 1;

    if ((x >= left && x <= right) || (y >= top && y <= bottom)) return true;

    const cx = x < left ? left : right;
    const cy = y < top ? top : bottom;
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function drawIcon(size) {
    const stride = size * 4 + 1;
    const raw = Buffer.alloc(stride * size);
    const radius = size * 0.19;
    const center = size / 2;

    for (let y = 0; y < size; y++) {
        const rowOffset = y * stride;
        raw[rowOffset] = 0;

        for (let x = 0; x < size; x++) {
            const offset = rowOffset + 1 + x * 4;
            const rounded = inRoundedRect(x, y, size, radius);
            if (!rounded) {
                raw[offset + 3] = 0;
                continue;
            }

            const gradient = y / Math.max(size - 1, 1);
            raw[offset] = Math.round(15 + gradient * 34);
            raw[offset + 1] = Math.round(98 + gradient * 25);
            raw[offset + 2] = Math.round(254 - gradient * 82);
            raw[offset + 3] = 255;

            const dx = Math.abs(x - center);
            const databaseTop = size * 0.26;
            const databaseBottom = size * 0.72;
            const widthAtY = size * (0.23 + 0.035 * Math.cos((y / size) * Math.PI * 2));
            const inBody = y >= databaseTop && y <= databaseBottom && dx <= widthAtY;
            const isTopRing = Math.abs((y - databaseTop) / (size * 0.045)) + dx / (size * 0.27) <= 1;
            const isMiddleRing = Math.abs((y - size * 0.49) / (size * 0.035)) + dx / (size * 0.25) <= 1;
            const isBottomRing = Math.abs((y - databaseBottom) / (size * 0.04)) + dx / (size * 0.23) <= 1;

            if (inBody || isTopRing || isMiddleRing || isBottomRing) {
                const ringCutout =
                    (isTopRing || isMiddleRing || isBottomRing) &&
                    Math.abs(x - center) < size * 0.18 &&
                    Math.abs(y - databaseTop) > size * 0.012 &&
                    Math.abs(y - size * 0.49) > size * 0.012 &&
                    Math.abs(y - databaseBottom) > size * 0.012;

                if (!ringCutout) {
                    raw[offset] = 255;
                    raw[offset + 1] = 255;
                    raw[offset + 2] = 255;
                    raw[offset + 3] = inBody ? 218 : 245;
                }
            }
        }
    }

    return raw;
}

function makePng(size) {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size, 0);
    header.writeUInt32BE(size, 4);
    header[8] = 8;
    header[9] = 6;
    header[10] = 0;
    header[11] = 0;
    header[12] = 0;

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        pngChunk('IHDR', header),
        pngChunk('IDAT', zlib.deflateSync(drawIcon(size), { level: 9 })),
        pngChunk('IEND', Buffer.alloc(0))
    ]);
}

function makeIco(sizes) {
    const images = sizes.map(size => ({ size, data: makePng(size) }));
    const headerSize = 6 + images.length * 16;
    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);

    let offset = headerSize;
    images.forEach((image, index) => {
        const entryOffset = 6 + index * 16;
        header[entryOffset] = image.size >= 256 ? 0 : image.size;
        header[entryOffset + 1] = image.size >= 256 ? 0 : image.size;
        header[entryOffset + 2] = 0;
        header[entryOffset + 3] = 0;
        header.writeUInt16LE(1, entryOffset + 4);
        header.writeUInt16LE(32, entryOffset + 6);
        header.writeUInt32LE(image.data.length, entryOffset + 8);
        header.writeUInt32LE(offset, entryOffset + 12);
        offset += image.data.length;
    });

    return Buffer.concat([header, ...images.map(image => image.data)]);
}

function makeIcns() {
    if (process.platform !== 'darwin') {
        console.warn('Skipping icon.icns generation because iconutil is macOS-only.');
        return;
    }

    const iconsetDir = path.join(os.tmpdir(), `soti-icon-${process.pid}.iconset`);
    fs.rmSync(iconsetDir, { recursive: true, force: true });
    fs.mkdirSync(iconsetDir, { recursive: true });

    const entries = [
        ['icon_16x16.png', 16],
        ['icon_16x16@2x.png', 32],
        ['icon_32x32.png', 32],
        ['icon_32x32@2x.png', 64],
        ['icon_128x128.png', 128],
        ['icon_128x128@2x.png', 256],
        ['icon_256x256.png', 256],
        ['icon_256x256@2x.png', 512],
        ['icon_512x512.png', 512],
        ['icon_512x512@2x.png', 1024]
    ];

    for (const [fileName, size] of entries) {
        fs.writeFileSync(path.join(iconsetDir, fileName), makePng(size));
    }

    execFileSync('iconutil', ['-c', 'icns', iconsetDir, '-o', icnsPath], { stdio: 'inherit' });
    fs.rmSync(iconsetDir, { recursive: true, force: true });
}

fs.writeFileSync(pngPath, makePng(1024));
fs.writeFileSync(icoPath, makeIco([16, 32, 48, 64, 128, 256]));
makeIcns();

console.log(`Wrote ${path.relative(process.cwd(), pngPath)}`);
console.log(`Wrote ${path.relative(process.cwd(), icoPath)}`);
if (fs.existsSync(icnsPath)) {
    console.log(`Wrote ${path.relative(process.cwd(), icnsPath)}`);
}
