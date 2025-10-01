import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);

    console.log('✅ User registered successfully:', {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      role: userData.role || 'user'
    });

    return {
      uid: user.uid,
      email: user.email,
      name: userData.name,
      role: userData.role || 'user'
    };
  } catch (error) {
    console.error('❌ Registration error:', error);
    
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
    console.log('🔐 Attempting login for:', email);
    
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

    console.log('✅ Login successful:', userData);
    return userData;
    
  } catch (error) {
    console.error('❌ Login error:', error);
    
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
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw new Error(error.message);
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      console.log('👤 User state changed - signed in:', user.email);
      
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
      console.log('👤 User state changed - signed out');
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), newUserDoc);
    }

    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName || '',
      role: userDoc.exists() ? userDoc.data().role : 'user',
      authProvider: 'google'
    };
  } catch (error) {
    console.error('❌ Google sign-in error:', error);
    throw error;
  }
};

// Phone Number Sign In
export const signInWithPhone = async (phoneNumber) => {
  try {
    console.log('📱 Setting up phone authentication for:', phoneNumber);
    
    // Clear any existing reCAPTCHA verifier
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log('⚠️ Error clearing previous reCAPTCHA:', e);
      }
      window.recaptchaVerifier = null;
    }

    // Setup reCAPTCHA verifier - use normal size for better reliability
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
      callback: (response) => {
        console.log('✅ reCAPTCHA solved:', response);
      },
      'expired-callback': () => {
        console.log('⚠️ reCAPTCHA expired');
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      },
      'error-callback': (error) => {
        console.error('❌ reCAPTCHA error:', error);
      }
    });

    // Render the reCAPTCHA
    try {
      await window.recaptchaVerifier.render();
      console.log('✅ reCAPTCHA rendered successfully');
    } catch (renderError) {
      console.error('❌ reCAPTCHA render error:', renderError);
      throw new Error('Failed to initialize security verification. Please refresh the page and try again.');
    }

    console.log('📱 Sending verification SMS...');
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    console.log('✅ SMS sent successfully');
    return confirmationResult;
  } catch (error) {
    console.error('❌ Phone sign-in error:', error);
    
    // Clean up on error
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log('⚠️ Error clearing reCAPTCHA on error:', e);
      }
      window.recaptchaVerifier = null;
    }
    
    throw error;
  }
};

// Verify Phone Code
export const verifyPhoneCode = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user document for new phone user
      const newUserDoc = {
        uid: user.uid,
        name: '',
        email: user.email || '',
        phoneNumber: user.phoneNumber,
        role: 'user',
        authProvider: 'phone',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), newUserDoc);
    }

    return {
      uid: user.uid,
      email: user.email || '',
      phoneNumber: user.phoneNumber,
      name: userDoc.exists() ? userDoc.data().name : '',
      role: userDoc.exists() ? userDoc.data().role : 'user',
      authProvider: 'phone'
    };
  } catch (error) {
    console.error('❌ Phone verification error:', error);
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
      isAnonymous: true
    };
  } catch (error) {
    console.error('❌ Anonymous sign-in error:', error);
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
    await setDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return {
      uid: user.uid,
      email: user.email,
      ...updates
    };
  } catch (error) {
    console.error('❌ Profile update error:', error);
    throw error;
  }
};