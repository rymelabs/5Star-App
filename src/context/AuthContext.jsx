import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerUser, loginUser, logoutUser, onAuthStateChange } from '../firebase/auth';

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
    
    const unsubscribe = onAuthStateChange((userData) => {
      console.log('🔄 Auth state changed:', userData ? `User: ${userData.email}` : 'No user');
      setUser(userData);
      setLoading(false);
    });

    return () => {
      console.log('🔄 Cleaning up auth state listener');
      unsubscribe();
    };
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

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};