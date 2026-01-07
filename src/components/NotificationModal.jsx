import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Bell, Info, AlertCircle, CheckCircle, Calendar, Megaphone } from 'lucide-react';
import { getFirebaseDb } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, increment, orderBy } from 'firebase/firestore';

const NotificationModal = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewedNotifications, setViewedNotifications] = useState(new Set());

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Track views for the current notification
    if (notifications.length > 0 && !viewedNotifications.has(notifications[currentIndex]?.id)) {
      trackNotificationView(notifications[currentIndex]?.id);
      setViewedNotifications(prev => new Set([...prev, notifications[currentIndex]?.id]));
    }
  }, [currentIndex, notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const db = getFirebaseDb();
      
      // Get dismissed notifications from localStorage
      const dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      
      // Fetch active admin notifications
      const notificationsRef = collection(db, 'adminNotifications');
      const q = query(
        notificationsRef,
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const notificationsList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(notif => !dismissedIds.includes(notif.id))
        .sort((a, b) => {
          // Sort by priority first (high > normal > low)
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by creation date (newest first)
          return (b.createdAt?.toDate?.() || new Date()) - (a.createdAt?.toDate?.() || new Date());
        });
      
      setNotifications(notificationsList);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const trackNotificationView = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      const db = getFirebaseDb();
      const notifRef = doc(db, 'adminNotifications', notificationId);
      await updateDoc(notifRef, {
        viewCount: increment(1),
      });
    } catch (error) {
    }
  };

  const trackNotificationDismiss = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      const db = getFirebaseDb();
      const notifRef = doc(db, 'adminNotifications', notificationId);
      await updateDoc(notifRef, {
        dismissCount: increment(1),
      });
    } catch (error) {
    }
  };

  const handleDismiss = () => {
    if (notifications.length > 0) {
      const currentNotification = notifications[currentIndex];
      
      // Track dismiss
      trackNotificationDismiss(currentNotification.id);
      
      // Save to localStorage
      const dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      dismissedIds.push(currentNotification.id);
      localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedIds));
      
      // Remove from current list
      const updatedNotifications = notifications.filter((_, index) => index !== currentIndex);
      setNotifications(updatedNotifications);
      
      // Adjust current index
      if (updatedNotifications.length === 0) {
        onClose();
      } else if (currentIndex >= updatedNotifications.length) {
        setCurrentIndex(updatedNotifications.length - 1);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      info: <Info className="w-6 h-6" />,
      announcement: <Megaphone className="w-6 h-6" />,
      warning: <AlertCircle className="w-6 h-6" />,
      update: <CheckCircle className="w-6 h-6" />,
      event: <Calendar className="w-6 h-6" />,
    };
    return icons[type] || icons.info;
  };

  const getNotificationStyles = (type, priority) => {
    const baseStyles = {
      info: 'from-dark-800 to-dark-900 border-blue-500/50',
      announcement: 'from-dark-800 to-dark-900 border-purple-500/50',
      warning: 'from-dark-800 to-dark-900 border-yellow-500/50',
      update: 'from-dark-800 to-dark-900 border-green-500/50',
      event: 'from-dark-800 to-dark-900 border-orange-500/50',
    };

    const iconColors = {
      info: 'text-blue-400',
      announcement: 'text-purple-400',
      warning: 'text-yellow-400',
      update: 'text-green-400',
      event: 'text-orange-400',
    };

    const priorityBorder = priority === 'high' ? 'border-2' : 'border';

    return {
      gradient: baseStyles[type] || baseStyles.info,
      iconColor: iconColors[type] || iconColors.info,
      border: priorityBorder,
    };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return null; // Don't show modal if no notifications
  }

  const currentNotification = notifications[currentIndex];
  const styles = getNotificationStyles(currentNotification.type, currentNotification.priority);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md">
        {/* Modal Content */}
        <div className={`bg-gradient-to-br ${styles.gradient} ${styles.border} rounded-3xl shadow-2xl shadow-black/50 overflow-hidden`}>
          {/* Header */}
          <div className="relative p-6 pb-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>

            <div className="flex items-start gap-4">
              <div className={`p-3 bg-dark-700/50 backdrop-blur-sm rounded-xl ${styles.iconColor} shadow-lg`}>
                {getNotificationIcon(currentNotification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {currentNotification.priority === 'high' && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded">
                      IMPORTANT
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-dark-700/50 text-gray-400 text-xs font-medium rounded capitalize">
                    {currentNotification.type}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-2">
                  {currentNotification.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-6">
            <p className="text-gray-200 leading-relaxed whitespace-pre-line">
              {currentNotification.message}
            </p>

            <div className="mt-4 flex items-center text-xs text-gray-400">
              <Bell className="w-3 h-3 mr-1" />
              {currentNotification.createdAt?.toDate?.()?.toLocaleDateString() || 'Today'}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-dark-900/80 backdrop-blur-sm border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-300" />
                </button>
                
                <span className="text-sm text-gray-400 min-w-[60px] text-center">
                  {currentIndex + 1} of {notifications.length}
                </span>
                
                <button
                  onClick={handleNext}
                  disabled={currentIndex === notifications.length - 1}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Dismiss
                </button>
                {currentIndex < notifications.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
