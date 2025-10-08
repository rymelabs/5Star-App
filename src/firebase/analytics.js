import { getDocs, getDoc, collection, doc } from 'firebase/firestore';
import { getFirebaseDb } from './config';

const checkDb = () => {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not initialized');
  return db;
};

export const analyticsService = {
  // Read aggregated daily metrics by date key 'YYYY-MM-DD'
  getDailyByDate: async (dateKey) => {
    try {
      const db = checkDb();
      const ref = doc(db, 'analytics', 'daily', 'byDate', dateKey);
      // Note: Firestore path here may differ if you use collection groups; try getDoc
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error('analyticsService.getDailyByDate error', error);
      throw error;
    }
  },

  // List recent daily documents (simple implementation)
  listRecentDaily: async (limit = 14) => {
    try {
      const db = checkDb();
      const collectionRef = collection(db, 'analytics', 'daily', 'byDate');
      const snaps = await getDocs(collectionRef);
      return snaps.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=> b.date.localeCompare(a.date)).slice(0, limit);
    } catch (error) {
      console.error('analyticsService.listRecentDaily error', error);
      throw error;
    }
  }
};
