import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { settingsCollection } from '../firebase/settings';
import { ArrowLeft, Bell, Moon, Globe, Shield, HelpCircle, LogOut, ChevronRight, Check, Inbox } from 'lucide-react';
import NotificationPermissionModal from '../components/NotificationPermissionModal';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount, permissionGranted, requestPermission } = useNotification();
  const { language: currentLanguage, changeLanguage, availableLanguages, t } = useLanguage();
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    matchUpdates: true,
    newsAlerts: false,
    // Team-specific notifications
    teamFollowing: true, // Enable notifications for followed teams
    upcomingMatches: true, // Notify about upcoming matches (24h before)
    liveMatches: true, // Notify when followed team's match goes live
    matchResults: true, // Notify when match finishes with score
    teamNews: true, // Notify about news articles mentioning followed teams
  });
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);

  // Determine if user is authenticated (not anonymous/guest)
  const isAuthenticatedUser = user && !user.isAnonymous;

  // Load settings from Firestore (authenticated) or localStorage (guest) on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        if (isAuthenticatedUser && user.uid) {
          // Load from Firestore for authenticated users
          console.log('📥 Loading settings from Firestore for user:', user.uid);
          const firestoreSettings = await settingsCollection.get(user.uid);
          
          if (firestoreSettings) {
            setNotifications(firestoreSettings.notifications || notifications);
            setDarkMode(firestoreSettings.darkMode !== undefined ? firestoreSettings.darkMode : true);
            const savedLang = firestoreSettings.language || currentLanguage;
            setLanguage(savedLang);
            if (savedLang !== currentLanguage) {
              changeLanguage(savedLang); // Sync with LanguageContext
            }
            console.log('✅ Settings loaded from Firestore');
          } else {
            // No settings in Firestore, use defaults
            console.log('ℹ️ No settings found in Firestore, using defaults');
          }
        } else {
          // Load from localStorage for guest users
          console.log('📥 Loading settings from localStorage for guest user');
          const savedSettings = localStorage.getItem('userSettings');
          if (savedSettings) {
            try {
              const parsed = JSON.parse(savedSettings);
              setNotifications(parsed.notifications || notifications);
              setDarkMode(parsed.darkMode !== undefined ? parsed.darkMode : true);
              const savedLang = parsed.language || currentLanguage;
              setLanguage(savedLang);
              if (savedLang !== currentLanguage) {
                changeLanguage(savedLang); // Sync with LanguageContext
              }
              console.log('✅ Settings loaded from localStorage');
            } catch (error) {
              console.error('Error parsing localStorage settings:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid, isAuthenticatedUser]);

  // Save settings to Firestore (authenticated) or localStorage (guest) whenever they change
  useEffect(() => {
    // Skip saving during initial load
    if (loading) return;

    const saveSettings = async () => {
      const settings = {
        notifications,
        darkMode,
        language,
      };

      try {
        if (isAuthenticatedUser && user.uid) {
          // Save to Firestore for authenticated users
          console.log('💾 Saving settings to Firestore for user:', user.uid);
          await settingsCollection.save(user.uid, settings);
          console.log('✅ Settings saved to Firestore');
        } else {
          // Save to localStorage for guest users
          console.log('💾 Saving settings to localStorage for guest user');
          localStorage.setItem('userSettings', JSON.stringify(settings));
          console.log('✅ Settings saved to localStorage');
        }
      } catch (error) {
        console.error('Error saving settings:', error);
        
        // Check if it's a permissions error
        if (error.code === 'permission-denied' || error.message.includes('permissions')) {
          console.warn('⚠️ Firestore permissions denied, falling back to localStorage');
          // Fallback to localStorage if Firestore fails
          localStorage.setItem('userSettings', JSON.stringify(settings));
          showToast('Settings saved locally (sync temporarily unavailable)', 'error');
        } else {
          showToast('Failed to save settings', 'error');
        }
      }
    };

    saveSettings();
  }, [notifications, darkMode, language, isAuthenticatedUser, user?.uid, loading]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="pb-6">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900 z-10 px-4 py-2.5 border-b border-dark-700">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <h1 className="ml-2 page-header">Settings</h1>
          </div>
        </div>
        
        {/* Loading State */}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">{t('pages.settings.loadingSettings')}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleNotificationChange = (key) => {
    setNotifications(prev => {
      const newValue = !prev[key];
      const newNotifications = { ...prev, [key]: newValue };
      
      // Show feedback
      const labels = {
        push: 'Push Notifications',
        email: 'Email Notifications',
        matchUpdates: 'Match Updates',
        newsAlerts: 'News Alerts'
      };
      showToast(`${labels[key]} ${newValue ? 'enabled' : 'disabled'}`, 'success');
      
      return newNotifications;
    });
  };

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    
    // Apply dark mode to document
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    showToast(`Dark mode ${newValue ? 'enabled' : 'disabled'}`, 'success');
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    changeLanguage(value); // Update the language context
    const selectedLang = availableLanguages.find(lang => lang.code === value);
    const message = t('pages.settings.languageChanged').replace('{language}', selectedLang?.nativeName || value);
    showToast(message, 'success');
  };

  const handleLogout = () => {
    logout();
    showToast(t('pages.settings.loggedOutSuccess'), 'success');
    setTimeout(() => {
      navigate('/auth');
    }, 500);
  };

  const settingSections = [
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
          description: permissionGranted ? t('pages.settings.notificationsEnabled') : t('pages.settings.enableBrowserNotifications'),
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
          description: darkMode ? t('pages.settings.darkThemeEnabled') : t('pages.settings.lightThemeEnabled'),
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
          onClick: () => window.open('mailto:RymeLabs@gmail.com?subject=5Star Premier League - Help Request', '_blank'),
        },
        {
          label: t('pages.settings.contactUs'),
          description: t('pages.settings.contactUsDesc'),
          type: 'link',
          onClick: () => window.open('mailto:RymeLabs@gmail.com?subject=5Star Premier League - Feedback', '_blank'),
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
      <>
        <div className="pb-6">
          {/* Header */}
          <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h1 className="ml-2 text-lg font-semibold text-white">{t('navigation.settings')}</h1>
            </div>
          </div>
        </div>
        
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-dark-800 rounded-lg w-full max-w-sm p-6 border border-dark-700 animate-[scaleIn_0.3s_ease-out]">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600/20 mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 text-center">{t('pages.settings.confirmLogout')}</h3>
            <p className="text-gray-400 mb-6 text-center">{t('pages.settings.logoutConfirmMessage')}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-all duration-200 font-medium hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="ml-2 page-header">{t('navigation.settings')}</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="px-4 py-6">
        {/* User Info */}
        <div className="card p-4 mb-6 hover:bg-dark-700 transition-all duration-200 animate-[fadeInUp_0.4s_ease-out]">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center animate-[scaleIn_0.5s_ease-out]">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{user?.name || t('pages.settings.guestUser')}</h3>
              <p className="text-sm text-gray-400">{user?.email || t('pages.settings.notLoggedIn')}</p>
            </div>
            {!user?.isAnonymous && (
              <button
                onClick={() => navigate('/profile')}
                className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {t('pages.profile.editProfile')}
              </button>
            )}
          </div>
          
          {/* Settings Storage Info */}
          <div className="pt-3 border-t border-dark-700">
            <div className="flex items-center text-xs">
              {isAuthenticatedUser ? (
                <>
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span className="text-gray-400">{t('pages.settings.settingsSynced')}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-gray-400">{t('pages.settings.settingsSavedLocally')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 text-primary-500 mr-2" />
                    <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                    {section.badge && (
                      <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded-full">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  
                  {section.action && (
                    <button
                      onClick={section.action.onClick}
                      className="flex items-center text-sm text-primary-400 hover:text-primary-300 transition"
                    >
                      {section.action.label}
                      {section.action.icon && <section.action.icon className="w-4 h-4 ml-1" />}
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {section.items.map((item, index) => (
                    <div 
                      key={index} 
                      onClick={item.type === 'link' ? item.onClick : undefined}
                      className={`card p-4 transition-all duration-200 animate-[fadeInUp_0.5s_ease-out] ${
                        item.type === 'link' ? 'cursor-pointer hover:bg-dark-700 active:scale-[0.98]' : 'hover:bg-dark-700'
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">{item.label}</h3>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                        
                        <div className="ml-4">
                          {item.type === 'toggle' && (
                            <button
                              onClick={item.onChange}
                              disabled={item.disabled}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800 hover:scale-110 active:scale-95 ${
                                item.value ? 'bg-primary-600' : 'bg-gray-600'
                              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                                  item.value ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                          
                          {item.type === 'button' && (
                            <button
                              onClick={item.onClick}
                              disabled={item.disabled}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                item.disabled
                                  ? 'bg-green-600/20 text-green-400 cursor-not-allowed'
                                  : 'bg-primary-600 hover:bg-primary-500 text-white'
                              }`}
                            >
                              {item.buttonLabel || 'Click'}
                            </button>
                          )}
                          
                          {item.type === 'select' && (
                            <select
                              value={item.value}
                              onChange={(e) => item.onChange(e.target.value)}
                              className="input-field py-2 px-3 text-sm cursor-pointer hover:border-primary-500 transition-colors duration-200"
                            >
                              {item.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {item.type === 'link' && (
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Logout Section */}
        <div className="mt-8 animate-[fadeInUp_0.6s_ease-out]">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full card p-4 text-left hover:bg-red-600/10 border-red-600/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
          >
            <div className="flex items-center">
              <LogOut className="w-5 h-5 text-red-400 mr-3 group-hover:rotate-12 transition-transform duration-200" />
              <span className="text-red-400 font-medium">{t('common.logout')}</span>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">5Star Sports App</p>
          <p className="text-xs text-gray-600">{t('common.version')} 1.0.0</p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-[slideInUp_0.3s_ease-out]">
          <div className={`rounded-lg px-6 py-3 shadow-lg flex items-center space-x-3 ${
            toast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onEnable={requestPermission}
      />
    </div>
  );
};

export default Settings;