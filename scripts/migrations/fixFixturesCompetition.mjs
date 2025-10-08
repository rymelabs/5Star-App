import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Usage:
// 1) Place your service account JSON at ./scripts/serviceAccountKey.json (or set FIREBASE_SERVICE_ACCOUNT env var with JSON contents)
// 2) Run: node ./scripts/migrations/fixFixturesCompetition.mjs --dry  (dry run)
//    or:  node ./scripts/migrations/fixFixturesCompetition.mjs      (apply changes)

const SERVICE_ACCOUNT_PATH = path.resolve('./scripts/serviceAccountKey.json');

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message);
      process.exit(1);
    }
  }

  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    const raw = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
    return JSON.parse(raw);
  }

  console.error('No service account provided. Set FIREBASE_SERVICE_ACCOUNT or place serviceAccountKey.json in ./scripts');
  process.exit(1);
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');

(async function main() {
  const serviceAccount = getServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  console.log(`Starting migration (dry run = ${dry}) - looking for fixtures with empty competition/season/league...`);

  const fixturesRef = db.collection('fixtures');
  // Query for documents where competition is null/empty OR seasonId is null/empty OR leagueId is null/empty
  const snapshot = await fixturesRef.get();
  let toUpdate = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const competition = (data.competition || '').toString().trim();
    const seasonId = (data.seasonId || '').toString().trim();
    const leagueId = (data.leagueId || '').toString().trim();

    // If competition is empty AND no seasonId and no leagueId, set competition = 'Friendly'
    if (!competition && !seasonId && !leagueId) {
      toUpdate.push({ id: doc.id, current: data });
    }
  });

  console.log(`Found ${toUpdate.length} fixture(s) to update.`);

  if (toUpdate.length === 0) {
    console.log('Nothing to do.');
    process.exit(0);
  }

  for (const f of toUpdate) {
    console.log(`- ${f.id}: setting competition -> 'Friendly'`);
    if (!dry) {
      try {
        await fixturesRef.doc(f.id).update({ competition: 'Friendly' });
      } catch (err) {
        console.error(`Failed to update ${f.id}:`, err.message);
      }
    }
  }

  console.log(dry ? 'Dry run finished.' : 'Migration complete.');
  process.exit(0);
})();
