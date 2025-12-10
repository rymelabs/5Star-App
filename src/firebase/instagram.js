import { getFirebaseDb } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Get Instagram settings from Firestore
export const getInstagramSettings = async () => {
  try {
    const db = getFirebaseDb();
    const settingsRef = doc(db, 'settings', 'instagram');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      return settingsDoc.data();
    }
    
    // Return default settings if none exist
    return {
      enabled: false,
      username: '',
    };
  } catch (error) {
    throw error;
  }
};

// Save Instagram settings to Firestore
export const saveInstagramSettings = async (settings) => {
  try {
    const db = getFirebaseDb();
    const settingsRef = doc(db, 'settings', 'instagram');
    
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Fetch Instagram posts from public profile (no API key needed)
// Note: Direct fetching from browser is blocked by Instagram's CORS policy
// This function is kept for future backend implementation
export const fetchInstagramPosts = async (limit = 12) => {
  try {
    const settings = await getInstagramSettings();
    
    if (!settings.enabled || !settings.username) {
      return [];
    }
    
    // Instagram blocks client-side requests due to CORS policy
    // For now, return empty array to show the profile link fallback
    // To display actual posts, you would need:
    // 1. Backend proxy server to fetch Instagram data
    // 2. Official Instagram Basic Display API with access token
    // 3. Third-party service (EmbedSocial, Juicer, SnapWidget)
    
    return [];
    
    /* 
    // This code is commented out because Instagram blocks it with CORS
    const username = settings.username.replace('@', '');
    const response = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const posts = data?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
    
    return posts.slice(0, limit).map(edge => ({
      id: edge.node.id,
      media_type: edge.node.is_video ? 'VIDEO' : 'IMAGE',
      media_url: edge.node.display_url,
      thumbnail_url: edge.node.thumbnail_src || edge.node.display_url,
      caption: edge.node.edge_media_to_caption?.edges[0]?.node?.text || '',
      permalink: `https://www.instagram.com/p/${edge.node.shortcode}/`,
      timestamp: new Date(edge.node.taken_at_timestamp * 1000).toISOString(),
      likes: edge.node.edge_liked_by?.count || 0,
      comments: edge.node.edge_media_to_comment?.count || 0,
    }));
    */
  } catch (error) {
    // Return empty array - will show profile link fallback
    return [];
  }
};
