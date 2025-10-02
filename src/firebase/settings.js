import { 
  doc, 
  getDoc,
  setDoc, 
  updateDoc,
  serverTimestamp
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

/**
 * Settings collection functions
 * Stores user preferences in Firestore for authenticated users
 */
export const settingsCollection = {
  /**
   * Get user settings from Firestore
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} User settings or null if not found
   */
  get: async (userId) => {
    try {
      const db = checkFirebaseInit();
      const settingsRef = doc(db, 'userSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  /**
   * Save or update user settings in Firestore
   * @param {string} userId - The user's ID
   * @param {Object} settings - Settings object to save
   * @returns {Promise<void>}
   */
  save: async (userId, settings) => {
    try {
      const db = checkFirebaseInit();
      const settingsRef = doc(db, 'userSettings', userId);
      
      // Check if document exists
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        // Update existing settings
        await updateDoc(settingsRef, {
          ...settings,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new settings document
        await setDoc(settingsRef, {
          ...settings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      
      // Provide more helpful error messages
      if (error.code === 'permission-denied') {
        console.error('❌ Firestore permission denied. Please update Firestore security rules.');
        console.error('📋 See FIRESTORE_RULES_UPDATE.md for instructions.');
        error.message = 'Firestore permissions not configured. Settings will be saved locally.';
      }
      
      throw error;
    }
  },

  /**
   * Update specific settings fields
   * @param {string} userId - The user's ID
   * @param {Object} updates - Partial settings object to update
   * @returns {Promise<void>}
   */
  update: async (userId, updates) => {
    try {
      const db = checkFirebaseInit();
      const settingsRef = doc(db, 'userSettings', userId);
      
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  /**
   * Get default settings object
   * @returns {Object} Default settings
   */
  getDefaults: () => ({
    notifications: {
      push: true,
      email: false,
      matchUpdates: true,
      newsAlerts: false,
    },
    darkMode: true,
    language: 'en',
  }),
};

export default settingsCollection;
