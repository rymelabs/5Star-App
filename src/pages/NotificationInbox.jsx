import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, Trash2, Clock } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { deleteNotification } from '../firebase/notifications';

const NotificationInbox = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { 
    inboxNotifications, 
    unreadCount, 
    loadNotifications,
    markAsRead,
    markAllAsRead,
    showSuccess,
    showError
  } = useNotification();

  useEffect(() => {
    if (currentUser) {
      loadNotifications({ limit: 100 });
    }
  }, [currentUser, loadNotifications]);

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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return notifDate.toLocaleDateString();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark-900 text-white p-6">
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-gray-400 mb-4">
            You need to be signed in to view notifications
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Sign In
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
                <h1 className="text-xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-400">
                    {unreadCount} unread
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
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {inboxNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-gray-400">
              We'll notify you about your followed teams' matches and news
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
  );
};

export default NotificationInbox;
