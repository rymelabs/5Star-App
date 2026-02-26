import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isDevelopment, getDomainInfo } from './config';

// Get auth and db instances
const auth = getFirebaseAuth();
const db = getFirebaseDb();

// Register new user
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, {
      displayName: userData.name
    });

    // Create user document in Firestore with role
    const userDoc = {
      uid: user.uid,
      name: userData.name,
      email: user.email,
      role: userData.role || 'user', // Use provided role or default to 'user'
      profileCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);

    return {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      role: userData.role || 'user',
      profileCompleted: false
    };
  } catch (error) {
    
    // Provide more user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    }
    
    throw new Error(errorMessage);
  }
};

// Login user (unchanged but with better logging)
export const loginUser = async (email, password) => {
  try {
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let userData;
    if (userDoc.exists()) {
      userData = {
        uid: user.uid,
        email: user.email,
        ...userDoc.data()
      };
    } else {
      // Fallback user data
      userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'User',
        role: 'user'
      };
    }

    return userData;
    
  } catch (error) {
    
    // Provide more user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password. Please check your credentials or create an account.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed login attempts. Please try again later.';
    }
    
    throw new Error(errorMessage);
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        callback({
          uid: user.uid,
          email: user.email,
          ...userDoc.data()
        });
      } else {
        callback({
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          role: 'user'
        });
      }
    } else {
      // User is signed out
      callback(null);
    }
  });
};

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user document for new Google user
      const newUserDoc = {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email,
        role: 'user',
        authProvider: 'google',
        profileCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), newUserDoc);
    }

    const userData = userDoc.exists() ? userDoc.data() : {};
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName || '',
      role: userData.role || 'user',
      authProvider: 'google',
      profileCompleted: userData.profileCompleted || false
    };
  } catch (error) {
    throw error;
  }
};

// Anonymous Sign In
export const signInAnonymous = async () => {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;

    return {
      uid: user.uid,
      email: null,
      name: 'Guest User',
      role: 'anonymous',
      authProvider: 'anonymous',
      isAnonymous: true,
      profileCompleted: false // Anonymous users never complete profile
    };
  } catch (error) {
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    // Update Firebase Auth profile
    if (updates.displayName) {
      await updateProfile(user, {
        displayName: updates.displayName
      });
    }

    // Update Firestore document
    const userDocRef = doc(db, 'users', user.uid);
    
    // Mark profile as completed if this is a profile setup update
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // If updating profile data, mark as completed for non-anonymous users
    if (updates.displayName || updates.bio || updates.favoriteTeam) {
      if (user.isAnonymous) {
        // Don't set profileCompleted for anonymous users
        updateData.profileCompleted = false;
      } else {
        updateData.profileCompleted = true;
      }
    }
    
    await setDoc(userDocRef, updateData, { merge: true });

    return {
      uid: user.uid,
      email: user.email,
      ...updateData
    };
  } catch (error) {
    throw error;
  }
};
