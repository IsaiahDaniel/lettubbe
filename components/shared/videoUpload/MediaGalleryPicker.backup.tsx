import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import Typography from "@/components/ui/Typography/Typography";
import useVideoUploadStore, {
  Album,
  PhotoAsset,
} from "@/store/videoUploadStore";
import RemixIcon from "react-native-remix-icon";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { Colors } from "@/constants";
import { Feather } from "@expo/vector-icons";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  withDecay,
  useAnimatedScrollHandler,
  Extrapolate,
  interpolate,
} from "react-native-reanimated";
import MediaCaptionInput from "@/components/shared/chat/fileSharing/MediaCaptionInput";
import FullScreenMediaPreview from "@/components/shared/chat/fileSharing/FullScreenMediaPreview";
import CustomAlert from "@/components/ui/CustomAlert";
import { getPresignedUrl } from "@/services/aws.service";
import { getImageDetails, getMediaDetails, uploadImage } from "@/helpers/utils/upload-utils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type MediaGalleryPickerProps = {
  selectedAlbum: Album | null;
  chatFunctions?: {
    setUploadedImageUrls?: (urls: string[]) => void;
    setUploadedVideoUrls?: (urls: string[]) => void;
    setChatMessage?: (message: string) => void;
    handleSendChat?: () => void;
    sendMediaMessage?: (caption: string, mediaAssets: any[]) => void;
    closeModal?: () => void;
  };
};

const MediaGalleryPicker = ({ selectedAlbum, chatFunctions }: MediaGalleryPickerProps) => {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const { showError, alertConfig, isVisible, hideAlert } = useCustomAlert();
  const [media, setMedia] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const scrollY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // New state for chat/community selection flow
  const [previewedMedia, setPreviewedMedia] = useState<MediaLibrary.Asset | null>(null);
  const [selectedMediaForChat, setSelectedMediaForChat] = useState<MediaLibrary.Asset[]>([]);
  const [selectedMediaSizes, setSelectedMediaSizes] = useState<{[key: string]: number}>({});
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);
  
  const MAX_TOTAL_SIZE_MB = 30;
  const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

  // Helper function to get file size
  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists ? (fileInfo.size || 0) : 0;
    } catch (error) {
      console.warn('Error getting file size:', error);
      return 0;
    }
  };

  // Calculate total size of selected media
  const getTotalSelectedSize = (): number => {
    return Object.values(selectedMediaSizes).reduce((total, size) => total + size, 0);
  };

  // Format bytes to readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const {
    uploadMode: storeUploadMode,
    selectedPhotos,
    setSelectedVideo,
    addSelectedPhoto,
    removeSelectedPhoto,
    isCommunityUpload,
    isChatUpload,
    clearSelections,
    closeUploadModal,
    hideUploadModal,
    hideGallery,
    navigateToEditor,
    openDetailsScreen,
    selectedVideo,
    setIsUploadingPhotoInCommunity,
    setIsUploadingVideoInCommunity,
    setIsUploadingPhotoInChat,
    setIsUploadingVideoInChat,
  } = useVideoUploadStore();

  const uploadMode = storeUploadMode as "video" | "photo" | "document" | "audio";

  // console.log("isCommunityUpload", isCommunityUpload);
  // console.log("selectedPhotos", selectedPhotos);

  // Refs to track state for gesture coordination
  const isScrollAtTop = useRef(true);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (selectedAlbum) {
      fetchMedia(selectedAlbum, false);
    }
  }, [selectedAlbum, uploadMode]);

  // Cleanup effect to clear selections if user navigates away without completing upload
  useEffect(() => {
    return () => {
      // Clear debounce timeout on unmount
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  const fetchMedia = async (album: Album, loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setMedia([]);
      setHasMoreMedia(true);
      setEndCursor(undefined);
    }

    try {
      if (!album) {
        setMedia([]);
        return;
      }

      const mediaType = uploadMode === "video" ? "video" : 
                        uploadMode === "audio" ? "audio" : 
                        uploadMode === "document" ? "photo" : "photo";
      const fetchLimit = loadMore ? 50 : 100; // Smaller batches for subsequent loads
      const currentCursor = loadMore ? endCursor : undefined;

      let result;

      if (album.id === "recents") {
        // For "Recents", get all media from device sorted by creation time
        result = await MediaLibrary.getAssetsAsync({
          mediaType,
          first: fetchLimit,
          after: currentCursor,
          sortBy: ["creationTime"],
          // No album parameter - gets all media from device
        });
      } else {
        // For actual albums, get media from that specific album
        result = await MediaLibrary.getAssetsAsync({
          mediaType,
          album: album.id, // Only pass album for real albums
          first: fetchLimit,
          after: currentCursor,
          sortBy: ["creationTime"],
        });
      }

      const newAssets = result.assets;

      if (loadMore) {
        setMedia((prevMedia) => [...prevMedia, ...newAssets]);
      } else {
        setMedia(newAssets);
      }

      // Update pagination state
      setHasMoreMedia(result.hasNextPage);
      setEndCursor(result.endCursor);

      if (!loadMore) {
        console.log(
          `Loaded ${newAssets.length} ${mediaType}s from ${album.title}`
        );
      }
    } catch (error) {
      // console.error(`Error fetching ${uploadMode}s from ${album?.title}:`, error);
      if (!loadMore) {
        setMedia([]);
      }
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // const handleVideoSelection = async (video: MediaLibrary.Asset) => {
  //   // Convert MediaLibrary asset to our VideoAsset format
  //   const videoAsset = {
  //     uri: video.uri,
  //     fileName: video.filename,
  //     width: video.width,
  //     height: video.height,
  //     duration: video.duration,
  //   };

  //   if (isCommunityUpload && selectedVideo) {
  //     setIsUploadingVideoInCommunity(false);
  //     return;
  //   }

  //   // Set as selected video
  //   setSelectedVideo(videoAsset);

  //   // Close the modal and gallery
  //   // hideGallery();
  //   closeUploadModal();

  //   // Explicitly signal navigation intent with the new flag
  //   navigateToEditor();

  //   // Close the modal and gallery first (hideUploadModal to preserve selections)
  //   hideGallery();
  //   hideUploadModal();

  //   // Navigate directly after closing modal
  //   setTimeout(() => {
  //     router.push("/(videoUploader)/videoEditor");
  //   }, 100);
  // };

  const handleVideoSelection = async (video: MediaLibrary.Asset) => {
    // Convert MediaLibrary asset to VideoAsset format
    const videoAsset = {
      uri: video.uri,
      fileName: video.filename,
      width: video.width,
      height: video.height,
      duration: video.duration,
    };

    console.log("handle vehicle selection");

    // Set as selected video
    setSelectedVideo(videoAsset);
    console.log("selected video", selectedVideo);

    // if (isCommunityUpload && selectedVideo) {
    //   console.log("this ran...");
    //   setIsUploadingVideoInCommunity(true);
    //   closeUploadModal();
    //   hideGallery();
    //   hideUploadModal();
    //   return;
    // }

    // && selectedVideo

    if (isCommunityUpload) {
      console.log("this ran...");
      setIsUploadingVideoInCommunity(true);
      // closeUploadModal();
      // hideGallery();
      // hideUploadModal();
      return; // ✅ This will now terminate properly
    }

    if (isChatUpload) {
      // Remove legacy upload trigger - now handled by sendMediaMessage
      // setIsUploadingVideoInChat(true);
      return;
    }

    // Close the modal and gallery first (hideUploadModal to preserve selections)
    hideGallery();
    hideUploadModal();

    if (!isCommunityUpload && !isChatUpload) {
      setTimeout(() => {
        console.log("navigating to video editor ran...");
        router.push("/(videoUploader)/videoEditor");
      }, 100);
    }

    // Navigate directly after closing modal
  };

  const handlePhotoSelection = async (photo: MediaLibrary.Asset) => {
    const photoAsset: PhotoAsset = {
      uri: photo.uri,
      fileName: photo.filename,
      width: photo.width,
      height: photo.height,
      type: "image/jpeg",
    };

    // Check if photo is already selected
    const isSelected = selectedPhotos.some((p) => p.uri === photo.uri);

    if (isSelected) {
      // Remove from selection
      const index = selectedPhotos.findIndex((p) => p.uri === photo.uri);
      removeSelectedPhoto(index);
    } else {
      // Add to selection (max 5)
      if (selectedPhotos.length < 5) {
        addSelectedPhoto(photoAsset);
      }
    }
  };

  const handleMediaSelection = (mediaAsset: MediaLibrary.Asset) => {
    // For chat/community uploads, use new selection flow
    if (isChatUpload || isCommunityUpload) {
      handleChatMediaClick(mediaAsset);
    } else {
      // Original upload flow
      if (uploadMode === "video" || uploadMode === "audio") {
        handleVideoSelection(mediaAsset);
      } else {
        handlePhotoSelection(mediaAsset);
      }
    }
  };

  // New handlers for chat/community selection flow
  const handleChatMediaClick = async (mediaAsset: MediaLibrary.Asset) => {
    // For audio files, handle selection directly without preview
    if (uploadMode === "audio") {
      await handleAudioSelection(mediaAsset);
      return;
    }
    
    setPreviewedMedia(mediaAsset);
    setShowFullScreenPreview(true);
    
    // Auto-select videos when opening preview
    if (uploadMode === "video") {
      const isAlreadySelected = selectedMediaForChat.some(item => item.id === mediaAsset.id);
      
      if (!isAlreadySelected) {
        // Check file size before adding
        const fileSize = await getFileSize(mediaAsset.uri);
        const currentTotalSize = getTotalSelectedSize();
        const newTotalSize = currentTotalSize + fileSize;
        
        if (newTotalSize <= MAX_TOTAL_SIZE_BYTES) {
          // Clear any previous selections for single video mode
          setSelectedMediaForChat([mediaAsset]);
          setSelectedMediaSizes({ [mediaAsset.id]: fileSize });
        } else {
          // Show size warning if needed
          showError("File too large", `This video is too large. Maximum total size is ${MAX_TOTAL_SIZE_BYTES / (1024 * 1024)}MB.`);
        }
      }
    }
  };

  const handleSelectionCircleClick = async (mediaAsset: MediaLibrary.Asset) => {
    // Toggle selection for multiple items
    const isSelected = selectedMediaForChat.some(item => item.id === mediaAsset.id);
    
    if (isSelected) {
      // Remove from selection
      const updatedSelection = selectedMediaForChat.filter(item => item.id !== mediaAsset.id);
      setSelectedMediaForChat(updatedSelection);
      
      // Remove from sizes tracking
      const updatedSizes = { ...selectedMediaSizes };
      delete updatedSizes[mediaAsset.id];
      setSelectedMediaSizes(updatedSizes);
      
      if (updatedSelection.length === 0) {
        setShowCaptionInput(false);
      }
    } else {
      // Check file size before adding
      const fileSize = await getFileSize(mediaAsset.uri);
      const currentTotalSize = getTotalSelectedSize();
      const newTotalSize = currentTotalSize + fileSize;
      
      if (newTotalSize > MAX_TOTAL_SIZE_BYTES) {
        // Show size limit warning
        const remainingSize = MAX_TOTAL_SIZE_BYTES - currentTotalSize;
        showError(
          'File Size Limit Exceeded',
          `File size: ${formatFileSize(fileSize)}\nRemaining space: ${formatFileSize(remainingSize)}\nTotal limit: ${MAX_TOTAL_SIZE_MB}MB`
        );
        return;
      }
      
      // Add to selection (max 30 for chat/community)
      if (selectedMediaForChat.length < 30) {
        const updatedSelection = [...selectedMediaForChat, mediaAsset];
        setSelectedMediaForChat(updatedSelection);
        setSelectedMediaSizes(prev => ({ ...prev, [mediaAsset.id]: fileSize }));
        // Only show caption input for non-audio files
        if (uploadMode !== "audio") {
          setShowCaptionInput(true);
        }
      }
    }
  };

  // Handle sending audio files directly without caption
  const handleSendAudioDirectly = async () => {
    if (selectedMediaForChat.length === 0) return;
    
    console.log("🎵 [MEDIA_GALLERY] Sending audio directly:", {
      selectedCount: selectedMediaForChat.length,
      isChatUpload,
      isCommunityUpload
    });

    // Send audio without caption
    await handleSendWithCaption('');
  };

  const handleSendWithCaption = async (caption: string) => {
    if (selectedMediaForChat.length === 0) return;
    
    // Use the new sendMediaMessage function if available
    if (chatFunctions?.sendMediaMessage) {
      // Send media message with local file references for immediate display and background upload
      chatFunctions.sendMediaMessage(caption, selectedMediaForChat);
    }
    
    // Close modals immediately
    setShowCaptionInput(false);
    setShowFullScreenPreview(false);
    setSelectedMediaForChat([]);
    setSelectedMediaSizes({});
    setPreviewedMedia(null);
    
    // Close the parent modal (FilePickerBottomSheet)
    if (chatFunctions?.closeModal) {
      chatFunctions.closeModal();
    } else {
      // Fallback to the store's close method
      closeUploadModal();
    }
  };

  const handleCancelCaption = () => {
    setShowCaptionInput(false);
    setSelectedMediaForChat([]);
    setSelectedMediaSizes({});
  };

  // Handle audio selection directly without preview
  const handleAudioSelection = async (mediaAsset: MediaLibrary.Asset) => {
    const isAlreadySelected = selectedMediaForChat.some(item => item.id === mediaAsset.id);
    
    if (isAlreadySelected) {
      // Deselect if already selected
      setSelectedMediaForChat(prev => prev.filter(item => item.id !== mediaAsset.id));
      setSelectedMediaSizes(prev => {
        const newSizes = { ...prev };
        delete newSizes[mediaAsset.id];
        return newSizes;
      });
    } else {
      // Check file size before adding
      const fileSize = await getFileSize(mediaAsset.uri);
      
      if (fileSize > MAX_TOTAL_SIZE_BYTES) {
        showError('File Too Large', `File size: ${formatFileSize(fileSize)}. Maximum allowed: ${MAX_TOTAL_SIZE_MB}MB`);
        return;
      }
      
      // For audio, only allow one file at a time, don't trigger caption input
      setSelectedMediaForChat([mediaAsset]);
      setSelectedMediaSizes({ [mediaAsset.id]: fileSize });
      // Don't set showCaptionInput for audio files
    }
  };

  const handleBackFromPreview = () => {
    setShowFullScreenPreview(false);
    setPreviewedMedia(null);
    
    // For audio files, clear selections when going back since users should send one at a time
    if (uploadMode === "audio") {
      setSelectedMediaForChat([]);
      setSelectedMediaSizes({});
    }
  };

  const handleToggleSelectionInPreview = async () => {
    if (previewedMedia) {
      // Toggle selection of the previewed media
      const isSelected = selectedMediaForChat.some(item => item.id === previewedMedia.id);
      
      if (isSelected) {
        const updatedSelection = selectedMediaForChat.filter(item => item.id !== previewedMedia.id);
        setSelectedMediaForChat(updatedSelection);
        
        // Remove from sizes tracking
        const updatedSizes = { ...selectedMediaSizes };
        delete updatedSizes[previewedMedia.id];
        setSelectedMediaSizes(updatedSizes);
        
        if (updatedSelection.length === 0) {
          setShowCaptionInput(false);
        }
      } else {
        // Check file size before adding
        const fileSize = await getFileSize(previewedMedia.uri);
        const currentTotalSize = getTotalSelectedSize();
        const newTotalSize = currentTotalSize + fileSize;
        
        if (newTotalSize > MAX_TOTAL_SIZE_BYTES) {
          // Show size limit warning
          const remainingSize = MAX_TOTAL_SIZE_BYTES - currentTotalSize;
          showError(
            'File Size Limit Exceeded',
            `File size: ${formatFileSize(fileSize)}\nRemaining space: ${formatFileSize(remainingSize)}\nTotal limit: ${MAX_TOTAL_SIZE_MB}MB`
          );
          return;
        }
        
        if (selectedMediaForChat.length < 30) {
          const updatedSelection = [...selectedMediaForChat, previewedMedia];
          setSelectedMediaForChat(updatedSelection);
          setSelectedMediaSizes(prev => ({ ...prev, [previewedMedia.id]: fileSize }));
          // Only show caption input for non-audio files
          if (uploadMode !== "audio") {
            setShowCaptionInput(true);
          }
        }
      }
    }
  };

  const handleContinueWithPhotos = () => {
    if (selectedPhotos.length === 0) return;
    // Close gallery and hide modal (without clearing selections)
    hideGallery();
    hideUploadModal();

    // Navigate to photo details screen
    openDetailsScreen();
    router.push("/(videoUploader)/photoDetails");
  };

  const handleCommunityChatImageUpload = () => {
    if (selectedPhotos.length === 0) return;
    // hideGallery();
    closeUploadModal();

    setIsUploadingPhotoInCommunity(true);

    console.log("hitting chat community upload");

    // Close gallery and hide modal (without clearing selections)
    hideGallery();
    hideUploadModal();
  };

  const handleChatImageUpload = () => {
    if (selectedPhotos.length === 0) return;
    // hideGallery();
    closeUploadModal();

    // Remove legacy upload trigger - now handled by sendMediaMessage
    // setIsUploadingPhotoInChat(true);

    // console.log("hitting chat upload");

    // Close gallery and hide modal (without clearing selections)
    hideGallery();
    hideUploadModal();
  };

  const isPhotoSelected = (photoUri: string) => {
    return selectedPhotos.some((p) => p.uri === photoUri);
  };

  const handleOpenCamera = () => {
    // Close the current modal and navigate to appropriate camera
    hideGallery();
    closeUploadModal();
    hideUploadModal();

    // Navigate to different camera screens based on upload mode
    if (uploadMode === "video") {
      router.push("/(videoUploader)/camera");
    } else {
      // For photos, navigate to photo camera
      router.push("/(videoUploader)/photo-camera");
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Debounced function to handle infinite scroll
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLoadMoreMedia = () => {
    if (selectedAlbum && hasMoreMedia && !loadingMore && !loading) {
      // Clear any existing timeout
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }

      // Debounce the load more request
      loadMoreTimeoutRef.current = setTimeout(() => {
        fetchMedia(selectedAlbum, true);
      }, 150); // 150ms debounce
    }
  };

  // Enhanced scroll handler with infinite scroll
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      // Track if we're at the top for gesture prioritization
      if (event.contentOffset.y <= 0) {
        runOnJS(() => {
          isScrollAtTop.current = true;
        });
      } else {
        runOnJS(() => {
          isScrollAtTop.current = false;
        });
      }

      // Infinite scroll: Check if we're near the bottom (optimized threshold)
      const { contentOffset, contentSize, layoutMeasurement } = event;
      const paddingToBottom = 200; // Load when 200px from bottom
      const remainingDistance =
        contentSize.height - layoutMeasurement.height - contentOffset.y;

      if (remainingDistance <= paddingToBottom && remainingDistance > 0) {
        runOnJS(handleLoadMoreMedia)();
      }
    },
    onBeginDrag: () => {
      isDragging.value = true;
    },
    onEndDrag: () => {
      isDragging.value = false;
    },
  });

  // Audio list item renderer
  const renderAudioItem = ({ mediaAsset, index }: { mediaAsset: MediaLibrary.Asset; index: number }) => {
    const isSelected = selectedMediaForChat.some(item => item.id === mediaAsset.id);
    const fileName = String(mediaAsset.filename || `Audio ${index + 1}`);
    const duration = mediaAsset.duration ? Math.floor(mediaAsset.duration) : 0;
    const fileSize = mediaAsset.width || 0; // MediaLibrary sometimes stores file size in width for audio
    
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return 'Unknown size';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
      <TouchableOpacity
        key={String(mediaAsset.id)}
        style={[
          styles.audioListItem,
          { 
            // backgroundColor: Colors[theme].cardBackground,
            borderColor: Colors[theme].borderColor 
          }
        ]}
        onPress={() => handleChatMediaClick(mediaAsset)}
        activeOpacity={0.7}
      >
        <View style={styles.audioItemLeft}>
          <View style={[
            styles.audioIcon,
            { backgroundColor: isSelected ? Colors.general.primary : Colors.general.purple }
          ]}>
            <Feather 
              name="music" 
              size={18} 
              color={isSelected ? 'white' : Colors[theme].text} 
            />
          </View>
          <View style={styles.audioInfo}>
            <Typography 
              size={16} 
              weight="600" 
              numberOfLines={1}
              style={{ color: Colors[theme].text }}
            >
              {String(fileName).replace(/\.[^/.]+$/, "")} {/* Remove file extension */}
            </Typography>
            <View style={styles.audioMetadata}>
              {duration > 0 && (
                <Typography size={12} style={{ color: Colors[theme].textLight }}>
                  {String(formatDuration(duration))}
                </Typography>
              )}
              {duration > 0 && fileSize > 0 && (
                <Typography size={12} style={{ color: Colors[theme].textLight }}>
                  {' • '}
                </Typography>
              )}
              {fileSize > 0 && (
                <Typography size={12} style={{ color: Colors[theme].textLight }}>
                  {String(formatFileSize(fileSize))}
                </Typography>
              )}
            </View>
          </View>
        </View>
        
        {/* {isSelected && (
          <View style={styles.audioSelectedIndicator}>
            <Feather name="check" size={16} color="white" />
          </View>
        )} */}
      </TouchableOpacity>
    );
  };

  const renderMediaItem = ({
    mediaAsset,
    index,
  }: {
    mediaAsset: MediaLibrary.Asset;
    index: number;
  }) => {
    const isVideo = uploadMode === "video" || uploadMode === "audio";
    
    // For chat/community uploads, use different selection logic
    if (isChatUpload || isCommunityUpload) {
      const isSelectedForChat = selectedMediaForChat.some(item => item.id === mediaAsset.id);
      const selectionNumber = selectedMediaForChat.findIndex(item => item.id === mediaAsset.id) + 1;
      
      return (
        <TouchableOpacity
          key={String(mediaAsset.id)}
          style={[styles.mediaItem, isSelectedForChat && styles.selectedMediaItem]}
          onPress={() => handleMediaSelection(mediaAsset)}
        >
          <Image
            source={{ uri: String(mediaAsset.uri || '') }}
            style={[styles.thumbnail, isSelectedForChat && styles.selectedThumbnail]}
          />

          {/* Duration badge for videos */}
          {isVideo && mediaAsset.duration && Number.isFinite(mediaAsset.duration) && (
            <View style={styles.durationBadge}>
              <Typography size={10} weight="600" style={{ color: "#FFFFFF" }}>
                {String(formatDuration(mediaAsset.duration))}
              </Typography>
            </View>
          )}

          {/* Selection circle for chat/community - disabled for videos */}
          {!isVideo && (
            <TouchableOpacity
              style={styles.selectionIndicator}
              onPress={(e) => {
                e.stopPropagation();
                handleSelectionCircleClick(mediaAsset);
              }}
            >
              {isSelectedForChat ? (
                <View style={styles.selectedIndicator}>
                  <Typography size={12} weight="600" style={{ color: "#FFFFFF" }}>
                    {String(selectionNumber)}
                  </Typography>
                </View>
              ) : (
                <View style={styles.unselectedIndicator} />
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    }

    // Original upload flow
    const isSelected = !isVideo && isPhotoSelected(mediaAsset.uri);
    const selectionNumber = !isVideo
      ? selectedPhotos.findIndex((p) => p.uri === mediaAsset.uri) + 1
      : 0;

    return (
      <TouchableOpacity
        key={String(mediaAsset.id)}
        style={[styles.mediaItem, isSelected && styles.selectedMediaItem]}
        onPress={() => handleMediaSelection(mediaAsset)}
      >
        <Image
          source={{ uri: String(mediaAsset.uri || '') }}
          style={[styles.thumbnail, isSelected && styles.selectedThumbnail]}
        />

        {/* Duration badge for videos */}
        {isVideo && mediaAsset.duration && Number.isFinite(mediaAsset.duration) && (
          <View style={styles.durationBadge}>
            <Typography size={10} weight="600" style={{ color: "#FFFFFF" }}>
              {String(formatDuration(mediaAsset.duration))}
            </Typography>
          </View>
        )}

        {/* Selection indicator for photos */}
        {!isVideo && (
          <View style={styles.selectionIndicator}>
            {isSelected ? (
              <View style={styles.selectedIndicator}>
                <Typography size={12} weight="600" style={{ color: "#FFFFFF" }}>
                  {String(selectionNumber)}
                </Typography>
              </View>
            ) : (
              <View style={styles.unselectedIndicator} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.general.primary} />
          <Typography size={14} weight="500" style={{ marginTop: 8 }}>
            Loading {uploadMode === "video" ? "videos" : uploadMode === "audio" ? "audio files" : "photos"}...
          </Typography>
        </View>
      );
    }

    if (media.length === 0) {
      return (
        <View style={styles.emptyState}>
          <RemixIcon name="inbox-line" size={48} color={Colors[theme].text} />
          <Typography
            size={16}
            weight="500"
            textType="text"
            style={{ marginTop: 8 }}
          >
            No {uploadMode === "video" ? "videos" : uploadMode === "audio" ? "audio files" : "photos"} found in{" "}
            {String(selectedAlbum?.title || "this album")}
          </Typography>
          {!isChatUpload && !isCommunityUpload && (
            <TouchableOpacity
              style={styles.emptyStateCameraButton}
              onPress={handleOpenCamera}
            >
              <RemixIcon name="camera-line" size={24} color="#FFFFFF" />
              <Typography
                size={16}
                weight="600"
                style={{ color: "#FFFFFF", marginLeft: 8 }}
              >
                Open Camera
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Prepare rows of 3 media items for the grid below
    // Skip first 6 items for chat/community (3x2 grid), or first 4 items for main upload (2x2 grid + camera)
    const topItemsCount = (isChatUpload || isCommunityUpload) ? 6 : 4;
    const remainingMedia = media.slice(topItemsCount);
    const rows = [];
    for (let i = 0; i < remainingMedia.length; i += 3) {
      const rowMedia = remainingMedia.slice(i, i + 3);
      rows.push(
        <View key={`row-${i}`} style={styles.gridRow}>
          {rowMedia.map((mediaAsset, index) => {
            if (!mediaAsset || !mediaAsset.id) return null;
            const renderedItem = renderMediaItem({ mediaAsset, index: topItemsCount + i * 3 + index });
            if (!renderedItem) return null;
            return (
              <React.Fragment key={String(mediaAsset.id)}>
                {renderedItem}
              </React.Fragment>
            );
          })}
          {/* Add empty placeholder slots if row has less than 3 items */}
          {rowMedia.length === 2 && (
            <View style={[styles.mediaItem, styles.emptySlot]} />
          )}
          {rowMedia.length === 1 && (
            <>
              <View style={[styles.mediaItem, styles.emptySlot]} />
              <View style={[styles.mediaItem, styles.emptySlot]} />
            </>
          )}
        </View>
      );
    }

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Photo selection continue button */}
        {!isCommunityUpload &&
          !isChatUpload &&
          uploadMode === "photo" &&
          selectedPhotos.length > 0 && (
            <View style={styles.continueButtonContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueWithPhotos}
              >
                <Typography size={16} weight="600" style={{ color: "#FFFFFF" }}>
                  Continue ({selectedPhotos.length}/5)
                </Typography>
              </TouchableOpacity>
            </View>
          )}

        {/* Circular send button for audio files */}
        {uploadMode === "audio" && selectedMediaForChat.length > 0 && (isCommunityUpload || isChatUpload) && (
          <View style={styles.audioSendButtonContainer}>
            <TouchableOpacity
              style={styles.audioSendButton}
              onPress={handleSendAudioDirectly}
              activeOpacity={0.8}
            >
              <Feather name="send" size={28} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Regular send buttons - only for photo uploads in chat/community */}
        {isCommunityUpload && selectedPhotos.length > 0 && uploadMode === "photo" && (
          <View style={styles.continueButtonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleCommunityChatImageUpload}
            >
              <Typography size={16} weight="600" style={{ color: "#FFFFFF" }}>
                Upload ({selectedPhotos.length}/5)
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        {isChatUpload && selectedPhotos.length > 0 && uploadMode === "photo" && (
          <View style={styles.continueButtonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleChatImageUpload}
            >
              <Typography size={16} weight="600" style={{ color: "#FFFFFF" }}>
                Upload ({selectedPhotos.length}/5)
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={isScrollAtTop.current}
        >
          {uploadMode !== "audio" && (
            <View style={styles.topSection}>
            {/* Camera button on the left - only show for main upload, not chat upload */}
            {!isChatUpload && !isCommunityUpload && (
              <TouchableOpacity
                style={[
                  styles.cameraButton,
                  { backgroundColor: Colors[theme].cardBackground },
                ]}
                onPress={handleOpenCamera}
              >
                <View style={styles.cameraButtonContent}>
                  <TouchableOpacity>
                    <Feather
                      name={uploadMode === "video" || uploadMode === "audio" ? "video" : "camera"}
                      size={40}
                      color={Colors[theme].textBold}
                    />
                  </TouchableOpacity>
                  <Typography size={14} weight="600" style={{ marginTop: 2 }}>
                    Camera
                  </Typography>
                </View>
              </TouchableOpacity>
            )}

            {/* Media items container - adjust layout based on camera visibility */}
            <View style={isChatUpload || isCommunityUpload ? styles.topGridContainer : styles.topRightContainer}>
              {isChatUpload || isCommunityUpload ? (
                // 3x2 grid layout when no camera (6 items total)
                <>
                  {/* First row of 3 media items */}
                  <View style={styles.topVideoRow}>
                    {media.length > 0 &&
                      renderMediaItem({ mediaAsset: media[0], index: 0 })}
                    {media.length > 1 &&
                      renderMediaItem({ mediaAsset: media[1], index: 1 })}
                    {media.length > 2 &&
                      renderMediaItem({ mediaAsset: media[2], index: 2 })}
                    {media.length === 2 && (
                      <View style={[styles.mediaItem, styles.emptySlot]} />
                    )}
                    {media.length === 1 && (
                      <>
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                      </>
                    )}
                    {media.length === 0 && (
                      <>
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                      </>
                    )}
                  </View>

                  {/* Second row of 3 media items */}
                  <View style={styles.topVideoRow}>
                    {media.length > 3 &&
                      renderMediaItem({ mediaAsset: media[3], index: 3 })}
                    {media.length > 4 &&
                      renderMediaItem({ mediaAsset: media[4], index: 4 })}
                    {media.length > 5 &&
                      renderMediaItem({ mediaAsset: media[5], index: 5 })}
                    {media.length === 5 && (
                      <View style={[styles.mediaItem, styles.emptySlot]} />
                    )}
                    {media.length === 4 && (
                      <>
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                      </>
                    )}
                    {media.length <= 3 && (
                      <>
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                      </>
                    )}
                  </View>
                </>
              ) : (
                // 2x2 grid layout when camera is present (4 items total)
                <>
                  {/* First row of 2 media items */}
                  <View style={styles.topVideoRow}>
                    {media.length > 0 &&
                      renderMediaItem({ mediaAsset: media[0], index: 0 })}
                    {media.length > 1 &&
                      renderMediaItem({ mediaAsset: media[1], index: 1 })}
                    {media.length === 1 && (
                      <View style={[styles.mediaItem, styles.emptySlot]} />
                    )}
                    {media.length === 0 && (
                      <>
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                      </>
                    )}
                  </View>

                  {/* Second row of 2 media items */}
                  <View style={styles.topVideoRow}>
                    {media.length > 2 &&
                      renderMediaItem({ mediaAsset: media[2], index: 2 })}
                    {media.length > 3 &&
                      renderMediaItem({ mediaAsset: media[3], index: 3 })}
                    {media.length === 3 && (
                      <View style={[styles.mediaItem, styles.emptySlot]} />
                    )}
                    {media.length <= 2 && (
                      <>
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                        <View style={[styles.mediaItem, styles.emptySlot]} />
                      </>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
          )}

          {/* Audio List or Grid of media */}
          {uploadMode === "audio" ? (
            <View style={styles.audioList}>
              {media.map((mediaAsset, index) => {
                if (!mediaAsset || !mediaAsset.id) return null;
                const renderedItem = renderAudioItem({ mediaAsset, index });
                if (!renderedItem) return null;
                return (
                  <React.Fragment key={String(mediaAsset.id)}>
                    {renderedItem}
                  </React.Fragment>
                );
              })}

              {/* Loading indicator when fetching more */}
              {loadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator
                    size="small"
                    color={Colors.general.primary}
                  />
                </View>
              )}

              {/* End of content indicator */}
              {!hasMoreMedia && !loading && media.length > 0 && (
                <View style={styles.endOfContentContainer}>
                  <Typography
                    size={12}
                    color={Colors[theme].textLight}
                    style={{ textAlign: "center" }}
                  >
                    {media.length} audio files loaded
                  </Typography>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.videoGrid}>
              {rows}

              {/* Loading indicator when fetching more */}
              {loadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator
                    size="small"
                    color={Colors.general.primary}
                  />
                </View>
              )}

              {/* End of content indicator */}
              {!hasMoreMedia && !loading && media.length > 0 && (
                <View style={styles.endOfContentContainer}>
                  <Typography
                    size={12}
                    color={Colors[theme].textLight}
                    style={{ textAlign: "center" }}
                  >
                    {media.length} {uploadMode === "video" ? "videos" : "photos"} loaded
                  </Typography>
                </View>
              )}
            </View>
          )}
        </Animated.ScrollView>
      </GestureHandlerRootView>
    );
  };

  // Render full screen preview as modal
  const fullScreenPreview = showFullScreenPreview && previewedMedia ? (
    <FullScreenMediaPreview
      visible={showFullScreenPreview}
      mediaUri={previewedMedia.uri}
      mediaType={uploadMode === 'video' ? 'video' : uploadMode === 'audio' ? 'audio' : 'photo'}
      isSelected={selectedMediaForChat.some(item => item.id === previewedMedia.id)}
      onToggleSelection={handleToggleSelectionInPreview}
      onSend={handleSendWithCaption}
      onBack={handleBackFromPreview}
      mediaWidth={previewedMedia.width}
      mediaHeight={previewedMedia.height}
    />
  ) : null;

  return (
    <View style={styles.container}>
      {renderContent()}
      
      {/* Caption input overlay - don't show for audio files */}
      {showCaptionInput && selectedMediaForChat.length > 0 && !showFullScreenPreview && uploadMode !== "audio" && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            // backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View style={{ paddingBottom: 8, paddingHorizontal: 16 }}>
            <Typography size={12} color="rgba(255,255,255,0.8)" style={{ textAlign: 'center' }}>
              {selectedMediaForChat.length} file(s) selected • {String(formatFileSize(getTotalSelectedSize()))} / {MAX_TOTAL_SIZE_MB}MB
            </Typography>
          </View>
          <MediaCaptionInput
            mediaItems={selectedMediaForChat.map(item => ({
              uri: item.uri,
              type: uploadMode === 'video' ? 'video' as const : 
                    uploadMode === 'audio' ? 'audio' as const : 'photo' as const
            }))}
            onSend={handleSendWithCaption}
            onCancel={handleCancelCaption}
          />
        </View>
      )}
      
      {/* Full screen preview modal */}
      {fullScreenPreview}
      
      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          primaryButton={alertConfig.primaryButton}
          secondaryButton={alertConfig.secondaryButton}
          onClose={hideAlert}
          variant={alertConfig.variant}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  topSection: {
    flexDirection: "row",
    width: "100%",
    paddingTop: 1,
    paddingHorizontal: 1,
  },
  topGridContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingTop: 1.5,
  },
  topRightContainer: {
    flex: 1.999,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingTop: 1.5,
  },
  topVideoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  videoGrid: {
    width: "100%",
    paddingHorizontal: 1,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  mediaItem: {
    flex: 1,
    aspectRatio: 1,
    margin: "0.40%",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  selectedMediaItem: {
    // borderWidth: 3,
    // borderColor: Colors.general.primary,
  },
  emptySlot: {
    backgroundColor: "transparent",
  },
  cameraButton: {
    flex: 0.975,
    aspectRatio: 0.49,
    margin: "0.45%",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cameraButtonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ddd",
  },
  selectedThumbnail: {
    opacity: 0.8,
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateCameraButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.general.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 16,
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicator: {
    backgroundColor: Colors.general.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unselectedIndicator: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  continueButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  audioSendButtonContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  audioSendButton: {
    width: 50,
    height: 50,
    paddingRight: 2,
    paddingTop: 2,
    borderRadius: 28,
    backgroundColor: Colors.general.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  clearButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  continueButton: {
    flex: 1,
    backgroundColor: Colors.general.primary,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingMoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginTop: 10,
  },
  endOfContentContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  // Audio list styles
  audioList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  audioListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  audioItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  audioSelectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.general.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MediaGalleryPicker;
