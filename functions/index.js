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
// CUSTOM CLAIMS FOR ADMIN ROLES
// ============================================================================

/**
 * Set custom claims when user role changes
 * This eliminates the need for expensive get() calls in Firestore security rules
 */
exports.onUserRoleChange = onDocumentUpdated("users/{userId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const userId = event.params.userId;

  // Only proceed if role changed
  if (beforeData.role === afterData.role) {
    return null;
  }

  const role = afterData.role || "user";
  const isAdmin = role === "admin" || role === "super-admin";
  const isSuperAdmin = role === "super-admin";

  try {
    await admin.auth().setCustomUserClaims(userId, {
      role: role,
      admin: isAdmin,
      superAdmin: isSuperAdmin,
    });

    logger.info(`Custom claims set for user ${userId}: role=${role}, admin=${isAdmin}, superAdmin=${isSuperAdmin}`);

    // Update a timestamp to signal the client to refresh their token
    await db.collection("users").doc(userId).update({
      claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
  } catch (error) {
    logger.error("Error setting custom claims:", error);
    return null;
  }
});

/**
 * Set custom claims when new user is created with a role
 */
exports.onUserCreatedSetClaims = onDocumentCreated("users/{userId}", async (event) => {
  const userData = event.data.data();
  const userId = event.params.userId;
  const role = userData.role || "user";

  // Skip if regular user (no claims needed)
  if (role === "user") {
    return null;
  }

  const isAdmin = role === "admin" || role === "super-admin";
  const isSuperAdmin = role === "super-admin";

  try {
    await admin.auth().setCustomUserClaims(userId, {
      role: role,
      admin: isAdmin,
      superAdmin: isSuperAdmin,
    });

    logger.info(`Custom claims set for new user ${userId}: role=${role}`);
    return null;
  } catch (error) {
    logger.error("Error setting custom claims for new user:", error);
    return null;
  }
});

/**
 * Sync all admin claims - One-time backfill for existing admin users
 * Run this once after deploying custom claims to sync existing admins
 * Trigger: Run manually via Firebase Console > Functions > syncAllAdminClaims
 */
exports.syncAllAdminClaims = onSchedule("every 24 hours", async () => {
  logger.info("Starting sync of all admin claims...");

  try {
    // Get all admin and super-admin users
    const adminsSnapshot = await db.collection("users")
        .where("role", "in", ["admin", "super-admin"])
        .get();

    let synced = 0;
    let errors = 0;

    for (const doc of adminsSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      const role = userData.role;
      const isAdmin = role === "admin" || role === "super-admin";
      const isSuperAdmin = role === "super-admin";

      try {
        await admin.auth().setCustomUserClaims(userId, {
          role: role,
          admin: isAdmin,
          superAdmin: isSuperAdmin,
        });
        synced++;
        logger.info(`Synced claims for ${userId}: ${role}`);
      } catch (err) {
        errors++;
        logger.error(`Failed to sync claims for ${userId}:`, err);
      }
    }

    logger.info(`Admin claims sync complete. Synced: ${synced}, Errors: ${errors}`);
    return null;
  } catch (error) {
    logger.error("Error syncing admin claims:", error);
    return null;
  }
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
      return normalizeUserSettings(settingsDoc.data());
    }
    // Return default settings if none exist
    return normalizeUserSettings(null);
  } catch (error) {
    logger.error("Error getting user settings:", error);
    return null;
  }
}

function normalizeUserSettings(raw) {
  const defaults = {
    teamFollowing: true,
    upcomingMatches: true,
    liveMatches: true,
    matchResults: true,
    teamNews: true,
    emailNotifications: false,
    pushNotifications: true,
  };

  if (!raw || typeof raw !== 'object') return defaults;

  // New client schema: { notifications: { push, email, teamFollowing, upcomingMatches, liveMatches, matchResults, teamNews, matchUpdates, newsAlerts } }
  if (raw.notifications && typeof raw.notifications === 'object') {
    const n = raw.notifications;
    const matchUpdatesFallback = typeof n.matchUpdates === 'boolean' ? n.matchUpdates : true;
    const teamNewsFallback = typeof n.newsAlerts === 'boolean' ? n.newsAlerts : true;

    return {
      teamFollowing: typeof n.teamFollowing === 'boolean' ? n.teamFollowing : defaults.teamFollowing,
      upcomingMatches: typeof n.upcomingMatches === 'boolean' ? n.upcomingMatches : matchUpdatesFallback,
      liveMatches: typeof n.liveMatches === 'boolean' ? n.liveMatches : matchUpdatesFallback,
      matchResults: typeof n.matchResults === 'boolean' ? n.matchResults : matchUpdatesFallback,
      teamNews: typeof n.teamNews === 'boolean' ? n.teamNews : teamNewsFallback,
      emailNotifications: typeof n.email === 'boolean' ? n.email : defaults.emailNotifications,
      pushNotifications: typeof n.push === 'boolean' ? n.push : defaults.pushNotifications,
    };
  }

  // Legacy schema: flat booleans
  return {
    teamFollowing: typeof raw.teamFollowing === 'boolean' ? raw.teamFollowing : defaults.teamFollowing,
    upcomingMatches: typeof raw.upcomingMatches === 'boolean' ? raw.upcomingMatches : defaults.upcomingMatches,
    liveMatches: typeof raw.liveMatches === 'boolean' ? raw.liveMatches : defaults.liveMatches,
    matchResults: typeof raw.matchResults === 'boolean' ? raw.matchResults : defaults.matchResults,
    teamNews: typeof raw.teamNews === 'boolean' ? raw.teamNews : defaults.teamNews,
    emailNotifications: typeof raw.emailNotifications === 'boolean' ? raw.emailNotifications : defaults.emailNotifications,
    pushNotifications: typeof raw.pushNotifications === 'boolean' ? raw.pushNotifications : defaults.pushNotifications,
  };
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

    const baseUrl = process.env.APP_URL || "https://your-app-url.com";
    const safeData = stringifyFcmData(notification.data || {});

    const relativeUrl = safeData.url || safeData.link || "/";
    const link = new URL(relativeUrl, baseUrl).toString();
    const icon = new URL(notification.icon || "/icons/icon-192.png", baseUrl).toString();

    const message = {
      tokens,
      data: safeData,
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon,
          badge: icon,
        },
        fcmOptions: {
          link,
        },
      },
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

function stringifyFcmData(data) {
  const out = {};
  if (!data || typeof data !== 'object') return out;
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    out[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return out;
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

/**
 * Create notification record and send notifications
 */
async function createAndSendNotification(userId, notificationData, settingKey, options = {}) {
  try {
    // Get user settings
    const settings = await getUserSettings(userId);
    const bypassTeamFollowing = options.bypassTeamFollowing === true;

    if (!settings || (!bypassTeamFollowing && !settings.teamFollowing)) {
      logger.info(`Team following disabled for user ${userId}`);
      return;
    }

    // Check specific setting
    if (settingKey && settings[settingKey] === false) {
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

async function getWatchlistUsersForFixture(fixtureId) {
  if (!fixtureId) return { userIds: [], docRefs: [] };
  const snapshot = await db.collectionGroup('watchlist').where('fixtureId', '==', String(fixtureId)).get();
  const userIds = new Set();
  const docRefs = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const userId = (data.userId || docSnap.ref.parent?.parent?.id || '').toString();
    if (userId) userIds.add(userId);
    docRefs.push(docSnap.ref);
  });
  return { userIds: Array.from(userIds), docRefs };
}

// ============================================================================
// CLOUD FUNCTIONS - TEST PUSH NOTIFICATIONS
// ============================================================================

/**
 * Firestore-triggered test push.
 * Create: pushTests/{id} with fields:
 *   - userId (string, required)
 *   - title (string, optional)
 *   - body (string, optional)
 *   - url (string, optional)
 */
exports.onPushTestCreated = onDocumentCreated("pushTests/{testId}", async (event) => {
  const test = event.data.data();
  const testId = event.params.testId;

  try {
    const userId = test.userId;
    if (!userId) {
      logger.warn(`pushTests/${testId} missing userId`);
      return;
    }

    const notification = {
      type: "push_test",
      title: (test.title || "🔔 Push Test").toString().slice(0, 100),
      body: (test.body || "If you see this, push notifications work.").toString().slice(0, 200),
      icon: "/icons/icon-192.png",
      data: {
        type: "push_test",
        url: (test.url || "/settings").toString(),
        testId,
      },
      actionUrl: `${process.env.APP_URL || "https://your-app-url.com"}${(test.url || "/settings").toString()}`,
    };

    await createAndSendNotification(userId, notification, null, { bypassTeamFollowing: true });
    logger.info(`Test push sent for pushTests/${testId} to user ${userId}`);
  } catch (error) {
    logger.error(`Error in onPushTestCreated (pushTests/${testId}):`, error);
  }
});

// ============================================================================
// CLOUD FUNCTIONS - WATCHLIST NOTIFICATIONS
// ============================================================================

/**
 * Triggered when a user adds a fixture to their watchlist.
 * Path: users/{userId}/watchlist/{fixtureId}
 */
exports.onWatchlistAdded = onDocumentCreated('users/{userId}/watchlist/{fixtureId}', async (event) => {
  const watch = event.data.data() || {};
  const userId = event.params.userId;
  const fixtureId = event.params.fixtureId;

  try {
    const home = (watch.homeTeamName || 'Match').toString();
    const away = (watch.awayTeamName || '').toString();
    const label = away ? `${home} vs ${away}` : home;

    const notification = {
      type: 'watchlist_added',
      title: '✅ Added to watchlist',
      body: `${label} has been added to your watchlist. You'll get reminders and live updates.`,
      icon: '/icons/icon-192.png',
      data: {
        type: 'watchlist_added',
        fixtureId: String(fixtureId),
        url: `/fixtures/${fixtureId}`,
      },
      actionUrl: `${process.env.APP_URL || 'https://your-app-url.com'}/fixtures/${fixtureId}`,
    };

    await createAndSendNotification(userId, notification, null, { bypassTeamFollowing: true });
  } catch (error) {
    logger.error('Error in onWatchlistAdded:', error);
  }
});

/**
 * Scheduled watchlist reminders (30 and 15 minutes before kickoff).
 * Runs every minute to keep timing tight.
 */
exports.notifyWatchlistReminders = onSchedule('every 1 minutes', async () => {
  try {
    const now = Date.now();

    const buildWindow = (minutes) => {
      const start = new Date(now + (minutes - 1) * 60 * 1000);
      const end = new Date(now + (minutes + 1) * 60 * 1000);
      return {
        start: admin.firestore.Timestamp.fromDate(start),
        end: admin.firestore.Timestamp.fromDate(end),
      };
    };

    const windows = [
      { minutes: 30, sentField: 'sent30' },
      { minutes: 15, sentField: 'sent15' },
    ];

    for (const w of windows) {
      const { start, end } = buildWindow(w.minutes);

      const snap = await db
        .collectionGroup('watchlist')
        .where('dateTime', '>=', start)
        .where('dateTime', '<', end)
        .get();

      if (snap.empty) continue;

      const batch = db.batch();
      const sends = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        if (data[w.sentField] === true) return;

        const userId = (data.userId || docSnap.ref.parent?.parent?.id || '').toString();
        if (!userId) return;

        const home = (data.homeTeamName || 'Match').toString();
        const away = (data.awayTeamName || '').toString();
        const label = away ? `${home} vs ${away}` : home;
        const fixtureId = (data.fixtureId || docSnap.id).toString();

        const notification = {
          type: 'watchlist_reminder',
          title: `⏰ Starts in ${w.minutes} minutes`,
          body: `${label} is starting soon.`,
          icon: '/icons/icon-192.png',
          data: {
            type: 'watchlist_reminder',
            fixtureId,
            url: `/fixtures/${fixtureId}`,
          },
          actionUrl: `${process.env.APP_URL || 'https://your-app-url.com'}/fixtures/${fixtureId}`,
        };

        sends.push(createAndSendNotification(userId, notification, null, { bypassTeamFollowing: true }));
        batch.set(docSnap.ref, { [w.sentField]: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      });

      await Promise.all(sends);
      await batch.commit();
    }
  } catch (error) {
    logger.error('Error in notifyWatchlistReminders:', error);
  }
});

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
    const followerIds = [...new Set([
      ...(homeTeam.followers || []),
      ...(awayTeam.followers || []),
    ])];

    const { userIds: watchlistUserIds } = await getWatchlistUsersForFixture(fixtureId);
    const followerSet = new Set((followerIds || []).map(String));
    const watchlistSet = new Set((watchlistUserIds || []).map(String));
    const allUserIds = Array.from(new Set([...followerSet, ...watchlistSet]));
    const scoreline = `${homeTeam.name} ${afterData.homeScore ?? 0} - ${afterData.awayScore ?? 0} ${awayTeam.name}`;

    // Check if match went live
    if (beforeData.status !== "live" && afterData.status === "live") {
      logger.info("Match went live - sending notifications");

      const notificationPromises = allUserIds.map((userId) => {
        const id = String(userId);
        const isWatchlisted = watchlistSet.has(id);

        const notification = isWatchlisted
          ? {
              type: 'watchlist_match_live',
              title: '🔴 LIVE NOW!',
              body: `${homeTeam.name} vs ${awayTeam.name} is live now.`,
              icon: homeTeam.logo || '/icons/icon-192.png',
              data: {
                fixtureId,
                type: 'watchlist_match_live',
                url: `/fixtures/${fixtureId}`,
              },
              actionUrl: `${process.env.APP_URL || 'https://your-app-url.com'}/fixtures/${fixtureId}`,
            }
          : {
              type: 'match_live',
              title: '🔴 LIVE NOW!',
              body: `${homeTeam.name} vs ${awayTeam.name} - Match is live!`,
              icon: homeTeam.logo || '/Fivescores logo.svg',
              data: {
                fixtureId,
                type: 'match_live',
                url: `/fixtures/${fixtureId}`,
              },
              actionUrl: `${process.env.APP_URL || 'https://your-app-url.com'}/fixtures/${fixtureId}`,
            };

        return isWatchlisted
          ? createAndSendNotification(id, notification, null, { bypassTeamFollowing: true })
          : createAndSendNotification(id, notification, 'liveMatches');
      });

      await Promise.all(notificationPromises);
    }

    // Check if score changed (during live match)
    if (afterData.status === "live" &&
        (beforeData.homeScore !== afterData.homeScore ||
         beforeData.awayScore !== afterData.awayScore)) {
      logger.info("Score updated - sending notifications");

      const notificationPromises = allUserIds.map((userId) => {
        const id = String(userId);
        const isWatchlisted = watchlistSet.has(id);

        const notification = isWatchlisted
          ? {
              type: 'watchlist_score_update',
              title: '⚽ Score Update',
              body: scoreline,
              icon: homeTeam.logo || '/icons/icon-192.png',
              data: {
                fixtureId,
                type: 'watchlist_score_update',
                url: `/fixtures/${fixtureId}`,
              },
              actionUrl: `${process.env.APP_URL || 'https://your-app-url.com'}/fixtures/${fixtureId}`,
            }
          : {
              type: 'score_update',
              title: '⚽ GOAL!',
              body: scoreline,
              icon: homeTeam.logo || '/Fivescores logo.svg',
              data: {
                fixtureId,
                type: 'score_update',
                url: `/fixtures/${fixtureId}`,
              },
              actionUrl: `${process.env.APP_URL || 'https://your-app-url.com'}/fixtures/${fixtureId}`,
            };

        return isWatchlisted
          ? createAndSendNotification(id, notification, null, { bypassTeamFollowing: true })
          : createAndSendNotification(id, notification, 'liveMatches');
      });

      await Promise.all(notificationPromises);
    }

    // Check if match finished
    if (beforeData.status !== "completed" && afterData.status === "completed") {
      logger.info("Match finished - sending final result notifications");

      const notificationPromises = allUserIds.map((userId) => {
        const id = String(userId);
        const isWatchlisted = watchlistSet.has(id);

        const notification = isWatchlisted
          ? {
              type: 'watchlist_match_finished',
              title: '⚽ Full Time',
              body: scoreline,
              icon: homeTeam.logo || '/icons/icon-192.png',
              data: {
                fixtureId,
                type: 'watchlist_match_result',
                url: `/fixtures/${fixtureId}`,
              },
              actionUrl: `${process.env.APP_URL || 'https://your-app-url.com'}/fixtures/${fixtureId}`,
            }
          : {
              type: 'match_finished',
              title: '⚽ Full Time',
              body: scoreline,
              icon: homeTeam.logo || '/Fivescores logo.svg',
              data: {
                fixtureId,
                type: 'match_result',
                url: `/fixtures/${fixtureId}`,
              },
              actionUrl: `${process.env.APP_URL || 'https://your-app-url.com'}/fixtures/${fixtureId}`,
            };

        return isWatchlisted
          ? createAndSendNotification(id, notification, null, { bypassTeamFollowing: true })
          : createAndSendNotification(id, notification, 'matchResults');
      });

      await Promise.all(notificationPromises);
    }
  } catch (error) {
    logger.error("Error in onFixtureUpdated:", error);
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

// ============================================================================
// AFCON 2025 WEB SCRAPER - LIVE SCORES, FIXTURES & STANDINGS
// Scrapes data from multiple sources with fallback to hardcoded schedule
// ============================================================================

const {onCall} = require("firebase-functions/v2/https");
const axios = require("axios");
const cheerio = require("cheerio");

// Firestore collection for AFCON data cache
const AFCON_COLLECTION = "afcon2025";

/**
 * Scrape live AFCON data from Google Search results
 * This function attempts to get live scores by scraping Google's sports data
 */
async function scrapeGoogleAfconScores() {
  try {
    const response = await axios.get('https://www.google.com/search?q=afcon+2025+live+scores', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    const matches = [];
    
    // Google sports cards have specific class patterns
    $('[data-attrid*="match"], .imso_mh__lg-st-cn').each((i, el) => {
      const homeTeam = $(el).find('.imso_mh__first-tn-sc, .imso_mh__tm-nm').first().text().trim();
      const awayTeam = $(el).find('.imso_mh__second-tn-sc, .imso_mh__tm-nm').last().text().trim();
      const homeScore = $(el).find('.imso_mh__l-tm-sc').text().trim();
      const awayScore = $(el).find('.imso_mh__r-tm-sc').text().trim();
      const status = $(el).find('.imso_mh__ft-mtch, .imso_mh__lg-st-txt').text().trim();
      
      if (homeTeam && awayTeam) {
        matches.push({
          homeTeam: normalizeTeamName(homeTeam),
          awayTeam: normalizeTeamName(awayTeam),
          homeScore: parseInt(homeScore) || null,
          awayScore: parseInt(awayScore) || null,
          status: status.includes('FT') ? 'FT' : status.includes('HT') ? 'HT' : status.includes('Live') ? 'LIVE' : 'NS',
          isLive: status.toLowerCase().includes('live') || /^\d+[\'′]$/.test(status)
        });
      }
    });
    
    return matches;
  } catch (error) {
    logger.warn('Google scraping failed:', error.message);
    return [];
  }
}

/**
 * Scrape AFCON data from FlashScore API (free, no auth required for basic data)
 */
async function scrapeFlashScoreAfcon() {
  try {
    // FlashScore API endpoint for Africa Cup of Nations
    const response = await axios.get('https://flashscore.com/football/africa/africa-cup-of-nations/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 8000
    });
    
    const $ = cheerio.load(response.data);
    const matches = [];
    
    // Parse match data from page
    $('.event__match').each((i, el) => {
      const homeTeam = $(el).find('.event__participant--home').text().trim();
      const awayTeam = $(el).find('.event__participant--away').text().trim();
      const homeScore = $(el).find('.event__score--home').text().trim();
      const awayScore = $(el).find('.event__score--away').text().trim();
      const stage = $(el).find('.event__stage--block').text().trim();
      
      if (homeTeam && awayTeam) {
        const isLive = stage.includes("'") || stage.toLowerCase().includes('live') || stage === 'HT';
        matches.push({
          homeTeam: normalizeTeamName(homeTeam),
          awayTeam: normalizeTeamName(awayTeam),
          homeScore: parseInt(homeScore) || null,
          awayScore: parseInt(awayScore) || null,
          status: stage.includes('Finished') ? 'FT' : isLive ? 'LIVE' : 'NS',
          isLive
        });
      }
    });
    
    return matches;
  } catch (error) {
    logger.warn('FlashScore scraping failed:', error.message);
    return [];
  }
}

/**
 * Merge scraped data with our schedule
 * Updates scores and status from scraped data while keeping our schedule structure
 */
function mergeScrapedDataWithSchedule(scrapedMatches, schedule) {
  if (!scrapedMatches || scrapedMatches.length === 0) {
    return schedule;
  }
  
  return schedule.map(match => {
    // Find matching scraped data
    const scraped = scrapedMatches.find(s => 
      (normalizeTeamName(s.homeTeam) === normalizeTeamName(match.homeTeam) &&
       normalizeTeamName(s.awayTeam) === normalizeTeamName(match.awayTeam)) ||
      (normalizeTeamName(s.homeTeam) === normalizeTeamName(match.awayTeam) &&
       normalizeTeamName(s.awayTeam) === normalizeTeamName(match.homeTeam))
    );
    
    if (scraped) {
      // Check if home/away are swapped
      const isSwapped = normalizeTeamName(scraped.homeTeam) === normalizeTeamName(match.awayTeam);
      
      return {
        ...match,
        homeScore: isSwapped ? scraped.awayScore : scraped.homeScore,
        awayScore: isSwapped ? scraped.homeScore : scraped.awayScore,
        status: scraped.status || match.status,
        isLive: scraped.isLive || false,
        scrapedAt: new Date().toISOString()
      };
    }
    
    return match;
  });
}

/**
 * Attempt to fetch live data from multiple sources
 */
async function fetchLiveAfconData() {
  // Try multiple sources in order of reliability
  let scrapedData = [];
  
  // Try FlashScore first
  scrapedData = await scrapeFlashScoreAfcon();
  if (scrapedData.length > 0) {
    logger.info(`Got ${scrapedData.length} matches from FlashScore`);
    return scrapedData;
  }
  
  // Try Google as fallback
  scrapedData = await scrapeGoogleAfconScores();
  if (scrapedData.length > 0) {
    logger.info(`Got ${scrapedData.length} matches from Google`);
    return scrapedData;
  }
  
  logger.info('No live data from scrapers, using schedule data');
  return [];
}

// AFCON 2025 team data with flags
const AFCON_TEAMS = {
  'Morocco': { flag: '🇲🇦', code: 'MAR' },
  'Mali': { flag: '🇲🇱', code: 'MLI' },
  'Zambia': { flag: '🇿🇲', code: 'ZAM' },
  'Comoros': { flag: '🇰🇲', code: 'COM' },
  'Egypt': { flag: '🇪🇬', code: 'EGY' },
  'South Africa': { flag: '🇿🇦', code: 'RSA' },
  'Angola': { flag: '🇦🇴', code: 'ANG' },
  'Zimbabwe': { flag: '🇿🇼', code: 'ZIM' },
  'Nigeria': { flag: '🇳🇬', code: 'NGA' },
  'Tunisia': { flag: '🇹🇳', code: 'TUN' },
  'Uganda': { flag: '🇺🇬', code: 'UGA' },
  'Tanzania': { flag: '🇹🇿', code: 'TAN' },
  'Senegal': { flag: '🇸🇳', code: 'SEN' },
  'DR Congo': { flag: '🇨🇩', code: 'COD' },
  'Benin': { flag: '🇧🇯', code: 'BEN' },
  'Botswana': { flag: '🇧🇼', code: 'BOT' },
  'Algeria': { flag: '🇩🇿', code: 'ALG' },
  'Burkina Faso': { flag: '🇧🇫', code: 'BFA' },
  'Equatorial Guinea': { flag: '🇬🇶', code: 'EQG' },
  'Sudan': { flag: '🇸🇩', code: 'SDN' },
  'Ivory Coast': { flag: '🇨🇮', code: 'CIV' },
  'Cameroon': { flag: '🇨🇲', code: 'CMR' },
  'Gabon': { flag: '🇬🇦', code: 'GAB' },
  'Mozambique': { flag: '🇲🇿', code: 'MOZ' }
};

// AFCON 2025 Groups
const AFCON_GROUPS = {
  'A': ['Morocco', 'Mali', 'Zambia', 'Comoros'],
  'B': ['Egypt', 'South Africa', 'Angola', 'Zimbabwe'],
  'C': ['Nigeria', 'Tunisia', 'Uganda', 'Tanzania'],
  'D': ['Senegal', 'DR Congo', 'Benin', 'Botswana'],
  'E': ['Algeria', 'Burkina Faso', 'Equatorial Guinea', 'Sudan'],
  'F': ['Ivory Coast', 'Cameroon', 'Gabon', 'Mozambique']
};

/**
 * Normalize team name to match our data
 */
function normalizeTeamName(name) {
  if (!name) return name;
  const normalized = name.trim();
  if (AFCON_TEAMS[normalized]) return normalized;
  
  const alternatives = {
    'Cote d\'Ivoire': 'Ivory Coast',
    'Côte d\'Ivoire': 'Ivory Coast',
    'Congo DR': 'DR Congo',
    'Dem. Rep. Congo': 'DR Congo',
    'Democratic Republic of Congo': 'DR Congo'
  };
  return alternatives[normalized] || normalized;
}

/**
 * Get team info (flag, code)
 */
function getTeamInfo(teamName) {
  const normalized = normalizeTeamName(teamName);
  return AFCON_TEAMS[normalized] || { flag: '🏳️', code: '???' };
}

/**
 * Find which group a team belongs to
 */
function findTeamGroup(teamName) {
  const normalized = normalizeTeamName(teamName);
  for (const [group, teams] of Object.entries(AFCON_GROUPS)) {
    if (teams.includes(normalized)) return group;
  }
  return null;
}

/**
 * Check if a match is currently live based on its scheduled time
 * A match is considered "live" if current time is within 2 hours of kickoff and status is NS
 */
function isMatchCurrentlyLive(match) {
  // If already marked as live status
  if (['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(match.status)) {
    return true;
  }
  
  // If match is finished or not scheduled
  if (['FT', 'AET', 'CANC', 'PST'].includes(match.status)) {
    return false;
  }
  
  // Check if match should be live based on time
  const matchTime = new Date(match.date).getTime();
  const now = Date.now();
  const matchDuration = 2 * 60 * 60 * 1000; // 2 hours (90 min + halftime + extra)
  
  // Match is live if: current time is after kickoff AND within match duration
  return now >= matchTime && now <= (matchTime + matchDuration);
}

/**
 * Get dynamic match status based on time
 */
function getDynamicMatchStatus(match) {
  if (['FT', 'AET', 'CANC', 'PST'].includes(match.status)) {
    return match.status;
  }
  
  const matchTime = new Date(match.date).getTime();
  const now = Date.now();
  const elapsed = now - matchTime;
  
  if (elapsed < 0) {
    return 'NS'; // Not started
  }
  
  const minutes = Math.floor(elapsed / 60000);
  
  if (minutes <= 45) {
    return '1H';
  } else if (minutes <= 60) {
    return 'HT';
  } else if (minutes <= 105) {
    return '2H';
  } else {
    // Match should be finished - keep original status or mark as needing update
    return match.status === 'NS' ? 'LIVE' : match.status;
  }
}

/**
 * AFCON 2025 Complete Schedule with known results
 */
const AFCON_2025_SCHEDULE = [
  // GROUP A
  { id: 'A1', group: 'A', homeTeam: 'Morocco', awayTeam: 'Comoros', date: '2025-12-21T20:00:00+01:00', venue: 'Rabat', homeScore: 2, awayScore: 0, status: 'FT' },
  { id: 'A2', group: 'A', homeTeam: 'Mali', awayTeam: 'Zambia', date: '2025-12-22T15:00:00+01:00', venue: 'Casablanca', homeScore: 1, awayScore: 1, status: 'FT' },
  { id: 'A3', group: 'A', homeTeam: 'Zambia', awayTeam: 'Comoros', date: '2025-12-26T18:30:00+01:00', venue: 'Casablanca', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'A4', group: 'A', homeTeam: 'Morocco', awayTeam: 'Mali', date: '2025-12-26T21:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'A5', group: 'A', homeTeam: 'Zambia', awayTeam: 'Morocco', date: '2025-12-29T20:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'A6', group: 'A', homeTeam: 'Comoros', awayTeam: 'Mali', date: '2025-12-29T20:00:00+01:00', venue: 'Casablanca', homeScore: null, awayScore: null, status: 'NS' },
  // GROUP B
  { id: 'B1', group: 'B', homeTeam: 'South Africa', awayTeam: 'Angola', date: '2025-12-22T18:00:00+01:00', venue: 'Marrakesh', homeScore: 2, awayScore: 1, status: 'FT' },
  { id: 'B2', group: 'B', homeTeam: 'Egypt', awayTeam: 'Zimbabwe', date: '2025-12-22T21:00:00+01:00', venue: 'Agadir', homeScore: 2, awayScore: 1, status: 'FT' },
  { id: 'B3', group: 'B', homeTeam: 'Angola', awayTeam: 'Zimbabwe', date: '2025-12-26T13:30:00+01:00', venue: 'Marrakesh', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'B4', group: 'B', homeTeam: 'Egypt', awayTeam: 'South Africa', date: '2025-12-26T16:00:00+01:00', venue: 'Agadir', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'B5', group: 'B', homeTeam: 'Angola', awayTeam: 'Egypt', date: '2025-12-29T17:00:00+01:00', venue: 'Agadir', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'B6', group: 'B', homeTeam: 'Zimbabwe', awayTeam: 'South Africa', date: '2025-12-29T17:00:00+01:00', venue: 'Marrakesh', homeScore: null, awayScore: null, status: 'NS' },
  // GROUP C
  { id: 'C1', group: 'C', homeTeam: 'Nigeria', awayTeam: 'Tanzania', date: '2025-12-23T18:30:00+01:00', venue: 'Fez', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'C2', group: 'C', homeTeam: 'Tunisia', awayTeam: 'Uganda', date: '2025-12-23T21:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'C3', group: 'C', homeTeam: 'Uganda', awayTeam: 'Tanzania', date: '2025-12-27T18:30:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'C4', group: 'C', homeTeam: 'Nigeria', awayTeam: 'Tunisia', date: '2025-12-27T21:00:00+01:00', venue: 'Fez', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'C5', group: 'C', homeTeam: 'Uganda', awayTeam: 'Nigeria', date: '2025-12-30T17:00:00+01:00', venue: 'Fez', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'C6', group: 'C', homeTeam: 'Tanzania', awayTeam: 'Tunisia', date: '2025-12-30T17:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  // GROUP D
  { id: 'D1', group: 'D', homeTeam: 'DR Congo', awayTeam: 'Benin', date: '2025-12-23T13:30:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'D2', group: 'D', homeTeam: 'Senegal', awayTeam: 'Botswana', date: '2025-12-23T16:00:00+01:00', venue: 'Tangier', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'D3', group: 'D', homeTeam: 'Benin', awayTeam: 'Botswana', date: '2025-12-27T13:30:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'D4', group: 'D', homeTeam: 'Senegal', awayTeam: 'DR Congo', date: '2025-12-27T16:00:00+01:00', venue: 'Tangier', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'D5', group: 'D', homeTeam: 'Benin', awayTeam: 'Senegal', date: '2025-12-30T20:00:00+01:00', venue: 'Tangier', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'D6', group: 'D', homeTeam: 'Botswana', awayTeam: 'DR Congo', date: '2025-12-30T20:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  // GROUP E
  { id: 'E1', group: 'E', homeTeam: 'Burkina Faso', awayTeam: 'Equatorial Guinea', date: '2025-12-24T13:30:00+01:00', venue: 'Casablanca', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'E2', group: 'E', homeTeam: 'Algeria', awayTeam: 'Sudan', date: '2025-12-24T16:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'E3', group: 'E', homeTeam: 'Equatorial Guinea', awayTeam: 'Sudan', date: '2025-12-28T16:00:00+01:00', venue: 'Casablanca', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'E4', group: 'E', homeTeam: 'Algeria', awayTeam: 'Burkina Faso', date: '2025-12-28T18:30:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'E5', group: 'E', homeTeam: 'Equatorial Guinea', awayTeam: 'Algeria', date: '2025-12-31T17:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'E6', group: 'E', homeTeam: 'Sudan', awayTeam: 'Burkina Faso', date: '2025-12-31T17:00:00+01:00', venue: 'Casablanca', homeScore: null, awayScore: null, status: 'NS' },
  // GROUP F
  { id: 'F1', group: 'F', homeTeam: 'Ivory Coast', awayTeam: 'Mozambique', date: '2025-12-24T18:30:00+01:00', venue: 'Marrakesh', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'F2', group: 'F', homeTeam: 'Cameroon', awayTeam: 'Gabon', date: '2025-12-24T21:00:00+01:00', venue: 'Agadir', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'F3', group: 'F', homeTeam: 'Gabon', awayTeam: 'Mozambique', date: '2025-12-28T13:30:00+01:00', venue: 'Agadir', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'F4', group: 'F', homeTeam: 'Ivory Coast', awayTeam: 'Cameroon', date: '2025-12-28T21:00:00+01:00', venue: 'Marrakesh', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'F5', group: 'F', homeTeam: 'Gabon', awayTeam: 'Ivory Coast', date: '2025-12-31T20:00:00+01:00', venue: 'Marrakesh', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'F6', group: 'F', homeTeam: 'Mozambique', awayTeam: 'Cameroon', date: '2025-12-31T20:00:00+01:00', venue: 'Agadir', homeScore: null, awayScore: null, status: 'NS' },
  // KNOCKOUT ROUNDS (TBD teams)
  { id: 'R16-1', round: 'Round of 16', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-03T17:00:00+01:00', venue: 'Tangier', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'R16-2', round: 'Round of 16', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-03T20:00:00+01:00', venue: 'Casablanca', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'R16-3', round: 'Round of 16', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-04T17:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'R16-4', round: 'Round of 16', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-04T20:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'R16-5', round: 'Round of 16', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-05T17:00:00+01:00', venue: 'Agadir', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'R16-6', round: 'Round of 16', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-05T20:00:00+01:00', venue: 'Fez', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'R16-7', round: 'Round of 16', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-06T17:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'R16-8', round: 'Round of 16', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-06T20:00:00+01:00', venue: 'Marrakesh', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'QF1', round: 'Quarter-final', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-09T17:00:00+01:00', venue: 'Tangier', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'QF2', round: 'Quarter-final', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-09T20:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'QF3', round: 'Quarter-final', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-10T17:00:00+01:00', venue: 'Marrakesh', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'QF4', round: 'Quarter-final', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-10T20:00:00+01:00', venue: 'Agadir', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'SF1', round: 'Semi-final', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-14T18:00:00+01:00', venue: 'Tangier', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'SF2', round: 'Semi-final', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-14T21:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
  { id: '3RD', round: 'Third Place', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-17T17:00:00+01:00', venue: 'Casablanca', homeScore: null, awayScore: null, status: 'NS' },
  { id: 'FINAL', round: 'Final', homeTeam: 'TBD', awayTeam: 'TBD', date: '2026-01-18T20:00:00+01:00', venue: 'Rabat', homeScore: null, awayScore: null, status: 'NS' },
];

/**
 * Calculate standings from match results
 */
function calculateStandingsFromMatches(matches) {
  const standings = {};
  
  for (const [group, teams] of Object.entries(AFCON_GROUPS)) {
    standings[group] = teams.map(team => ({
      team,
      ...getTeamInfo(team),
      played: 0, won: 0, draw: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0
    }));
  }
  
  matches.filter(m => m.status === 'FT' && m.group).forEach(match => {
    const group = standings[match.group];
    if (!group) return;
    
    const homeTeamName = typeof match.homeTeam === 'string' ? match.homeTeam : match.homeTeam?.name;
    const awayTeamName = typeof match.awayTeam === 'string' ? match.awayTeam : match.awayTeam?.name;
    
    const home = group.find(t => t.team === homeTeamName);
    const away = group.find(t => t.team === awayTeamName);
    if (!home || !away || match.homeScore === null) return;
    
    home.played++; away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;
    
    if (match.homeScore > match.awayScore) {
      home.won++; home.points += 3; away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++; away.points += 3; home.lost++;
    } else {
      home.draw++; away.draw++; home.points++; away.points++;
    }
    
    home.goalDiff = home.goalsFor - home.goalsAgainst;
    away.goalDiff = away.goalsFor - away.goalsAgainst;
  });
  
  for (const group of Object.values(standings)) {
    group.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });
    group.forEach((team, i) => team.position = i + 1);
  }
  
  return standings;
}

/**
 * Get AFCON 2025 data - returns fixtures, standings, and live matches
 */
exports.getAfconData = onCall(async (request) => {
  try {
    logger.info('Fetching AFCON 2025 data');
    
    // Check Firestore cache
    const cacheDoc = await db.collection(AFCON_COLLECTION).doc('latest').get();
    const cacheData = cacheDoc.exists ? cacheDoc.data() : null;
    const cacheAge = cacheData?.updatedAt ? Date.now() - cacheData.updatedAt.toMillis() : Infinity;
    
    // Use cache if less than 2 minutes old, but always recalculate live status
    if (cacheData && cacheAge < 2 * 60 * 1000) {
      logger.info('Returning cached AFCON data with updated live status');
      
      // Recalculate live status from cached fixtures
      const updatedFixtures = (cacheData.fixtures || []).map(fixture => {
        // Find original match to check live status
        const originalMatch = AFCON_2025_SCHEDULE.find(m => m.id === fixture.id);
        if (!originalMatch) return fixture;
        
        const isLive = isMatchCurrentlyLive(originalMatch);
        const dynamicStatus = isLive ? getDynamicMatchStatus(originalMatch) : fixture.status;
        
        return {
          ...fixture,
          status: dynamicStatus,
          isLive: isLive
        };
      });
      
      const liveMatches = updatedFixtures.filter(f => f.isLive);
      
      return {
        success: true,
        fixtures: updatedFixtures,
        standings: cacheData.standings || {},
        liveMatches: liveMatches,
        updatedAt: cacheData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        cached: true
      };
    }
    
    // Try to fetch live data from web scrapers
    let scrapedData = [];
    try {
      scrapedData = await fetchLiveAfconData();
    } catch (e) {
      logger.warn('Scraping failed, using schedule data:', e.message);
    }
    
    // Merge scraped data with schedule
    const mergedSchedule = mergeScrapedDataWithSchedule(scrapedData, AFCON_2025_SCHEDULE);
    
    // Format fixtures with dynamic live detection
    const fixtures = mergedSchedule.map(match => {
      const isLive = match.isLive || isMatchCurrentlyLive(match);
      const dynamicStatus = isLive ? getDynamicMatchStatus(match) : match.status;
      
      return {
        id: match.id,
        homeTeam: { name: match.homeTeam, ...getTeamInfo(match.homeTeam) },
        awayTeam: { name: match.awayTeam, ...getTeamInfo(match.awayTeam) },
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        date: match.date,
        venue: match.venue,
        group: match.group,
        round: match.round || (match.group ? `Group ${match.group}` : null),
        status: dynamicStatus,
        isLive: isLive
      };
    });
    
    // Calculate standings from merged data
    const standings = calculateStandingsFromMatches(mergedSchedule);
    
    // Find live matches
    const liveMatches = fixtures.filter(f => f.isLive);
    
    const result = {
      success: true,
      fixtures,
      standings,
      liveMatches,
      updatedAt: new Date().toISOString()
    };
    
    // Cache the result
    await db.collection(AFCON_COLLECTION).doc('latest').set({
      ...result,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return result;
    
  } catch (error) {
    logger.error('Error in getAfconData:', error.message);
    
    // Return fallback data with live detection
    const fixtures = AFCON_2025_SCHEDULE.map(match => {
      const isLive = isMatchCurrentlyLive(match);
      const dynamicStatus = isLive ? getDynamicMatchStatus(match) : match.status;
      
      return {
        id: match.id,
        homeTeam: { name: match.homeTeam, ...getTeamInfo(match.homeTeam) },
        awayTeam: { name: match.awayTeam, ...getTeamInfo(match.awayTeam) },
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        date: match.date,
        venue: match.venue,
        group: match.group,
        round: match.round || (match.group ? `Group ${match.group}` : null),
        status: dynamicStatus,
        isLive: isLive
      };
    });
    
    const liveMatches = fixtures.filter(f => f.isLive);
    
    return {
      success: true,
      fixtures,
      standings: calculateStandingsFromMatches(AFCON_2025_SCHEDULE),
      liveMatches,
      updatedAt: new Date().toISOString(),
      error: error.message
    };
  }
});

/**
 * Admin function to update a match result
 */
exports.updateAfconMatch = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new Error('Admin access required');
  }
  
  const { matchId, homeScore, awayScore, status } = request.data;
  if (!matchId) throw new Error('Match ID required');
  
  try {
    // Update in hardcoded schedule (for this session)
    const match = AFCON_2025_SCHEDULE.find(m => m.id === matchId);
    if (match) {
      if (homeScore !== undefined) match.homeScore = homeScore;
      if (awayScore !== undefined) match.awayScore = awayScore;
      if (status) match.status = status;
    }
    
    // Update cache
    const fixtures = AFCON_2025_SCHEDULE.map(m => ({
      id: m.id,
      homeTeam: { name: m.homeTeam, ...getTeamInfo(m.homeTeam) },
      awayTeam: { name: m.awayTeam, ...getTeamInfo(m.awayTeam) },
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      date: m.date,
      venue: m.venue,
      group: m.group,
      round: m.round || (m.group ? `Group ${m.group}` : null),
      status: m.status,
      isLive: m.status === 'LIVE'
    }));
    
    await db.collection(AFCON_COLLECTION).doc('latest').set({
      fixtures,
      standings: calculateStandingsFromMatches(AFCON_2025_SCHEDULE),
      liveMatches: fixtures.filter(f => f.isLive),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Match updated' };
  } catch (error) {
    logger.error('Error updating match:', error.message);
    throw error;
  }
});
