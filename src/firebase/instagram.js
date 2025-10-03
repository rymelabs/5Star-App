import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from './config';

// Helper function to check if Firebase is initialized
const checkFirebaseInit = () => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your .env configuration.');
  }
  return db;
};

/**
 * Instagram integration service
 * Note: For production, you'll need to set up Instagram Basic Display API
 * or use Instagram Graph API with proper authentication
 */

// Get Instagram settings from Firestore
export const getInstagramSettings = async () => {
  try {
    const database = checkFirebaseInit();
    const settingsRef = doc(database, 'settings', 'instagram');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      return settingsDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Instagram settings:', error);
    throw error;
  }
};

// Save Instagram settings (admin only)
export const saveInstagramSettings = async (settings) => {
  try {
    const database = checkFirebaseInit();
    const settingsRef = doc(database, 'settings', 'instagram');
    
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error saving Instagram settings:', error);
    throw error;
  }
};

// Fetch Instagram posts
// For now, this returns mock data. In production, you would:
// 1. Use Instagram Basic Display API with access token
// 2. Or use Instagram embed/oEmbed API
// 3. Or use a third-party service like Juicer, SnapWidget, etc.
export const fetchInstagramPosts = async (limit = 6) => {
  try {
    const settings = await getInstagramSettings();
    
    if (!settings || !settings.enabled) {
      return [];
    }

    // If you have an Instagram access token, use it here
    if (settings.accessToken && settings.username) {
      try {
        // Instagram Basic Display API endpoint
        const response = await fetch(
          `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${settings.accessToken}&limit=${limit}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return data.data || [];
        }
      } catch (error) {
        console.error('Error fetching from Instagram API:', error);
      }
    }

    // Fallback: Return empty array if no valid configuration
    return [];
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return [];
  }
};

// Generate Instagram embed URL for a post
export const getInstagramEmbedUrl = (postUrl) => {
  if (!postUrl) return null;
  return `https://www.instagram.com/p/${postUrl.split('/p/')[1]?.split('/')[0]}/embed/`;
};

// Parse Instagram username from URL
export const parseInstagramUsername = (url) => {
  if (!url) return null;
  const match = url.match(/instagram\.com\/([^\/\?]+)/);
  return match ? match[1] : null;
};

export default {
  getInstagramSettings,
  saveInstagramSettings,
  fetchInstagramPosts,
  getInstagramEmbedUrl,
  parseInstagramUsername
};
