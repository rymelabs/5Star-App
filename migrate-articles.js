// Migration Script: Add slugs to existing articles
// Run this once to update all existing articles that don't have slugs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Your Firebase config (copy from .env or firebase/config.js)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Slugify function (same as in helpers.js)
const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

async function migrateArticles() {
  try {
    console.log('🚀 Starting article migration...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Get all articles
    const articlesRef = collection(db, 'articles');
    const querySnapshot = await getDocs(articlesRef);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`📄 Found ${querySnapshot.size} articles\n`);

    // Process each article
    for (const docSnapshot of querySnapshot.docs) {
      const article = docSnapshot.data();
      const articleId = docSnapshot.id;

      try {
        // Skip if article already has a slug
        if (article.slug) {
          console.log(`⏭️  Skipping "${article.title}" - already has slug: "${article.slug}"`);
          skippedCount++;
          continue;
        }

        // Generate slug from title
        const slug = slugify(article.title);

        // Update the article
        const docRef = doc(db, 'articles', articleId);
        await updateDoc(docRef, {
          slug: slug,
          // Also ensure excerpt exists (use summary or content)
          excerpt: article.excerpt || article.summary || article.content?.substring(0, 150) + '...' || ''
        });

        console.log(`✅ Updated "${article.title}" with slug: "${slug}"`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating article "${article.title}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Complete!');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updatedCount} articles`);
    console.log(`⏭️  Skipped: ${skippedCount} articles (already had slugs)`);
    console.log(`❌ Errors:  ${errorCount} articles`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateArticles()
  .then(() => {
    console.log('✨ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
