// Image upload utility for Firebase Storage
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage } from '../firebase/config';

/**
 * Upload an image file to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder path in storage (e.g., 'teams', 'players')
 * @param {string} fileName - Optional custom filename (without extension)
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export const uploadImage = async (file, folder = 'images', fileName = null) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    const storage = getFirebaseStorage();

    // Generate unique filename if not provided
    const timestamp = Date.now();
    const originalName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const extension = file.name.split('.').pop().toLowerCase();
    const finalFileName = fileName || `${originalName}_${timestamp}`;

    const storageRef = ref(storage, `${folder}/${finalFileName}.${extension}`);

    // Upload the file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'uploadedBy': 'admin-panel',
        'uploadDate': new Date().toISOString()
      }
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);

    // Provide more helpful error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Storage access denied. Please ensure Firebase Storage is enabled in your Firebase Console and CORS is configured for localhost.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded');
    } else if (error.code === 'storage/invalid-format') {
      throw new Error('Invalid file format');
    } else if (error.code === 'storage/project-not-found') {
      throw new Error('Firebase Storage is not enabled. Please enable it in your Firebase Console.');
    } else if (error.message && error.message.includes('CORS')) {
      throw new Error('CORS policy blocked the request. Please configure CORS for your Firebase Storage bucket.');
    }

    throw error;
  }
};

/**
 * Delete an image from Firebase Storage
 * @param {string} imageUrl - The download URL of the image to delete
 * @returns {Promise<void>}
 */
export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
      // Not a Firebase Storage URL, skip deletion
      return;
    }

    const storage = getFirebaseStorage();

    // Extract the path from the URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error for deletion failures as it's not critical
  }
};

/**
 * Validate image file before upload
 * @param {File} file - The file to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image (JPEG, PNG, GIF, etc.)' };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File must be JPEG, PNG, GIF, or WebP format' };
  }

  return { isValid: true, error: null };
};