import admin from 'firebase-admin';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('./scripts/serviceAccountKey.json');
const FIREBASE_CLI_CONFIG_PATH = path.resolve(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.config/configstore/firebase-tools.json'
);
const FIREBASE_RC_PATH = path.resolve('./.firebaserc');
const FIREBASE_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const DEFAULT_REGULATION_MINUTES = 30;
const AUTO_FULL_TIME_MINUTE = 90;
const LEGACY_DEFAULT_REGULATION_MINUTES = 90;
const MATCH_BREAK_RATIO = 15 / 90;
const GOAL_PUNCHLINE_VARIANT_COUNT = 3600;
const KICKOFF_PUNCHLINE_VARIANT_COUNT = 2400;
const SECOND_HALF_PUNCHLINE_VARIANT_COUNT = 2400;

const LEGACY_STATUS_MAP = {
  upcoming: 'scheduled',
  playing: 'live',
  finished: 'completed'
};
const RUNTIME_STATS_KEYS = [
  'possession',
  'shots',
  'shotsOnTarget',
  'corners',
  'fouls',
  'yellowCards',
  'redCards'
];

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    return JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  }
  return null;
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

function resolveProjectId() {
  const envProjectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
  if (envProjectId) return envProjectId;

  if (!fs.existsSync(FIREBASE_RC_PATH)) return null;
  try {
    const firebaseRc = JSON.parse(fs.readFileSync(FIREBASE_RC_PATH, 'utf8'));
    const defaultProject = firebaseRc?.projects?.default;
    return defaultProject ? String(defaultProject) : null;
  } catch (_error) {
    return null;
  }
}

function toCanonicalStatus(status) {
  if (!status) return 'scheduled';
  const normalized = String(status).toLowerCase();
  return LEGACY_STATUS_MAP[normalized] || normalized;
}

function toNonNegativeInt(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function toClampedPercent(value, fallback = null) {
  const parsed = toNonNegativeInt(value, fallback);
  if (parsed === null) return fallback;
  return Math.min(100, parsed);
}

function hasFixtureStatsInput(stats) {
  if (!stats || typeof stats !== 'object') return false;
  return RUNTIME_STATS_KEYS.some((key) => {
    const homeValue = stats?.[key]?.home;
    const awayValue = stats?.[key]?.away;
    return homeValue !== '' && homeValue !== null && homeValue !== undefined ||
      awayValue !== '' && awayValue !== null && awayValue !== undefined;
  });
}

function normalizeFixtureStats({ stats, status, homeScore, awayScore }) {
  const canonicalStatus = toCanonicalStatus(status || 'scheduled');
  const isLiveOrCompleted = canonicalStatus === 'live' || canonicalStatus === 'completed';
  const safeHomeGoals = toNonNegativeInt(homeScore, 0);
  const safeAwayGoals = toNonNegativeInt(awayScore, 0);
  const shouldAutofill = isLiveOrCompleted || safeHomeGoals > 0 || safeAwayGoals > 0;
  const hasInput = hasFixtureStatsInput(stats);

  if (!hasInput && !shouldAutofill) {
    return null;
  }

  const payload = {};
  const possessionHome = toClampedPercent(stats?.possession?.home, null);
  const possessionAway = toClampedPercent(stats?.possession?.away, null);
  if (possessionHome !== null || possessionAway !== null || isLiveOrCompleted) {
    let homeValue = possessionHome;
    let awayValue = possessionAway;

    if (homeValue === null && awayValue === null) {
      homeValue = 50;
      awayValue = 50;
    } else if (homeValue !== null && awayValue === null) {
      awayValue = Math.max(0, 100 - homeValue);
    } else if (homeValue === null && awayValue !== null) {
      homeValue = Math.max(0, 100 - awayValue);
    } else {
      const total = homeValue + awayValue;
      if (total !== 100) {
        awayValue = Math.max(0, 100 - homeValue);
      }
    }

    payload.possession = {
      home: homeValue,
      away: awayValue
    };
  }

  RUNTIME_STATS_KEYS
    .filter((key) => key !== 'possession')
    .forEach((key) => {
      let homeValue = toNonNegativeInt(stats?.[key]?.home, null);
      let awayValue = toNonNegativeInt(stats?.[key]?.away, null);

      if (key === 'shots' || key === 'shotsOnTarget') {
        if (homeValue === null) homeValue = safeHomeGoals;
        if (awayValue === null) awayValue = safeAwayGoals;
      } else if (isLiveOrCompleted) {
        if (homeValue === null) homeValue = 0;
        if (awayValue === null) awayValue = 0;
      }

      if (homeValue === null && awayValue === null) return;

      payload[key] = {
        home: Math.max(0, homeValue ?? 0),
        away: Math.max(0, awayValue ?? 0)
      };
    });

  return Object.keys(payload).length > 0 ? payload : null;
}

function toMillis(value) {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  if (value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (value && typeof value.seconds === 'number') {
    return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1e6);
  }
  return null;
}

function resolveTiming(data) {
  const source = data?.matchTiming?.source ||
    (Number.isInteger(Number(data?.regulationMinutes)) ? 'fixture' : 'default');
  const raw = Number(data?.matchTiming?.regulationMinutes ?? data?.regulationMinutes ?? DEFAULT_REGULATION_MINUTES);
  const validRegulation = Number.isInteger(raw) && raw >= 30 && raw <= 240 && raw % 2 === 0
    ? raw
    : DEFAULT_REGULATION_MINUTES;
  const hasFixtureOverride = Number.isInteger(Number(data?.regulationMinutes));
  const regulationMinutes = source === 'default' &&
    !hasFixtureOverride &&
    validRegulation === LEGACY_DEFAULT_REGULATION_MINUTES
    ? DEFAULT_REGULATION_MINUTES
    : validRegulation;

  return {
    regulationMinutes,
    halfMinutes: regulationMinutes / 2,
    breakMinutes: Math.max(1, Math.round(regulationMinutes * MATCH_BREAK_RATIO)),
    breakRatio: MATCH_BREAK_RATIO,
    source
  };
}

function getAutoFullTimeMinute(timing) {
  return Math.max(Number(timing?.regulationMinutes || DEFAULT_REGULATION_MINUTES), AUTO_FULL_TIME_MINUTE);
}

function inferPhaseStartedAtMs({ phase, currentMinute, timing, kickoffMs, nowMs, existingPhaseStartedAt }) {
  const existingMs = toMillis(existingPhaseStartedAt);
  if (existingMs != null && existingMs <= nowMs) {
    return existingMs;
  }

  if (phase === 'first_half') {
    if (kickoffMs != null && kickoffMs <= nowMs) {
      return kickoffMs;
    }
    const elapsed = Math.max(0, Math.min(timing.halfMinutes, currentMinute));
    return nowMs - (elapsed * 60000);
  }

  if (phase === 'second_half') {
    const secondHalfElapsed = Math.max(0, Math.min(timing.halfMinutes, currentMinute - timing.halfMinutes));
    return nowMs - (secondHalfElapsed * 60000);
  }

  if (phase === 'halftime' && kickoffMs != null) {
    return Math.min(nowMs, kickoffMs + (timing.halfMinutes * 60000));
  }

  return nowMs;
}

function inferLiveClock(data, timing, nowIso) {
  const status = toCanonicalStatus(data.status);
  const autoFullTimeMinute = getAutoFullTimeMinute(timing);
  const nowMs = Date.parse(nowIso);
  const minute = Number(data.minute ?? data.liveClock?.currentMinute ?? 0);
  const kickoffMs = toMillis(data.dateTime || data.date);
  const existing = data.liveClock;

  if (existing) {
    const phase = existing.phase || (status === 'completed' ? 'full_time' : status === 'live' ? 'first_half' : 'pre_match');
    const currentMinuteRaw = Number(existing.currentMinute ?? minute ?? 0);
    const isManualFullTime = String(existing.lastTransitionKey || '').startsWith('manual_full_time');
    const currentMinute = status === 'completed' && Number.isFinite(currentMinuteRaw) && currentMinuteRaw > 0
      ? (isManualFullTime ? currentMinuteRaw : Math.max(currentMinuteRaw, autoFullTimeMinute))
      : currentMinuteRaw;
    const phaseStartedAtMs = inferPhaseStartedAtMs({
      phase,
      currentMinute,
      timing,
      kickoffMs,
      nowMs,
      existingPhaseStartedAt: existing.phaseStartedAt
    });

    return {
      phase,
      phaseStartedAt: new Date(phaseStartedAtMs).toISOString(),
      currentMinute,
      adminPause: Boolean(existing.adminPause),
      holdSecondHalf: Boolean(existing.holdSecondHalf),
      lastTransitionKey: existing.lastTransitionKey || ''
    };
  }

  if (status === 'completed') {
    const isManualFullTime = String(data?.liveClock?.lastTransitionKey || '').startsWith('manual_full_time');
    const completedMinute = Number.isFinite(minute) && minute > 0
      ? (isManualFullTime ? minute : Math.max(minute, autoFullTimeMinute))
      : autoFullTimeMinute;
    return {
      phase: 'full_time',
      phaseStartedAt: nowIso,
      currentMinute: completedMinute,
      adminPause: false,
      holdSecondHalf: false,
      lastTransitionKey: `backfill:full_time:${completedMinute}`
    };
  }

  if (status === 'live') {
    if (minute < timing.halfMinutes) {
      const phaseStartedAtMs = inferPhaseStartedAtMs({
        phase: 'first_half',
        currentMinute: Math.max(0, minute),
        timing,
        kickoffMs,
        nowMs
      });
      return {
        phase: 'first_half',
        phaseStartedAt: new Date(phaseStartedAtMs).toISOString(),
        currentMinute: Math.max(0, minute),
        adminPause: false,
        holdSecondHalf: false,
        lastTransitionKey: ''
      };
    }

    if (minute === timing.halfMinutes) {
      const phaseStartedAtMs = inferPhaseStartedAtMs({
        phase: 'halftime',
        currentMinute: timing.halfMinutes,
        timing,
        kickoffMs,
        nowMs
      });
      return {
        phase: 'halftime',
        phaseStartedAt: new Date(phaseStartedAtMs).toISOString(),
        currentMinute: timing.halfMinutes,
        adminPause: false,
        holdSecondHalf: false,
        lastTransitionKey: ''
      };
    }

    if (minute < autoFullTimeMinute) {
      const phaseStartedAtMs = inferPhaseStartedAtMs({
        phase: 'second_half',
        currentMinute: minute,
        timing,
        kickoffMs,
        nowMs
      });
      return {
        phase: 'second_half',
        phaseStartedAt: new Date(phaseStartedAtMs).toISOString(),
        currentMinute: minute,
        adminPause: false,
        holdSecondHalf: false,
        lastTransitionKey: ''
      };
    }

    return {
      phase: 'full_time',
      phaseStartedAt: nowIso,
      currentMinute: autoFullTimeMinute,
      adminPause: false,
      holdSecondHalf: false,
      lastTransitionKey: `backfill:full_time:${autoFullTimeMinute}`
    };
  }

  return {
    phase: 'pre_match',
    phaseStartedAt: kickoffMs != null ? new Date(kickoffMs).toISOString() : nowIso,
    currentMinute: 0,
    adminPause: false,
    holdSecondHalf: false,
    lastTransitionKey: ''
  };
}

function hashSeed(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getNarrationTemplateKey(phase, homeScore, awayScore) {
  if (phase === 'kickoff') return 'match.narration.kickoff.dynamic';
  if (phase === 'second_half_start') return 'match.narration.second_half.dynamic';

  if (phase === 'halftime') {
    if (homeScore === 0 && awayScore === 0) return 'match.narration.ht.goalless';
    if (homeScore === awayScore) return 'match.narration.ht.scoringDraw';
    return homeScore > awayScore ? 'match.narration.ht.homeLead' : 'match.narration.ht.awayLead';
  }
  if (homeScore === awayScore) return 'match.narration.ft.draw';
  return homeScore > awayScore ? 'match.narration.ft.homeWin' : 'match.narration.ft.awayWin';
}

function isScoreAwareNarrationPhase(phase) {
  return phase === 'halftime' || phase === 'full_time';
}

function getNarrationVariantCount(phase) {
  if (phase === 'kickoff') return KICKOFF_PUNCHLINE_VARIANT_COUNT;
  if (phase === 'second_half_start') return SECOND_HALF_PUNCHLINE_VARIANT_COUNT;
  return 20;
}

function buildSystemCommentaryEvent({
  fixtureId,
  phase,
  minute,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore
}) {
  const templateKey = getNarrationTemplateKey(phase, homeScore, awayScore);
  const scoreAware = isScoreAwareNarrationPhase(phase);
  const variantSeed = scoreAware
    ? `${fixtureId}:${phase}:${homeScore}-${awayScore}`
    : `${fixtureId}:${phase}`;
  const variantIndex = hashSeed(variantSeed) % getNarrationVariantCount(phase);
  const scoreSuffix = scoreAware ? `-${homeScore}-${awayScore}` : '';

  return {
    id: `system-${phase}-${fixtureId}${scoreSuffix}`,
    type: 'system_commentary',
    isSystem: true,
    templateKey,
    templateParams: {
      homeTeam: homeTeamName || 'Home',
      awayTeam: awayTeamName || 'Away',
      minute,
      variantIndex,
      ...(scoreAware ? {
        homeScore,
        awayScore
      } : {})
    },
    transitionPhase: phase,
    minute,
    createdAt: new Date().toISOString()
  };
}

function findTransitionEventIndex(events, phase) {
  if (!Array.isArray(events)) return -1;
  return events.findIndex((event) =>
    event &&
    event.isSystem &&
    event.type === 'system_commentary' &&
    event.transitionPhase === phase
  );
}

function normalizeSystemCommentaryEvents({
  events,
  fixtureId,
  status,
  liveClock,
  timing,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore
}) {
  const autoFullTimeMinute = getAutoFullTimeMinute(timing);
  const isManualFullTime = String(liveClock?.lastTransitionKey || '').startsWith('manual_full_time');
  const normalized = Array.isArray(events) ? [...events] : [];
  let changed = false;

  const normalizePhaseMinute = (phase, minute) => {
    const index = findTransitionEventIndex(normalized, phase);
    if (index === -1) return;
    const existing = normalized[index];
    const next = {
      ...existing,
      minute,
      transitionPhase: phase,
      templateParams: {
        ...(existing?.templateParams || {}),
        minute
      }
    };

    if (JSON.stringify(existing) !== JSON.stringify(next)) {
      normalized[index] = next;
      changed = true;
    }
  };

  const upsertPhase = (phase, minute) => {
    const target = buildSystemCommentaryEvent({
      fixtureId,
      phase,
      minute,
      homeTeamName,
      awayTeamName,
      homeScore,
      awayScore
    });
    const index = findTransitionEventIndex(normalized, phase);

    if (index === -1) {
      normalized.push(target);
      changed = true;
      return;
    }

    const existing = normalized[index];
    const scoreAware = isScoreAwareNarrationPhase(phase);
    const merged = {
      ...existing,
      id: existing?.id || target.id,
      type: 'system_commentary',
      isSystem: true,
      templateKey: target.templateKey,
      templateParams: {
        ...(existing?.templateParams || {}),
        ...target.templateParams,
        minute,
        ...(scoreAware ? { homeScore, awayScore } : {})
      },
      transitionPhase: phase,
      minute,
      createdAt: existing?.createdAt || target.createdAt
    };

    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      normalized[index] = merged;
      changed = true;
    }
  };

  const resolvedMinute = Number(liveClock?.currentMinute ?? 0);
  const secondHalfHasStarted = liveClock?.phase === 'second_half' ||
    liveClock?.phase === 'full_time' ||
    ((status === 'live' || status === 'completed') && resolvedMinute > timing.halfMinutes);

  if (status === 'live' || status === 'completed') {
    upsertPhase('kickoff', 0);
  }
  if (secondHalfHasStarted) {
    upsertPhase('second_half_start', timing.halfMinutes);
  }

  normalizePhaseMinute('kickoff', 0);
  if (secondHalfHasStarted) {
    normalizePhaseMinute('second_half_start', timing.halfMinutes);
  }
  normalizePhaseMinute('halftime', timing.halfMinutes);
  normalizePhaseMinute('full_time', autoFullTimeMinute);

  if (status === 'live' && liveClock?.phase === 'halftime') {
    upsertPhase('halftime', timing.halfMinutes);
  }

  if (status === 'completed' || liveClock?.phase === 'full_time') {
    const completedMinuteRaw = Number(liveClock?.currentMinute ?? 0);
    const completedMinute = Number.isFinite(completedMinuteRaw) && completedMinuteRaw > 0
      ? (isManualFullTime ? completedMinuteRaw : Math.max(completedMinuteRaw, autoFullTimeMinute))
      : autoFullTimeMinute;
    upsertPhase('full_time', completedMinute);
  }

  return { events: normalized, changed };
}

function resolveGoalEventSide(goalEvent, fixture) {
  if (!goalEvent) return null;

  const eventTeam = goalEvent.teamId || goalEvent.team || null;
  if (eventTeam === 'home' || eventTeam === 'away') {
    return eventTeam;
  }

  const eventTeamString = eventTeam != null ? String(eventTeam) : '';
  const homeCandidates = [
    fixture.homeTeamId,
    fixture.homeTeam?.id,
    fixture.homeTeam?.teamId,
    fixture.homeTeam?.name
  ].filter(Boolean).map((value) => String(value));
  const awayCandidates = [
    fixture.awayTeamId,
    fixture.awayTeam?.id,
    fixture.awayTeam?.teamId,
    fixture.awayTeam?.name
  ].filter(Boolean).map((value) => String(value));

  if (homeCandidates.includes(eventTeamString)) return 'home';
  if (awayCandidates.includes(eventTeamString)) return 'away';
  return null;
}

function resolveGoalScorerName(goalEvent, fixture, side) {
  if (goalEvent?.playerName) return goalEvent.playerName;
  if (!goalEvent?.playerId) return 'The scorer';

  const relevantTeam = side === 'home'
    ? fixture.homeTeam
    : side === 'away'
      ? fixture.awayTeam
      : null;
  const players = Array.isArray(relevantTeam?.players) ? relevantTeam.players : [];
  const found = players.find((player) => String(player?.id) === String(goalEvent.playerId));
  return found?.name || 'The scorer';
}

function buildGoalCommentaryEvent({
  fixtureId,
  goalEvent,
  goalEventId,
  side,
  teamName,
  scorerName,
  minute,
  homeScore,
  awayScore
}) {
  const variantIndex = hashSeed(`${fixtureId}:goal:${goalEventId}`) % GOAL_PUNCHLINE_VARIANT_COUNT;
  return {
    id: `system-goal-${fixtureId}-${goalEventId}`,
    type: 'system_commentary',
    isSystem: true,
    templateKey: 'match.narration.goal.dynamic',
    templateParams: {
      teamName,
      scorerName,
      homeScore,
      awayScore,
      minute,
      variantIndex
    },
    transitionPhase: 'goal',
    goalEventId,
    goalSide: side,
    minute,
    createdAt: goalEvent?.createdAt || goalEvent?.timestamp || new Date().toISOString()
  };
}

function syncGoalCommentaryEvents({ events, fixture, fixtureId }) {
  if (!Array.isArray(events)) return { events: [], changed: false };
  const normalized = [...events];

  const realGoals = normalized
    .filter((event) => event && !event.isSystem && (event.type === 'goal' || event.type === 'penalty_scored'))
    .map((event, index) => ({ event, index }));

  if (realGoals.length === 0) {
    const filtered = normalized.filter((event) =>
      !(event?.isSystem && event.type === 'system_commentary' && event.transitionPhase === 'goal')
    );
    return { events: filtered, changed: filtered.length !== normalized.length };
  }

  const sortedGoals = [...realGoals].sort((a, b) => {
    const minuteDiff = Number(a.event?.minute || 0) - Number(b.event?.minute || 0);
    if (minuteDiff !== 0) return minuteDiff;
    const aTime = toMillis(a.event?.timestamp) || toMillis(a.event?.createdAt) || 0;
    const bTime = toMillis(b.event?.timestamp) || toMillis(b.event?.createdAt) || 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.index - b.index;
  });

  let changed = false;
  let runningHome = 0;
  let runningAway = 0;
  const validGoalEventIds = new Set();

  for (const goalEntry of sortedGoals) {
    const goalEvent = goalEntry.event;
    const side = resolveGoalEventSide(goalEvent, fixture);
    if (side === 'home') runningHome += 1;
    if (side === 'away') runningAway += 1;

    const goalEventId = String(
      goalEvent?.id ||
      `${Number(goalEvent?.minute || 0)}-${toMillis(goalEvent?.timestamp) || toMillis(goalEvent?.createdAt) || goalEntry.index}-${side || 'unknown'}`
    );
    validGoalEventIds.add(goalEventId);

    const teamName = side === 'home'
      ? (fixture.homeTeam?.name || 'Home')
      : side === 'away'
        ? (fixture.awayTeam?.name || 'Away')
        : (goalEvent?.teamName || 'A team');
    const scorerName = resolveGoalScorerName(goalEvent, fixture, side);
    const minute = Number(goalEvent?.minute || 0);
    const commentary = buildGoalCommentaryEvent({
      fixtureId,
      goalEvent,
      goalEventId,
      side,
      teamName,
      scorerName,
      minute,
      homeScore: runningHome,
      awayScore: runningAway
    });

    const existingIndex = normalized.findIndex((event) =>
      event &&
      event.isSystem &&
      event.type === 'system_commentary' &&
      event.transitionPhase === 'goal' &&
      String(event.goalEventId || '') === goalEventId
    );

    if (existingIndex === -1) {
      normalized.push(commentary);
      changed = true;
      continue;
    }

    const existing = normalized[existingIndex];
    const merged = {
      ...existing,
      ...commentary,
      id: existing?.id || commentary.id,
      createdAt: existing?.createdAt || commentary.createdAt
    };
    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      normalized[existingIndex] = merged;
      changed = true;
    }
  }

  const beforeCleanupLength = normalized.length;
  const filtered = normalized.filter((event) => {
    if (!(event?.isSystem && event.type === 'system_commentary' && event.transitionPhase === 'goal')) {
      return true;
    }
    return validGoalEventIds.has(String(event.goalEventId || ''));
  });
  if (filtered.length !== beforeCleanupLength) {
    changed = true;
  }

  return { events: filtered, changed };
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');

async function main() {
  const serviceAccount = getServiceAccount();
  const projectId = resolveProjectId();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(projectId ? { projectId } : {})
    });
  } else {
    const refreshToken = getFirebaseCliRefreshToken();
    if (refreshToken && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const tempAdcPath = path.join(
        os.tmpdir(),
        `firebase-tools-adc-${projectId || 'default'}.json`
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

    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...(projectId ? { projectId } : {})
    });
  }
  const db = admin.firestore();

  const snapshot = await db.collection('fixtures').get();
  let affected = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const timing = resolveTiming(data);
    const autoFullTimeMinute = getAutoFullTimeMinute(timing);
    const canonicalStatus = toCanonicalStatus(data.status);
    const nowIso = new Date().toISOString();
    const liveClock = inferLiveClock(data, timing, nowIso);
    const homeScore = Number(data.homeScore ?? 0);
    const awayScore = Number(data.awayScore ?? 0);
    const normalizedEvents = normalizeSystemCommentaryEvents({
      events: data.events,
      fixtureId: doc.id,
      status: canonicalStatus,
      liveClock,
      timing,
      homeTeamName: data?.homeTeam?.name || data?.homeTeamName || null,
      awayTeamName: data?.awayTeam?.name || data?.awayTeamName || null,
      homeScore,
      awayScore
    });
    const goalSyncedEvents = syncGoalCommentaryEvents({
      events: normalizedEvents.events,
      fixture: data,
      fixtureId: doc.id
    });
    const normalizedStats = normalizeFixtureStats({
      stats: data.stats,
      status: canonicalStatus,
      homeScore,
      awayScore
    });
    const minute = canonicalStatus === 'completed'
      ? Number(liveClock.currentMinute ?? data.minute ?? autoFullTimeMinute)
      : canonicalStatus === 'live'
        ? Number(liveClock.currentMinute ?? data.minute ?? 0)
        : Number(data.minute ?? 0);

    const update = {
      status: canonicalStatus,
      minute,
      matchTiming: timing,
      liveClock,
      events: goalSyncedEvents.events,
      stats: normalizedStats
    };

    const changed =
      data.status !== update.status ||
      JSON.stringify(data.matchTiming || null) !== JSON.stringify(update.matchTiming) ||
      JSON.stringify(data.liveClock || null) !== JSON.stringify(update.liveClock) ||
      Number(data.minute || 0) !== Number(update.minute || 0) ||
      JSON.stringify(data.stats || null) !== JSON.stringify(update.stats || null) ||
      normalizedEvents.changed ||
      goalSyncedEvents.changed;

    if (!changed) continue;

    affected += 1;
    if (!dryRun) {
      await doc.ref.update(update);
    }
  }

  console.log(`${dryRun ? 'Dry run' : 'Applied'}: ${affected} fixture(s) require updates.`);

  // Close Firestore gRPC channels so the process exits after migrations complete.
  await admin.app().delete();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
