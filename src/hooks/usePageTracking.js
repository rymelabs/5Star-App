import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, setUserProps, getConsentStatus } from '../utils/analytics';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to track page views on route changes
 * Also sets user properties when auth state changes
 */
const usePageTracking = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Track page views on route change
  useEffect(() => {
    // Only track if user has consented
    if (getConsentStatus() !== 'granted') return;

    // Get language from localStorage or default to 'en'
    const language = localStorage.getItem('language') || 'en';
    
    trackPageView(location.pathname, {
      page_path: location.pathname + location.search,
      page_title: document.title,
      language,
      is_authenticated: !!user
    });
  }, [location.pathname, location.search, user]);

  // Set user properties when auth state changes
  useEffect(() => {
    if (getConsentStatus() !== 'granted') return;

    const language = localStorage.getItem('language') || 'en';
    const theme = localStorage.getItem('theme') || 'dark';
    
    // Determine device type
    const deviceType = window.innerWidth < 768 ? 'mobile' : 
                       window.innerWidth < 1024 ? 'tablet' : 'desktop';
    
    // Determine role
    let role = 'guest';
    if (user) {
      role = user.role === 'admin' ? 'admin' : 'user';
    }

    setUserProps({
      role,
      language,
      device_type: deviceType,
      theme
    });
  }, [user]);
};

export default usePageTracking;
