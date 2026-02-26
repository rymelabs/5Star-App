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

const deriveAuthState = (rawUser) => {
  if (!rawUser) return 'guest';
  return rawUser.isAnonymous ? 'anonymous' : 'authenticated';
};

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;

  const role = rawUser.role || 'user';
  const displayName = rawUser.displayName || rawUser.name || rawUser.email || '';

  return {
    ...rawUser,
    role,
    displayName,
    name: rawUser.name || displayName,
     isAnonymous: Boolean(rawUser.isAnonymous),
    isAdmin: role === 'admin' || role === 'super-admin',
    isSuperAdmin: role === 'super-admin'
  };
};

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
  const [authState, setAuthState] = useState('guest');

  useEffect(() => {
    
    // Check if Firebase is configured
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      setLoading(false);
      setError('Firebase configuration missing. Please set up your .env file.');
      return;
    }
    
    try {
      const unsubscribe = onAuthStateChange((userData) => {
        setUser(normalizeUser(userData));
        setAuthState(deriveAuthState(userData));
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      setLoading(false);
      setError('Failed to initialize authentication');
    }
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const newUser = await registerUser(userData.email, userData.password, userData);
      const normalized = normalizeUser(newUser);
      setUser(normalized);
      setAuthState('authenticated');
      return normalized;
    } catch (error) {
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
      
      const userData = await loginUser(email, password);
      const normalized = normalizeUser(userData);
      setUser(normalized);
      setAuthState('authenticated');
      return normalized;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      
      await logoutUser();
      setUser(null);
      setAuthState('guest');
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  const signInWithGoogleProvider = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const userData = await signInWithGoogle();
      const normalized = normalizeUser(userData);
      setUser(normalized);
      setAuthState('authenticated');
      return normalized;
    } catch (error) {
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
      
      const userData = await signInAnonymous();
      const normalized = normalizeUser(userData);
      setUser(normalized);
      setAuthState('anonymous');
      return normalized;
    } catch (error) {
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
      
      const updatedUser = await updateUserProfile(updates);
      
      // Update local user state
      const normalized = normalizeUser({ ...user, ...updatedUser });
      setUser(normalized);
      return normalized;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isGuest = authState === 'guest';
  const isAnonymous = authState === 'anonymous';
  const isAuthenticated = authState === 'authenticated';

  const value = {
    user,
    loading,
    error,
    authState,
    isGuest,
    isAnonymous,
    isAuthenticated,
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
