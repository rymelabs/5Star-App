import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Header from './ui/Header';
import BottomNav from './ui/BottomNav';
import AppShell from './ui/AppShell';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
      return undefined;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return undefined;
    }

    const storageKey = `scroll-position:${location.pathname}`;

    const restoreScroll = () => {
      const stored = window.sessionStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        container.scrollTo({ top: Number.isNaN(parsed) ? 0 : parsed, behavior: 'auto' });
      } else {
        container.scrollTo({ top: 0, behavior: 'auto' });
      }
    };

    const frameId = window.requestAnimationFrame(restoreScroll);

    const handleScroll = () => {
      window.sessionStorage.setItem(storageKey, container.scrollTop.toString());
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(frameId);
      window.sessionStorage.setItem(storageKey, container.scrollTop.toString());
    };
  }, [location.pathname]);

  return (
    <AppShell
      ref={scrollContainerRef}
      header={<Header />}
      bottomNav={<BottomNav />}
    >
      {children}
    </AppShell>
  );
};

export default Layout;
