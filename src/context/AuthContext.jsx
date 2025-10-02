import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  onAuthStateChange,
  signInWithGoogle,
  signInAnonymous,
  updateUserProfile
} from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    
    // Check if Firebase is configured
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      console.warn('🔥 Firebase not configured - auth will not work');
      setLoading(false);
      setError('Firebase configuration missing. Please set up your .env file.');
      return;
    }
    
    try {
      const unsubscribe = onAuthStateChange((userData) => {
        console.log('🔄 Auth state changed:', userData ? `User: ${userData.email}` : 'No user');
        setUser(userData);
        setLoading(false);
      });

      return () => {
        console.log('🔄 Cleaning up auth state listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up auth listener:', error);
      setLoading(false);
      setError('Failed to initialize authentication');
    }
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔄 Registering user:', userData.email);
      
      const newUser = await registerUser(userData.email, userData.password, userData);
      console.log('✅ Registration successful, setting user state:', newUser);
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔄 Logging in user:', email);
      
      const userData = await loginUser(email, password);
      console.log('✅ Login successful, setting user state:', userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('❌ Login failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      console.log('🔄 Logging out user');
      
      await logoutUser();
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      setError(error.message);
      throw error;
    }
  };

  // Debug current state
  console.log('🔍 AuthContext current state:', {
    user: user ? `${user.email} (${user.role})` : 'null',
    loading,
    error
  });

  const signInWithGoogleProvider = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔄 Signing in with Google');
      
      const userData = await signInWithGoogle();
      console.log('✅ Google sign-in successful:', userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };



  const signInAnonymousProvider = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔄 Signing in anonymously');
      
      const userData = await signInAnonymous();
      console.log('✅ Anonymous sign-in successful:', userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('❌ Anonymous sign-in failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔄 Updating profile:', updates);
      
      const updatedUser = await updateUserProfile(updates);
      console.log('✅ Profile updated successfully:', updatedUser);
      
      // Update local user state
      setUser(prev => ({ ...prev, ...updatedUser }));
      return updatedUser;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    signInWithGoogle: signInWithGoogleProvider,
    signInAnonymously: signInAnonymousProvider,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};