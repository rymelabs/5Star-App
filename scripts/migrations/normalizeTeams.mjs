#!/usr/bin/env node
/**
 * Migration: normalizeTeams
 * - Ensures each team document has `teamId` set to the Firestore document id
 * - Ensures each player in team.players has an `id` field
 * Usage:
 *   node scripts/migrations/normalizeTeams.mjs --dry
 *   node scripts/migrations/normalizeTeams.mjs --apply
 * Requirements:
 * - Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON with Firestore access
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry') || argv.length === 0;
const apply = argv.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage: --dry (preview) or --apply (make changes)');
  process.exit(1);
}

// Initialize admin SDK
try {
  admin.initializeApp();
} catch (err) {
  // if already initialized in a long-running process, ignore
}

const db = admin.firestore();

const ensurePlayerId = (p) => {
  if (p && p.id) return p;
  const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
  return { ...p, id };
};

const run = async () => {
  console.log(`Starting normalizeTeams migration (mode=${dryRun ? 'dry-run' : (apply ? 'apply' : 'unknown')})`);

  const teamsRef = db.collection('teams');
  const snapshot = await teamsRef.get();
  console.log(`Found ${snapshot.size} team documents`);

  let planned = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    const teamIdField = data.teamId || data.teamID || data.id || null;

    // If teamId isn't present or doesn't match doc.id, plan to set it
    if (!data.teamId || data.teamId !== doc.id) {
      updates.teamId = doc.id;
    }

    // Ensure players array exists and each player has id
    const players = Array.isArray(data.players) ? data.players : [];
    const normalizedPlayers = players.map(p => ensurePlayerId(p));

    // If any player was missing an id, plan to update players
    const playersChanged = normalizedPlayers.some((p, idx) => p !== players[idx] || !players[idx]?.id);
    if (playersChanged) updates.players = normalizedPlayers;

    if (Object.keys(updates).length > 0) {
      planned.push({ docId: doc.id, updates });
    }
  }

  console.log('Planned updates count:', planned.length);
  for (const p of planned) {
    console.log('->', p.docId, JSON.stringify(p.updates));
  }

  if (apply) {
    console.log('Applying changes...');
    const batch = db.batch();
    for (const p of planned) {
      const ref = teamsRef.doc(p.docId);
      batch.update(ref, p.updates);
    }
    await batch.commit();
    console.log('Migration applied successfully.');
  } else {
    console.log('Dry-run complete. No changes applied. Re-run with --apply to apply updates.');
  }
};

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
