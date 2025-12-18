import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PwaInstallContext = createContext(null);

export const PwaInstallProvider = ({ children }) => {
  const deferredPromptRef = useRef(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // iOS Safari home-screen mode
      window.navigator.standalone === true;

    setIsInstalled(standalone);

    // iOS doesn't fire beforeinstallprompt; keep install action available when not installed.
    if (ios && !standalone) {
      setCanInstall(true);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Only fires on Chromium-based browsers when installable.
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isInstalled) return { status: 'already-installed' };

    if (isIOS) {
      return { status: 'ios' };
    }

    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) {
      return { status: 'unavailable' };
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    // The event can only be used once.
    deferredPromptRef.current = null;
    setCanInstall(false);

    return { status: outcome === 'accepted' ? 'accepted' : 'dismissed' };
  }, [isIOS, isInstalled]);

  const value = useMemo(
    () => ({
      isIOS,
      isInstalled,
      canInstall: canInstall && !isInstalled,
      promptInstall,
    }),
    [isIOS, isInstalled, canInstall, promptInstall]
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
};

export const usePwaInstall = () => {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error('usePwaInstall must be used within a PwaInstallProvider');
  return ctx;
};
