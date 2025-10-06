import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import NotificationModal from './NotificationModal';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    // Show notification modal for authenticated users
    if (user && user.uid) {
      // Check if user has seen notifications in this session
      const hasSeenInSession = sessionStorage.getItem('hasSeenNotifications');
      
      if (!hasSeenInSession) {
        // Small delay to let the app load
        const timer = setTimeout(() => {
          setShowNotificationModal(true);
          sessionStorage.setItem('hasSeenNotifications', 'true');
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto bg-black pt-16 pb-24">
        {children}
      </main>
      <BottomNavigation />
      
      {/* Notification Modal */}
      {showNotificationModal && user && (
        <NotificationModal 
          userId={user.uid} 
          onClose={handleCloseNotificationModal} 
        />
      )}
    </div>
  );
};

export default Layout;