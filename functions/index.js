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
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (teamDoc.exists) {
      return teamDoc.data().followers || [];
    }
    return [];
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
      from: process.env.EMAIL_FROM || "5Star App <noreply@5starapp.com>",
      to: email,
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <img src="${notification.icon || "https://your-app-url.com/5Star-Logo.png"}" alt="5Star App" style="width: 60px; height: 60px;">
            <h1 style="color: white; margin: 10px 0;">5Star App</h1>
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
            <p>You're receiving this because you follow teams on 5Star App.</p>
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
      icon: notificationData.icon || "/5Star-Logo.png",
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
    // Get followers of both teams
    const homeFollowers = await getTeamFollowers(fixture.homeTeam.id);
    const awayFollowers = await getTeamFollowers(fixture.awayTeam.id);
    const allFollowers = [...new Set([...homeFollowers, ...awayFollowers])];

    logger.info(`Notifying ${allFollowers.length} followers about new fixture`);

    // Send notification to each follower
    const notificationPromises = allFollowers.map((userId) => {
      const notification = {
        type: "fixture_created",
        title: "⚽ New Match Scheduled",
        body: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name} - ${new Date(fixture.date).toLocaleDateString()}`,
        icon: fixture.homeTeam.logo || "/5Star-Logo.png",
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
    // Get followers
    const homeFollowers = await getTeamFollowers(afterData.homeTeam.id);
    const awayFollowers = await getTeamFollowers(afterData.awayTeam.id);
    const allFollowers = [...new Set([...homeFollowers, ...awayFollowers])];

    // Check if match went live
    if (beforeData.status !== "live" && afterData.status === "live") {
      logger.info("Match went live - sending notifications");

      const notificationPromises = allFollowers.map((userId) => {
        const notification = {
          type: "match_live",
          title: "🔴 LIVE NOW!",
          body: `${afterData.homeTeam.name} vs ${afterData.awayTeam.name} - Match is live!`,
          icon: afterData.homeTeam.logo || "/5Star-Logo.png",
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
    if (afterData.status === "live" &&
        (beforeData.homeScore !== afterData.homeScore ||
         beforeData.awayScore !== afterData.awayScore)) {
      logger.info("Score updated - sending notifications");

      const notificationPromises = allFollowers.map((userId) => {
        const notification = {
          type: "score_update",
          title: "⚽ GOAL!",
          body: `${afterData.homeTeam.name} ${afterData.homeScore} - ${afterData.awayScore} ${afterData.awayTeam.name}`,
          icon: afterData.homeTeam.logo || "/5Star-Logo.png",
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
    if (beforeData.status === "live" && afterData.status === "finished") {
      logger.info("Match finished - sending final result notifications");

      const notificationPromises = allFollowers.map((userId) => {
        const notification = {
          type: "match_finished",
          title: "⚽ Full Time",
          body: `${afterData.homeTeam.name} ${afterData.homeScore} - ${afterData.awayScore} ${afterData.awayTeam.name}`,
          icon: afterData.homeTeam.logo || "/5Star-Logo.png",
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
        icon: article.image || "/5Star-Logo.png",
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
exports.notifyUpcomingMatches = onSchedule("every 1 hours", async (event) => {
  logger.info("Running scheduled notification check for upcoming matches");

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Get fixtures scheduled between 24-25 hours from now
    const fixturesSnapshot = await db.collection("fixtures")
        .where("date", ">=", in24Hours.toISOString())
        .where("date", "<", in25Hours.toISOString())
        .where("status", "==", "scheduled")
        .get();

    logger.info(`Found ${fixturesSnapshot.size} upcoming matches`);

    for (const fixtureDoc of fixturesSnapshot.docs) {
      const fixture = fixtureDoc.data();
      const fixtureId = fixtureDoc.id;

      // Get followers
      const homeFollowers = await getTeamFollowers(fixture.homeTeam.id);
      const awayFollowers = await getTeamFollowers(fixture.awayTeam.id);
      const allFollowers = [...new Set([...homeFollowers, ...awayFollowers])];

      // Send notifications
      const notificationPromises = allFollowers.map((userId) => {
        const matchDate = new Date(fixture.date);
        const notification = {
          type: "upcoming_match_reminder",
          title: "⏰ Match Tomorrow",
          body: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name} - ${matchDate.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`,
          icon: fixture.homeTeam.logo || "/5Star-Logo.png",
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
