import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

// FCM Token Management
const FCM_TOKENS_COLLECTION = 'fcmTokens';

/**
 * Save or update FCM token for a user
 * @param {string} userId - User ID
 * @param {string} token - FCM registration token
 * @param {object} deviceInfo - Device information (browser, OS, etc.)
 */
export const saveFCMToken = async (userId, token, deviceInfo = {}) => {
  try {
    const db = getFirebaseDb();
    const tokenDoc = doc(db, FCM_TOKENS_COLLECTION, token);

    await setDoc(tokenDoc, {
      userId,
      token,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        ...deviceInfo
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastUsed: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Remove FCM token (e.g., on logout or token refresh)
 * @param {string} token - FCM registration token
 */
export const removeFCMToken = async (token) => {
  try {
    const db = getFirebaseDb();
    const tokenDoc = doc(db, FCM_TOKENS_COLLECTION, token);
    await deleteDoc(tokenDoc);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get all FCM tokens for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of token objects
 */
export const getUserFCMTokens = async (userId) => {
  try {
    const db = getFirebaseDb();
    const tokensRef = collection(db, FCM_TOKENS_COLLECTION);
    const q = query(tokensRef, where('userId', '==', userId));
    
    const snapshot = await getDocs(q);
    const tokens = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, tokens };
  } catch (error) {
    return { success: false, error: error.message, tokens: [] };
  }
};

/**
 * Remove all FCM tokens for a user (e.g., on account deletion)
 * @param {string} userId - User ID
 */
export const removeAllUserFCMTokens = async (userId) => {
  try {
    const result = await getUserFCMTokens(userId);
    if (!result.success) {
      return result;
    }

    const db = getFirebaseDb();
    const deletePromises = result.tokens.map(tokenData => 
      deleteDoc(doc(db, FCM_TOKENS_COLLECTION, tokenData.id))
    );

    await Promise.all(deletePromises);
    return { success: true, count: result.tokens.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
