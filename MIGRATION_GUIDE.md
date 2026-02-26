# How to Run the Article Migration Script

## What This Script Does

The migration script will:
1. Connect to your Firebase Firestore database
2. Find all articles in the `articles` collection
3. Add a `slug` field to any article that doesn't have one
4. Add an `excerpt` field if missing (using summary or content)
5. Skip articles that already have slugs
6. Provide a detailed report of the migration

## Prerequisites

Make sure you have:
- Node.js installed
- Firebase credentials in your `.env` file
- Articles in your Firestore database that need slugs

## Option 1: Run with Node (Recommended)

1. Install dependencies (if not already installed):
```bash
npm install
```

2. Run the migration script:
```bash
node migrate-articles.js
```

## Option 2: Run as npm script

1. Add this to your `package.json` scripts:
```json
{
  "scripts": {
    "migrate:articles": "node migrate-articles.js"
  }
}
```

2. Run it:
```bash
npm run migrate:articles
```

## Option 3: Manual Update via Firebase Console

If you prefer not to run the script, you can manually update each article:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database
4. Open the `articles` collection
5. For each article document:
   - Click to edit
   - Add field: `slug` (string) - Use lowercase, hyphenated version of title
   - Add field: `excerpt` (string) - Copy from summary or first 150 chars of content
   - Click Update

## Expected Output

When the script runs successfully, you should see:

```
🚀 Starting article migration...

📄 Found 5 articles

✅ Updated "Breaking News Article" with slug: "breaking-news-article"
✅ Updated "Transfer Update" with slug: "transfer-update"
⏭️  Skipping "Match Report" - already has slug: "match-report"
...

==================================================
📊 Migration Complete!
==================================================
✅ Updated: 4 articles
⏭️  Skipped: 1 articles (already had slugs)
❌ Errors:  0 articles
==================================================

✨ Migration script completed successfully!
```

## What If Something Goes Wrong?

### Error: "Firebase is not initialized"
- Check your `.env` file has all Firebase credentials
- Make sure variables start with `VITE_` prefix

### Error: "Permission denied"
- Check your Firestore security rules
- Make sure your Firebase user has admin access
- Try running with admin SDK credentials

### Error: "Cannot read properties of undefined"
- Some articles might have missing fields
- The script handles this gracefully
- Check the error message for the specific article

## After Migration

Once the script completes:

1. ✅ All articles should have slugs
2. ✅ Navigation should work correctly
3. ✅ Old article URLs will still work (fallback to ID)
4. ✅ New articles automatically get slugs

You can verify by:
- Opening your app and clicking articles
- Checking the URLs (should show slug instead of numeric ID)
- Looking in Firestore Console to see the new `slug` fields

## Do I Need to Run This Again?

**No!** This is a one-time migration script. After running it once:
- New articles automatically get slugs (handled in AdminNews.jsx)
- Existing articles now have slugs
- No need to run again unless you manually delete slug fields

## Backup Recommendation

Before running any migration script on production data, consider:

1. **Export your Firestore data** (from Firebase Console)
2. **Test on a development/staging database first**
3. **Run the script during low-traffic hours**

The script only adds fields (doesn't delete or overwrite), so it's relatively safe.
