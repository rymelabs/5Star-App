import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isDevelopment, getDomainInfo } from './config';

// Get auth and db instances
const auth = getFirebaseAuth();
const db = getFirebaseDb();

// Set persistence to LOCAL to survive page reloads/redirects
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Failed to set auth persistence:', err);
});

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
      
      // Get the ID token result to check custom claims
      let tokenClaims = {};
      try {
        const tokenResult = await user.getIdTokenResult();
        tokenClaims = tokenResult.claims || {};
      } catch (e) {
        console.warn('Could not get token claims:', e);
      }
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check if role in Firestore doesn't match token claims - may need token refresh
        const firestoreRole = userData.role || 'user';
        const tokenRole = tokenClaims.role;
        const isAdminInFirestore = firestoreRole === 'admin' || firestoreRole === 'super-admin';
        const isAdminInToken = tokenClaims.admin === true;
        
        // If Firestore says admin but token doesn't have admin claim, force refresh
        if (isAdminInFirestore && !isAdminInToken) {
          console.warn('Admin role mismatch: Firestore role is admin but token missing admin claim. Refreshing token...');
          try {
            await user.getIdToken(true); // Force refresh
            const refreshedToken = await user.getIdTokenResult();
            tokenClaims = refreshedToken.claims || {};
            console.log('Token refreshed. Admin claim:', tokenClaims.admin);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
        
        callback({
          uid: user.uid,
          email: user.email,
          firebaseUser: user, // Include Firebase user for token operations
          tokenClaims, // Include token claims for debugging
          ...userData
        });
      } else {
        callback({
          uid: user.uid,
          email: user.email,
          firebaseUser: user,
          tokenClaims,
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

// Detect if mobile browser
const isMobileBrowser = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper to process Google sign-in result
const processGoogleUser = async (user) => {
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
};

// Google Sign In - tries popup first, falls back to redirect on mobile
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  // Always try popup first - it works on most mobile browsers now
  try {
    console.log('Attempting Google sign-in with popup...');
    const result = await signInWithPopup(auth, provider);
    console.log('Popup sign-in successful:', result.user.email);
    return await processGoogleUser(result.user);
  } catch (popupError) {
    console.log('Popup failed:', popupError.code, popupError.message);
    
    // If popup was blocked or closed, try redirect on mobile
    if (isMobileBrowser() && 
        (popupError.code === 'auth/popup-blocked' || 
         popupError.code === 'auth/popup-closed-by-user' ||
         popupError.code === 'auth/cancelled-popup-request')) {
      console.log('Falling back to redirect sign-in...');
      // Store a flag so we know we're expecting a redirect result
      sessionStorage.setItem('googleSignInPending', 'true');
      await signInWithRedirect(auth, provider);
      return null;
    }
    
    // Re-throw other errors
    throw popupError;
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

// Handle Google redirect result (call this on app initialization)
export const handleGoogleRedirectResult = async () => {
  try {
    // Check if we were expecting a redirect
    const wasPending = sessionStorage.getItem('googleSignInPending');
    console.log('Checking for Google redirect result... (pending flag:', wasPending, ')');
    
    const result = await getRedirectResult(auth);
    
    // Clear the pending flag
    sessionStorage.removeItem('googleSignInPending');
    
    if (result && result.user) {
      const user = result.user;
      console.log('Google redirect result found for:', user.email);
      await processGoogleUser(user);
      return user;
    }
    
    // If we were expecting a result but didn't get one, the user might already be signed in
    // via the auth state observer - check current user
    if (wasPending && auth.currentUser) {
      console.log('Redirect pending but user already signed in:', auth.currentUser.email);
      return auth.currentUser;
    }
    
    console.log('No Google redirect result pending');
    return null;
  } catch (error) {
    // Clear the pending flag on error too
    sessionStorage.removeItem('googleSignInPending');
    
    // Common errors to handle gracefully
    if (error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/cancelled-popup-request') {
      console.log('User cancelled sign-in');
      return null;
    }
    
    console.error('Google redirect result error:', error.code, error.message);
    throw error;
  }
};

// Force refresh the current user's ID token to get latest custom claims
export const forceTokenRefresh = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user signed in');
  }
  
  try {
    await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();
    console.log('Token refreshed. Claims:', tokenResult.claims);
    return tokenResult.claims;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
};

// Get current user's token claims
export const getTokenClaims = async () => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  
  try {
    const tokenResult = await user.getIdTokenResult();
    return tokenResult.claims;
  } catch (error) {
    console.error('Failed to get token claims:', error);
    return null;
  }
};
