const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ICO Header & Directory Entry Helper (embeds standard PNG directly inside ICO)
function pngToIcoBuffer(pngBuffer, width, height) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Type (1 = ICO)
    header.writeUInt16LE(1, 4); // Number of images (1)
    
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // Color palette (0 = no palette)
    entry.writeUInt8(0, 3); // Reserved (0)
    entry.writeUInt16LE(1, 4); // Color planes (1)
    entry.writeUInt16LE(32, 6); // Bits per pixel (32)
    entry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
    entry.writeUInt32LE(22, 12); // Offset (6 + 16 = 22)
    
    return Buffer.concat([header, entry, pngBuffer]);
}

const targets = [
    {
        name: 'voicejeju',
        source: 'public/favicon/voicejeju.png', // Currently JPEG
        isJpeg: true
    },
    {
        name: 'jejujapan',
        source: 'public/favicon/jejujapan.png', // Currently JPEG
        isJpeg: true
    },
    {
        name: 'jejuqq',
        source: 'public/favicon/jejuqq.png', // Currently JPEG
        isJpeg: true
    },
    {
        name: 'jejutime',
        source: 'public/favicon/jejutime.png', // Currently JPEG
        isJpeg: true
    },
    {
        name: 'skyblueprime',
        source: 'public/favicon/skyblueprime.png', // Currently non-square PNG
        isJpeg: false
    }
];

async function main() {
    console.log('Starting icon optimization and generation...');

    for (const t of targets) {
        console.log(`Processing: ${t.name}`);
        const sourcePath = path.resolve(t.source);
        
        if (!fs.existsSync(sourcePath)) {
            console.error(`Source file not found: ${sourcePath}`);
            continue;
        }

        // Read source into memory buffer first to prevent file locks on Windows
        const sourceBuffer = fs.readFileSync(sourcePath);

        // 1. Process and square-resize the image using sharp
        let image = sharp(sourceBuffer);
        
        // If it's SkyBluePrime (or any non-square image), we resize and fit inside a square box.
        // For SkyBluePrime, transparent background is preferred since it is a PNG.
        if (t.name === 'skyblueprime') {
            image = image.resize(512, 512, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent background
            });
        } else {
            // For other domains, we also standardise to 512x512 pixels
            image = image.resize(512, 512, {
                fit: 'fill'
            });
        }

        // 2. Export as a real PNG
        const pngBuffer = await image.png().toBuffer();
        
        // Overwrite the file in public/favicon as a genuine PNG
        const destPngPath = path.resolve(`public/favicon/${t.name}.png`);
        fs.writeFileSync(destPngPath, pngBuffer);
        console.log(`  -> Saved genuine PNG: public/favicon/${t.name}.png`);

        // 3. Generate the real ICO file and save it to public/icons/
        const icoBuffer = pngToIcoBuffer(pngBuffer, 512, 512);
        const destIcoPath = path.resolve(`public/icons/${t.name}.ico`);
        fs.writeFileSync(destIcoPath, icoBuffer);
        console.log(`  -> Saved high-res ICO: public/icons/${t.name}.ico`);
    }

    console.log('Icon optimization completed successfully!');
}

main().catch(err => {
    console.error('Error during icon optimization:', err);
    process.exit(1);
});
