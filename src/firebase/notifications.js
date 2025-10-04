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
      icon: notificationData.icon || '/5Star-Logo.png',
      data: notificationData.data || {},
      read: false,
      delivered: false,
      createdAt: serverTimestamp(),
      expiresAt: notificationData.expiresAt || null // Optional expiration
    };

    const docRef = await addDoc(notificationsRef, notification);
    console.log('✅ Notification created:', docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error creating notification:', error);
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

    console.log(`✅ Retrieved ${notifications.length} notifications for user:`, userId);
    return { success: true, notifications };
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
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

    console.log('✅ Notification marked as read:', notificationId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
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
      console.log('✅ No unread notifications to mark');
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
    console.log(`✅ Marked ${snapshot.size} notifications as read`);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
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
    
    console.log('✅ Notification deleted:', notificationId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
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
    console.log(`✅ Unread count for user ${userId}: ${snapshot.size}`);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
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
      console.log('✅ No notifications to delete');
      return { success: true, count: 0 };
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Deleted ${snapshot.size} notifications`);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('❌ Error deleting all notifications:', error);
    return { success: false, error: error.message };
  }
};
