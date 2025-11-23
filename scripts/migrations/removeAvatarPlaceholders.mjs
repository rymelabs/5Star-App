#!/usr/bin/env node
/**
 * Migration: removeAvatarPlaceholders
 * -----------------------------------
 * Strips auto-generated ui-avatars.com logos from existing team documents so the
 * in-app avatar system can render the new initials/profile-photo experience.
 *
 * Usage:
 *   node scripts/migrations/removeAvatarPlaceholders.mjs --dry   (default)
 *   node scripts/migrations/removeAvatarPlaceholders.mjs --apply
 *
 * Requirements:
 * - Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON with Firestore access
 */

import admin from 'firebase-admin';

const args = process.argv.slice(2);
const dryRun = args.length === 0 || args.includes('--dry');
const apply = args.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage: --dry (preview) or --apply (make changes)');
  process.exit(1);
}

try {
  admin.initializeApp();
} catch (err) {
  // Ignore "already initialized" errors when scripts share the same process
}

const db = admin.firestore();

const isPlaceholderLogo = (logo) => {
  if (typeof logo !== 'string') return false;
  const normalized = logo.trim().toLowerCase();
  if (!normalized) return false;
  return normalized.includes('ui-avatars.com/api');
};

const getCleanLogoValue = (logo) => {
  // Setting to empty string keeps the field consistent for UI bindings
  if (typeof logo === 'string' && logo.trim()) {
    return '';
  }
  return ''; // fallback
};

const run = async () => {
  console.log(`Starting removeAvatarPlaceholders (mode=${dryRun ? 'dry-run' : 'apply'})`);

  const teamsRef = db.collection('teams');
  const snapshot = await teamsRef.get();
  console.log(`Fetched ${snapshot.size} team documents`);

  const pending = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const logo = data.logo ?? data.teamLogo ?? null;

    if (isPlaceholderLogo(logo)) {
      pending.push({
        docId: doc.id,
        previous: logo,
        updates: { logo: getCleanLogoValue(logo) }
      });
    }
  });

  if (pending.length === 0) {
    console.log('No placeholder logos detected. Nothing to do.');
    return;
  }

  console.log(`Planned updates: ${pending.length}`);
  pending.slice(0, 20).forEach((item, idx) => {
    console.log(`#${idx + 1}: ${item.docId} => removing ${item.previous}`);
  });
  if (pending.length > 20) {
    console.log('...');
  }

  if (dryRun) {
    console.log('Dry-run complete. Re-run with --apply to commit changes.');
    return;
  }

  console.log('Applying updates...');
  const BATCH_LIMIT = 400;
  for (let i = 0; i < pending.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const slice = pending.slice(i, i + BATCH_LIMIT);
    slice.forEach((item) => {
      const ref = teamsRef.doc(item.docId);
      batch.update(ref, item.updates);
    });
    await batch.commit();
    console.log(`Committed batch ${(i / BATCH_LIMIT) + 1} containing ${slice.length} docs`);
  }

  console.log('Placeholder logos removed successfully.');
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
