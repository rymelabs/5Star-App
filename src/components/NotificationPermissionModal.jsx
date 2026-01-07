import React, { useState } from 'react';
import { X, Bell, Smartphone, Mail, Check } from 'lucide-react';

const NotificationPermissionModal = ({ isOpen, onClose, onEnable }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEnable = async () => {
    setLoading(true);
    await onEnable();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-dark-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          Stay Updated
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6">
          Get instant notifications about your favorite teams' matches, scores, and news.
        </p>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary-400" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-white mb-1">Push Notifications</h3>
              <p className="text-sm text-gray-400">
                Get instant alerts on your device
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-accent-400" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-white mb-1">Email Updates</h3>
              <p className="text-sm text-gray-400">
                Receive match summaries and news
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-white mb-1">Full Control</h3>
              <p className="text-sm text-gray-400">
                Customize what you want to be notified about
              </p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-dark-700/50 rounded-lg p-3 mb-6">
          <p className="text-xs text-gray-400 text-center">
            You can change your notification preferences anytime in Settings
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition font-medium"
          >
            Not Now
          </button>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;
