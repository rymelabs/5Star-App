import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
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
import { db } from './config';

// Helper function to check if Firebase is initialized
const checkFirebaseInit = () => {
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
      const docRef = await addDoc(collection(db, 'teams'), {
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
      const batch = writeBatch(db);
      const teamsCollection = collection(db, 'teams');
      
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
      const teamRef = doc(db, 'teams', teamId);
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
      await deleteDoc(doc(db, 'teams', teamId));
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }
};

// Fixtures collection functions
export const fixturesCollection = {
  // Get all fixtures
  getAll: async () => {
    try {
      const q = query(collection(db, 'fixtures'), orderBy('dateTime', 'desc'));
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

  // Add new fixture
  add: async (fixtureData) => {
    try {
      const docRef = await addDoc(collection(db, 'fixtures'), {
        ...fixtureData,
        dateTime: new Date(fixtureData.dateTime),
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
      const fixtureRef = doc(db, 'fixtures', fixtureId);
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
    const q = query(collection(db, 'fixtures'), orderBy('dateTime', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const fixtures = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime?.toDate?.() || new Date(doc.data().dateTime)
      }));
      callback(fixtures);
    });
  }
};

// News collection functions
export const newsCollection = {
  // Get all articles
  getAll: async () => {
    try {
      const q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'));
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
      const docRef = doc(db, 'articles', articleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          publishedAt: docSnap.data().publishedAt?.toDate?.() || new Date(docSnap.data().publishedAt)
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  // Add new article
  add: async (articleData) => {
    try {
      const docRef = await addDoc(collection(db, 'articles'), {
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
  }
};

// Comments collection functions
export const commentsCollection = {
  // Get comments for a specific item (fixture or article)
  getForItem: async (itemType, itemId) => {
    try {
      const q = query(
        collection(db, 'comments'),
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

  // Add new comment
  add: async (commentData) => {
    try {
      const docRef = await addDoc(collection(db, 'comments'), {
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
    const q = query(
      collection(db, 'comments'),
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
      const q = query(
        collection(db, 'leagueTable'),
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
      const teamRef = doc(db, 'leagueTable', teamId);
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