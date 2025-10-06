import React from 'react';
import { AuthProvider } from './AuthContext';
import { FootballProvider } from './FootballContext';
import { NewsProvider } from './NewsContext';
import { NotificationProvider } from './NotificationContext';
import { CompetitionsProvider } from './CompetitionsContext';
import { InstagramProvider } from './InstagramContext';
import { LanguageProvider } from './LanguageContext';

// Combined provider component
export const AppProvider = ({ children }) => {
  return (
    <LanguageProvider>
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
    </LanguageProvider>
  );
};

export default AppProvider;