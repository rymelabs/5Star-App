import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, Trash2, Clock, Megaphone, Trophy, Calendar, Info, AlertTriangle, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { deleteNotification } from '../firebase/notifications';
import { getFirebaseDb } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getRelativeTime } from '../utils/dateUtils';
import SurfaceCard from '../components/ui/SurfaceCard';

const NotificationInbox = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const { 
    inboxNotifications = [], 
    unreadCount = 0, 
    loadNotifications,
    markAsRead,
    markAllAsRead,
    showSuccess,
    showError
  } = useNotification();
  
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const placeholderStorageKey = currentUser ? `notifications-placeholder:${currentUser.uid}` : 'notifications-placeholder:guest';
  const [hasSeenPlaceholder, setHasSeenPlaceholder] = useState(false);
  const pageMotionProps = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
    transition: { duration: 0.3, ease: 'easeOut' },
  };

  const placeholderNotification = useMemo(() => ({
    id: 'placeholder-intro',
    title: 'Welcome to the all-new Fivescores.com',
    body: 'Experience our fully optimized, lightning-fast match hub with richer stats, smarter alerts, and a premium feel across every screen.',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    type: 'announcement',
    isSystem: true,
    isAdminNotification: true,
    isPlaceholder: true,
    priority: 'normal',
    read: false
  }), []);

  useEffect(() => {
    if (!placeholderStorageKey || typeof window === 'undefined') {
      setHasSeenPlaceholder(false);
      return;
    }
    const stored = localStorage.getItem(placeholderStorageKey) === 'true';
    setHasSeenPlaceholder(stored);
  }, [placeholderStorageKey]);

  useEffect(() => {
    if (currentUser) {
      loadNotifications({ limit: 100 });
    }
    fetchAdminNotifications();
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
          // Admin notifications are "read" if they are in the list but we can track read state locally if needed
          // For now, we'll treat them as unread unless dismissed, or we could add a local read state
          read: false 
        }))
        .filter(notif => !dismissedIds.includes(notif.id));
      
      setAdminNotifications(notificationsList);
    } catch (error) {
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleDismissAdminNotification = (e, notificationId) => {
    e.stopPropagation();
    const dismissedIds = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    dismissedIds.push(notificationId);
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedIds));
    setAdminNotifications(prev => prev.filter(n => n.id !== notificationId));
    showSuccess('Dismissed', 'Admin notification dismissed');
  };

  const acknowledgePlaceholder = () => {
    if (!placeholderStorageKey || typeof window === 'undefined' || hasSeenPlaceholder) return;
    localStorage.setItem(placeholderStorageKey, 'true');
    setHasSeenPlaceholder(true);
  };

  const handleNotificationClick = async (notification) => {
    if (notification.isPlaceholder) {
      acknowledgePlaceholder();
      return;
    }
    if (currentUser && !notification.read && !notification.isAdminNotification && !notification.isPlaceholder) {
      await markAsRead(notification.id);
    }
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
    switch (type) {
      case 'fixture_created':
      case 'upcoming_match_reminder':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'match_live':
        return (
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute top-0 right-0" />
            <Trophy className="w-5 h-5 text-red-400" />
          </div>
        );
      case 'score_update':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'announcement':
      case 'admin_announcement':
        return <Megaphone className="w-5 h-5 text-purple-400" />;
      case 'team_update':
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const groupedNotifications = useMemo(() => {
    const all = [
      ...adminNotifications.map(n => ({
        ...n,
        type: n.type || 'announcement',
        createdAt: n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt),
        isSystem: true
      })),
      ...inboxNotifications.map(n => ({
        ...n,
        createdAt: new Date(n.createdAt),
        isSystem: false
      }))
    ];

    if (!hasSeenPlaceholder && !all.some(n => n.id === placeholderNotification.id)) {
      all.push(placeholderNotification);
    }

    all.sort((a, b) => b.createdAt - a.createdAt);

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    all.forEach(notification => {
      const date = notification.createdAt;
      if (date.toDateString() === today.toDateString()) {
        groups.Today.push(notification);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(notification);
      } else {
        groups.Earlier.push(notification);
      }
    });

    return groups;
  }, [adminNotifications, inboxNotifications, placeholderNotification, hasSeenPlaceholder]);

  const hasNotifications = Object.values(groupedNotifications).some(group => group.length > 0);

  return (
    <motion.div {...pageMotionProps} className="relative min-h-screen bg-app">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-app/80 backdrop-blur-xl border-b border-white/5">
        <div className="w-full px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">{t('notifications.title')}</h1>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={async () => {
                await markAllAsRead();
                acknowledgePlaceholder();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium text-brand-purple transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full px-4 py-6">
        {!hasNotifications ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-brand-purple/20 blur-3xl rounded-full" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 flex items-center justify-center backdrop-blur-sm">
                <Bell className="w-10 h-10 text-white/40" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('notifications.noNotificationsYet')}</h3>
            <p className="text-gray-400 max-w-xs mx-auto leading-relaxed">
              {t('notifications.emptyMessage')}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNotifications).map(([group, notifications]) => (
              notifications.length > 0 && (
                <div key={group} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">
                    {group}
                  </h2>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
                          ${!notification.read && !notification.isSystem 
                            ? 'bg-white/[0.08] border-brand-purple/30 shadow-[0_0_20px_rgba(109,40,217,0.15)]' 
                            : 'bg-elevated/50 border-white/5 hover:bg-white/[0.07] hover:border-white/10'
                          }
                        `}
                      >
                        {/* Unread Indicator Line */}
                        {!notification.read && !notification.isSystem && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-purple shadow-[0_0_10px_#6d28d9]" />
                        )}

                        <div className="p-4 sm:p-5 flex gap-4">
                          {/* Icon Container */}
                          <div className={`
                            flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border
                            ${notification.isSystem 
                              ? 'bg-purple-500/10 border-purple-500/20' 
                              : 'bg-white/5 border-white/10'
                            }
                          `}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <h3 className={`text-base font-semibold truncate pr-2 ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                {notification.title}
                              </h3>
                              <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                                {getRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                            
                            <p className={`text-sm leading-relaxed line-clamp-2 ${!notification.read ? 'text-gray-300' : 'text-gray-500'}`}>
                              {notification.body || notification.message}
                            </p>

                            {notification.isSystem && notification.priority === 'high' && (
                              <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                {t('notifications.important')}
                              </div>
                            )}

                            {notification.isPlaceholder && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acknowledgePlaceholder();
                                }}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/20 text-brand-purple font-semibold text-xs tracking-wide hover:bg-brand-purple/30 transition-colors"
                              >
                                Got it
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col items-end justify-between gap-2 pl-2">
                            {notification.isSystem && !notification.isPlaceholder ? (
                              <button
                                onClick={(e) => handleDismissAdminNotification(e, notification.id)}
                                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                                title="Dismiss"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            ) : !notification.isSystem ? (
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationInbox;
