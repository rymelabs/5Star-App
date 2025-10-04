import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

// Helper function to check if Firebase is initialized
const checkFirebaseInit = () => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your .env configuration.');
  }
  return db;
};

// Teams collection functions
export const teamsCollection = {
  // Get all teams
  getAll: async () => {
    try {
      const database = checkFirebaseInit();
      const querySnapshot = await getDocs(collection(database, 'teams'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  // Add new team
  add: async (teamData) => {
    try {
      const database = checkFirebaseInit();
      const docRef = await addDoc(collection(database, 'teams'), {
        ...teamData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding team:', error);
      throw error;
    }
  },

  // Bulk add teams
  addBulk: async (teams) => {
    try {
      const database = checkFirebaseInit();
      const batch = writeBatch(database);
      const teamsCollection = collection(database, 'teams');
      
      teams.forEach((team) => {
        const docRef = doc(teamsCollection);
        batch.set(docRef, {
          ...team,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error bulk adding teams:', error);
      throw error;
    }
  },

  // Update team
  update: async (teamId, updates) => {
    try {
      const database = checkFirebaseInit();
      const teamRef = doc(database, 'teams', teamId);
      await updateDoc(teamRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  // Delete team
  delete: async (teamId) => {
    try {
      const database = checkFirebaseInit();
      // Ensure teamId is a string
      const id = String(teamId);
      console.log('🗑️ Deleting team with ID:', id, 'Type:', typeof id);
      await deleteDoc(doc(database, 'teams', id));
      console.log('✅ Team document deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  // Follow team
  follow: async (teamId, userId) => {
    try {
      const database = checkFirebaseInit();
      const id = String(teamId);
      const teamRef = doc(database, 'teams', id);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        throw new Error('Team not found');
      }

      const currentFollowers = teamDoc.data().followers || [];
      
      // Check if already following
      if (currentFollowers.includes(userId)) {
        console.log('User already follows this team');
        return;
      }

      // Add user to followers array and increment count
      await updateDoc(teamRef, {
        followers: [...currentFollowers, userId],
        followerCount: (teamDoc.data().followerCount || 0) + 1,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error following team:', error);
      throw error;
    }
  },

  // Unfollow team
  unfollow: async (teamId, userId) => {
    try {
      const database = checkFirebaseInit();
      const id = String(teamId);
      const teamRef = doc(database, 'teams', id);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        throw new Error('Team not found');
      }

      const currentFollowers = teamDoc.data().followers || [];
      
      // Check if not following
      if (!currentFollowers.includes(userId)) {
        console.log('User does not follow this team');
        return;
      }

      // Remove user from followers array and decrement count
      const newFollowers = currentFollowers.filter(id => id !== userId);
      await updateDoc(teamRef, {
        followers: newFollowers,
        followerCount: Math.max(0, (teamDoc.data().followerCount || 0) - 1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error unfollowing team:', error);
      throw error;
    }
  }
};

// Fixtures collection functions
export const fixturesCollection = {
  // Get all fixtures
  getAll: async () => {
    try {
      const database = checkFirebaseInit();
      const q = query(collection(database, 'fixtures'), orderBy('dateTime', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime?.toDate?.() || new Date(doc.data().dateTime)
      }));
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      throw error;
    }
  },

  // Get fixtures by season
  getBySeason: async (seasonId) => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'fixtures'),
        where('seasonId', '==', seasonId),
        orderBy('dateTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime?.toDate?.() || new Date(doc.data().dateTime)
      }));
    } catch (error) {
      console.error('Error fetching fixtures by season:', error);
      throw error;
    }
  },

  // Get fixtures by group
  getByGroup: async (seasonId, groupId) => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'fixtures'),
        where('seasonId', '==', seasonId),
        where('groupId', '==', groupId),
        orderBy('dateTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime?.toDate?.() || new Date(doc.data().dateTime)
      }));
    } catch (error) {
      console.error('Error fetching fixtures by group:', error);
      throw error;
    }
  },

  // Get fixtures by stage (group/knockout)
  getByStage: async (seasonId, stage) => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'fixtures'),
        where('seasonId', '==', seasonId),
        where('stage', '==', stage),
        orderBy('dateTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime?.toDate?.() || new Date(doc.data().dateTime)
      }));
    } catch (error) {
      console.error('Error fetching fixtures by stage:', error);
      throw error;
    }
  },

  // Add new fixture
  add: async (fixtureData) => {
    try {
      const database = checkFirebaseInit();
      const docRef = await addDoc(collection(database, 'fixtures'), {
        ...fixtureData,
        dateTime: new Date(fixtureData.dateTime),
        seasonId: fixtureData.seasonId || null,
        groupId: fixtureData.groupId || null,
        stage: fixtureData.stage || null, // 'group' or 'knockout'
        round: fixtureData.round || null, // For knockout: 'quarter-final', 'semi-final', 'final'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding fixture:', error);
      throw error;
    }
  },

  // Update fixture (for live scores)
  update: async (fixtureId, updates) => {
    try {
      const database = checkFirebaseInit();
      const fixtureRef = doc(database, 'fixtures', fixtureId);
      await updateDoc(fixtureRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating fixture:', error);
      throw error;
    }
  },

  // Real-time fixture updates
  onSnapshot: (callback) => {
    const database = checkFirebaseInit();
    const q = query(collection(database, 'fixtures'), orderBy('dateTime', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const fixtures = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime?.toDate?.() || new Date(doc.data().dateTime)
      }));
      callback(fixtures);
    });
  },

  // Toggle like on a fixture
  toggleLike: async (fixtureId, userId) => {
    try {
      const database = checkFirebaseInit();
      const fixtureRef = doc(database, 'fixtures', fixtureId);
      const fixtureDoc = await getDoc(fixtureRef);
      
      if (!fixtureDoc.exists()) {
        throw new Error('Fixture not found');
      }

      const fixtureData = fixtureDoc.data();
      const likedBy = fixtureData.likedBy || [];
      const isLiked = likedBy.includes(userId);

      let updatedLikedBy;
      let updatedLikes;

      if (isLiked) {
        // Unlike
        updatedLikedBy = likedBy.filter(id => id !== userId);
        updatedLikes = Math.max(0, (fixtureData.likes || 0) - 1);
      } else {
        // Like
        updatedLikedBy = [...likedBy, userId];
        updatedLikes = (fixtureData.likes || 0) + 1;
      }

      await updateDoc(fixtureRef, {
        likes: updatedLikes,
        likedBy: updatedLikedBy,
        updatedAt: serverTimestamp()
      });

      return { likes: updatedLikes, isLiked: !isLiked };
    } catch (error) {
      console.error('Error toggling fixture like:', error);
      throw error;
    }
  },

  // Delete fixtures by season
  deleteBySeason: async (seasonId) => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'fixtures'),
        where('seasonId', '==', seasonId)
      );
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(database);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return querySnapshot.docs.length; // Return count of deleted fixtures
    } catch (error) {
      console.error('Error deleting fixtures by season:', error);
      throw error;
    }
  },

  // Clean up broken fixtures (fixtures with undefined team IDs)
  cleanupBrokenFixtures: async () => {
    try {
      const database = checkFirebaseInit();
      const querySnapshot = await getDocs(collection(database, 'fixtures'));
      
      const batch = writeBatch(database);
      let deletedCount = 0;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Delete fixtures with undefined or missing team IDs
        if (!data.homeTeamId || !data.awayTeamId || 
            data.homeTeamId === 'undefined' || data.awayTeamId === 'undefined') {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });
      
      await batch.commit();
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up broken fixtures:', error);
      throw error;
    }
  }
};

// News collection functions
export const newsCollection = {
  // Get all articles
  getAll: async () => {
    try {
      const database = checkFirebaseInit();
      const q = query(collection(database, 'articles'), orderBy('publishedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate?.() || new Date(doc.data().publishedAt)
      }));
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  },

  // Get article by ID
  getById: async (articleId) => {
    try {
      const database = checkFirebaseInit();
      const docRef = doc(database, 'articles', articleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          publishedAt: docSnap.data().publishedAt?.toDate?.() || new Date(docSnap.data().publishedAt)
        };
      }
      
      console.warn(`Article not found with ID: ${articleId}`);
      return null;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  // Get article by slug (or ID for backward compatibility)
  getBySlug: async (slugOrId) => {
    try {
      const database = checkFirebaseInit();
      
      // First, try to find by slug
      const q = query(collection(database, 'articles'), where('slug', '==', slugOrId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return {
          id: docSnap.id,
          ...docSnap.data(),
          publishedAt: docSnap.data().publishedAt?.toDate?.() || new Date(docSnap.data().publishedAt)
        };
      }
      
      // If not found by slug, try by document ID (for old articles without slugs)
      console.log(`Article not found with slug "${slugOrId}", trying by document ID...`);
      try {
        const docRef = doc(database, 'articles', slugOrId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data(),
            publishedAt: docSnap.data().publishedAt?.toDate?.() || new Date(docSnap.data().publishedAt)
          };
        }
      } catch (idError) {
        // If it's not a valid document ID, just continue
        console.log('Not a valid document ID either');
      }
      
      console.warn(`Article not found with slug or ID: ${slugOrId}`);
      return null;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  // Add new article
  add: async (articleData) => {
    try {
      const database = checkFirebaseInit();
      const docRef = await addDoc(collection(database, 'articles'), {
        ...articleData,
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding article:', error);
      throw error;
    }
  },

  // Update article
  update: async (articleId, articleData) => {
    try {
      const database = checkFirebaseInit();
      const articleIdStr = String(articleId);
      const docRef = doc(database, 'articles', articleIdStr);
      await updateDoc(docRef, {
        ...articleData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  },

  // Delete article
  delete: async (articleId) => {
    try {
      const database = checkFirebaseInit();
      // Convert ID to string (handles both numeric and string IDs)
      const articleIdStr = String(articleId);
      const docRef = doc(database, 'articles', articleIdStr);
      
      console.log('Attempting to delete article:', articleIdStr, '(original:', articleId, ')');
      
      // Verify article exists before deleting
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.warn('Article already deleted or does not exist:', articleIdStr);
        return; // Don't throw error, just return
      }
      
      // Delete the document
      await deleteDoc(docRef);
      console.log('Article deleted successfully:', articleIdStr);
      
      // Verify deletion
      const verifySnap = await getDoc(docRef);
      if (verifySnap.exists()) {
        throw new Error('Article deletion verification failed - document still exists');
      }
      console.log('Article deletion verified:', articleIdStr);
    } catch (error) {
      console.error('Error deleting article:', articleId, error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  },

  // Toggle like on article
  toggleLike: async (articleId, userId) => {
    try {
      const database = checkFirebaseInit();
      const articleIdStr = String(articleId);
      const articleRef = doc(database, 'articles', articleIdStr);
      const articleSnap = await getDoc(articleRef);
      
      if (!articleSnap.exists()) {
        throw new Error('Article not found');
      }
      
      const articleData = articleSnap.data();
      const likedBy = articleData.likedBy || [];
      const likes = articleData.likes || 0;
      
      let newLikedBy;
      let newLikes;
      
      if (likedBy.includes(userId)) {
        // Unlike - remove user from array
        newLikedBy = likedBy.filter(id => id !== userId);
        newLikes = Math.max(0, likes - 1);
      } else {
        // Like - add user to array
        newLikedBy = [...likedBy, userId];
        newLikes = likes + 1;
      }
      
      await updateDoc(articleRef, {
        likedBy: newLikedBy,
        likes: newLikes,
        updatedAt: serverTimestamp()
      });
      
      return {
        liked: !likedBy.includes(userId),
        likes: newLikes
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Increment view count
  incrementView: async (articleId) => {
    try {
      const database = checkFirebaseInit();
      const articleIdStr = String(articleId);
      const articleRef = doc(database, 'articles', articleIdStr);
      
      // Get current views count
      const articleSnap = await getDoc(articleRef);
      
      if (!articleSnap.exists()) {
        console.warn('Article not found for view increment:', articleIdStr);
        return;
      }
      
      const currentViews = articleSnap.data().views || 0;
      
      // Increment view count
      await updateDoc(articleRef, {
        views: currentViews + 1,
        updatedAt: serverTimestamp()
      });
      
      return currentViews + 1;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw - view tracking shouldn't break the app
    }
  }
};

// Comments collection functions
export const commentsCollection = {
    // Get comments for an item
  getForItem: async (itemType, itemId) => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'comments'),
        where('itemType', '==', itemType),
        where('itemId', '==', itemId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Get comment count for an item
  getCountForItem: async (itemType, itemId) => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'comments'),
        where('itemType', '==', itemType),
        where('itemId', '==', itemId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error fetching comment count:', error);
      return 0;
    }
  },

  // Add new comment
  add: async (commentData) => {
    try {
      const database = checkFirebaseInit();
      const docRef = await addDoc(collection(database, 'comments'), {
        ...commentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Real-time comments
  onSnapshot: (itemType, itemId, callback) => {
    const database = checkFirebaseInit();
    const q = query(
      collection(database, 'comments'),
      where('itemType', '==', itemType),
      where('itemId', '==', itemId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      callback(comments);
    });
  }
};

// League table functions
export const leagueTableCollection = {
  // Get current league table
  getCurrent: async () => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'leagueTable'),
        orderBy('position', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching league table:', error);
      throw error;
    }
  },

  // Update team position
  updateTeam: async (teamId, stats) => {
    try {
      const database = checkFirebaseInit();
      const teamRef = doc(database, 'leagueTable', teamId);
      await updateDoc(teamRef, {
        ...stats,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating league table:', error);
      throw error;
    }
  }
};

// Admin Activity collection functions
export const adminActivityCollection = {
  // Log an admin action
  log: async (actionData) => {
    try {
      const database = checkFirebaseInit();
      const activityRef = await addDoc(collection(database, 'adminActivity'), {
        ...actionData,
        createdAt: serverTimestamp()
      });
      return activityRef.id;
    } catch (error) {
      console.error('Error logging admin activity:', error);
      throw error;
    }
  },

  // Get recent activities with limit
  getRecent: async (limitCount = 10) => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'adminActivity'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('Error fetching admin activities:', error);
      throw error;
    }
  },

  // Real-time activity updates
  onSnapshot: (limitCount = 10, callback) => {
    const database = checkFirebaseInit();
    const q = query(
      collection(database, 'adminActivity'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(q, (querySnapshot) => {
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      callback(activities);
    });
  }
};

// Competitions collection functions
export const competitionsCollection = {
  // Get all competitions
  getAll: async () => {
    try {
      const database = checkFirebaseInit();
      const querySnapshot = await getDocs(collection(database, 'competitions'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching competitions:', error);
      throw error;
    }
  },

  // Add new competition
  add: async (competitionData) => {
    try {
      const database = checkFirebaseInit();
      const docRef = await addDoc(collection(database, 'competitions'), {
        ...competitionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding competition:', error);
      throw error;
    }
  },

  // Update competition
  update: async (competitionId, updates) => {
    try {
      const database = checkFirebaseInit();
      const competitionRef = doc(database, 'competitions', competitionId);
      await updateDoc(competitionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating competition:', error);
      throw error;
    }
  },

  // Delete competition
  delete: async (competitionId) => {
    try {
      const database = checkFirebaseInit();
      await deleteDoc(doc(database, 'competitions', competitionId));
    } catch (error) {
      console.error('Error deleting competition:', error);
      throw error;
    }
  },

  // Real-time competitions
  onSnapshot: (callback) => {
    const database = checkFirebaseInit();
    const q = query(collection(database, 'competitions'), orderBy('name'));
    return onSnapshot(q, (querySnapshot) => {
      const competitions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(competitions);
    });
  }
};

// League Settings collection functions
export const leagueSettingsCollection = {
  // Get league settings
  get: async () => {
    try {
      const database = checkFirebaseInit();
      const settingsRef = doc(database, 'leagueSettings', 'current');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      } else {
        // Return default settings if none exist
        return {
          qualifiedPosition: 4,
          relegationPosition: 18,
          totalTeams: 20
        };
      }
    } catch (error) {
      console.error('Error fetching league settings:', error);
      // Return defaults on error
      return {
        qualifiedPosition: 4,
        relegationPosition: 18,
        totalTeams: 20
      };
    }
  },

  // Save/Update league settings
  save: async (settings) => {
    try {
      const database = checkFirebaseInit();
      const settingsRef = doc(database, 'leagueSettings', 'current');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving league settings:', error);
      throw error;
    }
  },

  // Real-time settings
  onSnapshot: (callback) => {
    const database = checkFirebaseInit();
    const settingsRef = doc(database, 'leagueSettings', 'current');
    return onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback({
          qualifiedPosition: 4,
          relegationPosition: 18,
          totalTeams: 20
        });
      }
    });
  }
};

// Seasons/Tournament collection functions
export const seasonsCollection = {
  // Get all seasons
  getAll: async () => {
    try {
      const database = checkFirebaseInit();
      const q = query(collection(database, 'seasons'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching seasons:', error);
      throw error;
    }
  },

  // Get a single season by ID
  getById: async (seasonId) => {
    try {
      const database = checkFirebaseInit();
      const seasonDoc = await getDoc(doc(database, 'seasons', seasonId));
      if (seasonDoc.exists()) {
        return { id: seasonDoc.id, ...seasonDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching season:', error);
      throw error;
    }
  },

  // Get active season
  getActive: async () => {
    try {
      const database = checkFirebaseInit();
      const q = query(
        collection(database, 'seasons'), 
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching active season:', error);
      throw error;
    }
  },

  // Create a new season
  create: async (seasonData) => {
    try {
      const database = checkFirebaseInit();
      const currentYear = new Date().getFullYear();
      
      const season = {
        name: seasonData.name || `5Star Premier League Season ${currentYear}`,
        year: seasonData.year || currentYear,
        isActive: seasonData.isActive || false,
        status: 'upcoming', // upcoming, ongoing, completed
        
        // Group stage configuration
        numberOfGroups: seasonData.numberOfGroups || 4,
        teamsPerGroup: seasonData.teamsPerGroup || 4,
        groups: seasonData.groups || [], // Array of {id, name, teams: []}
        
        // Knockout configuration
        knockoutConfig: {
          matchesPerRound: seasonData.knockoutConfig?.matchesPerRound || 2, // 1 = single leg, 2 = home & away
          rounds: seasonData.knockoutConfig?.rounds || [], // Array of knockout rounds
        },
        
        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(database, 'seasons'), season);
      return docRef.id;
    } catch (error) {
      console.error('Error creating season:', error);
      throw error;
    }
  },

  // Update a season
  update: async (seasonId, updates) => {
    try {
      const database = checkFirebaseInit();
      await updateDoc(doc(database, 'seasons', seasonId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating season:', error);
      throw error;
    }
  },

  // Set a season as active (deactivates all others)
  setActive: async (seasonId) => {
    try {
      const database = checkFirebaseInit();
      const batch = writeBatch(database);
      
      // Get all seasons
      const seasonsSnapshot = await getDocs(collection(database, 'seasons'));
      
      // Deactivate all seasons
      seasonsSnapshot.docs.forEach((seasonDoc) => {
        batch.update(seasonDoc.ref, { isActive: false });
      });
      
      // Activate the selected season
      batch.update(doc(database, 'seasons', seasonId), { 
        isActive: true,
        status: 'ongoing',
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error setting active season:', error);
      throw error;
    }
  },

  // Delete a season
  delete: async (seasonId) => {
    try {
      const database = checkFirebaseInit();
      await deleteDoc(doc(database, 'seasons', seasonId));
    } catch (error) {
      console.error('Error deleting season:', error);
      throw error;
    }
  },

  // Add a group to a season
  addGroup: async (seasonId, groupData) => {
    try {
      const database = checkFirebaseInit();
      const seasonRef = doc(database, 'seasons', seasonId);
      const seasonDoc = await getDoc(seasonRef);
      
      if (seasonDoc.exists()) {
        const season = seasonDoc.data();
        const groups = season.groups || [];
        const groupId = `group-${Date.now()}`;
        
        groups.push({
          id: groupId,
          name: groupData.name || `Group ${groups.length + 1}`,
          teams: groupData.teams || [],
          standings: [] // Will be calculated from fixtures
        });
        
        await updateDoc(seasonRef, {
          groups,
          updatedAt: serverTimestamp()
        });
        
        return groupId;
      }
    } catch (error) {
      console.error('Error adding group:', error);
      throw error;
    }
  },

  // Update a group in a season
  updateGroup: async (seasonId, groupId, groupData) => {
    try {
      const database = checkFirebaseInit();
      const seasonRef = doc(database, 'seasons', seasonId);
      const seasonDoc = await getDoc(seasonRef);
      
      if (seasonDoc.exists()) {
        const season = seasonDoc.data();
        const groups = season.groups || [];
        const groupIndex = groups.findIndex(g => g.id === groupId);
        
        if (groupIndex !== -1) {
          groups[groupIndex] = {
            ...groups[groupIndex],
            ...groupData,
            id: groupId // Preserve the ID
          };
          
          await updateDoc(seasonRef, {
            groups,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  },

  // Real-time listener for a single season
  onSnapshotById: (seasonId, callback) => {
    const database = checkFirebaseInit();
    return onSnapshot(doc(database, 'seasons', seasonId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    });
  },

  // Generate group fixtures
  generateGroupFixtures: async (seasonId) => {
    try {
      const database = checkFirebaseInit();
      const seasonDoc = await getDoc(doc(database, 'seasons', seasonId));
      
      if (!seasonDoc.exists()) return;
      
      const season = seasonDoc.data();
      const fixtures = [];
      
      // Generate fixtures for each group
      season.groups.forEach(group => {
        const teams = group.teams;
        
        // Round-robin: each team plays every other team
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            // Home fixture
            fixtures.push({
              seasonId,
              groupId: group.id,
              groupName: group.name,
              stage: 'group',
              homeTeamId: teams[i].id,
              awayTeamId: teams[j].id,
              status: 'upcoming',
              dateTime: null, // To be set by admin
              venue: null // To be set by admin
            });
            
            // Away fixture (return leg)
            fixtures.push({
              seasonId,
              groupId: group.id,
              groupName: group.name,
              stage: 'group',
              homeTeamId: teams[j].id,
              awayTeamId: teams[i].id,
              status: 'upcoming',
              dateTime: null,
              venue: null
            });
          }
        }
      });
      
      return fixtures;
    } catch (error) {
      console.error('Error generating group fixtures:', error);
      throw error;
    }
  },

  // Seed knockout stage from group qualifiers
  seedKnockoutStage: async (seasonId, qualifiersPerGroup = 2) => {
    try {
      const database = checkFirebaseInit();
      const seasonDoc = await getDoc(doc(database, 'seasons', seasonId));
      
      if (!seasonDoc.exists()) return;
      
      const season = seasonDoc.data();
      const qualifiedTeams = [];
      
      // Get top N teams from each group
      season.groups.forEach(group => {
        const standings = (group.standings || [])
          .sort((a, b) => b.points - a.points || (b.goalDifference - a.goalDifference))
          .slice(0, qualifiersPerGroup);
        
        standings.forEach((team, index) => {
          qualifiedTeams.push({
            teamId: team.teamId,
            team: team.team,
            groupId: group.id,
            groupPosition: index + 1,
            points: team.points
          });
        });
      });
      
      // Create knockout rounds
      const knockoutRounds = [];
      let currentRound = qualifiedTeams;
      let roundNumber = 1;
      
      while (currentRound.length > 1) {
        const roundName = currentRound.length === 2 ? 'Final' :
                         currentRound.length === 4 ? 'Semi-Finals' :
                         currentRound.length === 8 ? 'Quarter-Finals' :
                         `Round of ${currentRound.length}`;
        
        const matches = [];
        for (let i = 0; i < currentRound.length; i += 2) {
          matches.push({
            homeTeam: currentRound[i],
            awayTeam: currentRound[i + 1],
            matchNumber: (i / 2) + 1
          });
        }
        
        knockoutRounds.push({
          roundNumber,
          name: roundName,
          matches,
          completed: false
        });
        
        currentRound = currentRound.slice(0, currentRound.length / 2);
        roundNumber++;
      }
      
      await updateDoc(doc(database, 'seasons', seasonId), {
        'knockoutConfig.rounds': knockoutRounds,
        updatedAt: serverTimestamp()
      });
      
      return knockoutRounds;
    } catch (error) {
      console.error('Error seeding knockout stage:', error);
      throw error;
    }
  },

  // Real-time listener for seasons
  onSnapshot: (callback) => {
    const database = checkFirebaseInit();
    const q = query(collection(database, 'seasons'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const seasons = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(seasons);
    });
  }
};