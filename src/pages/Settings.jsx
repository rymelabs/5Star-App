import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Bell, Moon, Globe, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    matchUpdates: true,
    newsAlerts: false,
  });
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const settingSections = [
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Push Notifications',
          description: 'Receive push notifications on your device',
          type: 'toggle',
          value: notifications.push,
          onChange: () => handleNotificationChange('push'),
        },
        {
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          type: 'toggle',
          value: notifications.email,
          onChange: () => handleNotificationChange('email'),
        },
        {
          label: 'Match Updates',
          description: 'Get notified about live match events',
          type: 'toggle',
          value: notifications.matchUpdates,
          onChange: () => handleNotificationChange('matchUpdates'),
        },
        {
          label: 'News Alerts',
          description: 'Receive alerts for breaking news',
          type: 'toggle',
          value: notifications.newsAlerts,
          onChange: () => handleNotificationChange('newsAlerts'),
        },
      ],
    },
    {
      title: 'Appearance',
      icon: Moon,
      items: [
        {
          label: 'Dark Mode',
          description: 'Use dark theme (currently enabled)',
          type: 'toggle',
          value: darkMode,
          onChange: () => setDarkMode(!darkMode),
          disabled: true,
        },
      ],
    },
    {
      title: 'General',
      icon: Globe,
      items: [
        {
          label: 'Language',
          description: 'Choose your preferred language',
          type: 'select',
          value: language,
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
          ],
          onChange: (value) => setLanguage(value),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        {
          label: 'Change Password',
          description: 'Update your account password',
          type: 'link',
          onClick: () => navigate('/settings/password'),
        },
        {
          label: 'Privacy Policy',
          description: 'Read our privacy policy',
          type: 'link',
          onClick: () => window.open('/privacy', '_blank'),
        },
        {
          label: 'Terms of Service',
          description: 'View terms and conditions',
          type: 'link',
          onClick: () => window.open('/terms', '_blank'),
        },
      ],
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        {
          label: 'Help Center',
          description: 'Get help and support',
          type: 'link',
          onClick: () => window.open('/help', '_blank'),
        },
        {
          label: 'Contact Us',
          description: 'Send feedback or report issues',
          type: 'link',
          onClick: () => navigate('/contact'),
        },
        {
          label: 'About',
          description: 'App version and information',
          type: 'link',
          onClick: () => navigate('/about'),
        },
      ],
    },
  ];

  if (showLogoutConfirm) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-dark-800 rounded-lg w-full max-w-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Confirm Logout</h3>
          <p className="text-gray-400 mb-6">Are you sure you want to log out of your account?</p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2 px-4 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-white">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="px-4 py-6">
        {/* User Info */}
        <div className="card p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center">
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
              <h3 className="font-medium text-white">{user?.name || 'Guest User'}</h3>
              <p className="text-sm text-gray-400">{user?.email || 'Not logged in'}</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="text-primary-500 text-sm font-medium hover:text-primary-400 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="flex items-center mb-4">
                  <Icon className="w-5 h-5 text-primary-500 mr-2" />
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                </div>
                
                <div className="space-y-3">
                  {section.items.map((item, index) => (
                    <div key={index} className="card p-4">
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
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800 ${
                                item.value ? 'bg-primary-600' : 'bg-gray-600'
                              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  item.value ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                          
                          {item.type === 'select' && (
                            <select
                              value={item.value}
                              onChange={(e) => item.onChange(e.target.value)}
                              className="input-field py-1 px-2 text-sm"
                            >
                              {item.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {item.type === 'link' && (
                            <button
                              onClick={item.onClick}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
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
        <div className="mt-8">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full card p-4 text-left hover:bg-red-600/10 border-red-600/20 transition-colors"
          >
            <div className="flex items-center">
              <LogOut className="w-5 h-5 text-red-400 mr-3" />
              <span className="text-red-400 font-medium">Logout</span>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">5Star Sports App</p>
          <p className="text-xs text-gray-600">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;