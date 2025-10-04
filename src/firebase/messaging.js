import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirebaseApp } from './config';

let messaging = null;

// Initialize Firebase Cloud Messaging
export const initializeMessaging = () => {
  try {
    const app = getFirebaseApp();
    messaging = getMessaging(app);
    console.log('✅ Firebase Cloud Messaging initialized');
    return messaging;
  } catch (error) {
    console.error('❌ Error initializing FCM:', error);
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return { success: false, error: 'Notifications not supported' };
    }

    // Check current permission status
    if (Notification.permission === 'denied') {
      console.warn('⚠️ Notification permission denied by user');
      return { success: false, error: 'Permission denied' };
    }

    // Request permission if not granted
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ User denied notification permission');
        return { success: false, error: 'Permission denied by user' };
      }
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = initializeMessaging();
      if (!messaging) {
        return { success: false, error: 'Failed to initialize messaging' };
      }
    }

    // Get FCM registration token
    // NOTE: You need to add your VAPID key from Firebase Console > Project Settings > Cloud Messaging
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error('❌ VAPID key not configured. Add VITE_FIREBASE_VAPID_KEY to .env');
      console.error('Get your VAPID key from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates');
      return { success: false, error: 'VAPID key not configured' };
    }

    const token = await getToken(messaging, { vapidKey });
    
    if (token) {
      console.log('✅ FCM token obtained:', token);
      return { success: true, token };
    } else {
      console.warn('⚠️ No registration token available');
      return { success: false, error: 'No token available' };
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return { success: false, error: error.message };
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    messaging = initializeMessaging();
    if (!messaging) {
      console.error('❌ Cannot listen for messages: messaging not initialized');
      return () => {};
    }
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 Foreground message received:', payload);
    
    // Extract notification data
    const notificationData = {
      title: payload.notification?.title || 'New Notification',
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/5Star-Logo.png',
      badge: payload.notification?.badge || '/5Star-Logo.png',
      data: payload.data || {},
      timestamp: new Date().toISOString()
    };

    // Call the callback with notification data
    callback(notificationData);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        data: notificationData.data,
        requireInteraction: false,
        tag: notificationData.data.type || 'default'
      });
    }
  });
};

// Get messaging instance
export const getFirebaseMessaging = () => {
  if (!messaging) {
    messaging = initializeMessaging();
  }
  return messaging;
};

export { messaging };
