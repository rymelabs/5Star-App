import React from 'react';
import { AuthProvider } from './AuthContext';
import { FootballProvider } from './FootballContext';
import { NewsProvider } from './NewsContext';
import { NotificationProvider } from './NotificationContext';
import { CompetitionsProvider } from './CompetitionsContext';
import { InstagramProvider } from './InstagramContext';

// Combined provider component
export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <FootballProvider>
        <NewsProvider>
          <CompetitionsProvider>
            <InstagramProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </InstagramProvider>
          </CompetitionsProvider>
        </NewsProvider>
      </FootballProvider>
    </AuthProvider>
  );
};

export default AppProvider;