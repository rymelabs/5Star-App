import React from 'react';
import { User, Settings, Shield, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

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
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-80 bg-black/30 backdrop-blur-[26px] border border-gray-700/50 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                {user?.name?.[0] || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-white tracking-tight">{user?.name || 'User'}</h3>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <button
            onClick={handleProfile}
            className="w-full flex items-center p-3 text-left text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <User className="w-5 h-5 mr-3 text-gray-400" />
            <span className="font-medium tracking-tight">Profile</span>
          </button>

          <button
            onClick={handleSettings}
            className="w-full flex items-center p-3 text-left text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 mr-3 text-gray-400" />
            <span className="font-medium tracking-tight">Settings</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={handleAdminAccess}
              className="w-full flex items-center p-3 text-left text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <Shield className="w-5 h-5 mr-3 text-primary-500" />
              <span className="font-medium tracking-tight text-primary-500">Admin Panel</span>
            </button>
          )}

          <hr className="my-2 border-gray-700/50" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium tracking-tight">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;