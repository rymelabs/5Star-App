import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('5star_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      } catch (error) {
        localStorage.removeItem('5star_user');
      }
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - replace with actual API call
      const user = {
        id: 1,
        email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=22c55e&color=fff`,
        role: email.includes('admin') ? 'admin' : 'user',
      };
      
      localStorage.setItem('5star_user', JSON.stringify(user));
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = {
        id: Date.now(),
        ...userData,
        avatar: `https://ui-avatars.com/api/?name=${userData.name}&background=22c55e&color=fff`,
        role: 'user',
      };
      
      localStorage.setItem('5star_user', JSON.stringify(user));
      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: user });
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('5star_user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Update profile function
  const updateProfile = (updates) => {
    const updatedUser = { ...state.user, ...updates };
    localStorage.setItem('5star_user', JSON.stringify(updatedUser));
    dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE, payload: updates });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;