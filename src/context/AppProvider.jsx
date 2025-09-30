import React from 'react';
import { AuthProvider } from './AuthContext';
import { FootballProvider } from './FootballContext';
import { NewsProvider } from './NewsContext';
import { NotificationProvider } from './NotificationContext';

// Combined provider component
export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <FootballProvider>
        <NewsProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </NewsProvider>
      </FootballProvider>
    </AuthProvider>
  );
};

export default AppProvider;