#!/usr/bin/env node

/**
 * Generate PNG favicons from SVG
 * 
 * Requirements:
 * - Install sharp: npm install sharp
 * - Or use online converter: https://cloudconvert.com/svg-to-png
 * 
 * Usage:
 * node scripts/generate-favicons.js favicon-v1-magic-wand.svg
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp is not installed.');
  console.log('📦 Install it with: npm install sharp');
  console.log('\n💡 Alternative: Use online converter:');
  console.log('   https://cloudconvert.com/svg-to-png');
  console.log('   Or: https://svgtopng.com/');
  process.exit(1);
}

const sizes = [16, 32, 48, 128, 512];
const inputFile = process.argv[2];

if (!inputFile) {
  console.error('❌ Please provide an SVG file path');
  console.log('Usage: node scripts/generate-favicons.js favicon-v1-magic-wand.svg');
  process.exit(1);
}

const inputPath = path.join(__dirname, '..', 'public', inputFile);
const outputDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(inputPath)) {
  console.error(`❌ File not found: ${inputPath}`);
  process.exit(1);
}

async function generateFavicons() {
  console.log(`🎨 Generating favicons from: ${inputFile}\n`);
  
  const svgBuffer = fs.readFileSync(inputPath);
  
  for (const size of sizes) {
    try {
      const outputPath = path.join(outputDir, `icon-${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}:`, error.message);
    }
  }
  
  // Also generate favicon.ico (multi-size ICO file)
  try {
    const faviconPath = path.join(outputDir, 'favicon.ico');
    
    // Create ICO with multiple sizes
    const icoSizes = [16, 32, 48];
    const icoImages = await Promise.all(
      icoSizes.map(size =>
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );
    
    // Note: sharp doesn't support ICO directly, so we'll create a simple PNG
    // For true ICO, use: https://www.icoconverter.com/ or imagemagick
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    console.log(`\n✅ Generated: favicon.png (32x32)`);
    console.log(`\n💡 Note: For true .ico file, use online converter:`);
    console.log(`   https://www.icoconverter.com/`);
  } catch (error) {
    console.error(`❌ Error generating favicon:`, error.message);
  }
  
  console.log(`\n✨ Done! All favicons generated in: ${outputDir}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Update wxt.config.ts manifest with icon paths`);
  console.log(`   2. Test in browser`);
  console.log(`   3. For Chrome Store, use icon-128.png or icon-512.png`);
}

generateFavicons().catch(console.error);

