import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "@/helpers/utils/request";
import { VideoDetails, PostDetails } from "@/store/videoUploadStore";
import axios from "axios";
import { baseURL } from "@/config/axiosInstance";
import { getData } from "@/helpers/utils/storage";
import { validateMentionsForBackend } from "@/helpers/utils/mentionUtils";
// import { updatePlaylistVideo } from "./playlist.service";

export const uploadVideo = async (
  videoUri: string,
  videoDetails: VideoDetails,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<GenericResponse> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(videoUri);

    if (!fileInfo.exists) {
      throw new Error("Video file does not exist");
    }

    // Create form data for multipart upload
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
    formData.append("allowComments", String(videoDetails.isCommentsAllowed));

    // Add tags as a JSON string
    if (videoDetails.tags && videoDetails.tags.length > 0) {
      formData.append("tags", JSON.stringify(videoDetails.tags));
    }

    // Add playlist IDs as a JSON string
    if (videoDetails.playlistIds && videoDetails.playlistIds.length > 0) {
      formData.append("playlistIds", JSON.stringify(videoDetails.playlistIds));
    }

    // Add usernames array for backend
    if (videoDetails.mentions && videoDetails.mentions.length > 0) {
      const usernames = validateMentionsForBackend(videoDetails.mentions);
      
      console.log("🔥 VIDEO SERVICE - MENTIONS PAYLOAD DEBUG:", {
        originalMentions: videoDetails.mentions,
        usernames: usernames,
        usernamesCount: usernames.length,
        usernamesPayload: JSON.stringify(usernames),
        description: videoDetails.description,
        timestamp: new Date().toISOString()
      });
      
      // Send only usernames array as expected by backend
      formData.append("usernames", JSON.stringify(usernames));
    } else {
      console.log("🔥 VIDEO SERVICE - NO MENTIONS DEBUG:", {
        videoDetailsMentions: videoDetails.mentions,
        mentionsLength: videoDetails.mentions?.length || 0,
        description: videoDetails.description,
        timestamp: new Date().toISOString()
      });
    }

    // Add thumbnail if it exists and is different from the video URI
    if (videoDetails.thumbnailUri && videoDetails.thumbnailUri !== videoUri) {
      // Extract thumbnail filename
      const thumbnailUriParts = videoDetails.thumbnailUri.split("/");
      const thumbnailFileName = thumbnailUriParts[thumbnailUriParts.length - 1];

      formData.append("thumbnailImage", {
        uri:
          Platform.OS === "ios"
            ? videoDetails.thumbnailUri.replace("file://", "")
            : videoDetails.thumbnailUri,
        name: thumbnailFileName,
        type: "image/jpeg",
      } as any);
    }

    // Handle upload with progress tracking
    const uploadOptions = {
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    // return await apiClient.post<GenericResponse>(
    //   `/feeds/upload/`,
    //   formData,
    //   {
    //     ...uploadOptions,
    //     headers: {
    //       "Content-Type": "multipart/form-data",
    //     },
    //   }
    // );

    const uploadResponse = await apiClient.post(
      "/feeds/upload/",
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      }
    );
    
    // After successful upload, add video to selected playlists
    if (uploadResponse.data && uploadResponse.data.success && 
        videoDetails.playlistIds && videoDetails.playlistIds.length > 0) {
      
      const videoId = uploadResponse.data.data._id || uploadResponse.data.data.id;
      
      // Add the video to each selected playlist
      // const playlistPromises = videoDetails.playlistIds.map((playlistId) => {
      //   const form = new FormData();
      //   form.append("playlistVideo", videoId);
      //   return updatePlaylistVideo(playlistId, form);
      // });
      
      
      // Wait for all playlist additions to complete
      // await Promise.all(playlistPromises);
    }
    
    return uploadResponse;
  } catch (error) {
    console.error("Error in uploadVideo:", error);
    throw error;
  }
};

export const generateVideoThumbnail = async (
  videoUri: string,
  timeInSeconds: number = 0
): Promise<string> => {
  try {
    console.warn(
      "Video thumbnail generation not implemented. Please install expo-video-thumbnails."
    );
    return videoUri;
  } catch (error) {
    console.error("Error generating video thumbnail:", error);
    throw error;
  }
};

export const getUserVideos = (userId: string): Promise<GenericResponse> => {
  return apiClient.get<GenericResponse>(`/videos/user/${userId}`);
};

export const getVideoById = (videoId: string): Promise<GenericResponse> => {
  return apiClient.get<GenericResponse>(`/videos/${videoId}`);
};

export const updateVideoDetails = (
  videoId: string,
  data: Partial<VideoDetails>
): Promise<GenericResponse> => {
  return apiClient.patch<GenericResponse>(`/videos/${videoId}`, data);
};

export const deleteVideo = (videoId: string): Promise<GenericResponse> => {
  return apiClient.delete<GenericResponse>(`/videos/${videoId}`);
};

export const getUserUploadedVideos = (params: { pageParam?: number; type?: string } = {}): Promise<GenericResponse> => {
  const { pageParam = 1, type } = params;
  const typeParam = type ? `&type=${type}` : '';
  return apiClient.get<GenericResponse>(`/feeds/uploads?page=${pageParam}&limit=10${typeParam}`);
}

export const getUserPublicUploadedVideos = (userId: string, params: { pageParam?: number; type?: string } = {}): Promise<GenericResponse> => {
  const { pageParam = 1, type } = params;
  const typeParam = type ? `&type=${type}` : '';
  return apiClient.get<GenericResponse>(`/feeds/uploads/public?userId=${userId}&page=${pageParam}&limit=5${typeParam}`);
}

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

// Upload single photo
export const uploadSinglePhoto = async (
  imageUri: string,
  postDetails: PostDetails,
  onProgress?: (progress: number) => void
): Promise<GenericResponse> => {
  try {
    // Compress image for faster upload
    console.log("Compressing image for faster upload...");
    const compressedImageUri = await compressImage(imageUri);

    // Verify compressed image exists
    const fileInfo = await FileSystem.getInfoAsync(compressedImageUri);
    if (!fileInfo.exists) {
      throw new Error(`Compressed image file does not exist: ${compressedImageUri}`);
    }

    // Get token for authorization
    const token = await getData("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Create form data for multipart upload
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

    // Add compressed image to form data
    const uriParts = compressedImageUri.split("/");
    const fileName = uriParts[uriParts.length - 1];
    const fileType = getFileType(fileName);

    formData.append("images", {
      uri: Platform.OS === "ios" ? compressedImageUri.replace("file://", "") : compressedImageUri,
      name: fileName || `image.jpg`,
      type: fileType,
    } as any);

    // Add post details to form data
    formData.append("description", postDetails.description || "");
    formData.append("visibility", postDetails.visibility || "public");
    formData.append("isCommentsAllowed", String(postDetails.isCommentsAllowed));
    formData.append("category", "Entertainment"); // Default category

    // Add tags as a JSON string (always required by server)
    const tags = postDetails.tags && postDetails.tags.length > 0 ? postDetails.tags : [];
    formData.append("tags", JSON.stringify(tags));

    // Add usernames array for backend
    if (postDetails.mentions && postDetails.mentions.length > 0) {
      const usernames = validateMentionsForBackend(postDetails.mentions);
      
      console.log("🔥 SINGLE PHOTO UPLOAD - MENTIONS PAYLOAD DEBUG:", {
        originalMentions: postDetails.mentions,
        usernames: usernames,
        usernamesCount: usernames.length,
        usernamesPayload: JSON.stringify(usernames),
        description: postDetails.description,
        timestamp: new Date().toISOString()
      });
      
      // Send only usernames array as expected by backend
      formData.append("usernames", JSON.stringify(usernames));
    } else {
      console.log("🔥 SINGLE PHOTO UPLOAD - NO MENTIONS DEBUG:", {
        postDetailsMentions: postDetails.mentions,
        mentionsLength: postDetails.mentions?.length || 0,
        description: postDetails.description,
        timestamp: new Date().toISOString()
      });
    }

    // logging
    console.log(`Uploading single compressed photo...`);

    // Use direct axios call
    const uploadResponse = await axios.post(`${baseURL}/feeds/upload/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5-minute timeout for single photo upload
      maxContentLength: 50 * 1024 * 1024, // 50MB limit per photo
      maxBodyLength: 50 * 1024 * 1024,
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    
    return uploadResponse.data;
  } catch (error: any) {
    console.error("Error in uploadSinglePhoto:", error);
    
    // Log more detailed error information
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    
    throw error;
  }
};

export const uploadPhotos = async (
  imageUris: string[],
  postDetails: PostDetails,
  userId: string,
  onProgress?: (progress: number) => void,
  onPhotoProgress?: (photoIndex: number, photoProgress: number) => void
): Promise<GenericResponse> => {
  try {
    if (!imageUris || imageUris.length === 0) {
      throw new Error("No images selected for upload");
    }

    if (imageUris.length > 5) {
      throw new Error("Maximum 5 images allowed per post");
    }

    console.log(`Starting upload of ${imageUris.length} photos as a single post...`);
    
    const totalSteps = imageUris.length + 1; // Compression steps + upload step
    let currentStep = 0;
    
    // Step 1: Compress all images sequentially with progress updates
    console.log("Compressing images for faster upload...");
    const compressedImageUris: string[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];
      console.log(`Compressing photo ${i + 1} of ${imageUris.length}...`);
      
      try {
        const compressedUri = await compressImage(imageUri);
        compressedImageUris.push(compressedUri);
        
        currentStep++;
        const stepProgress = Math.round((currentStep / totalSteps) * 100);
        onProgress?.(stepProgress);
        onPhotoProgress?.(i, 100); // Individual photo compression complete
        
        console.log(`Photo ${i + 1} compressed successfully`);
      } catch (error) {
        console.error(`Failed to compress photo ${i + 1}, using original:`, error);
        compressedImageUris.push(imageUri); // Use original if compression fails
        currentStep++;
        const stepProgress = Math.round((currentStep / totalSteps) * 100);
        onProgress?.(stepProgress);
      }
    }

    // Step 2: Verify all compressed images exist
    const fileChecks = await Promise.all(
      compressedImageUris.map(async (imageUri) => {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        return { uri: imageUri, exists: fileInfo.exists };
      })
    );
    
    const missingFiles = fileChecks.filter(check => !check.exists);
    if (missingFiles.length > 0) {
      throw new Error(`Compressed image files do not exist: ${missingFiles.map(f => f.uri).join(', ')}`);
    }

    // Step 3: Get token for authorization
    const token = await getData("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Step 4: Create form data for multipart upload with ALL photos
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

    // Add ALL compressed images to form data
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
    const tags = postDetails.tags && postDetails.tags.length > 0 ? postDetails.tags : [];
    formData.append("tags", JSON.stringify(tags));

    // Add usernames array for backend
    if (postDetails.mentions && postDetails.mentions.length > 0) {
      const usernames = validateMentionsForBackend(postDetails.mentions);
      
      console.log("🔥 MULTIPLE PHOTOS UPLOAD - MENTIONS PAYLOAD DEBUG:", {
        originalMentions: postDetails.mentions,
        usernames: usernames,
        usernamesCount: usernames.length,
        usernamesPayload: JSON.stringify(usernames),
        description: postDetails.description,
        numberOfPhotos: compressedImageUris.length,
        timestamp: new Date().toISOString()
      });
      
      // Send only usernames array as expected by backend
      formData.append("usernames", JSON.stringify(usernames));
    } else {
      console.log("🔥 MULTIPLE PHOTOS UPLOAD - NO MENTIONS DEBUG:", {
        postDetailsMentions: postDetails.mentions,
        mentionsLength: postDetails.mentions?.length || 0,
        description: postDetails.description,
        numberOfPhotos: compressedImageUris.length,
        timestamp: new Date().toISOString()
      });
    }

    // Step 5: Upload ALL photos in a single request
    console.log(`Uploading ${compressedImageUris.length} photos as a single post...`);

    const uploadResponse = await axios.post(`${baseURL}/feeds/upload/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      timeout: 600000, // 10-minute timeout for multiple photo uploads
      maxContentLength: 100 * 1024 * 1024, // 100MB limit
      maxBodyLength: 100 * 1024 * 1024,
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total) {
          // Upload progress is the final step
          const uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Scale upload progress to the remaining percentage after compression
          const baseProgress = Math.round((currentStep / totalSteps) * 100);
          const remainingProgress = 100 - baseProgress;
          const totalProgress = baseProgress + Math.round((uploadProgress * remainingProgress) / 100);
          
          onProgress?.(Math.min(totalProgress, 100));
        }
      },
    });
    
    console.log(`Single post with ${compressedImageUris.length} photos uploaded successfully`);
    
    return uploadResponse.data;
    
  } catch (error: any) {
    console.error("Error in uploadPhotos:", error);
    
    // Log more detailed error information
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    
    throw error;
  }
};