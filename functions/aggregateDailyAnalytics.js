const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// This scheduled function runs daily and aggregates simple metrics into analytics/daily/{YYYY-MM-DD}
exports.aggregateDailyAnalytics = functions.pubsub.schedule('every 24 hours').onRun(async (_context) => {
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const key = `${yyyy}-${mm}-${dd}`;

  try {
    // Count users with teamFollowing notifications enabled
    const usersSnapshot = await db.collection('users').where('notifications.teamFollowing', '==', true).get();
    const notificationsEnabled = usersSnapshot.size;

    // Sum team follower counts
    const teamsSnapshot = await db.collection('teams').get();
    let totalFollowers = 0;
    const topTeams = [];
    teamsSnapshot.forEach(doc => {
      const data = doc.data();
      const followers = data.followerCount || (Array.isArray(data.followers) ? data.followers.length : 0);
      totalFollowers += followers;
      topTeams.push({ id: doc.id, name: data.name, followers });
    });
    topTeams.sort((a,b) => b.followers - a.followers);

    // Count total comments if articles store commentsCount
    let totalComments = 0;
    const articlesSnapshot = await db.collection('articles').get();
    articlesSnapshot.forEach(doc => {
      const d = doc.data();
      totalComments += d.commentsCount || 0;
    });

    // Count notifications sent today from an adminNotifications log if exists
    let notificationsSent = 0;
    try {
      const notifSnapshot = await db.collection('adminNotifications').where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`))).get();
      notificationsSent = notifSnapshot.size;
    } catch (e) {
      console.warn('adminNotifications may not exist', e.message || e);
    }

    // Aggregate simple views metric from adminActivity entries of type 'view'
    const activitiesSnapshot = await db.collection('adminActivity').where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`))).get();
    let views = 0;
    activitiesSnapshot.forEach(doc => {
      const d = doc.data();
      views += d.views || (d.type === 'news' && d.action === 'view' ? 1 : 0);
    });

    // Write aggregated doc
    const analyticsRef = db.collection('analytics').doc('daily').collection('byDate').doc(key);
    await analyticsRef.set({
      date: key,
      notificationsEnabled,
      totalFollowers,
      topTeams: topTeams.slice(0,10),
      totalComments,
      notificationsSent,
      views,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Aggregated analytics for', key);
    return null;
  } catch (error) {
    console.error('Error aggregating analytics:', error);
    return null;
  }
});
