// Video upload utility for Firebase Storage with progress tracking
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage } from '../firebase/config';

/**
 * Upload a video file to Firebase Storage with progress tracking
 * @param {File} file - The video file to upload
 * @param {string} folder - The folder path in storage (e.g., 'highlights')
 * @param {function} onProgress - Callback for upload progress (percentage 0-100)
 * @returns {Promise<string>} - The download URL of the uploaded video
 */
export const uploadVideoWithProgress = (file, folder = 'highlights', onProgress = null) => {
    return new Promise((resolve, reject) => {
        try {
            if (!file) {
                return reject(new Error('No file provided'));
            }

            // Validate file type (videos only)
            if (!file.type.startsWith('video/')) {
                return reject(new Error('File must be a video'));
            }

            // Max size: 100MB
            const maxSize = 100 * 1024 * 1024;
            if (file.size > maxSize) {
                return reject(new Error('Video file is too large (max 100MB)'));
            }

            const storage = getFirebaseStorage();
            const timestamp = Date.now();
            const originalName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
            const extension = file.name.split('.').pop().toLowerCase();
            const finalFileName = `${originalName}_${timestamp}.${extension}`;

            const storageRef = ref(storage, `${folder}/${finalFileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file, {
                contentType: file.type
            });

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // Progress reporting
                    if (onProgress) {
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        onProgress(progress);
                    }
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error('Video upload failed:', error);

                    let errorMessage = 'Upload failed';
                    if (error.code === 'storage/unauthorized') {
                        errorMessage = 'Storage access denied. Check your Firebase rules.';
                    } else if (error.code === 'storage/quota-exceeded') {
                        errorMessage = 'Storage quota exceeded.';
                    } else if (error.code === 'storage/canceled') {
                        errorMessage = 'Upload canceled.';
                    }

                    reject(new Error(errorMessage));
                },
                async () => {
                    // Handle successful uploads on complete
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    } catch (err) {
                        reject(err);
                    }
                }
            );
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Delete a video from Firebase Storage
 * @param {string} videoUrl - The download URL of the video to delete
 * @returns {Promise<void>}
 */
export const deleteVideo = async (videoUrl) => {
    try {
        if (!videoUrl || !videoUrl.includes('firebasestorage.googleapis.com')) {
            return;
        }

        const storage = getFirebaseStorage();
        const url = new URL(videoUrl);
        const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Video deletion failed:', error);
    }
};
