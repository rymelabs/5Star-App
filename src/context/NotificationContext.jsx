import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Check, X, AlertCircle, Info, Bell } from 'lucide-react';
import { useAuth } from './AuthContext';
import { 
  requestNotificationPermission, 
  onForegroundMessage 
} from '../firebase/messaging';
import { saveFCMToken, removeFCMToken } from '../firebase/fcmTokens';
import { 
  getUserNotifications, 
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead 
} from '../firebase/notifications';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const NotificationIcon = ({ type }) => {
  const icons = {
    success: Check,
    error: X,
    warning: AlertCircle,
    info: Info,
  };
  
  const Icon = icons[type] || Info;
  return <Icon className="w-5 h-5" />;
};

const Notification = ({ notification, onClose }) => {
  const colors = {
    success: 'bg-accent-600 border-accent-500 text-white',
    error: 'bg-red-600 border-red-500 text-white',
    warning: 'bg-yellow-600 border-yellow-500 text-white',
    info: 'bg-blue-600 border-blue-500 text-white',
  };

  return (
    <div className={`${colors[notification.type]} rounded-lg border p-4 shadow-lg flex items-center justify-between min-w-80 transform transition-all duration-300 ease-in-out`}>
      <div className="flex items-center">
        <NotificationIcon type={notification.type} />
        <div className="ml-3">
          <p className="font-medium">{notification.title}</p>
          {notification.message && (
            <p className="text-sm opacity-90">{notification.message}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onClose(notification.id)}
        className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]); // Toast notifications
  const [inboxNotifications, setInboxNotifications] = useState([]); // Firebase notifications
  const [unreadCount, setUnreadCount] = useState(0);
  const [fcmToken, setFcmToken] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { user: currentUser } = useAuth();

  // ========== Toast Notifications (existing functionality) ==========
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((title, message) => {
    return addNotification({ type: 'success', title, message });
  }, [addNotification]);

  const showError = useCallback((title, message) => {
    return addNotification({ type: 'error', title, message });
  }, [addNotification]);

  const showWarning = useCallback((title, message) => {
    return addNotification({ type: 'warning', title, message });
  }, [addNotification]);

  const showInfo = useCallback((title, message) => {
    return addNotification({ type: 'info', title, message });
  }, [addNotification]);

  // ========== FCM Push Notifications ==========
  
  // Request notification permission and get FCM token
  const requestPermission = useCallback(async () => {
    if (!currentUser) {
      showError('Error', 'You must be logged in to enable notifications');
      return { success: false };
    }

    const result = await requestNotificationPermission();
    
    if (result.success && result.token) {
      setFcmToken(result.token);
      setPermissionGranted(true);
      
      // Save token to Firestore
      await saveFCMToken(currentUser.uid, result.token);
      
      // Show appropriate success message
      if (result.isDevMode) {
        showInfo(
          'Development Mode', 
          result.message || 'Preferences saved. Push notifications will work when deployed to production (HTTPS).'
        );
      } else {
        showSuccess('Success', 'Notifications enabled!');
      }
      
      return { success: true, token: result.token };
    } else {
      showError('Permission Denied', result.error || 'Unable to enable notifications');
      return { success: false, error: result.error };
    }
  }, [currentUser, showSuccess, showError, showInfo]);

  // Load user notifications from Firestore
  const loadNotifications = useCallback(async (options = {}) => {
    if (!currentUser) return;

    try {
      const result = await getUserNotifications(currentUser.uid, options);
      if (result.success) {
        setInboxNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [currentUser]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!currentUser) return;

    try {
      const result = await getUnreadCount(currentUser.uid);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [currentUser]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update local state
      setInboxNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      const result = await markAllNotificationsAsRead(currentUser.uid);
      if (result.success) {
        setInboxNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        showSuccess('Success', 'All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      showError('Error', 'Failed to mark notifications as read');
    }
  }, [currentUser, showSuccess, showError]);

  // Initialize FCM when user logs in
  useEffect(() => {
    if (!currentUser) {
      setFcmToken(null);
      setPermissionGranted(false);
      setInboxNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Check if permission is already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      setPermissionGranted(true);
    }

    // Load initial data
    loadNotifications({ limit: 50 });
    loadUnreadCount();

    // Set up foreground message listener
    const unsubscribe = onForegroundMessage((notification) => {
      console.log('📬 Foreground notification received:', notification);
      
      // Show toast notification
      addNotification({
        type: 'info',
        title: notification.title,
        message: notification.body,
      });

      // Reload notifications and count
      loadNotifications({ limit: 50 });
      loadUnreadCount();
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser, loadNotifications, loadUnreadCount, addNotification]);

  // Clean up FCM token on logout
  useEffect(() => {
    if (!currentUser && fcmToken) {
      removeFCMToken(fcmToken);
    }
  }, [currentUser, fcmToken]);

  const value = {
    // Toast notifications
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // FCM notifications
    inboxNotifications,
    unreadCount,
    fcmToken,
    permissionGranted,
    requestPermission,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;