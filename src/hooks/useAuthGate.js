import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PROMPT = {
  title: 'Sign in required',
  message: 'Create a free account to continue.',
  confirmText: 'Go to sign in',
  cancelText: 'Maybe later',
  type: 'info'
};

const useAuthGate = (overrides = {}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) {
      return true;
    }
    setIsOpen(true);
    return false;
  }, [isAuthenticated]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    navigate('/auth', { state: { from: location.pathname + location.search } });
  }, [navigate, location]);

  const authPromptProps = {
    isOpen,
    onClose: handleClose,
    onConfirm: handleConfirm,
    title: overrides.title || DEFAULT_PROMPT.title,
    message: overrides.message || DEFAULT_PROMPT.message,
    confirmText: overrides.confirmText || DEFAULT_PROMPT.confirmText,
    cancelText: overrides.cancelText || DEFAULT_PROMPT.cancelText,
    type: overrides.type || DEFAULT_PROMPT.type
  };

  return { requireAuth, authPromptProps };
};

export default useAuthGate;
