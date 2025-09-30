import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
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