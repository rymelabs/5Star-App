import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

/**
 * Firebase Configuration
 * 
 * Uses environment variables with fallback defaults.
 * 
 * NOTE: Firebase API keys are designed to be PUBLIC and are NOT secrets.
 * Security is enforced through:
 * - Firebase Security Rules (Firestore, Storage)
 * - Firebase App Check (optional)
 * - Domain restrictions in Firebase Console
 * 
 * See: https://firebase.google.com/docs/projects/api-keys
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBdtawVAtXKwyA1F8sqzNK5TbjbAHS1QYQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "starsapp-e27d1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "starsapp-e27d1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "starsapp-e27d1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1062173096121",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1062173096121:web:f7fb86663e1924ff470368",
  measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || "G-TEXQZBETKG"
};

//testing for github push
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Helper function to check if we're in development
export const isDevelopment = () => {
  return import.meta.env.MODE === 'development' || 
         import.meta.env.VITE_NODE_ENV === 'development' ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

// Helper function to get current domain info
export const getDomainInfo = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  return {
    hostname,
    port,
    protocol,
    fullDomain: port ? `${hostname}:${port}` : hostname,
    isDev: isDevelopment()
  };
};

// Helper accessors for services
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;
export const getFirebaseStorage = () => storage;
export const getFirebaseFunctions = () => functions;

// Expose raw config for service worker initialization
export const getFirebaseClientConfig = () => ({ ...firebaseConfig });

// Direct exports
export { app, auth, db, storage, functions };
export default app;
