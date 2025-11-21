import React from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info'
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconColor: 'text-red-400',
          iconBg: 'bg-red-500/10',
          confirmBtn: 'bg-red-500 hover:bg-red-600',
          border: 'border-red-500/30'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          iconBg: 'bg-yellow-500/10',
          confirmBtn: 'bg-yellow-500 hover:bg-yellow-600',
          border: 'border-yellow-500/30'
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/10',
          confirmBtn: 'bg-blue-500 hover:bg-blue-600',
          border: 'border-blue-500/30'
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          iconBg: 'bg-yellow-500/10',
          confirmBtn: 'bg-yellow-500 hover:bg-yellow-600',
          border: 'border-yellow-500/30'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  const renderMessage = () => {
    if (!message) {
      return null;
    }

    if (typeof message === 'string') {
      return (
        <p className="text-gray-300 text-sm leading-relaxed">
          {message}
        </p>
      );
    }

    return message;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className={`relative w-full max-w-md bg-dark-800 rounded-2xl border ${styles.border} shadow-2xl`}>
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 hover:bg-dark-700 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 ${styles.iconBg} rounded-xl`}>
              <Icon className={`w-6 h-6 ${styles.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {title}
              </h3>
              {renderMessage()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 ${styles.confirmBtn} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
