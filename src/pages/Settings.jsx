import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { usePwaInstall } from '../context/PwaInstallContext';
import { settingsCollection } from '../firebase/settings';
import {
  ArrowLeft,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
  Inbox,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import NotificationPermissionModal from '../components/NotificationPermissionModal';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, permissionGranted, requestPermission } = useNotification();
  const { language: currentLanguage, changeLanguage, availableLanguages, t } = useLanguage();
  const { isInstalled, promptInstall } = usePwaInstall();
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    matchUpdates: true,
    newsAlerts: false,
    teamFollowing: true,
    upcomingMatches: true,
    liveMatches: true,
    matchResults: true,
    teamNews: true,
  });
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);

  const isAuthenticatedUser = user && !user.isAnonymous;
  const pageMotionProps = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
    transition: { duration: 0.3, ease: 'easeOut' },
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        if (isAuthenticatedUser && user.uid) {
          const firestoreSettings = await settingsCollection.get(user.uid);

          if (firestoreSettings) {
            setNotifications(firestoreSettings.notifications || notifications);
            setDarkMode(firestoreSettings.darkMode !== undefined ? firestoreSettings.darkMode : true);
            const savedLang = firestoreSettings.language || currentLanguage;
            setLanguage(savedLang);
            if (savedLang !== currentLanguage) {
              changeLanguage(savedLang);
            }
          }
        } else {
          const savedSettings = localStorage.getItem('userSettings');
          if (savedSettings) {
            try {
              const parsed = JSON.parse(savedSettings);
              setNotifications(parsed.notifications || notifications);
              setDarkMode(parsed.darkMode !== undefined ? parsed.darkMode : true);
              const savedLang = parsed.language || currentLanguage;
              setLanguage(savedLang);
              if (savedLang !== currentLanguage) {
                changeLanguage(savedLang);
              }
            } catch (error) {
              showToast('Failed to read saved settings', 'error');
            }
          }
        }
      } catch (error) {
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid, isAuthenticatedUser]);

  useEffect(() => {
    if (loading) return;

    const saveSettings = async () => {
      const settings = {
        notifications,
        darkMode,
        language,
      };

      try {
        if (isAuthenticatedUser && user.uid) {
          await settingsCollection.save(user.uid, settings);
        } else {
          localStorage.setItem('userSettings', JSON.stringify(settings));
        }
      } catch (error) {
        if (error.code === 'permission-denied' || error.message.includes('permissions')) {
          localStorage.setItem('userSettings', JSON.stringify(settings));
          showToast('Settings saved locally (sync temporarily unavailable)', 'error');
        } else {
          showToast('Failed to save settings', 'error');
        }
      }
    };

    saveSettings();
  }, [notifications, darkMode, language, isAuthenticatedUser, user?.uid, loading]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  if (loading) {
    return (
      <motion.div {...pageMotionProps} className="relative min-h-screen">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
        </div>

        <div className="sticky top-0 z-50 bg-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/20 border-b border-white/5">
          <div className="flex items-center px-4 h-14">
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
            <div className="ml-3 h-4 w-32 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="relative z-10 pt-6 space-y-10 pb-16">
          <div className="px-4 space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-1">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-[pulse_2s_ease-in-out_infinite]" />
              <div className="relative bg-black/40 rounded-xl p-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="h-4 bg-white/10 rounded-full animate-pulse w-2/3" />
                  <div className="h-3 bg-white/10 rounded-full animate-pulse w-1/2" />
                  <div className="h-3 bg-white/10 rounded-full animate-pulse w-32" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-white/40">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400/40 animate-pulse" />
              <div className="h-3 bg-white/10 rounded-full w-32 animate-pulse" />
            </div>
          </div>

          <div className="px-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`stat-skeleton-${index}`}
                  className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-4 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 mb-3" />
                  <div className="h-6 bg-white/10 rounded-full w-1/2 mb-2" />
                  <div className="h-3 bg-white/10 rounded-full w-3/4" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
              <div key={`section-skeleton-${sectionIndex}`} className="space-y-3">
                <div className="px-6 flex items-center gap-3 text-brand-purple">
                  <div className="w-4 h-4 bg-brand-purple/30 rounded-full animate-pulse" />
                  <div className="h-3 bg-white/20 rounded-full w-32 animate-pulse" />
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/5 divide-y divide-white/5 rounded-2xl overflow-hidden">
                  {Array.from({ length: sectionIndex === 0 ? 4 : sectionIndex === 1 ? 3 : 2 }).map((_, itemIndex) => (
                    <div
                      key={`section-${sectionIndex}-item-${itemIndex}`}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div className="flex-1 pr-4 space-y-2">
                        <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
                        <div className="h-3 bg-white/5 rounded-full w-5/6 animate-pulse" />
                      </div>
                      <div className="w-12 h-6 bg-white/10 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6">
            <div className="h-12 rounded-xl bg-red-500/10 border border-red-500/20 animate-pulse" />
            <div className="mt-8 space-y-2">
              <div className="h-3 bg-white/5 rounded-full w-40 mx-auto animate-pulse" />
              <div className="h-2 bg-white/5 rounded-full w-24 mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleNotificationChange = (key) => {
    setNotifications((prev) => {
      const newValue = !prev[key];
      const newNotifications = { ...prev, [key]: newValue };
      const labels = {
        push: 'Push Notifications',
        email: 'Email Notifications',
        matchUpdates: 'Match Updates',
        newsAlerts: 'News Alerts',
        teamFollowing: 'Team Notifications',
        upcomingMatches: 'Upcoming Matches',
        liveMatches: 'Live Match Alerts',
        matchResults: 'Match Results',
        teamNews: 'Team News',
      };
      showToast(`${labels[key]} ${newValue ? 'enabled' : 'disabled'}`, 'success');
      return newNotifications;
    });
  };

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showToast(`Dark mode ${newValue ? 'enabled' : 'disabled'}`, 'success');
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    changeLanguage(value);
    const selectedLang = availableLanguages.find((lang) => lang.code === value);
    const message = t('pages.settings.languageChanged').replace(
      '{language}',
      selectedLang?.nativeName || value
    );
    showToast(message, 'success');
  };

  const handleLogout = () => {
    logout();
    showToast(t('pages.settings.loggedOutSuccess'), 'success');
    setTimeout(() => {
      navigate('/auth');
    }, 500);
  };

  const handleInstallApp = async () => {
    try {
      const result = await promptInstall();

      if (result.status === 'accepted') {
        showToast('App installed successfully!', 'success');
        return;
      }

      if (result.status === 'dismissed') {
        showToast('App installation cancelled', 'error');
        return;
      }

      if (result.status === 'ios') {
        showToast('On iPhone/iPad: tap Share → Add to Home Screen', 'success');
        return;
      }

      if (result.status === 'already-installed') {
        showToast('App is already installed', 'success');
        return;
      }

      showToast('Install prompt not available yet. Use your browser menu → Add to Home screen.', 'error');
    } catch (error) {
      showToast('Failed to install app', 'error');
      console.error('Install prompt error:', error);
    }
  };

  const settingSections = [
    {
      title: 'Install Now',
      icon: Download,
      items: [
        {
          label: 'Install App',
          description: 'Add fivescores to your home screen for a better experience',
          type: 'button',
          buttonLabel: isInstalled ? 'Installed' : 'Install on Device',
          onClick: handleInstallApp,
          disabled: isInstalled,
        },
      ],
    },
    {
      title: t('pages.settings.notifications'),
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      action: {
        label: t('pages.settings.inbox'),
        icon: Inbox,
        onClick: () => navigate('/notifications'),
      },
      items: [
        {
          label: t('pages.settings.enableNotifications'),
          description: permissionGranted
            ? t('pages.settings.notificationsEnabled')
            : t('pages.settings.enableBrowserNotifications'),
          type: 'button',
          buttonLabel: permissionGranted ? t('pages.settings.enabled') : t('pages.settings.enable'),
          onClick: () => !permissionGranted && setShowPermissionModal(true),
          disabled: permissionGranted,
        },
        {
          label: t('pages.settings.pushNotifications'),
          description: t('pages.settings.pushNotificationsDesc'),
          type: 'toggle',
          value: notifications.push,
          onChange: () => handleNotificationChange('push'),
        },
        {
          label: t('pages.settings.emailNotifications'),
          description: t('pages.settings.emailNotificationsDesc'),
          type: 'toggle',
          value: notifications.email,
          onChange: () => handleNotificationChange('email'),
        },
        {
          label: t('pages.settings.matchUpdates'),
          description: t('pages.settings.matchUpdatesDesc'),
          type: 'toggle',
          value: notifications.matchUpdates,
          onChange: () => handleNotificationChange('matchUpdates'),
        },
        {
          label: t('pages.settings.newsAlerts'),
          description: t('pages.settings.newsAlertsDesc'),
          type: 'toggle',
          value: notifications.newsAlerts,
          onChange: () => handleNotificationChange('newsAlerts'),
        },
      ],
    },
    {
      title: t('pages.settings.teamFollowingNotifications'),
      icon: Bell,
      description: t('pages.settings.teamFollowingDesc'),
      items: [
        {
          label: t('pages.settings.teamNotifications'),
          description: t('pages.settings.teamNotificationsDesc'),
          type: 'toggle',
          value: notifications.teamFollowing,
          onChange: () => handleNotificationChange('teamFollowing'),
        },
        {
          label: t('pages.settings.upcomingMatches'),
          description: t('pages.settings.upcomingMatchesDesc'),
          type: 'toggle',
          value: notifications.upcomingMatches,
          onChange: () => handleNotificationChange('upcomingMatches'),
          disabled: !notifications.teamFollowing,
        },
        {
          label: t('pages.settings.liveMatchAlerts'),
          description: t('pages.settings.liveMatchAlertsDesc'),
          type: 'toggle',
          value: notifications.liveMatches,
          onChange: () => handleNotificationChange('liveMatches'),
          disabled: !notifications.teamFollowing,
        },
        {
          label: t('pages.settings.matchResults'),
          description: t('pages.settings.matchResultsDesc'),
          type: 'toggle',
          value: notifications.matchResults,
          onChange: () => handleNotificationChange('matchResults'),
          disabled: !notifications.teamFollowing,
        },
        {
          label: t('pages.settings.teamNews'),
          description: t('pages.settings.teamNewsDesc'),
          type: 'toggle',
          value: notifications.teamNews,
          onChange: () => handleNotificationChange('teamNews'),
          disabled: !notifications.teamFollowing,
        },
      ],
    },
    {
      title: t('pages.settings.appearance'),
      icon: Moon,
      items: [
        {
          label: t('pages.settings.darkMode'),
          description: darkMode
            ? t('pages.settings.darkThemeEnabled')
            : t('pages.settings.lightThemeEnabled'),
          type: 'toggle',
          value: darkMode,
          onChange: handleDarkModeToggle,
          disabled: false,
        },
      ],
    },
    {
      title: t('pages.settings.general'),
      icon: Globe,
      items: [
        {
          label: t('pages.settings.language'),
          description: t('pages.settings.languageDesc'),
          type: 'select',
          value: currentLanguage,
          options: [
            { value: 'en', label: 'English' },
            { value: 'yo', label: 'Yoruba (Èdè Yorùbá)' },
            { value: 'ig', label: 'Igbo (Asụsụ Igbo)' },
            { value: 'ha', label: 'Hausa (Harshen Hausa)' },
          ],
          onChange: handleLanguageChange,
        },
      ],
    },
    {
      title: t('pages.settings.privacySecurity'),
      icon: Shield,
      items: [
        {
          label: t('pages.settings.changePassword'),
          description: t('pages.settings.changePasswordDesc'),
          type: 'link',
          onClick: () => navigate('/settings/password'),
        },
        {
          label: t('pages.settings.privacyPolicy'),
          description: t('pages.settings.privacyPolicyDesc'),
          type: 'link',
          onClick: () => navigate('/privacy-policy'),
        },
        {
          label: t('pages.settings.termsOfService'),
          description: t('pages.settings.termsOfServiceDesc'),
          type: 'link',
          onClick: () => navigate('/terms-of-service'),
        },
      ],
    },
    {
      title: t('pages.settings.support'),
      icon: HelpCircle,
      items: [
        {
          label: t('pages.settings.helpCenter'),
          description: t('pages.settings.helpCenterDesc'),
          type: 'link',
          onClick: () =>
            window.open('mailto:RymeLabs@gmail.com?subject=Fivescores - Help Request', '_blank'),
        },
        {
          label: t('pages.settings.contactUs'),
          description: t('pages.settings.contactUsDesc'),
          type: 'link',
          onClick: () =>
            window.open('mailto:RymeLabs@gmail.com?subject=Fivescores - Feedback', '_blank'),
        },
        {
          label: t('pages.settings.about'),
          description: t('pages.settings.aboutDesc'),
          type: 'link',
          onClick: () => navigate('/about'),
        },
      ],
    },
  ];

  if (showLogoutConfirm) {
    return (
      <motion.div {...pageMotionProps} className="min-h-screen bg-black text-white relative">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px]" />
        </div>

        <div className="sticky top-0 z-50 bg-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/20 border-b border-white/5">
          <div className="flex items-center px-4 h-14">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="ml-2 text-lg font-bold tracking-tight text-white">{t('navigation.settings')}</h1>
          </div>
        </div>

        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-8 border border-white/10 shadow-2xl animate-[scaleIn_0.3s_ease-out]">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-6 border border-red-500/20">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 text-center">{t('pages.settings.confirmLogout')}</h3>
            <p className="text-white/50 mb-8 text-center text-sm leading-relaxed">
              {t('pages.settings.logoutConfirmMessage')}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
              >
                {t('common.logout')}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageMotionProps} className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="sticky top-0 z-50 bg-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/20 border-b border-white/5">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="ml-2 text-lg font-bold tracking-tight text-white">{t('navigation.settings')}</h1>
        </div>
      </div>

      <div className="relative z-10 pt-6">
        <div className="px-4 mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-1">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
            <div className="relative bg-black/40 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-brand-purple to-blue-500">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10 text-white font-bold text-xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">
                  {user?.name || t('pages.settings.guestUser')}
                </h3>
                <p className="text-sm text-white/40 truncate">
                  {user?.email || t('pages.settings.notLoggedIn')}
                </p>
                {!user?.isAnonymous && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="mt-2 text-xs font-medium text-brand-purple hover:text-brand-purple-light transition-colors flex items-center"
                  >
                    {t('pages.profile.editProfile')} <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-white/30">
            {isAuthenticatedUser ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span>{t('pages.settings.settingsSynced')}</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span>{t('pages.settings.settingsSavedLocally')}</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-10">
          {settingSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="space-y-3">
                <div className="px-6 flex items-center gap-2 text-brand-purple">
                  <Icon className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em]">{section.title}</h2>
                  {section.badge && (
                    <span className="px-1.5 py-0.5 bg-brand-purple text-white text-[10px] font-bold rounded-full">
                      {section.badge}
                    </span>
                  )}
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/5 divide-y divide-white/5 rounded-2xl overflow-hidden">
                  {section.items.map((item, index) => (
                    <div
                      key={index}
                      onClick={item.type === 'link' ? item.onClick : undefined}
                      className={`px-6 py-4 flex items-center justify-between group transition-all ${
                        item.type === 'link' ? 'cursor-pointer hover:bg-white/5' : ''
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <h3 className="text-sm font-medium text-white group-hover:text-white/90 transition-colors">
                          {item.label}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{item.description}</p>
                        )}
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {item.type === 'toggle' && (
                          <button
                            onClick={item.onChange}
                            disabled={item.disabled}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
                              item.value ? 'bg-brand-purple shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-white/10'
                            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ${
                                item.value ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}

                        {item.type === 'button' && (
                          <button
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                              item.disabled
                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                            }`}
                          >
                            {item.buttonLabel || 'Action'}
                          </button>
                        )}

                        {item.type === 'select' && (
                          <div className="relative">
                            <select
                              value={item.value}
                              onChange={(e) => item.onChange(e.target.value)}
                              className="appearance-none bg-black/40 border border-white/10 text-white text-xs font-medium rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:border-brand-purple/50 transition-colors cursor-pointer"
                            >
                              {item.options.map((option) => (
                                <option key={option.value} value={option.value} className="bg-dark-900">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none rotate-90" />
                          </div>
                        )}

                        {item.type === 'link' && (
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                        )}
                      </div>
                    </div>
                  ))}

                  {section.title === t('pages.settings.general') && isAuthenticatedUser && (
                    <div className="px-6 py-3 bg-black/20">
                      <button
                        onClick={() => setShowAdvancedMenu((s) => !s)}
                        className="flex items-center gap-2 text-xs font-medium text-brand-purple hover:text-brand-purple-light transition-colors"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                        <span>{t('pages.settings.advanced') || 'Advanced Options'}</span>
                      </button>

                      {showAdvancedMenu && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          {user?.role !== 'admin' && (
                            <button
                              onClick={() => navigate('/submit-team')}
                              className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-brand-purple/20 to-blue-600/20 border border-brand-purple/20 text-white text-sm font-medium hover:from-brand-purple/30 hover:to-blue-600/30 transition-all"
                            >
                              {t('navigation.submitTeam') || 'Submit a Team'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 px-6 pb-10">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 font-medium hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {t('common.logout')}
          </button>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase">Fivescores.com</p>
            <p className="text-[10px] text-white/10 mt-1">v1.0.0 • Build 2025.11</p>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-[slideInUp_0.3s_ease-out] w-full max-w-xs px-4">
          <div
            className={`rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <NotificationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onEnable={requestPermission}
      />
    </motion.div>
  );
};

export default Settings;
