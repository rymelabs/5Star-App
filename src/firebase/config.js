import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    
    // Create mock objects to prevent crashes
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.warn('🔥 Firebase not initialized due to missing configuration');
  console.warn('📝 Please create .env file with your Firebase configuration');
}

// Create safe exports that won't crash the app
const safeAuth = auth;
const safeDb = db;
const safeStorage = storage;

export { safeAuth as auth, safeDb as db, safeStorage as storage };
export default app;