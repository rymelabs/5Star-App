import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getFirebaseApp, getFirebaseClientConfig } from './config';

let messaging = null;
let messagingSupported = null;

// Check if Firebase Messaging is supported
const checkMessagingSupport = async () => {
  if (messagingSupported !== null) {
    return messagingSupported;
  }
  
  try {
    messagingSupported = await isSupported();
    return messagingSupported;
  } catch (error) {
    messagingSupported = false;
    return false;
  }
};

// Initialize Firebase Cloud Messaging
export const initializeMessaging = async () => {
  try {
    const supported = await checkMessagingSupport();
    
    if (!supported) {
      return null;
    }
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return null;
    }
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      return null;
    }
    
    const app = getFirebaseApp();
    
    // Try to initialize messaging - this can fail on localhost even if isSupported() returns true
    try {
      messaging = getMessaging(app);
      return messaging;
    } catch (messagingError) {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return { success: false, error: 'Notifications not supported' };
    }

    // Check current permission status
    if (Notification.permission === 'denied') {
      return { success: false, error: 'Permission denied' };
    }

    // Request permission if not granted
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Permission denied by user' };
      }
    }


    // Check if messaging is supported
    const supported = await checkMessagingSupport();
    
    if (!supported) {
      
      // Return success with a dummy token for testing
      // This allows UI to work and preferences to be saved
      const dummyToken = `dev-token-${Date.now()}`;
      
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

      // Wait for service worker to be ready and send runtime config (avoids hardcoded keys in SW)
      const readyRegistration = await navigator.serviceWorker.ready;
      const activeSw = readyRegistration.active || registration.active;
      if (activeSw) {
        activeSw.postMessage({
          type: 'INIT_FIREBASE',
          config: getFirebaseClientConfig(),
        });
      }
    } catch (swError) {
      
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
      
      // Still allow enabling for development
      const dummyToken = `dev-token-${Date.now()}`;
      return { 
        success: true, 
        token: dummyToken,
        isDevMode: true,
        message: 'Notification preferences saved (VAPID key required for push notifications)'
      };
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
    
    if (token) {
      return { success: true, token, isDevMode: false };
    } else {
      
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
    
    // For development, still allow enabling
    if (error.code === 'messaging/unsupported-browser' || 
        error.message.includes('not available') ||
        error.message.includes('localhost')) {
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
    return () => {}; // Return empty cleanup function
  }

  if (!messaging) {
    messaging = await initializeMessaging();
    if (!messaging) {
      return () => {};
    }
  }

  return onMessage(messaging, (payload) => {
    
    // Extract notification data
    const notificationData = {
      title: payload.notification?.title || 'New Notification',
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/icons/icon-192.png',
      badge: payload.notification?.badge || '/icons/icon-192.png',
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
