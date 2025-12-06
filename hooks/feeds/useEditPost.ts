import useVideoUploadStore from "@/store/videoUploadStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadVideo } from "@/services/videoUpload.service";
import axios from "axios";
import { baseURL } from "@/config/axiosInstance";
import useAuth from "../auth/useAuth";
import { handleError } from "@/helpers/utils/handleError";
// import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from "@tanstack/react-query";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useAlert } from "@/components/ui/AlertProvider";
import useGetPost from "./useGetPost";
import { editPost } from "@/services/feed.service";
import { GenericResponse } from "@/helpers/types/general.types";
import { validateMentionsForBackend, parseMentionsFromBackend } from "@/helpers/utils/mentionUtils";

const useEditPost = (postId: string) => {
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showModalSuccess, setShowModalSuccess] = useState(false);
  const { showError } = useAlert();

  // Get post data
  const { data: post, isSuccess: postLoaded } = useGetPost(postId);

  const {
    selectedVideo,
    editedVideoUri,
    videoDetails,
    setVideoDetails,
    closeDetailsScreen,
    setUploading,
    setUploadProgress,
    setUploadError,
    uploadProgress,
    uploadError,
  } = useVideoUploadStore();

  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize video details with post data when post loads
  useEffect(() => {
    if (postLoaded && post?.data) {
      // Ensure tags is always an array and filter out invalid entries
      let tags = post.data.tags || [];
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch {
          tags = [];
        }
      }
      
      // Clean up tags array
      const cleanTags = Array.isArray(tags) 
        ? tags.filter(tag => 
            tag && 
            typeof tag === 'string' && 
            tag.trim() !== "" && 
            tag !== "[]" && 
            tag !== "undefined" &&
            tag !== "null"
          )
        : [];
      
      // Parse mentions from response
      const { mentions } = parseMentionsFromBackend(
        post.data.description || "",
        post.data.mentions || []
      );
      
      setVideoDetails({
        description: post.data.description || "",
        tags: cleanTags,
        visibility: post.data.visibility || "public",
        isCommentsAllowed: post.data.isCommentsAllowed !== false,
        playlistIds: [],
        thumbnailUri: post.data.thumbnail || "",
        mentions: mentions,
      });
    }
  }, [postLoaded, post, setVideoDetails]);

  // Monitor upload progress changes
  useEffect(() => {
    // Only respond to upload status changes if currently uploading
    if (isUploading) {
      if (uploadError) {
        // Upload failed
        setIsUploading(false);
        showError(
          "Update Failed",
          uploadError || "There was an error updating your video."
        );
      }
    }
  }, [uploadError, isUploading]);

  const generateThumbnail = async () => {
    try {
      const videoUri =
        editedVideoUri || (selectedVideo ? selectedVideo.uri : null);
      if (videoUri) {
        // Generate an actual image thumbnail from the video
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 1000, // Get thumbnail from 1 second into the video
          quality: 0.8,
        });

        setThumbnailImage(uri);
        setVideoDetails({ thumbnailUri: uri }); // This will be a JPEG
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      // Don't set the video as thumbnail in case of error
      // Instead, use a default placeholder image
      // or retry generation with different parameters
    }
  };

  const handlePickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      setThumbnailImage(selectedAsset.uri);
      setVideoDetails({ thumbnailUri: selectedAsset.uri });
    }
  };

  const handleUpload = async () => {
    try {
      const apiFormData = new FormData();

      setIsUploading(true);
      setUploading(true);

      const videoUri =
        editedVideoUri || (selectedVideo ? selectedVideo.uri : null);

      if (videoUri) {
        const uriParts = videoUri.split("/");
        const fileName = uriParts[uriParts.length - 1];

        apiFormData.append("postVideo", {
          uri:
            Platform.OS === "ios" ? videoUri.replace("file://", "") : videoUri,
          name: fileName,
          type: "video/mp4",
        } as any);
      }

      if(videoDetails.thumbnailUri) {
          const thumbParts = videoDetails.thumbnailUri.split("/");
          const thumbFileName = thumbParts[thumbParts.length - 1];

          apiFormData.append("thumbnailImage", {
            uri:
              Platform.OS === "ios"
                ? videoDetails.thumbnailUri.replace("file://", "")
                : videoDetails.thumbnailUri,
            name: thumbFileName,
            type: "image/jpeg",
          } as any);
      }


      console.log("videoDetails", videoDetails);


      if(videoDetails.description){
        apiFormData.append("description", videoDetails.description || "");
      }

      if(videoDetails.visibility){
          apiFormData.append("visibility", videoDetails.visibility || "public");
      }

      if(videoDetails.isCommentsAllowed){
          apiFormData.append(
            "isCommentsAllowed",
            String(videoDetails.isCommentsAllowed)
          );
      }

      if(videoDetails.tags.length > 0){
          apiFormData.append("tags", JSON.stringify(videoDetails.tags));
      }

      // Add usernames array for backend
      if (videoDetails.mentions && videoDetails.mentions.length > 0) {
        const usernames = validateMentionsForBackend(videoDetails.mentions);
        
        // Send only usernames array as expected by backend
        apiFormData.append("usernames", JSON.stringify(usernames));
      }

      // Convert tags to JSON string if it's an array
    //   apiFormData.append("playlistId", videoDetails.playlistIds[0] || "");
      // apiFormData.append("playlistId", JSON.stringify(videoDetails.playlistIds));

      console.log("before axios");

      console.log("apiFormData", apiFormData);

      const response = await axios.patch(
        `${baseURL}/feeds/upload/${postId}`,
        apiFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
          timeout: 300000, // 5-minute timeout for large uploads
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        }
      );

      if (response.data) {
        setUploading(false);
        setShowModalSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["userFeeds"], exact: false, refetchType: 'all' });
      }

      console.log("after axios");
      setIsUploading(false);

      // console.log("response", response.data);
    } catch (error: any) {
      console.log("uploading error", JSON.stringify(error, null, 2));
      setIsUploading(false);
      setUploadError(error?.response?.data?.message || "Update failed");
      handleError(error);
    }
  };

  const navigateToDetailsPage = (page: string) => {
    router.push(`/(videoUploader)/videoDetails/${page}` as any);
  };

  return {
    navigateToDetailsPage,
    handleUpload,
    handlePickThumbnail,
    thumbnailImage,
    isUploading,
    setIsUploading,
    setThumbnailImage,
    videoDetails,
    setVideoDetails,
    closeDetailsScreen,
    setUploading,
    setUploadProgress,
    setUploadError,
    uploadProgress,
    selectedVideo,
    editedVideoUri,
    router,
    showModalSuccess, 
    setShowModalSuccess,
    videoUri: editedVideoUri || (selectedVideo ? selectedVideo.uri : null),
    generateThumbnail,
  };
};

export default useEditPost;