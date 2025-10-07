import React, { useState } from 'react';
import { X, User, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/auth/login');
  };

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  if (showLogoutConfirm) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
        <div className="bg-dark-800 rounded-lg w-full max-w-sm mx-4 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('pages.settings.confirmLogout')}</h3>
          <p className="text-gray-400 mb-6">{t('pages.settings.logoutConfirmMessage')}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 py-2 px-4 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-start justify-center pt-20">
      <div className="bg-dark-800 rounded-lg w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">{t('pages.profile.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* User Info */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{user?.name || t('profileModal.guestUser')}</h3>
              <p className="text-sm text-gray-400">{user?.email || t('profileModal.notLoggedIn')}</p>
              {user?.role === 'admin' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent-600 text-white mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  {t('common.admin')}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="py-2">
          <button
            onClick={() => handleNavigation('/profile')}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-dark-700 transition-colors"
          >
            <User className="w-5 h-5 text-gray-400 mr-3" />
            <span className="text-white">{t('pages.profile.editProfile')}</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/settings')}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-dark-700 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400 mr-3" />
            <span className="text-white">{t('navigation.settings')}</span>
          </button>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => handleNavigation('/admin')}
              className="w-full flex items-center px-4 py-3 text-left hover:bg-dark-700 transition-colors"
            >
              <Shield className="w-5 h-5 text-gray-400 mr-3" />
              <span className="text-white">{t('navigation.adminDashboard')}</span>
            </button>
          )}
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-dark-700 transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;