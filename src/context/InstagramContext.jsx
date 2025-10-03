import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchInstagramPosts, getInstagramSettings } from '../firebase/instagram';

const InstagramContext = createContext();

export const useInstagram = () => {
  const context = useContext(InstagramContext);
  if (!context) {
    throw new Error('useInstagram must be used within an InstagramProvider');
  }
  return context;
};

export const InstagramProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState(null);
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

      // Only fetch posts if Instagram is enabled
      if (instagramSettings && instagramSettings.enabled) {
        const instagramPosts = await fetchInstagramPosts(6);
        setPosts(instagramPosts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Error loading Instagram data:', err);
      setError(err.message);
      setPosts([]);
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

  const value = {
    posts,
    settings,
    loading,
    error,
    refreshPosts
  };

  return (
    <InstagramContext.Provider value={value}>
      {children}
    </InstagramContext.Provider>
  );
};

export default InstagramContext;
