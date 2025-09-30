import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

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
  const [notifications, setNotifications] = useState([]);

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

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
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