/**
 * Image Resize Utility
 * Generates thumbnail and full-size variants of uploaded images
 * Uses browser-image-compression for efficient client-side processing
 */
import imageCompression from 'browser-image-compression';

// Size configurations for logo variants
export const LOGO_SIZES = {
  thumbnail: {
    maxWidthOrHeight: 64,
    maxSizeMB: 0.01, // ~10KB max
    useWebWorker: true,
    fileType: 'image/webp',
  },
  full: {
    maxWidthOrHeight: 256,
    maxSizeMB: 0.05, // ~50KB max
    useWebWorker: true,
    fileType: 'image/webp',
  },
};

/**
 * Compress and resize an image to a specific size
 * @param {File} file - The original image file
 * @param {Object} options - Compression options (from LOGO_SIZES)
 * @returns {Promise<File>} - Compressed image file
 */
export const resizeImage = async (file, options) => {
  try {
    const compressedFile = await imageCompression(file, {
      ...options,
      initialQuality: 0.8,
      alwaysKeepResolution: false,
    });
    
    return compressedFile;
  } catch (error) {
    console.error('Image resize failed:', error);
    throw new Error(`Failed to resize image: ${error.message}`);
  }
};

/**
 * Generate both thumbnail and full-size variants of an image
 * @param {File} file - The original image file
 * @returns {Promise<{thumbnail: File, full: File}>} - Both image variants
 */
export const generateLogoVariants = async (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  try {
    // Generate both variants in parallel for faster processing
    const [thumbnail, full] = await Promise.all([
      resizeImage(file, LOGO_SIZES.thumbnail),
      resizeImage(file, LOGO_SIZES.full),
    ]);

    return { thumbnail, full };
  } catch (error) {
    console.error('Failed to generate logo variants:', error);
    throw error;
  }
};

/**
 * Convert a blob URL or external URL to a File object
 * Uses canvas to bypass CORS restrictions for images
 * For Firebase Storage URLs, adds token handling
 * @param {string} url - Image URL
 * @param {string} filename - Desired filename
 * @returns {Promise<File>} - File object
 */
export const urlToFile = async (url, filename = 'image') => {
  // For Firebase Storage URLs, try direct fetch first (should work with proper CORS)
  if (url.includes('firebasestorage.googleapis.com')) {
    try {
      const response = await fetch(url, { 
        mode: 'cors',
        credentials: 'omit' // Don't send cookies
      });
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], `${filename}.png`, { type: blob.type || 'image/png' });
        return file;
      }
    } catch (e) {
      console.log('Direct fetch failed, trying canvas method...', e.message);
    }
  }

  // Fallback to canvas method
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to get CORS-enabled image
    
    img.onload = () => {
      try {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image to blob'));
            return;
          }
          const file = new File([blob], `${filename}.png`, { type: 'image/png' });
          resolve(file);
        }, 'image/png', 0.95);
      } catch (error) {
        reject(new Error(`Canvas error: ${error.message}. This may be a tainted canvas due to CORS.`));
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image from: ${url.substring(0, 50)}...`));
    };
    
    // Add cache-busting for Firebase URLs to avoid stale cache
    const separator = url.includes('?') ? '&' : '?';
    img.src = url + separator + '_t=' + Date.now();
  });
};

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Human-readable size
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
