/**
 * Migration Script: Generate Logo Thumbnails for Existing Teams
 * 
 * This script fetches all teams from Firestore, downloads their existing logos,
 * generates thumbnail variants, uploads them to Firebase Storage, and updates
 * the team documents with the new logoThumbUrl field.
 * 
 * USAGE:
 * 1. Make sure you have Firebase Admin SDK credentials set up
 * 2. Run: node scripts/migrations/migrate-team-logos.js
 * 
 * NOTE: This script is designed to be run from the command line using Node.js.
 * It requires the Firebase Admin SDK.
 */

const admin = require('firebase-admin');
const https = require('https');
const http = require('http');
const path = require('path');
const sharp = require('sharp'); // You may need to: npm install sharp

// Initialize Firebase Admin SDK
// Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or provide the service account key path
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '../../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'fivestar-app-d8cd7.appspot.com' // Update with your bucket name
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK');
  console.error('   Make sure you have serviceAccountKey.json in the project root');
  console.error('   or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  process.exit(1);
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Configuration
const THUMBNAIL_SIZE = 64;
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 10; // Process teams in batches to avoid rate limiting

/**
 * Download image from URL
 */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Generate thumbnail using Sharp
 */
async function generateThumbnail(imageBuffer) {
  return sharp(imageBuffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      withoutEnlargement: false
    })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Upload thumbnail to Firebase Storage
 */
async function uploadThumbnail(buffer, teamName) {
  const safeName = teamName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `teams/${safeName}_${Date.now()}_thumb.webp`;
  
  const file = bucket.file(fileName);
  
  await file.save(buffer, {
    metadata: {
      contentType: 'image/webp',
      metadata: {
        variant: 'thumbnail',
        migratedAt: new Date().toISOString()
      }
    }
  });
  
  // Make the file publicly accessible
  await file.makePublic();
  
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

/**
 * Process a single team
 */
async function processTeam(team) {
  const teamId = team.id;
  const teamData = team.data();
  const teamName = teamData.name || 'unknown';
  
  // Skip if no logo or already has thumbnail
  if (!teamData.logo) {
    return { status: 'skipped', reason: 'no logo', teamName };
  }
  
  if (teamData.logoThumbUrl) {
    return { status: 'skipped', reason: 'already has thumbnail', teamName };
  }
  
  try {
    console.log(`  Processing: ${teamName}`);
    
    // Download original logo
    const imageBuffer = await downloadImage(teamData.logo);
    console.log(`    ✓ Downloaded (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
    
    // Generate thumbnail
    const thumbnailBuffer = await generateThumbnail(imageBuffer);
    console.log(`    ✓ Generated thumbnail (${(thumbnailBuffer.length / 1024).toFixed(1)} KB)`);
    
    if (DRY_RUN) {
      console.log(`    ⚠ DRY RUN - Would upload and update Firestore`);
      return { status: 'dry-run', teamName };
    }
    
    // Upload thumbnail
    const thumbnailUrl = await uploadThumbnail(thumbnailBuffer, teamName);
    console.log(`    ✓ Uploaded thumbnail`);
    
    // Update Firestore
    await db.collection('teams').doc(teamId).update({
      logoThumbUrl: thumbnailUrl,
      updatedAt: new Date().toISOString()
    });
    console.log(`    ✓ Updated Firestore`);
    
    return { status: 'success', teamName, thumbnailUrl };
  } catch (error) {
    console.error(`    ✗ Error: ${error.message}`);
    return { status: 'error', teamName, error: error.message };
  }
}

/**
 * Process teams in batches
 */
async function processBatch(teams) {
  const results = [];
  for (const team of teams) {
    const result = await processTeam(team);
    results.push(result);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return results;
}

/**
 * Main migration function
 */
async function migrateTeamLogos() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Team Logo Thumbnail Migration Script');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
  }
  
  console.log('\n📦 Fetching teams from Firestore...');
  
  try {
    const teamsSnapshot = await db.collection('teams').get();
    const teams = teamsSnapshot.docs;
    
    console.log(`   Found ${teams.length} teams\n`);
    
    const allResults = [];
    
    // Process in batches
    for (let i = 0; i < teams.length; i += BATCH_SIZE) {
      const batch = teams.slice(i, i + BATCH_SIZE);
      console.log(`\n📌 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(teams.length / BATCH_SIZE)}`);
      const batchResults = await processBatch(batch);
      allResults.push(...batchResults);
    }
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('═══════════════════════════════════════════════════════════');
    
    const success = allResults.filter(r => r.status === 'success').length;
    const skipped = allResults.filter(r => r.status === 'skipped').length;
    const errors = allResults.filter(r => r.status === 'error').length;
    const dryRun = allResults.filter(r => r.status === 'dry-run').length;
    
    console.log(`✅ Success: ${success}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    if (DRY_RUN) {
      console.log(`🔍 Would process: ${dryRun}`);
    }
    
    if (errors > 0) {
      console.log('\n❌ Failed teams:');
      allResults
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`   - ${r.teamName}: ${r.error}`));
    }
    
    console.log('\n✨ Migration complete!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateTeamLogos().then(() => process.exit(0));
