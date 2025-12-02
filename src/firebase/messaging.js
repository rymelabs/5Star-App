import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getFirebaseApp } from './config';

let messaging = null;
let messagingSupported = null;

// Check if Firebase Messaging is supported
const checkMessagingSupport = async () => {
  if (messagingSupported !== null) {
    return messagingSupported;
  }
  
  try {
    messagingSupported = await isSupported();
    console.log('📱 Firebase Messaging supported:', messagingSupported);
    return messagingSupported;
  } catch (error) {
    console.warn('⚠️ Error checking messaging support:', error);
    messagingSupported = false;
    return false;
  }
};

// Initialize Firebase Cloud Messaging
export const initializeMessaging = async () => {
  try {
    const supported = await checkMessagingSupport();
    
    if (!supported) {
      console.warn('⚠️ Firebase Messaging is not supported in this environment');
      console.warn('💡 This is normal for localhost. Notifications will work in production (HTTPS)');
      return null;
    }
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported in this browser');
      return null;
    }
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported in this browser');
      return null;
    }
    
    const app = getFirebaseApp();
    
    // Try to initialize messaging - this can fail on localhost even if isSupported() returns true
    try {
      messaging = getMessaging(app);
      console.log('✅ Firebase Cloud Messaging initialized');
      return messaging;
    } catch (messagingError) {
      console.warn('💡 FCM not available:', messagingError.message);
      console.warn('💡 This is normal for localhost - FCM requires HTTPS in production');
      return null;
    }
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

    console.log('✅ Notification permission granted');

    // Check if messaging is supported
    const supported = await checkMessagingSupport();
    
    if (!supported) {
      console.warn('💡 FCM not available in this environment (localhost)');
      console.warn('💡 Notification preferences will be saved, but push notifications require production deployment');
      
      // Return success with a dummy token for testing
      // This allows UI to work and preferences to be saved
      const dummyToken = `dev-token-${Date.now()}`;
      console.log('💡 Using development mode - preferences will be saved');
      
      return { 
        success: true, 
        token: dummyToken,
        isDevMode: true,
        message: 'Notification preferences saved (push notifications require production deployment)'
      };
    }

    // Register service worker first
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered:', registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');
    } catch (swError) {
      console.error('❌ Service Worker registration failed:', swError);
      console.warn('💡 This is normal for localhost - service worker requires HTTPS in production');
      
      // Still allow enabling for development
      const dummyToken = `dev-token-${Date.now()}`;
      return { 
        success: true, 
        token: dummyToken,
        isDevMode: true,
        message: 'Notification preferences saved (service worker requires HTTPS)'
      };
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = await initializeMessaging();
      if (!messaging) {
        console.warn('💡 Messaging initialization failed - using development mode');
        const dummyToken = `dev-token-${Date.now()}`;
        return { 
          success: true, 
          token: dummyToken,
          isDevMode: true,
          message: 'Notification preferences saved (full functionality requires production deployment)'
        };
      }
    }

    // Get FCM registration token
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error('❌ VAPID key not configured. Add VITE_FIREBASE_VAPID_KEY to .env');
      console.error('Get your VAPID key from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates');
      
      // Still allow enabling for development
      const dummyToken = `dev-token-${Date.now()}`;
      return { 
        success: true, 
        token: dummyToken,
        isDevMode: true,
        message: 'Notification preferences saved (VAPID key required for push notifications)'
      };
    }

    const token = await getToken(messaging, { vapidKey });
    
    if (token) {
      console.log('✅ FCM token obtained:', token);
      return { success: true, token, isDevMode: false };
    } else {
      console.warn('⚠️ No registration token available');
      
      // Still allow enabling for development
      const dummyToken = `dev-token-${Date.now()}`;
      return { 
        success: true, 
        token: dummyToken,
        isDevMode: true,
        message: 'Notification preferences saved'
      };
    }
  } catch (error) {
    console.error('❌ Error in notification permission:', error);
    
    // For development, still allow enabling
    if (error.code === 'messaging/unsupported-browser' || 
        error.message.includes('not available') ||
        error.message.includes('localhost')) {
      console.warn('💡 Development mode - notifications will work in production');
      const dummyToken = `dev-token-${Date.now()}`;
      return { 
        success: true, 
        token: dummyToken,
        isDevMode: true,
        message: 'Notification preferences saved (push notifications require production deployment)'
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Listen for foreground messages
export const onForegroundMessage = async (callback) => {
  // Check if messaging is supported first
  const isSupported = await checkMessagingSupport();
  if (!isSupported) {
    console.log('💡 FCM not available - foreground message listener disabled');
    return () => {}; // Return empty cleanup function
  }

  if (!messaging) {
    messaging = await initializeMessaging();
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
      icon: payload.notification?.icon || '/Fivescores logo.svg',
      badge: payload.notification?.badge || '/Fivescores logo.svg',
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
export const getFirebaseMessaging = async () => {
  if (!messaging) {
    messaging = await initializeMessaging();
  }
  return messaging;
};

export { messaging };
