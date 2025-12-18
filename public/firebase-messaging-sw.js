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

// Initialize the Firebase app in the service worker
// Firebase web config values are not secrets; they identify the project.
firebase.initializeApp({
  apiKey: "AIzaSyBdtawVAtXKwyA1F8sqzNK5TbjbAHS1QYQ",
  authDomain: "starsapp-e27d1.firebaseapp.com",
  projectId: "starsapp-e27d1",
  storageBucket: "starsapp-e27d1.firebasestorage.app",
  messagingSenderId: "1062173096121",
  appId: "1:1062173096121:web:f7fb86663e1924ff470368"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
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
