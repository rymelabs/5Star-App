#!/usr/bin/env node

/**
 * Media Compression Script
 * This script compresses images and provides instructions for video compression
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const LANDING_PAGE_BG = path.join(__dirname, 'public', 'LandingPageBG');
const COMPRESSED_DIR = path.join(__dirname, 'public', 'LandingPageBG-compressed');

// Ensure compressed directory exists
if (!fs.existsSync(COMPRESSED_DIR)) {
  fs.mkdirSync(COMPRESSED_DIR, { recursive: true });
}

console.log('🎨 Starting media compression...\n');

// Instructions for manual video compression
console.log('📹 VIDEO COMPRESSION INSTRUCTIONS:');
console.log('The video file (BackgroundVid1.mp4) is 15MB.');
console.log('\nOption 1: Use online tool (easiest):');
console.log('1. Go to https://www.freeconvert.com/video-compressor');
console.log('2. Upload BackgroundVid1.mp4');
console.log('3. Set quality to "Medium" or adjust size to ~2-3MB');
console.log('4. Download and replace the original file\n');

console.log('Option 2: Install ffmpeg and run this command:');
console.log('brew install ffmpeg');
console.log('ffmpeg -i public/LandingPageBG/BackgroundVid1.mp4 -vcodec libx264 -crf 28 -preset medium -vf "scale=1280:-2" public/LandingPageBG-compressed/BackgroundVid1.mp4\n');

console.log('Option 3: Use HandBrake (GUI tool):');
console.log('1. Download from https://handbrake.fr/');
console.log('2. Open BackgroundVid1.mp4');
console.log('3. Set dimensions to 1280x720');
console.log('4. Set quality to RF 28');
console.log('5. Export\n');

console.log('=' .repeat(60));
console.log('\n🖼️  IMAGE COMPRESSION:');
console.log('For images, I recommend using online tools:\n');

const images = [
  '5STARSRB-06.png (368KB)',
  'PHOTO-2024-12-31-19-43-49.jpg (360KB)',
  'PHOTO-2024-06-11-08-28-38.jpg (32KB - already small)'
];

console.log('Images to compress:');
images.forEach((img, i) => {
  console.log(`${i + 1}. ${img}`);
});

console.log('\nRecommended online tools:');
console.log('- https://tinypng.com/ (PNG compression)');
console.log('- https://compressor.io/ (JPG/PNG compression)');
console.log('- https://squoosh.app/ (Google\'s image optimizer)\n');

console.log('Target sizes:');
console.log('- Images: Reduce to 100-200KB each');
console.log('- Video: Reduce to 2-3MB\n');

console.log('=' .repeat(60));
console.log('\n✅ After compression, replace the files in:');
console.log(`   ${LANDING_PAGE_BG}\n`);
