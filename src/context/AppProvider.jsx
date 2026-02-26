import React from 'react';
import { AuthProvider } from './AuthContext';
import { FootballProvider } from './FootballContext';
import { NewsProvider } from './NewsContext';
import { NotificationProvider } from './NotificationContext';
import { CompetitionsProvider } from './CompetitionsContext';
import { InstagramProvider } from './InstagramContext';
import { LanguageProvider } from './LanguageContext';
import { RecycleBinProvider } from './RecycleBinContext';

// Combined provider component
export const AppProvider = ({ children }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FootballProvider>
          <NewsProvider>
            <CompetitionsProvider>
              <InstagramProvider>
                <RecycleBinProvider>
                  <NotificationProvider>
                    {children}
                  </NotificationProvider>
                </RecycleBinProvider>
              </InstagramProvider>
            </CompetitionsProvider>
          </NewsProvider>
        </FootballProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default AppProvider;
