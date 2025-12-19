import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './compact-text.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hide the pre-React splash as soon as the app mounts.
const splash = document.getElementById('pwa-splash')
if (splash) {
  requestAnimationFrame(() => {
    splash.classList.add('pwa-splash-hide')
    window.setTimeout(() => splash.remove(), 250)
  })
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use the Firebase Messaging service worker as the single controlling SW.
    // This avoids scope conflicts between multiple SWs and ensures background
    // notifications work consistently.
    navigator.serviceWorker.getRegistration('/')
      .then((existing) => existing || navigator.serviceWorker.register('/firebase-messaging-sw.js'))
      .catch((err) => {
        // AbortError is common during dev reloads / navigation.
        if (err?.name === 'AbortError') return;
        // eslint-disable-next-line no-console
        console.warn('Service worker registration failed:', err);
      });
  });
}
