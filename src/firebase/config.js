import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Support both base64-encoded key (for Netlify) and plain key (for local dev / Firebase Hosting)
const apiKeyB64 = import.meta.env.VITE_FIREBASE_API_KEY_B64 || '';
const apiKeyPlain = import.meta.env.VITE_FIREBASE_API_KEY || '';

const firebaseConfig = {
  apiKey: apiKeyB64 ? atob(apiKeyB64) : apiKeyPlain,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Validate configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  // Show user-friendly error
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      alert('Firebase configuration is missing. Please check the console for setup instructions.');
    }, 1000);
  }
}

let app = null;
let auth = null;
let db = null;
let storage = null;
let functions = null;

// Only initialize Firebase if configuration is complete
if (missingKeys.length === 0) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    
  } catch (error) {
    
    // Create mock objects to prevent crashes
    auth = null;
    db = null;
    storage = null;
  }
} else {
}

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

// Helper accessors to guarantee initialized services
export const getFirebaseApp = () => {
  if (!app) {
    throw new Error('Firebase app has not been initialized. Ensure environment variables are set correctly.');
  }
  return app;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    throw new Error('Firebase auth has not been initialized. Check Firebase configuration and initialization logic.');
  }
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    throw new Error('Firestore has not been initialized. Check Firebase configuration and initialization logic.');
  }
  return db;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    throw new Error('Firebase storage has not been initialized. Check Firebase configuration and initialization logic.');
  }
  return storage;
};

export const getFirebaseFunctions = () => {
  if (!functions) {
    throw new Error('Firebase functions has not been initialized. Check Firebase configuration and initialization logic.');
  }
  return functions;
};

// Expose raw config (without hardcoded secrets) for service worker initialization
export const getFirebaseClientConfig = () => ({ ...firebaseConfig });

// Direct exports (may be null if not initialized)
export { auth, db, storage, functions };
export default app;
