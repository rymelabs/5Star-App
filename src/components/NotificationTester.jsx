import React, { useState } from 'react';
import NotificationModal from '../components/NotificationModal';
import { useAuth } from '../context/AuthContext';

// TEMPORARY TESTING COMPONENT
// Add this to Latest.jsx temporarily to test the modal

const NotificationTester = () => {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <button
        onClick={() => {
          // Clear session storage
          sessionStorage.removeItem('hasSeenNotifications');
          sessionStorage.removeItem('lastNotificationCheck');
          // Show modal
          setShowModal(true);
        }}
        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-lg font-medium"
      >
        🔔 Test Notification Modal
      </button>

      {showModal && user && (
        <NotificationModal 
          userId={user.uid} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
};

export default NotificationTester;

/*
USAGE:
1. Import this in Latest.jsx:
   import NotificationTester from '../components/NotificationTester';

2. Add this before the closing </div> in Latest.jsx:
   <NotificationTester />

3. A purple button will appear in the bottom right
4. Click it to manually test the notification modal
5. Remove after testing
*/
