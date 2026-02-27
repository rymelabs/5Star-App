const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Configure email transporter (using Gmail as example)
// NOTE: For production, use SendGrid, AWS SES, or similar service
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Set in Firebase Functions config
    pass: process.env.EMAIL_PASSWORD, // Set in Firebase Functions config
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user notification settings
 */
async function getUserSettings(userId) {
  try {
    const settingsDoc = await db.collection("userSettings").doc(userId).get();
    if (settingsDoc.exists) {
      return settingsDoc.data();
    }
    // Return default settings if none exist
    return {
      teamFollowing: true,
      upcomingMatches: true,
      liveMatches: true,
      matchResults: true,
      teamNews: true,
      emailNotifications: true,
      pushNotifications: true,
    };
  } catch (error) {
    logger.error("Error getting user settings:", error);
    return null;
  }
}

/**
 * Get FCM tokens for a user
 */
async function getUserFCMTokens(userId) {
  try {
    const tokensSnapshot = await db.collection("fcmTokens")
        .where("userId", "==", userId)
        .get();

    return tokensSnapshot.docs.map((doc) => doc.data().token);
  } catch (error) {
    logger.error("Error getting FCM tokens:", error);
    return [];
  }
}

/**
 * Get user email
 */
async function getUserEmail(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    return userDoc.exists ? userDoc.data().email : null;
  } catch (error) {
    logger.error("Error getting user email:", error);
    return null;
  }
}

/**
 * Get team followers
 */
async function getTeamFollowers(teamId) {
  try {
    const teamInfo = await getTeamInfo(teamId);
    return teamInfo.followers;
  } catch (error) {
    logger.error("Error getting team followers:", error);
    return [];
  }
}

/**
 * Send push notification
 */
async function sendPushNotification(userId, notification) {
  try {
    const tokens = await getUserFCMTokens(userId);

    if (tokens.length === 0) {
      logger.info(`No FCM tokens for user ${userId}`);
      return {success: false, reason: "no_tokens"};
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.icon,
      },
      data: notification.data || {},
      tokens: tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    logger.info(`Push notification sent to user ${userId}:`, response);

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          tokensToRemove.push(tokens[idx]);
        }
      });

      // Remove invalid tokens from Firestore
      for (const token of tokensToRemove) {
        await db.collection("fcmTokens").doc(token).delete();
      }
    }

    return {success: true, response};
  } catch (error) {
    logger.error("Error sending push notification:", error);
    return {success: false, error: error.message};
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(userId, notification) {
  try {
    const email = await getUserEmail(userId);

    if (!email) {
      logger.info(`No email for user ${userId}`);
      return {success: false, reason: "no_email"};
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || "Fivescores <noreply@fivescores.com>",
      to: email,
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <img src="${notification.icon || "https://fivescores.com/Fivescores logo.svg"}" alt="Fivescores" style="width: 60px; height: 60px;">
            <h1 style="color: white; margin: 10px 0;">Fivescores</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">${notification.title}</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${notification.body}</p>
            ${notification.actionUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${notification.actionUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
              </div>
            ` : ""}
          </div>
          <div style="background: #e5e7eb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>You're receiving this because you follow teams on Fivescores.</p>
            <p>Manage your notification preferences in the app settings.</p>
          </div>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    logger.info(`Email sent to user ${userId} at ${email}`);
    return {success: true};
  } catch (error) {
    logger.error("Error sending email:", error);
    return {success: false, error: error.message};
  }
}

function extractTeamId(teamRef) {
  if (!teamRef) return null;
  if (typeof teamRef === "string") return teamRef;
  if (typeof teamRef === "object") {
    return teamRef.id || teamRef.teamId || teamRef._id || null;
  }
  return null;
}

function buildFallbackTeamName(teamId, fallbackName) {
  if (fallbackName) return fallbackName;
  if (!teamId) return "Unknown Team";
  return `Team ${teamId.substring(0, 6)}`;
}

async function getTeamInfo(teamRef, fallbackName = "Unknown Team") {
  const teamId = extractTeamId(teamRef);
  if (!teamId) {
    return {
      id: null,
      name: fallbackName || "Unknown Team",
      logo: "/Fivescores logo.svg",
      followers: [],
    };
  }

  try {
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (teamDoc.exists) {
      const data = teamDoc.data();
      return {
        id: teamId,
        name: data.name || fallbackName || buildFallbackTeamName(teamId),
        logo: data.logo || "/Fivescores logo.svg",
        followers: data.followers || [],
      };
    }
  } catch (error) {
    logger.error("Error getting team info:", error);
  }

  return {
    id: teamId,
    name: buildFallbackTeamName(teamId, fallbackName),
    logo: "/Fivescores logo.svg",
    followers: [],
  };
}

async function resolveFixtureTeams(fixture) {
  const homeTeamSource = fixture.homeTeam || fixture.homeTeamId;
  const awayTeamSource = fixture.awayTeam || fixture.awayTeamId;

  const [homeTeam, awayTeam] = await Promise.all([
    getTeamInfo(homeTeamSource, fixture.homeTeam?.name),
    getTeamInfo(awayTeamSource, fixture.awayTeam?.name),
  ]);

  return {homeTeam, awayTeam};
}

function getDateFromField(value) {
  if (!value) return null;
  if (value.toDate && typeof value.toDate === "function") {
    try {
      return value.toDate();
    } catch (error) {
      logger.error("Error converting Timestamp to Date:", error);
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatFixtureDateLabel(fixture) {
  const kickoff = getDateFromField(fixture.dateTime || fixture.date);
  if (!kickoff) return "Soon";
  return kickoff.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DEFAULT_REGULATION_MINUTES = 30;
const AUTO_FULL_TIME_MINUTE = 90;
const LEGACY_DEFAULT_REGULATION_MINUTES = 90;
const MATCH_BREAK_RATIO = 15 / 90;
const GOAL_PUNCHLINE_VARIANT_COUNT = 3600;
const GOAL_OVERTURNED_VARIANT_COUNT = 24;
const KICKOFF_PUNCHLINE_VARIANT_COUNT = 2400;
const SECOND_HALF_PUNCHLINE_VARIANT_COUNT = 2400;
const RUNTIME_STATS_KEYS = ["possession", "shots", "shotsOnTarget", "corners", "fouls", "yellowCards", "redCards"];
const LEGACY_STATUS_MAP = {
  upcoming: "scheduled",
  playing: "live",
  finished: "completed",
};

function toCanonicalFixtureStatus(status) {
  if (!status) return "scheduled";
  const normalized = String(status).toLowerCase();
  return LEGACY_STATUS_MAP[normalized] || normalized;
}

function toMillis(value) {
  if (!value) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  if (value && typeof value.seconds === "number") {
    return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1e6);
  }
  return null;
}

function resolveTimingFromFixture(fixture = {}) {
  const source = fixture?.matchTiming?.source ||
    (Number.isInteger(Number(fixture?.regulationMinutes)) ? "fixture" : "default");
  const regulation = Number(
    fixture?.matchTiming?.regulationMinutes ??
    fixture?.regulationMinutes ??
    DEFAULT_REGULATION_MINUTES
  );
  const validRegulation = Number.isInteger(regulation) && regulation >= 30 && regulation <= 240 && regulation % 2 === 0
    ? regulation
    : DEFAULT_REGULATION_MINUTES;
  const hasFixtureOverride = Number.isInteger(Number(fixture?.regulationMinutes));
  const safeRegulation = source === "default" &&
    !hasFixtureOverride &&
    validRegulation === LEGACY_DEFAULT_REGULATION_MINUTES
    ? DEFAULT_REGULATION_MINUTES
    : validRegulation;
  return {
    regulationMinutes: safeRegulation,
    halfMinutes: safeRegulation / 2,
    breakMinutes: Math.max(1, Math.round(safeRegulation * MATCH_BREAK_RATIO)),
    breakRatio: MATCH_BREAK_RATIO,
    source,
  };
}

function toNonNegativeInt(value, fallback = null) {
  if (value === "" || value === null || value === undefined) return fallback;
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
  if (!stats || typeof stats !== "object") return false;
  return RUNTIME_STATS_KEYS.some((key) => {
    const homeValue = stats?.[key]?.home;
    const awayValue = stats?.[key]?.away;
    return homeValue !== "" && homeValue !== null && homeValue !== undefined ||
      awayValue !== "" && awayValue !== null && awayValue !== undefined;
  });
}

function normalizeFixtureStats({stats, status, homeScore, awayScore}) {
  const canonicalStatus = toCanonicalFixtureStatus(status || "scheduled");
  const isLiveOrCompleted = canonicalStatus === "live" || canonicalStatus === "completed";
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
      away: awayValue,
    };
  }

  RUNTIME_STATS_KEYS
    .filter((key) => key !== "possession")
    .forEach((key) => {
      let homeValue = toNonNegativeInt(stats?.[key]?.home, null);
      let awayValue = toNonNegativeInt(stats?.[key]?.away, null);

      if (key === "shots" || key === "shotsOnTarget") {
        if (homeValue === null) homeValue = safeHomeGoals;
        if (awayValue === null) awayValue = safeAwayGoals;
      } else if (isLiveOrCompleted) {
        if (homeValue === null) homeValue = 0;
        if (awayValue === null) awayValue = 0;
      }

      if (homeValue === null && awayValue === null) return;

      payload[key] = {
        home: Math.max(0, homeValue ?? 0),
        away: Math.max(0, awayValue ?? 0),
      };
    });

  return Object.keys(payload).length > 0 ? payload : null;
}

function inferPhaseStartedAtMs({phase, liveClock, minute, kickoffMs, timing, nowMs}) {
  const existingMs = toMillis(liveClock?.phaseStartedAt);
  if (existingMs != null && existingMs <= nowMs) {
    return existingMs;
  }

  if (phase === "first_half") {
    if (kickoffMs != null && kickoffMs <= nowMs) {
      return kickoffMs;
    }
    const elapsed = Math.max(0, Math.min(timing.halfMinutes, Number(minute) || 0));
    return nowMs - (elapsed * 60000);
  }

  if (phase === "second_half") {
    const secondHalfElapsed = Math.max(
      0,
      Math.min(timing.halfMinutes, (Number(minute) || timing.halfMinutes) - timing.halfMinutes)
    );
    return nowMs - (secondHalfElapsed * 60000);
  }

  if (phase === "halftime" && kickoffMs != null) {
    return Math.min(nowMs, kickoffMs + (timing.halfMinutes * 60000));
  }

  return nowMs;
}

function hashSeed(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getNarrationTemplateKey(phase, homeScore, awayScore) {
  if (phase === "kickoff") {
    return "match.narration.kickoff.dynamic";
  }

  if (phase === "second_half_start") {
    return "match.narration.second_half.dynamic";
  }

  if (phase === "halftime") {
    if (homeScore === 0 && awayScore === 0) return "match.narration.ht.goalless";
    if (homeScore === awayScore) return "match.narration.ht.scoringDraw";
    return homeScore > awayScore ? "match.narration.ht.homeLead" : "match.narration.ht.awayLead";
  }
  if (homeScore === awayScore) return "match.narration.ft.draw";
  return homeScore > awayScore ? "match.narration.ft.homeWin" : "match.narration.ft.awayWin";
}

function isScoreAwareNarrationPhase(phase) {
  return phase === "halftime" || phase === "full_time";
}

function getNarrationVariantCount(phase) {
  if (phase === "kickoff") return KICKOFF_PUNCHLINE_VARIANT_COUNT;
  if (phase === "second_half_start") return SECOND_HALF_PUNCHLINE_VARIANT_COUNT;
  return 20;
}

function buildSystemCommentaryEvent({
  fixtureId,
  phase,
  minute,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}) {
  const templateKey = getNarrationTemplateKey(phase, homeScore, awayScore);
  const scoreAware = isScoreAwareNarrationPhase(phase);
  const variantSeed = scoreAware
    ? `${fixtureId}:${phase}:${homeScore}-${awayScore}`
    : `${fixtureId}:${phase}`;
  const variantIndex = hashSeed(variantSeed) % getNarrationVariantCount(phase);
  const scoreSuffix = scoreAware ? `-${homeScore}-${awayScore}` : "";
  return {
    id: `system-${phase}-${fixtureId}${scoreSuffix}`,
    type: "system_commentary",
    isSystem: true,
    templateKey,
    templateParams: {
      homeTeam: homeTeam?.name || "Home",
      awayTeam: awayTeam?.name || "Away",
      minute,
      variantIndex,
      ...(scoreAware ? {
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
      } : {}),
    },
    transitionPhase: phase,
    minute,
    createdAt: new Date().toISOString(),
  };
}

function findTransitionEventIndex(events, phase) {
  if (!Array.isArray(events)) return -1;
  return events.findIndex((event) => event &&
    event.isSystem &&
    event.type === "system_commentary" &&
    event.transitionPhase === phase);
}

function normalizeTransitionEventMinute(events, phase, minute) {
  const index = findTransitionEventIndex(events, phase);
  if (index === -1) return false;
  const existing = events[index];
  const normalized = {
    ...existing,
    transitionPhase: phase,
    minute,
    templateParams: {
      ...(existing?.templateParams || {}),
      minute,
    },
  };

  if (JSON.stringify(existing) === JSON.stringify(normalized)) {
    return false;
  }

  events[index] = normalized;
  return true;
}

function upsertTransitionCommentaryEvent({
  events,
  fixtureId,
  phase,
  minute,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}) {
  const nextEvent = buildSystemCommentaryEvent({
    fixtureId,
    phase,
    minute,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
  });
  const index = findTransitionEventIndex(events, phase);

  if (index === -1) {
    events.push(nextEvent);
    return true;
  }

  const scoreAware = isScoreAwareNarrationPhase(phase);
  const existing = events[index];
  const merged = {
    ...existing,
    id: existing?.id || nextEvent.id,
    type: "system_commentary",
    isSystem: true,
    templateKey: nextEvent.templateKey,
    templateParams: {
      ...(existing?.templateParams || {}),
      ...nextEvent.templateParams,
      minute,
      ...(scoreAware ? {homeScore, awayScore} : {}),
    },
    transitionPhase: phase,
    minute,
    createdAt: existing?.createdAt || nextEvent.createdAt,
  };

  if (JSON.stringify(existing) === JSON.stringify(merged)) {
    return false;
  }

  events[index] = merged;
  return true;
}

function resolveGoalEventSide(goalEvent, fixture) {
  if (!goalEvent) return null;

  const eventTeam = goalEvent.teamId || goalEvent.team || null;
  if (eventTeam === "home" || eventTeam === "away") {
    return eventTeam;
  }

  const eventTeamString = eventTeam != null ? String(eventTeam) : "";
  const homeCandidates = [
    fixture.homeTeamId,
    fixture.homeTeam?.id,
    fixture.homeTeam?.teamId,
    fixture.homeTeam?.name,
  ].filter(Boolean).map((value) => String(value));
  const awayCandidates = [
    fixture.awayTeamId,
    fixture.awayTeam?.id,
    fixture.awayTeam?.teamId,
    fixture.awayTeam?.name,
  ].filter(Boolean).map((value) => String(value));

  if (homeCandidates.includes(eventTeamString)) return "home";
  if (awayCandidates.includes(eventTeamString)) return "away";
  return null;
}

function resolveGoalScorerName(goalEvent, fixture, side) {
  if (goalEvent?.playerName) return goalEvent.playerName;
  if (!goalEvent?.playerId) return "The scorer";

  const relevantTeam = side === "home"
    ? fixture.homeTeam
    : side === "away"
      ? fixture.awayTeam
      : null;
  const players = Array.isArray(relevantTeam?.players) ? relevantTeam.players : [];
  const found = players.find((player) => String(player?.id) === String(goalEvent.playerId));
  return found?.name || "The scorer";
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
  awayScore,
}) {
  const variantIndex = hashSeed(`${fixtureId}:goal:${goalEventId}`) % GOAL_PUNCHLINE_VARIANT_COUNT;
  return {
    id: `system-goal-${fixtureId}-${goalEventId}`,
    type: "system_commentary",
    isSystem: true,
    templateKey: "match.narration.goal.dynamic",
    templateParams: {
      teamName,
      scorerName,
      homeScore,
      awayScore,
      minute,
      variantIndex,
    },
    transitionPhase: "goal",
    goalEventId,
    goalSide: side,
    minute,
    createdAt: goalEvent?.createdAt || goalEvent?.timestamp || new Date().toISOString(),
  };
}

function buildGoalOverturnedCommentaryEvent({
  fixtureId,
  correctionKey,
  side,
  teamName,
  minute,
  homeScore,
  awayScore,
}) {
  const variantIndex = hashSeed(`${fixtureId}:goal-overturned:${correctionKey}`) % GOAL_OVERTURNED_VARIANT_COUNT;
  return {
    id: `system-goal-overturned-${fixtureId}-${correctionKey}`,
    type: "system_commentary",
    isSystem: true,
    templateKey: "match.narration.goal.overturned.dynamic",
    templateParams: {
      teamName,
      homeScore,
      awayScore,
      minute,
      variantIndex,
    },
    transitionPhase: "goal_overturned",
    correctionKey,
    goalSide: side,
    minute,
    createdAt: new Date().toISOString(),
  };
}

function countRealGoalEvents(events = []) {
  if (!Array.isArray(events)) return 0;
  return events.filter((event) =>
    event &&
    !event.isSystem &&
    (event.type === "goal" || event.type === "penalty_scored")
  ).length;
}

function maybeAddGoalOverturnedCommentaryEvent({
  beforeFixture,
  afterFixture,
  fixtureId,
  events,
}) {
  if (!Array.isArray(events)) return false;

  const beforeHome = Number(beforeFixture?.homeScore ?? 0);
  const beforeAway = Number(beforeFixture?.awayScore ?? 0);
  const afterHome = Number(afterFixture?.homeScore ?? 0);
  const afterAway = Number(afterFixture?.awayScore ?? 0);
  const homeDelta = afterHome - beforeHome;
  const awayDelta = afterAway - beforeAway;

  if (homeDelta >= 0 && awayDelta >= 0) return false;

  const sides = [];
  if (homeDelta < 0) sides.push("home");
  if (awayDelta < 0) sides.push("away");
  if (sides.length === 0) return false;

  let added = false;
  const minute = Number(afterFixture?.liveClock?.currentMinute ?? afterFixture?.minute ?? 0);
  const changeStamp = toMillis(afterFixture?.updatedAt) || Date.now();

  for (const side of sides) {
    const correctionKey = `overturned:${side}:${beforeHome}-${beforeAway}->${afterHome}-${afterAway}:${changeStamp}`;
    const exists = events.some((event) =>
      event &&
      event.isSystem &&
      event.type === "system_commentary" &&
      event.transitionPhase === "goal_overturned" &&
      String(event.correctionKey || "") === correctionKey
    );
    if (exists) continue;

    const teamName = side === "home"
      ? (afterFixture?.homeTeam?.name || "Home")
      : (afterFixture?.awayTeam?.name || "Away");
    const commentary = buildGoalOverturnedCommentaryEvent({
      fixtureId,
      correctionKey,
      side,
      teamName,
      minute,
      homeScore: afterHome,
      awayScore: afterAway,
    });
    events.push(commentary);
    added = true;
  }

  return added;
}

function maybeAddScoreDeltaGoalCommentaryEvent({
  beforeFixture,
  afterFixture,
  fixtureId,
  events,
}) {
  if (!Array.isArray(events)) return false;

  const beforeHome = Number(beforeFixture?.homeScore ?? 0);
  const beforeAway = Number(beforeFixture?.awayScore ?? 0);
  const afterHome = Number(afterFixture?.homeScore ?? 0);
  const afterAway = Number(afterFixture?.awayScore ?? 0);
  const homeDelta = afterHome - beforeHome;
  const awayDelta = afterAway - beforeAway;

  if (homeDelta <= 0 && awayDelta <= 0) return false;

  const beforeGoalCount = countRealGoalEvents(beforeFixture?.events || []);
  const afterGoalCount = countRealGoalEvents(afterFixture?.events || []);
  if (afterGoalCount > beforeGoalCount) {
    return false;
  }

  let side = null;
  if (homeDelta > 0 && awayDelta <= 0) side = "home";
  if (awayDelta > 0 && homeDelta <= 0) side = "away";
  if (!side) return false;

  const scoreDeltaKey = `score-delta:${afterHome}-${afterAway}`;
  const exists = events.some((event) =>
    event &&
    event.isSystem &&
    event.type === "system_commentary" &&
    event.transitionPhase === "score_update" &&
    String(event.goalEventId || "") === scoreDeltaKey
  );
  if (exists) return false;

  const minute = Number(afterFixture?.liveClock?.currentMinute ?? afterFixture?.minute ?? 0);
  const teamName = side === "home"
    ? (afterFixture?.homeTeam?.name || "Home")
    : (afterFixture?.awayTeam?.name || "Away");
  const commentary = buildGoalCommentaryEvent({
    fixtureId,
    goalEvent: null,
    goalEventId: scoreDeltaKey,
    side,
    teamName,
    scorerName: "The scorer",
    minute,
    homeScore: afterHome,
    awayScore: afterAway,
  });

  events.push({
    ...commentary,
    id: `system-score-update-${fixtureId}-${afterHome}-${afterAway}`,
    transitionPhase: "score_update",
    createdAt: new Date().toISOString(),
  });
  return true;
}

function syncGoalCommentaryEvents({events, fixture, fixtureId}) {
  if (!Array.isArray(events)) return false;

  const realGoals = events
    .filter((event) => event && !event.isSystem && (event.type === "goal" || event.type === "penalty_scored"))
    .map((event, index) => ({event, index}));
  if (realGoals.length === 0) {
    const before = events.length;
    const filtered = events.filter((event) =>
      !(event?.isSystem && event.type === "system_commentary" && event.transitionPhase === "goal")
    );
    if (filtered.length === before) return false;
    events.splice(0, events.length, ...filtered);
    return true;
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
    if (side === "home") runningHome += 1;
    if (side === "away") runningAway += 1;

    const goalEventId = String(
      goalEvent?.id ||
      `${Number(goalEvent?.minute || 0)}-${toMillis(goalEvent?.timestamp) || toMillis(goalEvent?.createdAt) || goalEntry.index}-${side || "unknown"}`
    );
    validGoalEventIds.add(goalEventId);

    const teamName = side === "home"
      ? (fixture.homeTeam?.name || "Home")
      : side === "away"
        ? (fixture.awayTeam?.name || "Away")
        : (goalEvent?.teamName || "A team");
    const scorerName = resolveGoalScorerName(goalEvent, fixture, side);
    const minute = Number(goalEvent?.minute || 0);
    const nextCommentary = buildGoalCommentaryEvent({
      fixtureId,
      goalEvent,
      goalEventId,
      side,
      teamName,
      scorerName,
      minute,
      homeScore: runningHome,
      awayScore: runningAway,
    });

    const existingIndex = events.findIndex((event) =>
      event &&
      event.isSystem &&
      event.type === "system_commentary" &&
      event.transitionPhase === "goal" &&
      String(event.goalEventId || "") === goalEventId
    );

    if (existingIndex === -1) {
      events.push(nextCommentary);
      changed = true;
      continue;
    }

    const existing = events[existingIndex];
    const merged = {
      ...existing,
      ...nextCommentary,
      id: existing?.id || nextCommentary.id,
      createdAt: existing?.createdAt || nextCommentary.createdAt,
    };
    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
      events[existingIndex] = merged;
      changed = true;
    }
  }

  const beforeCleanupLength = events.length;
  const filtered = events.filter((event) => {
    if (!(event?.isSystem && event.type === "system_commentary" && event.transitionPhase === "goal")) {
      return true;
    }
    return validGoalEventIds.has(String(event.goalEventId || ""));
  });
  if (filtered.length !== beforeCleanupLength) {
    events.splice(0, events.length, ...filtered);
    changed = true;
  }

  return changed;
}

function computeLiveClockUpdate(fixture, fixtureId, nowMs) {
  const canonicalStatus = toCanonicalFixtureStatus(fixture.status);
  if (canonicalStatus === "cancelled" || canonicalStatus === "postponed") {
    return null;
  }

  const timing = resolveTimingFromFixture(fixture);
  const autoFullTimeMinute = Math.max(timing.regulationMinutes, AUTO_FULL_TIME_MINUTE);
  const kickoff = getDateFromField(fixture.dateTime || fixture.date);
  const kickoffMs = kickoff ? kickoff.getTime() : null;
  const homeScore = Number(fixture.homeScore ?? 0);
  const awayScore = Number(fixture.awayScore ?? 0);
  const events = Array.isArray(fixture.events) ? [...fixture.events] : [];
  let eventsChanged = false;

  let status = canonicalStatus;
  let minute = Number(fixture.minute ?? fixture.liveClock?.currentMinute ?? 0);
  const hasManualFullTimeKey = String(fixture?.liveClock?.lastTransitionKey || "").startsWith("manual_full_time");
  let liveClock = fixture.liveClock ? {...fixture.liveClock} : {
    phase: status === "completed" ? "full_time" : (status === "live" ? "first_half" : "pre_match"),
    phaseStartedAt: kickoff ? kickoff.toISOString() : new Date(nowMs).toISOString(),
    currentMinute: status === "completed"
      ? (Number.isFinite(minute) && minute > 0 ? minute : autoFullTimeMinute)
      : 0,
    adminPause: false,
    holdSecondHalf: false,
    lastTransitionKey: "",
  };

  let changed = false;

  if (status === "scheduled" && !liveClock.manualStartOnly && kickoffMs != null && nowMs >= kickoffMs) {
    const kickoffStartMs = Math.min(nowMs, kickoffMs);
    const kickoffElapsed = Math.max(0, Math.floor((nowMs - kickoffStartMs) / 60000));
    status = "live";
    liveClock.phase = "first_half";
    liveClock.phaseStartedAt = new Date(kickoffStartMs).toISOString();
    liveClock.currentMinute = Math.min(timing.halfMinutes, kickoffElapsed);
    liveClock.adminPause = false;
    minute = liveClock.currentMinute;
    if (upsertTransitionCommentaryEvent({
      events,
      fixtureId,
      phase: "kickoff",
      minute: 0,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeScore,
      awayScore,
    })) {
      eventsChanged = true;
    }
    changed = true;
  }

  if (status === "live") {
    if (!liveClock.phase || liveClock.phase === "pre_match") {
      liveClock.phase = "first_half";
      changed = true;
    }
    const phase = liveClock.phase;
    const phaseStartedAtMs = inferPhaseStartedAtMs({
      phase,
      liveClock,
      minute: Number(liveClock.currentMinute ?? minute ?? 0),
      kickoffMs,
      timing,
      nowMs,
    });
    if (toMillis(liveClock.phaseStartedAt) !== phaseStartedAtMs) {
      liveClock.phaseStartedAt = new Date(phaseStartedAtMs).toISOString();
      changed = true;
    }

    if (liveClock.adminPause) {
      minute = Number(liveClock.currentMinute ?? minute ?? 0);
    } else if (phase === "first_half") {
      if (upsertTransitionCommentaryEvent({
        events,
        fixtureId,
        phase: "kickoff",
        minute: 0,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeScore,
        awayScore,
      })) {
        eventsChanged = true;
      }
      const elapsed = Math.max(0, Math.floor((nowMs - phaseStartedAtMs) / 60000));
      minute = Math.min(timing.halfMinutes, elapsed);
      liveClock.currentMinute = minute;

      if (elapsed >= timing.halfMinutes) {
        const transitionKey = `halftime:${homeScore}-${awayScore}`;
        liveClock.phase = "halftime";
        liveClock.phaseStartedAt = new Date(nowMs).toISOString();
        liveClock.currentMinute = timing.halfMinutes;
        minute = timing.halfMinutes;
        liveClock.lastTransitionKey = transitionKey;
        if (upsertTransitionCommentaryEvent({
          events,
          fixtureId,
          phase: "halftime",
          minute: timing.halfMinutes,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          homeScore,
          awayScore,
        })) {
          eventsChanged = true;
        }
        changed = true;
      }
    } else if (phase === "halftime") {
      minute = timing.halfMinutes;
      liveClock.currentMinute = timing.halfMinutes;
      if (upsertTransitionCommentaryEvent({
        events,
        fixtureId,
        phase: "halftime",
        minute: timing.halfMinutes,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeScore,
        awayScore,
      })) {
        eventsChanged = true;
      }
      const breakElapsed = Math.max(0, Math.floor((nowMs - phaseStartedAtMs) / 60000));
      if (!liveClock.holdSecondHalf && breakElapsed >= timing.breakMinutes) {
        const secondHalfStartMs = phaseStartedAtMs + (timing.breakMinutes * 60000);
        liveClock.phase = "second_half";
        liveClock.phaseStartedAt = new Date(Math.min(nowMs, secondHalfStartMs)).toISOString();
        liveClock.currentMinute = timing.halfMinutes;
        liveClock.lastTransitionKey = `second_half:${Math.floor(nowMs / 60000)}`;
        if (upsertTransitionCommentaryEvent({
          events,
          fixtureId,
          phase: "second_half_start",
          minute: timing.halfMinutes,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          homeScore,
          awayScore,
        })) {
          eventsChanged = true;
        }
        changed = true;
      }
    } else if (phase === "second_half") {
      if (upsertTransitionCommentaryEvent({
        events,
        fixtureId,
        phase: "second_half_start",
        minute: timing.halfMinutes,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeScore,
        awayScore,
      })) {
        eventsChanged = true;
      }
      const elapsed = Math.max(0, Math.floor((nowMs - phaseStartedAtMs) / 60000));
      minute = Math.min(autoFullTimeMinute, timing.halfMinutes + elapsed);
      liveClock.currentMinute = minute;

      if (minute >= autoFullTimeMinute) {
        const transitionKey = `full_time:${homeScore}-${awayScore}`;
        status = "completed";
        liveClock.phase = "full_time";
        liveClock.phaseStartedAt = new Date(nowMs).toISOString();
        liveClock.currentMinute = autoFullTimeMinute;
        liveClock.adminPause = false;
        liveClock.holdSecondHalf = false;
        liveClock.lastTransitionKey = transitionKey;
        minute = autoFullTimeMinute;
        if (upsertTransitionCommentaryEvent({
          events,
          fixtureId,
          phase: "full_time",
          minute: autoFullTimeMinute,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          homeScore,
          awayScore,
        })) {
          eventsChanged = true;
        }
        changed = true;
      }
    } else if (phase === "full_time") {
      status = "completed";
      const resolvedMinute = Number(liveClock.currentMinute ?? minute ?? 0);
      const finalMinute = Number.isFinite(resolvedMinute) && resolvedMinute > 0
        ? (hasManualFullTimeKey ? resolvedMinute : Math.max(resolvedMinute, autoFullTimeMinute))
        : autoFullTimeMinute;
      minute = finalMinute;
      if (Number(liveClock.currentMinute ?? 0) !== finalMinute) {
        liveClock.currentMinute = finalMinute;
        changed = true;
      }
    }
  }

  if (status === "live" || status === "completed") {
    if (upsertTransitionCommentaryEvent({
      events,
      fixtureId,
      phase: "kickoff",
      minute: 0,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeScore,
      awayScore,
    })) {
      eventsChanged = true;
    }
  }

  const resolvedLiveMinute = Number(liveClock.currentMinute ?? minute ?? 0);
  const secondHalfHasStarted = liveClock.phase === "second_half" ||
    liveClock.phase === "full_time" ||
    ((status === "live" || status === "completed") && resolvedLiveMinute > timing.halfMinutes);
  if ((status === "live" || status === "completed") && secondHalfHasStarted) {
    if (upsertTransitionCommentaryEvent({
      events,
      fixtureId,
      phase: "second_half_start",
      minute: timing.halfMinutes,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeScore,
      awayScore,
    })) {
      eventsChanged = true;
    }
  }

  if (normalizeTransitionEventMinute(events, "kickoff", 0)) {
    eventsChanged = true;
  }
  if (secondHalfHasStarted && normalizeTransitionEventMinute(events, "second_half_start", timing.halfMinutes)) {
    eventsChanged = true;
  }

  if (status === "completed" && liveClock.phase !== "full_time") {
    const resolvedMinute = Number(liveClock.currentMinute ?? minute ?? fixture.minute ?? 0);
    const finalMinute = Number.isFinite(resolvedMinute) && resolvedMinute > 0
      ? (hasManualFullTimeKey ? resolvedMinute : Math.max(resolvedMinute, autoFullTimeMinute))
      : autoFullTimeMinute;
    liveClock.phase = "full_time";
    liveClock.phaseStartedAt = liveClock.phaseStartedAt || new Date(nowMs).toISOString();
    liveClock.currentMinute = finalMinute;
    minute = finalMinute;
    changed = true;
  }

  if (status === "completed") {
    const completedMinuteRaw = Number(liveClock.currentMinute ?? minute ?? fixture.minute ?? 0);
    const completedMinute = Number.isFinite(completedMinuteRaw) && completedMinuteRaw > 0
      ? (hasManualFullTimeKey ? completedMinuteRaw : Math.max(completedMinuteRaw, autoFullTimeMinute))
      : autoFullTimeMinute;
    if (Number(minute ?? 0) !== completedMinute || Number(liveClock.currentMinute ?? 0) !== completedMinute) {
      minute = completedMinute;
      liveClock.currentMinute = completedMinute;
      changed = true;
    }
    if (normalizeTransitionEventMinute(events, "kickoff", 0)) {
      eventsChanged = true;
    }
    if (normalizeTransitionEventMinute(events, "second_half_start", timing.halfMinutes)) {
      eventsChanged = true;
    }
    if (normalizeTransitionEventMinute(events, "halftime", timing.halfMinutes)) {
      eventsChanged = true;
    }
    if (upsertTransitionCommentaryEvent({
      events,
      fixtureId,
      phase: "full_time",
      minute: completedMinute,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeScore,
      awayScore,
    })) {
      eventsChanged = true;
    }
  }

  if (syncGoalCommentaryEvents({events, fixture, fixtureId})) {
    eventsChanged = true;
  }

  const nextMatchTiming = {
    regulationMinutes: timing.regulationMinutes,
    halfMinutes: timing.halfMinutes,
    breakMinutes: timing.breakMinutes,
    breakRatio: timing.breakRatio,
    source: timing.source || "default",
  };
  const timingChanged = JSON.stringify(fixture.matchTiming || null) !== JSON.stringify(nextMatchTiming);
  const nextStats = normalizeFixtureStats({
    stats: fixture.stats,
    status,
    homeScore,
    awayScore,
  });
  const statsChanged = JSON.stringify(fixture.stats || null) !== JSON.stringify(nextStats || null);

  if (!changed &&
      status === canonicalStatus &&
      minute === Number(fixture.minute ?? 0) &&
      Number(liveClock.currentMinute ?? 0) === Number(fixture.liveClock?.currentMinute ?? 0) &&
      !eventsChanged &&
      !timingChanged &&
      !statsChanged) {
    return null;
  }

  const updatePayload = {
    status,
    minute,
    matchTiming: nextMatchTiming,
    liveClock,
  };
  if (eventsChanged) {
    updatePayload.events = events;
  }
  if (statsChanged) {
    updatePayload.stats = nextStats;
  }
  return updatePayload;
}

/**
 * Create notification record and send notifications
 */
async function createAndSendNotification(userId, notificationData, settingKey) {
  try {
    // Get user settings
    const settings = await getUserSettings(userId);
    if (!settings || !settings.teamFollowing) {
      logger.info(`Team following disabled for user ${userId}`);
      return;
    }

    // Check specific setting
    if (settingKey && !settings[settingKey]) {
      logger.info(`${settingKey} disabled for user ${userId}`);
      return;
    }

    // Create notification record in Firestore
    await db.collection("notifications").add({
      userId,
      type: notificationData.type,
      title: notificationData.title,
      body: notificationData.body,
      icon: notificationData.icon || "/Fivescores logo.svg",
      data: notificationData.data || {},
      read: false,
      delivered: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send push notification if enabled
    if (settings.pushNotifications) {
      await sendPushNotification(userId, notificationData);
    }

    // Send email if enabled
    if (settings.emailNotifications) {
      await sendEmailNotification(userId, notificationData);
    }

    logger.info(`Notification sent to user ${userId}`);
  } catch (error) {
    logger.error("Error creating and sending notification:", error);
  }
}

// ============================================================================
// CLOUD FUNCTIONS - FIXTURE NOTIFICATIONS
// ============================================================================

/**
 * Trigger when a new fixture is created
 * Notifies followers about upcoming match
 */
exports.onFixtureCreated = onDocumentCreated("fixtures/{fixtureId}", async (event) => {
  const fixture = event.data.data();
  const fixtureId = event.params.fixtureId;

  logger.info(`New fixture created: ${fixtureId}`);

  try {
    const {homeTeam, awayTeam} = await resolveFixtureTeams(fixture);
    const allFollowers = [...new Set([
      ...(homeTeam.followers || []),
      ...(awayTeam.followers || []),
    ])];

    logger.info(`Notifying ${allFollowers.length} followers about new fixture`);

    const kickoffLabel = formatFixtureDateLabel(fixture);

    // Send notification to each follower
    const notificationPromises = allFollowers.map((userId) => {
      const notification = {
        type: "fixture_created",
        title: "⚽ New Match Scheduled",
        body: `${homeTeam.name} vs ${awayTeam.name} - ${kickoffLabel}`,
        icon: homeTeam.logo || "/Fivescores logo.svg",
        data: {
          fixtureId,
          type: "fixture",
          url: `/fixtures/${fixtureId}`,
        },
        actionUrl: `${process.env.APP_URL || "https://your-app-url.com"}/fixtures/${fixtureId}`,
      };

      return createAndSendNotification(userId, notification, "upcomingMatches");
    });

    await Promise.all(notificationPromises);
    logger.info("Fixture creation notifications sent");
  } catch (error) {
    logger.error("Error in onFixtureCreated:", error);
  }
});

/**
 * Trigger when fixture is updated
 * Notifies about match going live, score updates, and final results
 */
exports.onFixtureUpdated = onDocumentUpdated("fixtures/{fixtureId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const fixtureId = event.params.fixtureId;

  logger.info(`Fixture updated: ${fixtureId}`);

  try {
    const {homeTeam, awayTeam} = await resolveFixtureTeams(afterData);
    const allFollowers = [...new Set([
      ...(homeTeam.followers || []),
      ...(awayTeam.followers || []),
    ])];
    const scoreline = `${homeTeam.name} ${afterData.homeScore ?? 0} - ${afterData.awayScore ?? 0} ${awayTeam.name}`;
    const beforeStatus = toCanonicalFixtureStatus(beforeData.status);
    const afterStatus = toCanonicalFixtureStatus(afterData.status);
    const statusChanged = beforeStatus !== afterStatus;
    const scoreChanged = beforeData.homeScore !== afterData.homeScore ||
      beforeData.awayScore !== afterData.awayScore;
    const eventsChanged = (beforeData.events || []).length !== (afterData.events || []).length;
    const liveClockChanged = JSON.stringify(beforeData.liveClock || null) !== JSON.stringify(afterData.liveClock || null);

    // Check if match went live
    if (beforeStatus !== "live" && afterStatus === "live") {
      logger.info("Match went live - sending notifications");

      const notificationPromises = allFollowers.map((userId) => {
        const notification = {
          type: "match_live",
          title: "🔴 LIVE NOW!",
          body: `${homeTeam.name} vs ${awayTeam.name} - Match is live!`,
          icon: homeTeam.logo || "/Fivescores logo.svg",
          data: {
            fixtureId,
            type: "match_live",
            url: `/fixtures/${fixtureId}`,
          },
          actionUrl: `${process.env.APP_URL || "https://your-app-url.com"}/fixtures/${fixtureId}`,
        };

        return createAndSendNotification(userId, notification, "liveMatches");
      });

      await Promise.all(notificationPromises);
    }

    // Check if score changed (during live match)
    if (afterStatus === "live" && scoreChanged) {
      logger.info("Score updated - sending notifications");

      const notificationPromises = allFollowers.map((userId) => {
        const notification = {
          type: "score_update",
          title: "⚽ GOAL!",
          body: scoreline,
          icon: homeTeam.logo || "/Fivescores logo.svg",
          data: {
            fixtureId,
            type: "score_update",
            url: `/fixtures/${fixtureId}`,
          },
          actionUrl: `${process.env.APP_URL || "https://your-app-url.com"}/fixtures/${fixtureId}`,
        };

        return createAndSendNotification(userId, notification, "liveMatches");
      });

      await Promise.all(notificationPromises);
    }

    // Check if match finished
    if (beforeStatus !== "completed" && afterStatus === "completed") {
      logger.info("Match finished - sending final result notifications");

      const notificationPromises = allFollowers.map((userId) => {
        const notification = {
          type: "match_finished",
          title: "⚽ Full Time",
          body: scoreline,
          icon: homeTeam.logo || "/Fivescores logo.svg",
          data: {
            fixtureId,
            type: "match_result",
            url: `/fixtures/${fixtureId}`,
          },
          actionUrl: `${process.env.APP_URL || "https://your-app-url.com"}/fixtures/${fixtureId}`,
        };

        return createAndSendNotification(userId, notification, "matchResults");
      });

      await Promise.all(notificationPromises);
    }

    if (statusChanged || liveClockChanged || scoreChanged || eventsChanged) {
      const workingEvents = Array.isArray(afterData.events) ? [...afterData.events] : [];
      const scoreDeltaFactAdded = scoreChanged && maybeAddScoreDeltaGoalCommentaryEvent({
        beforeFixture: beforeData,
        afterFixture: afterData,
        fixtureId,
        events: workingEvents,
      });
      const goalOverturnedFactAdded = scoreChanged && maybeAddGoalOverturnedCommentaryEvent({
        beforeFixture: beforeData,
        afterFixture: afterData,
        fixtureId,
        events: workingEvents,
      });
      const hasPrefillFacts = scoreDeltaFactAdded || goalOverturnedFactAdded;
      const fixtureForClockUpdate = hasPrefillFacts
        ? {...afterData, events: workingEvents}
        : afterData;
      const immediateUpdate = computeLiveClockUpdate(fixtureForClockUpdate, fixtureId, Date.now());

      if (immediateUpdate || hasPrefillFacts) {
        const nextEvents = immediateUpdate?.events
          ? [...immediateUpdate.events]
          : hasPrefillFacts
            ? workingEvents
            : null;
        const updatePayload = {
          ...(immediateUpdate || {}),
          status: toCanonicalFixtureStatus(immediateUpdate?.status || afterStatus),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (nextEvents) {
          updatePayload.events = nextEvents;
        }
        await db.collection("fixtures").doc(fixtureId).update(updatePayload);
      }
    }
  } catch (error) {
    logger.error("Error in onFixtureUpdated:", error);
  }
});

/**
 * Scheduled live clock sync
 * Runs every minute and advances fixture phase/minute server-side
 */
exports.syncFixtureLiveClock = onSchedule("every 1 minutes", async (_event) => {
  logger.info("Running fixture live clock sync");

  try {
    const snapshot = await db.collection("fixtures").get();
    const nowMs = Date.now();
    let updatedCount = 0;

    for (const fixtureDoc of snapshot.docs) {
      const fixtureId = fixtureDoc.id;
      const fixtureRef = fixtureDoc.ref;

      await db.runTransaction(async (transaction) => {
        const freshDoc = await transaction.get(fixtureRef);
        if (!freshDoc.exists) return;

        const freshFixture = freshDoc.data();
        const update = computeLiveClockUpdate(freshFixture, fixtureId, nowMs);
        if (!update) return;

        transaction.update(fixtureRef, {
          ...update,
          status: toCanonicalFixtureStatus(update.status),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updatedCount += 1;
      });
    }

    logger.info(`Fixture live clock sync complete. Updated ${updatedCount} fixture(s).`);
  } catch (error) {
    logger.error("Error during fixture live clock sync:", error);
  }
});

// ============================================================================
// CLOUD FUNCTIONS - ARTICLE NOTIFICATIONS
// ============================================================================

/**
 * Trigger when a new article is created
 * Notifies followers of teams mentioned in the article
 */
exports.onArticleCreated = onDocumentCreated("articles/{articleId}", async (event) => {
  const article = event.data.data();
  const articleId = event.params.articleId;

  logger.info(`New article created: ${articleId}`);

  try {
    // Get teams mentioned in the article
    const teamIds = article.teams || [];

    if (teamIds.length === 0) {
      logger.info("No teams associated with article");
      return;
    }

    // Get all followers of mentioned teams
    const followersPromises = teamIds.map((teamId) => getTeamFollowers(teamId));
    const followersArrays = await Promise.all(followersPromises);
    const allFollowers = [...new Set(followersArrays.flat())];

    logger.info(`Notifying ${allFollowers.length} followers about new article`);

    // Send notification to each follower
    const notificationPromises = allFollowers.map((userId) => {
      const notification = {
        type: "article_published",
        title: "📰 New Article",
        body: article.title,
        icon: article.image || "/Fivescores logo.svg",
        data: {
          articleId,
          type: "article",
          url: `/articles/${articleId}`,
        },
        actionUrl: `${process.env.APP_URL || "https://your-app-url.com"}/articles/${articleId}`,
      };

      return createAndSendNotification(userId, notification, "teamNews");
    });

    await Promise.all(notificationPromises);
    logger.info("Article notifications sent");
  } catch (error) {
    logger.error("Error in onArticleCreated:", error);
  }
});

// ============================================================================
// CLOUD FUNCTIONS - SCHEDULED NOTIFICATIONS
// ============================================================================

/**
 * Scheduled function to notify about upcoming matches (24 hours before)
 * Runs every hour
 */
exports.notifyUpcomingMatches = onSchedule("every 1 hours", async (_event) => {
  logger.info("Running scheduled notification check for upcoming matches");

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Get fixtures scheduled between 24-25 hours from now
    const fixturesSnapshot = await db.collection("fixtures")
      .where("dateTime", ">=", admin.firestore.Timestamp.fromDate(in24Hours))
      .where("dateTime", "<", admin.firestore.Timestamp.fromDate(in25Hours))
        .where("status", "==", "scheduled")
        .get();

    logger.info(`Found ${fixturesSnapshot.size} upcoming matches`);

    for (const fixtureDoc of fixturesSnapshot.docs) {
      const fixture = fixtureDoc.data();
      const fixtureId = fixtureDoc.id;

      const {homeTeam, awayTeam} = await resolveFixtureTeams(fixture);
      const allFollowers = [...new Set([
        ...(homeTeam.followers || []),
        ...(awayTeam.followers || []),
      ])];

      // Send notifications
      const notificationPromises = allFollowers.map((userId) => {
        const notification = {
          type: "upcoming_match_reminder",
          title: "⏰ Match Tomorrow",
          body: `${homeTeam.name} vs ${awayTeam.name} - ${formatFixtureDateLabel(fixture)}`,
          icon: homeTeam.logo || "/Fivescores logo.svg",
          data: {
            fixtureId,
            type: "upcoming_match",
            url: `/fixtures/${fixtureId}`,
          },
          actionUrl: `${process.env.APP_URL || "https://your-app-url.com"}/fixtures/${fixtureId}`,
        };

        return createAndSendNotification(userId, notification, "upcomingMatches");
      });

      await Promise.all(notificationPromises);
      logger.info(`Sent upcoming match notifications for fixture ${fixtureId}`);
    }
  } catch (error) {
    logger.error("Error in notifyUpcomingMatches:", error);
  }
});
