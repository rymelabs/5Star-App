#!/usr/bin/env node
/**
 * Migration: normalizeDeletedSeasonsFixtures
 *
 * Purpose:
 * - Find fixtures linked to seasons that no longer exist
 * - Move those fixtures into recycleBin
 * - Remove those fixtures from fixtures collection
 *
 * Usage:
 *   node scripts/migrations/normalizeDeletedSeasonsFixtures.mjs --dry
 *   node scripts/migrations/normalizeDeletedSeasonsFixtures.mjs --apply
 *
 * Auth options (first available is used):
 * 1) FIREBASE_SERVICE_ACCOUNT env var (JSON string)
 * 2) ./scripts/serviceAccountKey.json
 * 3) Application Default Credentials (admin.initializeApp())
 */

import admin from 'firebase-admin';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('./scripts/serviceAccountKey.json');
const FIREBASE_RC_PATH = path.resolve('./.firebaserc');
const FIREBASE_CLI_CONFIG_PATH = path.resolve(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.config/configstore/firebase-tools.json'
);
const FIREBASE_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const DEFAULT_RETENTION_DAYS = 30;
const MAX_FIXTURES_PER_BATCH = 200; // 200 fixtures => 400 writes (set + delete) per batch

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry') || !argv.includes('--apply');
const apply = argv.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage: --dry (preview) or --apply (apply changes)');
  process.exit(1);
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error.message);
      process.exit(1);
    }
  }

  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    } catch (error) {
      console.error(`Failed to read service account at ${SERVICE_ACCOUNT_PATH}:`, error.message);
      process.exit(1);
    }
  }

  return null;
}

function resolveProjectId() {
  const envProjectId =
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID;
  if (envProjectId) return String(envProjectId);

  if (!fs.existsSync(FIREBASE_RC_PATH)) return null;

  try {
    const firebaseRc = JSON.parse(fs.readFileSync(FIREBASE_RC_PATH, 'utf8'));
    const defaultProject = firebaseRc?.projects?.default;
    return defaultProject ? String(defaultProject) : null;
  } catch (_error) {
    return null;
  }
}

function getFirebaseCliRefreshToken() {
  if (!fs.existsSync(FIREBASE_CLI_CONFIG_PATH)) return null;

  try {
    const config = JSON.parse(fs.readFileSync(FIREBASE_CLI_CONFIG_PATH, 'utf8'));
    const refreshToken = config?.tokens?.refresh_token;
    return refreshToken ? String(refreshToken) : null;
  } catch (_error) {
    return null;
  }
}

function initAdmin() {
  if (admin.apps.length > 0) return;

  const serviceAccount = getServiceAccount();
  const projectId = resolveProjectId();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id
    });
    return;
  }

  if (projectId) {
    const refreshToken = getFirebaseCliRefreshToken();
    if (refreshToken && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const tempAdcPath = path.join(
        os.tmpdir(),
        `firebase-tools-adc-${projectId}.json`
      );
      fs.writeFileSync(
        tempAdcPath,
        JSON.stringify({
          type: 'authorized_user',
          client_id: FIREBASE_CLI_CLIENT_ID,
          client_secret: FIREBASE_CLI_CLIENT_SECRET,
          refresh_token: refreshToken
        }),
        'utf8'
      );
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempAdcPath;
    }
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...(projectId ? { projectId } : {})
  });
}

const nowIso = () => new Date().toISOString();

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const run = async () => {
  initAdmin();
  const db = admin.firestore();

  console.log(`Starting normalizeDeletedSeasonsFixtures migration (mode=${dryRun ? 'dry-run' : 'apply'})`);

  const [seasonsSnap, fixturesSnap, recycleBinSeasonsSnap] = await Promise.all([
    db.collection('seasons').get(),
    db.collection('fixtures').get(),
    db.collection('recycleBin').where('itemType', '==', 'season').get()
  ]);

  const activeSeasonIds = new Set(seasonsSnap.docs.map((doc) => doc.id));
  const deletedSeasonMap = new Map();

  recycleBinSeasonsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const seasonId = String(data?.originalId || data?.id || '').trim();
    if (!seasonId) return;
    if (!deletedSeasonMap.has(seasonId)) {
      deletedSeasonMap.set(seasonId, {
        ownerId: data.ownerId || null,
        ownerName: data.ownerName || null
      });
    }
  });

  const orphanFixtures = [];
  const perSeasonCounts = new Map();

  fixturesSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const seasonId = String(data?.seasonId || '').trim();
    if (!seasonId) return;
    if (activeSeasonIds.has(seasonId)) return;

    const reason = deletedSeasonMap.has(seasonId) ? 'season_in_recycle_bin' : 'season_missing';

    orphanFixtures.push({
      id: docSnap.id,
      data,
      seasonId,
      reason
    });

    const current = perSeasonCounts.get(seasonId) || 0;
    perSeasonCounts.set(seasonId, current + 1);
  });

  const reasonCounts = orphanFixtures.reduce((acc, fixture) => {
    acc[fixture.reason] = (acc[fixture.reason] || 0) + 1;
    return acc;
  }, {});

  console.log(`Active seasons: ${activeSeasonIds.size}`);
  console.log(`Deleted seasons in recycleBin: ${deletedSeasonMap.size}`);
  console.log(`Fixtures scanned: ${fixturesSnap.size}`);
  console.log(`Orphan fixtures found: ${orphanFixtures.length}`);
  console.log(`Reason counts: ${JSON.stringify(reasonCounts)}`);

  if (orphanFixtures.length > 0) {
    console.log('Affected season IDs and fixture counts:');
    Array.from(perSeasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([seasonId, count]) => {
        console.log(`- ${seasonId}: ${count}`);
      });
  }

  if (dryRun) {
    console.log('Dry-run complete. No changes applied.');
    return;
  }

  if (orphanFixtures.length === 0) {
    console.log('No orphan fixtures to normalize.');
    return;
  }

  const expiresAt = admin.firestore.Timestamp.fromMillis(
    Date.now() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  const chunks = chunkArray(orphanFixtures, MAX_FIXTURES_PER_BATCH);
  let movedCount = 0;
  let deletedCount = 0;
  let sequence = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const batch = db.batch();

    chunk.forEach((fixture) => {
      sequence += 1;
      const deletedSeasonMeta = deletedSeasonMap.get(fixture.seasonId) || {};
      const fixtureOwnerId = fixture.data.ownerId || deletedSeasonMeta.ownerId || null;
      const fixtureOwnerName = fixture.data.ownerName || deletedSeasonMeta.ownerName || 'Unknown';
      const recycleBinId = `fixtures_${fixture.id}_${Date.now()}_${sequence}`;

      const recyclePayload = {
        ...fixture.data,
        id: fixture.id,
        originalId: fixture.id,
        originalCollection: 'fixtures',
        itemType: 'fixture',
        ownerId: fixtureOwnerId,
        ownerName: fixtureOwnerName,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: 'migration:normalizeDeletedSeasonsFixtures',
        deletedByName: 'Migration Script',
        expiresAt,
        normalizationReason: fixture.reason,
        normalizationSource: 'normalizeDeletedSeasonsFixtures',
        normalizationRunAt: nowIso()
      };

      batch.set(db.collection('recycleBin').doc(recycleBinId), recyclePayload);
      batch.delete(db.collection('fixtures').doc(fixture.id));
    });

    await batch.commit();
    movedCount += chunk.length;
    deletedCount += chunk.length;
    console.log(`Committed batch ${i + 1}/${chunks.length} (${chunk.length} fixture(s))`);
  }

  console.log(`Normalization complete. Moved to recycleBin: ${movedCount}. Deleted from fixtures: ${deletedCount}.`);
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
