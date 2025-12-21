import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { fetchInstagramPosts, getInstagramSettings } from '../firebase/instagram';
import useCachedState from '../hooks/useCachedState';

const InstagramContext = createContext();

export const useInstagram = () => {
  const context = useContext(InstagramContext);
  if (!context) {
    throw new Error('useInstagram must be used within an InstagramProvider');
  }
  return context;
};

export const InstagramProvider = ({ children }) => {
  const [posts, setPosts] = useCachedState('instagram:posts', []);
  const [settings, setSettings] = useCachedState('instagram:settings', null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Instagram settings and posts
  const loadInstagramData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch settings first
      const instagramSettings = await getInstagramSettings();
      setSettings(instagramSettings);

      // Only fetch posts if Instagram is enabled and username is provided
      if (instagramSettings?.enabled && instagramSettings?.username) {
        try {
          const instagramPosts = await fetchInstagramPosts(12);
          setPosts(instagramPosts);
        } catch (err) {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } catch (err) {
      setError(err.message);
      setPosts([]);
      setSettings({ enabled: false, username: '' });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadInstagramData();
  }, []);

  // Refresh posts
  const refreshPosts = async () => {
    await loadInstagramData();
  };

  const value = useMemo(() => ({
    posts,
    settings,
    loading,
    error,
    refreshPosts
  }), [posts, settings, loading, error, refreshPosts]);

  return (
    <InstagramContext.Provider value={value}>
      {children}
    </InstagramContext.Provider>
  );
};

export default InstagramContext;
