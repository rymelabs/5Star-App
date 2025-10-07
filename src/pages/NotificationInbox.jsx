import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, Trash2, Clock, Megaphone } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { deleteNotification } from '../firebase/notifications';
import { getFirebaseDb } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const NotificationInbox = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const { 
    inboxNotifications, 
    unreadCount, 
    loadNotifications,
    markAsRead,
    markAllAsRead,
    showSuccess,
    showError
  } = useNotification();
  
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadNotifications({ limit: 100 });
      fetchAdminNotifications();
    }
  }, [currentUser, loadNotifications]);

  const fetchAdminNotifications = async () => {
    try {
      setLoadingAdmin(true);
      const db = getFirebaseDb();
      
      // Get dismissed notifications from localStorage
      const dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
      
      const notificationsRef = collection(db, 'adminNotifications');
      const q = query(
        notificationsRef,
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const notificationsList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          isAdminNotification: true,
        }))
        .filter(notif => !dismissedIds.includes(notif.id));
      
      setAdminNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleDismissAdminNotification = (e, notificationId) => {
    e.stopPropagation();
    
    // Save to localStorage
    const dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    dismissedIds.push(notificationId);
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedIds));
    
    // Remove from list
    setAdminNotifications(prev => prev.filter(n => n.id !== notificationId));
    showSuccess('Dismissed', 'Admin notification dismissed');
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to the relevant page if URL is provided
    if (notification.data?.url) {
      navigate(notification.data.url);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    
    try {
      await deleteNotification(notificationId);
      await loadNotifications({ limit: 100 });
      showSuccess('Deleted', 'Notification removed');
    } catch (error) {
      showError('Error', 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      fixture_created: '⚽',
      match_live: '🔴',
      score_update: '⚽',
      match_finished: '🏁',
      article_published: '📰',
      upcoming_match_reminder: '⏰',
      // Admin notification types
      info: 'ℹ️',
      announcement: '📢',
      warning: '⚠️',
      update: '✨',
      event: '🎉',
    };
    return icons[type] || '📬';
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return t('notifications.minutesAgo').replace('{count}', diffMins);
    if (diffHours < 24) return t('notifications.hoursAgo').replace('{count}', diffHours);
    if (diffDays < 7) return t('notifications.daysAgo').replace('{count}', diffDays);
    
    return notifDate.toLocaleDateString();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark-900 text-white p-6">
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-xl font-semibold mb-2">{t('common.signInRequired')}</h2>
          <p className="text-gray-400 mb-4">
            {t('notifications.signInToView')}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            {t('notifications.signIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-dark-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="page-header">{t('notifications.title')}</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-400">
                    {t('notifications.unreadCount').replace('{count}', unreadCount)}
                  </p>
                )}
              </div>
            </div>

            {inboxNotifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center text-sm text-primary-400 hover:text-primary-300 transition"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Admin Notifications Section */}
        {adminNotifications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">{t('notifications.adminAnnouncements')}</h2>
            </div>
            <div className="space-y-2">
              {adminNotifications.map((notification) => {
                const priorityColors = {
                  high: 'border-red-500/50 bg-red-500/5',
                  normal: 'border-purple-500/50 bg-purple-500/5',
                  low: 'border-gray-500/50 bg-gray-500/5',
                };
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${priorityColors[notification.priority] || priorityColors.normal}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        {/* Icon */}
                        <div className="text-3xl mr-3 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">
                              {notification.title}
                            </h3>
                            {notification.priority === 'high' && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded">
                                {t('notifications.important')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2 whitespace-pre-line">
                            {notification.message}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(notification.createdAt?.toDate?.())}
                          </div>
                        </div>
                      </div>

                      {/* Dismiss Button */}
                      <button
                        onClick={(e) => handleDismissAdminNotification(e, notification.id)}
                        className="ml-2 p-2 text-gray-500 hover:text-purple-400 hover:bg-dark-700 rounded transition flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Notifications Section */}
        <div>
          {adminNotifications.length > 0 && (
            <h2 className="text-lg font-semibold text-white mb-3">{t('notifications.yourNotifications')}</h2>
          )}
          {inboxNotifications.length === 0 && adminNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold mb-2">{t('notifications.noNotificationsYet')}</h2>
              <p className="text-gray-400">
                {t('notifications.emptyMessage')}
              </p>
            </div>
          ) : inboxNotifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {t('notifications.noPersonal')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {inboxNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-lg border cursor-pointer transition transform hover:scale-[1.01] ${
                    notification.read
                      ? 'bg-dark-800 border-dark-700'
                      : 'bg-dark-800/80 border-primary-600/50 shadow-lg shadow-primary-600/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      {/* Icon */}
                      <div className="text-3xl mr-3 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <h3 className={`font-semibold ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="ml-2 w-2 h-2 bg-primary-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          {notification.body}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="ml-2 p-2 text-gray-500 hover:text-red-400 hover:bg-dark-700 rounded transition flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationInbox;
