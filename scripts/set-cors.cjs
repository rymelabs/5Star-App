/**
 * Script to update Firebase Storage CORS configuration
 * Run with: node scripts/set-cors.js
 * 
 * Prerequisites:
 * - Service account key file at serviceAccountKey.json in project root
 * - Or set GOOGLE_APPLICATION_CREDENTIALS environment variable
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// Configuration - try the firebasestorage.app format
const BUCKET_NAME = 'YOUR_PROJECT_ID.firebasestorage.app';
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '../serviceAccountKey.json');

async function setCors() {
  console.log('🔧 Setting CORS configuration for Firebase Storage...\n');
  
  // Check for service account file
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ Service account key file not found at:', SERVICE_ACCOUNT_PATH);
    console.log('\nTo get the service account key:');
    console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the file as "serviceAccountKey.json" in the project root');
    process.exit(1);
  }

  try {
    // Initialize storage with service account
    const storage = new Storage({
      keyFilename: SERVICE_ACCOUNT_PATH
    });

    const bucket = storage.bucket(BUCKET_NAME);
    
    // Read CORS configuration
    const corsPath = path.join(__dirname, '../cors.json');
    const corsConfig = JSON.parse(fs.readFileSync(corsPath, 'utf8'));
    
    console.log('📋 CORS Configuration to apply:');
    console.log(JSON.stringify(corsConfig, null, 2));
    console.log('');
    
    // Set CORS
    await bucket.setCorsConfiguration(corsConfig);
    
    console.log('✅ CORS configuration applied successfully!');
    console.log(`   Bucket: ${BUCKET_NAME}`);
    
    // Verify
    const [metadata] = await bucket.getMetadata();
    console.log('\n📝 Current CORS configuration:');
    console.log(JSON.stringify(metadata.cors, null, 2));
    
  } catch (error) {
    console.error('❌ Failed to set CORS:', error.message);
    
    if (error.code === 403) {
      console.log('\nThe service account may not have permission to modify the bucket.');
      console.log('Make sure it has the "Storage Admin" role.');
    }
    
    process.exit(1);
  }
}

setCors();
