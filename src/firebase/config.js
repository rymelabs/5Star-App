import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Debug environment variables first
console.log('🔧 Environment variables debug:', {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? 'SET' : 'MISSING',
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING',
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ? 'SET' : 'MISSING'
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
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
  console.error('🔥 Firebase Configuration Error!');
  console.error('Missing Firebase configuration keys:', missingKeys);
  console.error('Please create a .env file with your Firebase configuration.');
  console.error('Copy .env.example to .env and fill in your Firebase project details.');
  console.error('Get your config from: Firebase Console > Project Settings > General > Your apps');
  
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

// Only initialize Firebase if configuration is complete
if (missingKeys.length === 0) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log('📱 Project ID:', firebaseConfig.projectId);
    console.log('📱 Auth Domain:', firebaseConfig.authDomain);
    console.log('📱 API Key:', firebaseConfig.apiKey ? 'SET' : 'MISSING');
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Firebase config used:', firebaseConfig);
    
    // Create mock objects to prevent crashes
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.warn('🔥 Firebase not initialized due to missing configuration');
  console.warn('📝 Please create .env file with your Firebase configuration');
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
    console.error('❌ Firebase app not initialized');
    console.error('❌ Missing keys:', missingKeys);
    throw new Error('Firebase app has not been initialized. Ensure environment variables are set correctly.');
  }
  return app;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    console.error('❌ Firebase auth not initialized');
    console.error('❌ Missing keys:', missingKeys);
    throw new Error('Firebase auth has not been initialized. Check Firebase configuration and initialization logic.');
  }
  console.log('✅ Returning auth instance');
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    console.error('❌ Firestore not initialized');
    throw new Error('Firestore has not been initialized. Check Firebase configuration and initialization logic.');
  }
  return db;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    console.error('❌ Firebase storage not initialized');
    throw new Error('Firebase storage has not been initialized. Check Firebase configuration and initialization logic.');
  }
  return storage;
};

// Direct exports (may be null if not initialized)
export { auth, db, storage };
export default app;