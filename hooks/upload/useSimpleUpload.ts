import { useState, useRef } from 'react';
import { Platform } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { baseURL } from '@/config/axiosInstance';
import { getData } from '@/helpers/utils/storage';
import { validateMentionsForBackend } from '@/helpers/utils/mentionUtils';
import useVideoUploadStore from '@/store/videoUploadStore';
import { VideoDetails, PostDetails } from '@/store/videoUploadStore';

export const useSimpleUpload = () => {
  const queryClient = useQueryClient();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  const {
    isUploading: storeIsUploading,
    isCancelling,
    abortController,
    setUploading,
    setUploadProgress,
    setUploadError,
    setCancelling,
    setAbortController,
    clearAbortController,
    resetUpload
  } = useVideoUploadStore();

  // Convert error to user-friendly message
  const getErrorMessage = (error: any): string => {
    if (!error) return 'Upload failed';
    
    // Check for HTTP status codes first
    if (error.response?.status) {
      const statusCode = error.response.status;
      switch (statusCode) {
        case 413:
          return 'File is too large. Please choose a smaller file.';
        case 415:
          return 'File type not supported. Please choose a different file.';
        case 400:
          return 'Invalid file or missing information. Please check your upload.';
        case 401:
          return 'Session expired. Please log in again.';
        case 403:
          return 'Upload not permitted. Check your account status.';
        case 404:
          return 'Upload service unavailable. Please try again later.';
        case 422:
          return 'File validation failed. Please check file format and size.';
        case 429:
          return 'Too many uploads. Please wait and try again.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Server error. Please try again in a few minutes.';
        default:
          return 'Upload failed. Please try again.';
      }
    }
    
    // Check for common error messages
    const message = error.message || error.toString();
    
    if (message.includes('Network Error') || message.includes('timeout')) {
      return 'Connection timeout. Please check your internet and try again.';
    }
    
    if (message.includes('File too large') || message.includes('413')) {
      return 'File is too large. Please choose a smaller file.';
    }
    
    if (message.includes('No authentication token')) {
      return 'Session expired. Please log in again.';
    }
    
    if (message.includes('does not exist')) {
      return 'File not found. Please select the file again.';
    }
    
    return 'Upload failed. Please try again.';
  };

  // Show completion notification
  const showCompletionNotification = async (type: 'video' | 'photo', success: boolean, error?: any) => {
    try {
      const mediaType = type === 'video' ? 'Video' : 'Photo';
      const errorMessage = error ? getErrorMessage(error) : '';
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: success ? `${mediaType} Upload Complete` : `${mediaType} Upload Failed`,
          body: success 
            ? `Your ${type} has been uploaded successfully!`
            : errorMessage || `Failed to upload your ${type}`,
          data: { type: 'upload_result' },
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          color: success ? '#4CAF50' : '#F44336',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing completion notification:', error);
    }
  };

  const videoUploadMutation = useMutation({
    mutationFn: async ({ 
      videoUri, 
      videoDetails, 
      userId 
    }: { 
      videoUri: string; 
      videoDetails: VideoDetails; 
      userId: string; 
    }) => {
      console.log('📤 Video mutation starting - checking AbortController...', {
        hasAbortController: !!abortController,
        currentTaskId
      });
      
      // Use the AbortController from the store
      if (!abortController) {
        console.log('❌ No AbortController found in store - upload was cancelled');
        throw new Error('Upload was cancelled before it could start');
      }
      
      console.log('✅ AbortController found in store - proceeding with upload');

      // Get authentication token
      setUploadProgress(1); // Show minimal progress during auth
      const token = await getData('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Verify video file exists
      setUploadProgress(2); // Show progress during file validation
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new Error('Video file does not exist');
      }

      // Create form data for multipart upload
      setUploadProgress(3); // Show progress during form preparation
      const formData = new FormData();

      // Extract filename from URI
      const uriParts = videoUri.split("/");
      const fileName = uriParts[uriParts.length - 1];

      // Add the video file to form data
      formData.append("postVideo", {
        uri: Platform.OS === "ios" ? videoUri.replace("file://", "") : videoUri,
        name: fileName,
        type: "video/mp4",
      } as any);

      // Add video details to form data
      formData.append("description", videoDetails.description);
      formData.append("visibility", videoDetails.visibility);
      formData.append("isCommentsAllowed", String(videoDetails.isCommentsAllowed));

      // Add tags as a JSON string (ensure clean JSON without encoding issues)
      if (videoDetails.tags && videoDetails.tags.length > 0) {
        const cleanTags = videoDetails.tags.filter(tag => tag && tag.trim() !== '');
        formData.append("tags", JSON.stringify(cleanTags));
      }

      // Add playlist IDs as a JSON string
      if (videoDetails.playlistIds && videoDetails.playlistIds.length > 0) {
        formData.append("playlistIds", JSON.stringify(videoDetails.playlistIds));
      }

      // Add usernames array for backend
      if (videoDetails.mentions && videoDetails.mentions.length > 0) {
        const usernames = validateMentionsForBackend(videoDetails.mentions);
        formData.append("usernames", JSON.stringify(usernames));
      }

      // Add thumbnail if it exists and is different from the video URI
      if (videoDetails.thumbnailUri && videoDetails.thumbnailUri !== videoUri) {
        // Extract thumbnail filename
        const thumbnailUriParts = videoDetails.thumbnailUri.split("/");
        const thumbnailFileName = thumbnailUriParts[thumbnailUriParts.length - 1];

        formData.append("thumbnailImage", {
          uri: Platform.OS === "ios"
            ? videoDetails.thumbnailUri.replace("file://", "")
            : videoDetails.thumbnailUri,
          name: thumbnailFileName,
          type: "image/jpeg",
        } as any);
      }

      // Form data preparation complete, ready to upload
      setUploadProgress(5); // Show preparation complete

      // Upload with axios and abort controller
      const response = await axios.post(`${baseURL}/feeds/upload/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        timeout: 600000, // 10 minute timeout
        signal: abortController.signal, // Enable cancellation
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total && !abortController.signal.aborted) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      if (abortController.signal.aborted) {
        throw new Error('Upload was cancelled');
      }

      return response.data;
    },
    onSuccess: async () => {
      console.log('Video upload completed successfully');
      setUploadProgress(100);
      
      // Show success notification
      await showCompletionNotification('video', true);
      
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ['userFeeds'], exact: false, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['feeds'], exact: false, refetchType: 'all' });
      
      // Reset upload state but keep AbortController for potential cancel
      setTimeout(() => {
        resetUpload();
        setCurrentTaskId(null);
        // Don't clear abortControllerRef - let cancel handle it
      }, 1000);
    },
    onError: async (error: any) => {
      console.error('Video upload failed:', error);
      
      // Check if upload was cancelled by user
      const isAborted = error.message?.includes('cancelled') || 
                       error.message?.includes('aborted') ||
                       error.name === 'AbortError' ||
                       error.code === 'ERR_CANCELED' ||
                       error.code === 'ECONNABORTED' ||
                       (abortController?.signal.aborted);
      
      if (!isAborted) {
        // Only show error if the upload wasn't cancelled by user
        const friendlyMessage = getErrorMessage(error);
        setUploadError(friendlyMessage);
        await showCompletionNotification('video', false, error);
        
        // Reset state but keep AbortController for potential cancel
        setTimeout(() => {
          resetUpload();
          setCurrentTaskId(null);
          // Don't clear abortControllerRef - let cancel handle it
        }, 2000);
      } else {
        console.log('🚫 Video upload was cancelled by user - suppressing error notification');
        // Don't show error notifications for user cancellations
      }
    },
  });

  // Image compression helper
  const compressImage = async (imageUri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1080 } }], // Resize to max 1080px width
        {
          compress: 0.8, // 80% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (error) {
      console.warn("Image compression failed, using original:", error);
      return imageUri; // Fallback to original
    }
  };

  const photoUploadMutation = useMutation({
    mutationFn: async ({ 
      photoUris, 
      postDetails, 
      userId 
    }: { 
      photoUris: string[]; 
      postDetails: PostDetails; 
      userId: string; 
    }) => {
      // Use the AbortController from the store
      if (!abortController) {
        throw new Error('Upload was cancelled before it could start');
      }

      // Get authentication token
      setUploadProgress(1); // Show minimal progress during auth
      const token = await getData('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Compress images for faster upload
      setUploadProgress(2); // Show progress - skipping compression
      // console.log("Compressing images for faster upload...");
      // const compressedImageUris: string[] = [];
      // 
      // for (let i = 0; i < photoUris.length; i++) {
      //   const imageUri = photoUris[i];
      //   try {
      //     const compressedUri = await compressImage(imageUri);
      //     compressedImageUris.push(compressedUri);
      //   } catch (error) {
      //     console.error(`Failed to compress photo ${i + 1}, using original:`, error);
      //     compressedImageUris.push(imageUri); // Use original if compression fails
      //   }
      // }

      // Use original images without compression
      const compressedImageUris = photoUris;

      // Verify all images exist  
      setUploadProgress(3); // Show progress during file validation
      const fileChecks = await Promise.all(
        compressedImageUris.map(async (imageUri) => {
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          return { uri: imageUri, exists: fileInfo.exists };
        })
      );
      
      const missingFiles = fileChecks.filter(check => !check.exists);
      if (missingFiles.length > 0) {
        throw new Error(`Original image files do not exist: ${missingFiles.map(f => f.uri).join(', ')}`);
      }

      // Create form data for multipart upload
      setUploadProgress(4); // Show progress during form preparation
      const formData = new FormData();

      // Optimize file type detection with lookup
      const getFileType = (fileName: string): string => {
        if (!fileName) return "image/jpeg";
        const extension = fileName.toLowerCase().split('.').pop();
        const typeMap: { [key: string]: string } = {
          'png': "image/png",
          'webp': "image/webp",
          'jpg': "image/jpeg",
          'jpeg': "image/jpeg"
        };
        return typeMap[extension || ''] || "image/jpeg";
      };

      // Add ALL original images to form data (compression disabled)
      compressedImageUris.forEach((imageUri, index) => {
        const uriParts = imageUri.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileType = getFileType(fileName);

        formData.append("images", {
          uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
          name: fileName || `image_${index}.jpg`,
          type: fileType,
        } as any);
      });

      // Add post details to form data
      formData.append("description", postDetails.description || "");
      formData.append("visibility", postDetails.visibility || "public");
      formData.append("isCommentsAllowed", String(postDetails.isCommentsAllowed));
      formData.append("category", "Entertainment"); // Default category

      // Add tags as a JSON string (always required by server)
      const rawTags = postDetails.tags && postDetails.tags.length > 0 ? postDetails.tags : [];
      const cleanTags = rawTags.filter(tag => tag && tag.trim() !== '');
      formData.append("tags", JSON.stringify(cleanTags));

      // Add usernames array for backend
      if (postDetails.mentions && postDetails.mentions.length > 0) {
        const usernames = validateMentionsForBackend(postDetails.mentions);
        formData.append("usernames", JSON.stringify(usernames));
      }

      // Form data preparation complete, ready to upload
      setUploadProgress(5); // Show preparation complete

      // Upload with axios and abort controller
      const response = await axios.post(`${baseURL}/feeds/upload/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        timeout: 600000, // 10 minute timeout
        signal: abortController.signal, // Enable cancellation
        maxContentLength: 100 * 1024 * 1024, // 100MB limit
        maxBodyLength: 100 * 1024 * 1024,
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total && !abortController.signal.aborted) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      if (abortController.signal.aborted) {
        throw new Error('Upload was cancelled');
      }

      return response.data;
    },
    onSuccess: async () => {
      console.log('Photo upload completed successfully');
      setUploadProgress(100);
      
      // Show success notification
      await showCompletionNotification('photo', true);
      
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ['userFeeds'], exact: false, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['feeds'], exact: false, refetchType: 'all' });
      
      // Reset upload state but keep AbortController for potential cancel
      setTimeout(() => {
        resetUpload();
        setCurrentTaskId(null);
        // Don't clear abortControllerRef - let cancel handle it
      }, 1000);
    },
    onError: async (error: any) => {
      console.error('Photo upload failed:', error);
      
      // Check if upload was cancelled by user
      const isAborted = error.message?.includes('cancelled') || 
                       error.message?.includes('aborted') ||
                       error.name === 'AbortError' ||
                       error.code === 'ERR_CANCELED' ||
                       error.code === 'ECONNABORTED' ||
                       (abortController?.signal.aborted);
      
      if (!isAborted) {
        // Only show error if the upload wasn't cancelled by user
        const friendlyMessage = getErrorMessage(error);
        setUploadError(friendlyMessage);
        await showCompletionNotification('photo', false, error);
        
        // Reset state but keep AbortController for potential cancel
        setTimeout(() => {
          resetUpload();
          setCurrentTaskId(null);
          // Don't clear abortControllerRef - let cancel handle it
        }, 2000);
      } else {
        console.log('🚫 Photo upload was cancelled by user - suppressing error notification');
        // Don't show error notifications for user cancellations
      }
    },
  });

  const cancelUpload = () => {
    console.log('🚫 Cancel button pressed - immediate response');
    
    // Set cancelling state immediately for UI feedback
    setCancelling(true);
    
    // Abort the actual HTTP request immediately
    if (abortController) {
      const wasAborted = abortController.signal.aborted;
      console.log('🚫 Store AbortController state before abort:', { 
        exists: true, 
        wasAborted,
        currentTaskId 
      });
      
      abortController.abort();
      console.log('🚫 HTTP request abort() called - signal should be aborted now');
    } else {
      console.log('🚫 No AbortController found in store to abort');
    }
    
    // Reset state immediately - no delay needed
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setCancelling(false);
    setCurrentTaskId(null);
    
    // Also reset the upload store to clear UI
    resetUpload();
    
    console.log('🚫 Upload cancelled and UI reset');
    
    // Clear AbortController after a brief delay to allow any in-flight error handling
    setTimeout(() => {
      clearAbortController();
    }, 1000);
  };

  const startVideoUpload = (videoUri: string, videoDetails: VideoDetails, userId: string) => {
    // Clean up any previous AbortController
    if (abortController) {
      clearAbortController();
    }
    
    // Create AbortController immediately when upload starts
    const taskId = `video_${Date.now()}`;
    const newAbortController = new AbortController();
    
    // Set up state immediately
    setCurrentTaskId(taskId);
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setAbortController(newAbortController);
    
    console.log('🚀 Starting video upload with store AbortController:', { taskId });
    
    // Start the mutation with existing AbortController
    videoUploadMutation.mutate({ videoUri, videoDetails, userId });
  };

  const startPhotoUpload = (photoUris: string[], postDetails: PostDetails, userId: string) => {
    // Clean up any previous AbortController
    if (abortController) {
      clearAbortController();
    }
    
    // Create AbortController immediately when upload starts
    const taskId = `photo_${Date.now()}`;
    const newAbortController = new AbortController();
    
    // Set up state immediately
    setCurrentTaskId(taskId);
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setAbortController(newAbortController);
    
    console.log('🚀 Starting photo upload with store AbortController:', { taskId });
    
    // Start the mutation with existing AbortController
    photoUploadMutation.mutate({ photoUris, postDetails, userId });
  };

  return {
    // State
    currentTaskId,
    isUploading: storeIsUploading, // Use store state instead of mutation pending
    
    // Actions
    startVideoUpload,
    startPhotoUpload,
    cancelUpload,
  };
};