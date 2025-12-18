import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_CACHE_KEY = 'fivescores_page_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

export const usePageCache = () => {
  const location = useLocation();
  const isInitialLoad = useRef(true);
  const isRefresh = useRef(false);

  useEffect(() => {
    // Detect if this is a page refresh
    if (window.performance && window.performance.navigation) {
      isRefresh.current = window.performance.navigation.type === 1; // TYPE_RELOAD
    }

    console.log(`[PageCache] Page load - Path: ${location.pathname}, Is Refresh: ${isRefresh.current}`);

    // On initial load, check if we should restore from cache
    if (isInitialLoad.current && !isRefresh.current) {
      const cachedData = getCachedPage(location.pathname);
      if (cachedData) {
        console.log(`[PageCache] Restoring cached data for ${location.pathname}:`, cachedData);
        // Restore scroll position if cached
        if (cachedData.scrollY !== undefined) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            window.scrollTo(0, cachedData.scrollY);
          });
        }
        // You can extend this to restore other page state
      } else {
        console.log(`[PageCache] No cached data found for ${location.pathname}`);
      }
    }

    isInitialLoad.current = false;
  }, [location.pathname]);

  // Cache page data when component unmounts (navigation away)
  useEffect(() => {
    const handleScroll = () => {
      if (!isRefresh.current) {
        cacheCurrentPage(location.pathname, {
          scrollY: window.scrollY,
          timestamp: Date.now()
        });
      }
    };

    const handleBeforeUnload = () => {
      if (!isRefresh.current) {
        cacheCurrentPage(location.pathname, {
          scrollY: window.scrollY,
          timestamp: Date.now()
        });
      }
    };

    // Throttle scroll events for performance
    let scrollTimeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(scrollTimeout);

      // Cache on navigation
      if (!isRefresh.current) {
        cacheCurrentPage(location.pathname, {
          scrollY: window.scrollY,
          timestamp: Date.now()
        });
      }
    };
  }, [location.pathname]);

  return {
    isRefresh: isRefresh.current,
    clearCache: () => clearPageCache(),
    getCachedPage: (path) => getCachedPage(path)
  };
};

function cacheCurrentPage(pathname, data) {
  try {
    const cache = getAllPageCache();
    cache[pathname] = {
      ...data,
      timestamp: Date.now()
    };

    // Clean up old entries
    Object.keys(cache).forEach(key => {
      if (Date.now() - cache[key].timestamp > CACHE_EXPIRY) {
        delete cache[key];
      }
    });

    localStorage.setItem(PAGE_CACHE_KEY, JSON.stringify(cache));
    console.log(`[PageCache] Cached data for ${pathname}:`, data);
  } catch (error) {
    console.warn('Failed to cache page data:', error);
  }
}

function getCachedPage(pathname) {
  try {
    const cache = getAllPageCache();
    const data = cache[pathname];

    if (data && Date.now() - data.timestamp < CACHE_EXPIRY) {
      return data;
    }

    // Remove expired entry
    if (data) {
      delete cache[pathname];
      localStorage.setItem(PAGE_CACHE_KEY, JSON.stringify(cache));
    }

    return null;
  } catch (error) {
    console.warn('Failed to get cached page data:', error);
    return null;
  }
}

function getAllPageCache() {
  try {
    const cache = localStorage.getItem(PAGE_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (error) {
    console.warn('Failed to parse page cache:', error);
    return {};
  }
}

function clearPageCache() {
  try {
    localStorage.removeItem(PAGE_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear page cache:', error);
  }
}