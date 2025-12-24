// Firebase Cloud Messaging Service Worker
// This service worker handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Basic PWA lifecycle hooks (kept lightweight).
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Pass-through fetch handler so the SW is considered an app SW by more user agents.
self.addEventListener('fetch', () => {});

// Firebase config will be provided at runtime from the main app (no hardcoded keys here).
let messaging = null;
let firebaseInitialized = false;

// Receive config from the main thread and initialize lazily.
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'INIT_FIREBASE' && event.data.config && !firebaseInitialized) {
    try {
      firebase.initializeApp(event.data.config);
      messaging = firebase.messaging();
      firebaseInitialized = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to init Firebase in SW:', err);
    }
  }
});

// Handle background messages (only after messaging is initialized)
const handleBackgroundMessage = (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Customize notification
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192.png',
    badge: payload.notification?.badge || '/icons/icon-192.png',
    data: payload.data || {},
    requireInteraction: false,
    tag: payload.data?.type || 'default',
    vibrate: [200, 100, 200],
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : []
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
};

// Wire background handler when messaging becomes available
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'INIT_FIREBASE' && messaging && firebaseInitialized) {
    messaging.onBackgroundMessage(handleBackgroundMessage);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);

  event.notification.close();

  // Get the URL to open from notification data
  const urlToOpen = event.notification.data?.url || '/';
  const targetUrl = new URL(urlToOpen, self.location.origin).toString();

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if ((client.url === targetUrl || client.url.endsWith(urlToOpen)) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
