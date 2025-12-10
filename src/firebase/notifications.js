import { 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  getDocs,
  getDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Create a notification record in Firestore
 * @param {string} userId - User ID to receive notification
 * @param {object} notificationData - Notification details
 */
export const createNotification = async (userId, notificationData) => {
  try {
    const db = getFirebaseDb();
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);

    const notification = {
      userId,
      type: notificationData.type, // 'fixture', 'match', 'article', etc.
      title: notificationData.title,
      body: notificationData.body,
      icon: notificationData.icon || '/Fivescores logo.svg',
      data: notificationData.data || {},
      read: false,
      delivered: false,
      createdAt: serverTimestamp(),
      expiresAt: notificationData.expiresAt || null // Optional expiration
    };

    const docRef = await addDoc(notificationsRef, notification);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {object} options - Query options (limit, unreadOnly, etc.)
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const db = getFirebaseDb();
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    
    let q = query(
      notificationsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Filter by read status if specified
    if (options.unreadOnly) {
      q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );
    }

    // Apply limit if specified
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null
    }));

    return { success: true, notifications };
  } catch (error) {
    return { success: false, error: error.message, notifications: [] };
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const db = getFirebaseDb();
    const notificationDoc = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    
    await updateDoc(notificationDoc, {
      read: true,
      readAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const db = getFirebaseDb();
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      });
    });

    await batch.commit();
    return { success: true, count: snapshot.size };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 */
export const deleteNotification = async (notificationId) => {
  try {
    const db = getFirebaseDb();
    const notificationDoc = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationDoc);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 */
export const getUnreadCount = async (userId) => {
  try {
    const db = getFirebaseDb();
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return { success: true, count: snapshot.size };
  } catch (error) {
    return { success: false, error: error.message, count: 0 };
  }
};

/**
 * Delete all notifications for a user
 * @param {string} userId - User ID
 */
export const deleteAllUserNotifications = async (userId) => {
  try {
    const db = getFirebaseDb();
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { success: true, count: snapshot.size };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
