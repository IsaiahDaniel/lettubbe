import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as MediaLibrary from "expo-media-library";
import useVideoUploadStore, { Album, PhotoAsset } from "@/store/videoUploadStore";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedScrollHandler, runOnJS } from "react-native-reanimated";
import MediaCaptionInput from "@/components/shared/chat/fileSharing/MediaCaptionInput";
import FullScreenMediaPreview from "@/components/shared/chat/fileSharing/FullScreenMediaPreview";
import CustomAlert from "@/components/ui/CustomAlert";
import Typography from "@/components/ui/Typography/Typography";

import { useMediaFetching } from "@/hooks/upload/useMediaFetching";
import { useMediaSelection } from "@/hooks/upload/useMediaSelection";
import { formatFileSize, MAX_TOTAL_SIZE_MB } from "@/helpers/utils/media-utils";
import { AudioListView, MediaGridView, EmptyStateView, LoadingStateView } from "./MediaSections";
import { MediaActionButtons } from "./MediaActions/MediaActionButtons";

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
  const { showError, alertConfig, isVisible, hideAlert } = useCustomAlert();
  const scrollY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // State for preview and caption flow
  const [previewedMedia, setPreviewedMedia] = useState<MediaLibrary.Asset | null>(null);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);

  // Refs to track state for gesture coordination
  const isScrollAtTop = useRef(true);
  const scrollViewRef = useRef(null);

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

  // hooks for media fetching and selection
  const { media, loading, loadingMore, hasMoreMedia, handleLoadMore } = useMediaFetching({
    selectedAlbum,
    uploadMode,
  });

  const {
    selectedMedia,
    selectedMediaSizes,
    selectionCount,
    totalSize,
    isMediaSelected,
    getSelectionNumber,
    toggleMediaSelection,
    clearSelections: clearMediaSelections,
    setSelectedMediaDirect,
    getTotalSelectedSize,
  } = useMediaSelection({
    uploadMode,
    maxSelections: 30,
  });

  /**
   * Handle video selection for different upload contexts
   */
  const handleVideoSelection = async (video: MediaLibrary.Asset) => {
    const videoAsset = {
      uri: video.uri,
      fileName: video.filename,
      width: video.width,
      height: video.height,
      duration: video.duration,
    };

    setSelectedVideo(videoAsset);

    if (isCommunityUpload) {
      setIsUploadingVideoInCommunity(true);
      return;
    }

    if (isChatUpload) {
      return;
    }

    // Standard upload flow
    hideGallery();
    hideUploadModal();

    setTimeout(() => {
      router.push("/(videoUploader)/videoEditor");
    }, 100);
  };

  /**
   * Handle photo selection for standard upload
   */
  const handlePhotoSelection = async (photo: MediaLibrary.Asset) => {
    const photoAsset: PhotoAsset = {
      uri: photo.uri,
      fileName: photo.filename,
      width: photo.width,
      height: photo.height,
      type: "image/jpeg",
    };

    const isSelected = selectedPhotos.some((p) => p.uri === photo.uri);

    if (isSelected) {
      const index = selectedPhotos.findIndex((p) => p.uri === photo.uri);
      removeSelectedPhoto(index);
    } else {
      if (selectedPhotos.length < 5) {
        addSelectedPhoto(photoAsset);
      }
    }
  };

  /**
   * Handle media item press based on context
   */
  const handleMediaSelection = (mediaAsset: MediaLibrary.Asset) => {
    if (isChatUpload || isCommunityUpload) {
      handleChatMediaClick(mediaAsset);
    } else {
      if (uploadMode === "video" || uploadMode === "audio") {
        handleVideoSelection(mediaAsset);
      } else {
        handlePhotoSelection(mediaAsset);
      }
    }
  };

  /**
   * Handle chat/community media selection with preview
   */
  const handleChatMediaClick = async (mediaAsset: MediaLibrary.Asset) => {
    if (uploadMode === "audio") {
      await handleAudioSelection(mediaAsset);
      return;
    }
    
    setPreviewedMedia(mediaAsset);
    setShowFullScreenPreview(true);
    
    // Auto-select videos when opening preview
    if (uploadMode === "video") {
      const isAlreadySelected = selectedMedia.some(item => item.id === mediaAsset.id);
      
      if (!isAlreadySelected) {
        const success = await toggleMediaSelection(mediaAsset);
        if (success) {
          setSelectedMediaDirect([mediaAsset]);
        }
      }
    }
  };

  /**
   * Handle audio selection directly without preview
   */
  const handleAudioSelection = async (mediaAsset: MediaLibrary.Asset) => {
    const isAlreadySelected = selectedMedia.some(item => item.id === mediaAsset.id);
    
    if (isAlreadySelected) {
      await toggleMediaSelection(mediaAsset);
    } else {
      const success = await toggleMediaSelection(mediaAsset);
      if (success) {
        setSelectedMediaDirect([mediaAsset]);
      }
    }
  };

  /**
   * Handle sending media with caption
   */
  const handleSendWithCaption = async (caption: string) => {
    if (selectedMedia.length === 0) return;
    
    if (chatFunctions?.sendMediaMessage) {
      chatFunctions.sendMediaMessage(caption, selectedMedia);
    }
    
    // Reset state
    setShowCaptionInput(false);
    setShowFullScreenPreview(false);
    clearMediaSelections();
    setPreviewedMedia(null);
    
    if (chatFunctions?.closeModal) {
      chatFunctions.closeModal();
    } else {
      closeUploadModal();
    }
  };

  /**
   * Handle camera navigation
   */
  const handleOpenCamera = () => {
    hideGallery();
    closeUploadModal();
    hideUploadModal();

    if (uploadMode === "video") {
      router.push("/(videoUploader)/camera");
    } else {
      router.push("/(videoUploader)/photo-camera");
    }
  };

  /**
   * Handle continue with photos for standard upload
   */
  const handleContinueWithPhotos = () => {
    if (selectedPhotos.length === 0) return;
    
    hideGallery();
    hideUploadModal();
    openDetailsScreen();
    router.push("/(videoUploader)/photoDetails");
  };

  /**
   * Handle community/chat photo upload
   */
  const handleCommunityOrChatPhotoUpload = () => {
    if (selectedPhotos.length === 0) return;
    
    if (isCommunityUpload) {
      setIsUploadingPhotoInCommunity(true);
    }
    
    closeUploadModal();
    hideGallery();
    hideUploadModal();
  };

  // Enhanced scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      // Track if we're at the top
      if (event.contentOffset.y <= 0) {
        runOnJS(() => {
          isScrollAtTop.current = true;
        });
      } else {
        runOnJS(() => {
          isScrollAtTop.current = false;
        });
      }

      // Infinite scroll check - load earlier for smoother experience
      const { contentOffset, contentSize, layoutMeasurement } = event;
      const paddingToBottom = 300; // Increased from 200 to 300 for earlier loading
      const remainingDistance = contentSize.height - layoutMeasurement.height - contentOffset.y;

      if (remainingDistance <= paddingToBottom && remainingDistance > 0) {
        runOnJS(handleLoadMore)();
      }
    },
    onBeginDrag: () => {
      isDragging.value = true;
    },
    onEndDrag: () => {
      isDragging.value = false;
    },
  });

  const handleToggleSelectionInPreview = async () => {
    if (previewedMedia) {
      const success = await toggleMediaSelection(previewedMedia);
      
      if (success && selectedMedia.length > 0 && uploadMode !== "audio") {
        setShowCaptionInput(true);
      }
      
      if (selectedMedia.length === 0) {
        setShowCaptionInput(false);
      }
    }
  };

  const handleBackFromPreview = () => {
    setShowFullScreenPreview(false);
    setPreviewedMedia(null);
    
    if (uploadMode === "audio") {
      clearMediaSelections();
    }
  };

  const handleCancelCaption = () => {
    setShowCaptionInput(false);
    clearMediaSelections();
  };

  const handleSendAudioDirectly = async () => {
    if (selectedMedia.length === 0) return;
    await handleSendWithCaption('');
  };

  /**
   * Render main content based on loading and media state
   */
  const renderContent = () => {
    if (loading) {
      return <LoadingStateView uploadMode={uploadMode} />;
    }

    if (media.length === 0) {
      return (
        <EmptyStateView
          uploadMode={uploadMode}
          selectedAlbumTitle={selectedAlbum?.title}
          showCameraButton={!isChatUpload && !isCommunityUpload}
          onCameraPress={handleOpenCamera}
        />
      );
    }

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Action Buttons */}
        <MediaActionButtons
          uploadMode={uploadMode}
          selectedCount={isChatUpload || isCommunityUpload ? selectionCount : selectedPhotos.length}
          totalSize={totalSize}
          maxSize={MAX_TOTAL_SIZE_MB}
          isChatUpload={isChatUpload}
          isCommunityUpload={isCommunityUpload}
          onSend={uploadMode === "audio" ? handleSendAudioDirectly : handleCommunityOrChatPhotoUpload}
          onContinue={handleContinueWithPhotos}
        />

        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          bounces={isScrollAtTop.current}
        >
          {uploadMode === "audio" ? (
            <AudioListView
              media={media}
              selectedMedia={selectedMedia}
              loadingMore={loadingMore}
              hasMoreMedia={hasMoreMedia}
              onItemPress={handleMediaSelection}
            />
          ) : (
            <MediaGridView
              media={media}
              uploadMode={uploadMode}
              selectedMedia={isChatUpload || isCommunityUpload ? selectedMedia :
                media.filter(mediaItem => selectedPhotos.some(photo => photo.uri === mediaItem.uri))
              }
              selectedPhotos={selectedPhotos}
              loadingMore={loadingMore}
              hasMoreMedia={hasMoreMedia}
              isChatUpload={isChatUpload}
              isCommunityUpload={isCommunityUpload}
              onItemPress={handleMediaSelection}
              onSelectionCirclePress={toggleMediaSelection}
              onCameraPress={handleOpenCamera}
            />
          )}
        </Animated.ScrollView>
      </GestureHandlerRootView>
    );
  };

  // Render full screen preview modal
  const fullScreenPreview = showFullScreenPreview && previewedMedia ? (
    <FullScreenMediaPreview
      visible={showFullScreenPreview}
      mediaUri={previewedMedia.uri}
      mediaType={uploadMode === 'video' ? 'video' : uploadMode === 'audio' ? 'audio' : 'photo'}
      isSelected={isMediaSelected(previewedMedia.id)}
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
      
      {/* Caption input overlay */}
      {showCaptionInput && selectedMedia.length > 0 && !showFullScreenPreview && uploadMode !== "audio" && (
        <View style={styles.captionInputOverlay}>
          <View style={styles.captionInputInfo}>
            <Typography size={12} color="rgba(255,255,255,0.8)" style={{ textAlign: 'center' }}>
              {selectedMedia.length} file(s) selected • {formatFileSize(getTotalSelectedSize())} / {MAX_TOTAL_SIZE_MB}MB
            </Typography>
          </View>
          <MediaCaptionInput
            mediaItems={selectedMedia.map(item => ({
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
  captionInputOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  captionInputInfo: {
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
});

export default MediaGalleryPicker;