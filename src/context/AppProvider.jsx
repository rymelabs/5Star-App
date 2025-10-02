import React from 'react';
import { AuthProvider } from './AuthContext';
import { FootballProvider } from './FootballContext';
import { NewsProvider } from './NewsContext';
import { NotificationProvider } from './NotificationContext';
import { CompetitionsProvider } from './CompetitionsContext';

// Combined provider component
export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <FootballProvider>
        <NewsProvider>
          <CompetitionsProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </CompetitionsProvider>
        </NewsProvider>
      </FootballProvider>
    </AuthProvider>
  );
};

export default AppProvider;