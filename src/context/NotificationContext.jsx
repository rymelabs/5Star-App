import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Check, X, AlertCircle, Info, Bell } from 'lucide-react';
import Toast from '../components/Toast';
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

const NotificationContext = createContext(null);

// Default values when context is not available
const defaultNotificationContext = {
  notifications: [],
  inboxNotifications: [],
  unreadCount: 0,
  fcmToken: null,
  permissionGranted: false,
  addNotification: () => {},
  removeNotification: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
  fetchNotifications: () => Promise.resolve([]),
  markAsRead: () => Promise.resolve(),
  markAllAsRead: () => Promise.resolve(),
  initializePushNotifications: () => Promise.resolve({ success: false }),
  clearFCMToken: () => Promise.resolve(),
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return default context instead of throwing - handles edge cases during HMR
    return defaultNotificationContext;
  }
  return context;
};

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'success':
      return <Check className="w-5 h-5 text-white" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-white" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-white" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-white" />;
  }
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
    // Backwards-compatible alias
    showNotification: (title, type = 'info', message) => {
      if (type === 'success') return showSuccess(title, message);
      if (type === 'error') return showError(title, message);
      if (type === 'warning') return showWarning(title, message);
      return showInfo(title, message);
    },
    
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
          <Toast
            key={notification.id}
            type={notification.type}
            message={`${notification.title ? notification.title + ': ' : ''}${notification.message || ''}`}
            onClose={() => removeNotification(notification.id)}
            duration={5000}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
