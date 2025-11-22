import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Settings, Shield, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ isOpen = true, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  if (!isOpen) return null;

  const handleAdminAccess = () => {
    onClose();
    navigate('/admin');
  };

  const handleProfile = () => {
    onClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    onClose();
    navigate('/settings');
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4 sm:pr-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-app/40 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-80 bg-elevated/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-white/5 relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark p-[2px] shadow-lg shadow-brand-purple/20">
                    <div className="w-full h-full rounded-full bg-elevated flex items-center justify-center text-white font-bold text-lg">
                      {user?.name?.[0] || 'U'}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white tracking-tight text-lg">{user?.name || t('profileModal.guestUser')}</h3>
                    <p className="text-xs text-white/40 font-medium">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1">
              <button
                onClick={handleProfile}
                className="w-full flex items-center p-3 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-brand-purple/20 group-hover:text-brand-purple transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-medium tracking-wide flex-1">{t('pages.profile.editProfile')}</span>
              </button>

              <button
                onClick={handleSettings}
                className="w-full flex items-center p-3 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-brand-purple/20 group-hover:text-brand-purple transition-colors">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="font-medium tracking-wide flex-1">{t('navigation.settings')}</span>
              </button>

              {user?.isAdmin && (
                <button
                  onClick={handleAdminAccess}
                  className="w-full flex items-center p-3 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-brand-purple/20 group-hover:text-brand-purple transition-colors">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-medium tracking-wide flex-1">{t('navigation.adminPanel')}</span>
                </button>
              )}

              <div className="my-2 border-t border-white/5 mx-3" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center p-3 text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-medium tracking-wide flex-1">{t('common.logout')}</span>
              </button>
            </div>
            
            {/* Footer */}
            <div className="px-5 py-3 bg-white/5 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/20 font-medium tracking-widest uppercase">Fivescores</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
