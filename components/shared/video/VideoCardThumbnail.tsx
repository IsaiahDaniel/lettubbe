import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import { View, Image, Pressable, StyleSheet, Dimensions, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Icons } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Typography from "@/components/ui/Typography/Typography";
import Avatar from "@/components/ui/Avatar";
import { VideoCardThumbnailProps } from "@/helpers/types/feed/types";
import { formatVideoDuration } from '@/helpers/utils/formatting';
import { useAudioStore } from "@/store/audioStore";
import VideoPreviewPlayer from './VideoPreviewPlayer';
import VerificationBadge from '@/components/ui/VerificationBadge';
import AnimatedPaginationDots from '@/components/ui/AnimatedPaginationDots';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const VideoCardThumbnail = memo(({ 
  video, 
  userInfo,
  onDurationChange, 
  onAvatarPress,
  onPress,
  isAutoPlaying = false,
  enablePreview = false,
  onLayout,
  videoDimensions,
  onAutoplayProgressUpdate,
  onAutoplayStart,
  onAutoplayStop,
}: VideoCardThumbnailProps & { 
  onPress?: () => void;
  onLayout?: (event: any) => void;
  onAutoplayProgressUpdate?: (currentTime: number, duration: number) => void;
  onAutoplayStart?: () => void;
  onAutoplayStop?: () => void;
}) => {
  const { theme } = useCustomTheme();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});
  const [previewError, setPreviewError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [autoplayCount, setAutoplayCount] = useState(0);
  const [showReloadButton, setShowReloadButton] = useState(false);
  const [hasCompletedCurrentCycle, setHasCompletedCurrentCycle] = useState(false);
  const autoplayCountRef = useRef(0);
  const containerRef = useRef<View>(null);
  
  // Global audio state
  const { isGloballyMuted, toggleGlobalMute } = useAudioStore();

  // Determine if this is a photo post or video post
  const isPhotoPost = useMemo(() => 
    video?.images && video.images.length > 0, 
    [video?.images]
  );

  // Calculate dynamic thumbnail height based on actual media dimensions
  const dynamicThumbnailHeight = useMemo(() => {
    // Use actual dimensions when available (works for both photos and videos)
    if (videoDimensions) {
      const aspectRatio = videoDimensions.width / videoDimensions.height;
      const calculatedHeight = screenWidth / aspectRatio;
      
      if (isPhotoPost) {
        // photo-specific constraints to prevent extremely tall or short photos
        const maxPhotoHeight = screenWidth * 1.5; // 2:3 aspect ratio (portrait)
        const minPhotoHeight = screenWidth * 0.5; // 2:1 aspect ratio (landscape)
        
        return Math.min(Math.max(calculatedHeight, minPhotoHeight), maxPhotoHeight);
      } else {
        // video-specific constraints
        const maxHeight = screenWidth * 1.5; // 2:3 aspect ratio
        const minHeight = screenWidth * 0.5; // 2:1 aspect ratio
        
        return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
      }
    }
    
    // Fallback to default ratios when dimensions not yet loaded
    if (isPhotoPost) {
      return squarePhotoHeight; // Default square ratio for photos
    }
    
    // This should not happen anymore since VideoCard handles the loading
    console.warn('VideoCardThumbnail: No videoDimensions provided for video');
    return squarePhotoHeight;
  }, [isPhotoPost, video?.images, videoDimensions]);

  const displayDuration = useMemo(() => {
    // Show countdown when video is auto-playing and we have current time
    if (isAutoPlaying && videoDuration > 0 && currentTime >= 0) {
      const remainingTime = Math.max(0, videoDuration - currentTime);
      // console.log('⏰ COUNTDOWN:', {
      //   videoId: video?._id?.slice(-6),
      //   currentTime: currentTime.toFixed(1),
      //   duration: videoDuration.toFixed(1),
      //   remaining: remainingTime.toFixed(1),
      //   isPlaying: isAutoPlaying
      // });
      return formatVideoDuration(remainingTime);
    }
    
    // Otherwise show total duration
    return video?.duration ? formatVideoDuration(video.duration) : "--:--";
  }, [video?.duration, isAutoPlaying, videoDuration, currentTime, video?._id]);

  const safeUserInfo = useMemo(() => ({
    firstName: userInfo?.firstName || "",
    profilePicture: userInfo?.profilePicture || "",
    username: userInfo?.username || "",
    subscription: userInfo?.subscription || undefined
  }), [userInfo?.firstName, userInfo?.profilePicture, userInfo?.username, userInfo?.subscription]);

  // Memoize avatar ring color to prevent unnecessary re-renders
  const avatarRingColor = useMemo(() => Colors[theme].avatar, [theme]);

  // Memoize dynamic styles to prevent object recreation
  const containerStyle = useMemo(() => [
    styles.container,
    {
      height: dynamicThumbnailHeight,
      backgroundColor: Colors[theme].cardBackground
    }
  ], [dynamicThumbnailHeight, theme]);

  const photoContainerStyle = useMemo(() => [
    styles.photoContainer,
    { height: dynamicThumbnailHeight }
  ], [dynamicThumbnailHeight]);



  const handlePhotoScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const screenWidth = Dimensions.get('window').width;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentPhotoIndex(index);
  };

  const handleImageLoad = (event: any) => {
    setIsImageLoaded(true);
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    setCurrentTime(currentTime);
    if (duration > 0 && videoDuration !== duration) {
      setVideoDuration(duration);
    }

    // Reset completion flag when video starts over (near beginning)
    if (duration > 0 && (currentTime / duration) < 0.1) {
      setHasCompletedCurrentCycle(false);
    }

    // Check if video completed (reached near end) and hasn't been counted yet
    if (duration > 0 && currentTime > 0 && (currentTime / duration) >= 0.95 && !hasCompletedCurrentCycle) {
      setHasCompletedCurrentCycle(true);

      // Video completed, increment autoplay count using ref for immediate access
      autoplayCountRef.current += 1;
      const newCount = autoplayCountRef.current;
      console.log('🎬 AUTOPLAY: Video completed, count:', newCount);
      setAutoplayCount(newCount);

      if (newCount >= 2) {
        // After 2 plays, show reload button and stop autoplay
        setShowReloadButton(true);
        setShowPreview(false);
      }
    }

    // Track autoplay progress if this is an autoplay video
    if (isAutoPlaying && onAutoplayProgressUpdate) {
      onAutoplayProgressUpdate(currentTime, duration);
    }
  };

  // Handle preview state changes
  useEffect(() => {
    console.log('🎬 THUMBNAIL: Preview state change:', {
      videoId: video?._id?.slice(-8),
      enablePreview,
      isAutoPlaying,
      isPhotoPost,
      previewError,
      autoplayCount,
      showReloadButton,
      shouldShowPreview: enablePreview && isAutoPlaying && !isPhotoPost && !previewError && autoplayCount < 2 && !showReloadButton
    });

    // Only show preview if autoplay limit hasn't been reached
    const shouldShowPreview = enablePreview && isAutoPlaying && !isPhotoPost && !previewError && autoplayCount < 2 && !showReloadButton;

    if (shouldShowPreview) {
      setShowPreview(true);
      // Start autoplay tracking when video starts playing
      if (onAutoplayStart) {
        onAutoplayStart();
      }
    } else {
      // If we're stopping due to autoplay limit reached, ensure reload button shows
      if (autoplayCount >= 2 && !showReloadButton && !isPhotoPost) {
        console.log('🎬 AUTOPLAY: Setting reload button to true');
        setShowReloadButton(true);
      }

      setShowPreview(false);
      // Stop autoplay tracking when video stops playing
      if (onAutoplayStop) {
        onAutoplayStop();
      }
    }
  }, [enablePreview, isAutoPlaying, isPhotoPost, previewError, autoplayCount, showReloadButton, video?._id]);

  // Reset error state when video changes
  useEffect(() => {
    setPreviewError(false);
    setShowPreview(false);
    setCurrentTime(0);
    setVideoDuration(0);
    setAutoplayCount(0);
    autoplayCountRef.current = 0;
    setShowReloadButton(false);
    setHasCompletedCurrentCycle(false);
    
    // Initialize loading state for all images
    if (isPhotoPost && video?.images) {
      const initialLoadingState: { [key: number]: boolean } = {};
      video.images.forEach((_, index) => {
        initialLoadingState[index] = true;
      });
      setLoadingImages(initialLoadingState);
    }
  }, [video?.videoUrl, video?.images, isPhotoPost]);

  // Simple onLayout handler for position tracking
  const handleLayoutEvent = (event: any) => {
    if (onLayout) {
      onLayout(event);
    }
  };

  const handlePreviewError = (error?: any) => {
    // Only log significant errors, not cleanup-related ones
    if (error && !error.toString?.().includes('already released')) {
      console.warn('Video preview failed, falling back to thumbnail:', error);
    }
    setPreviewError(true);
    setShowPreview(false);
  };

  const handleReloadAutoplay = () => {
    // Open video player like normal thumbnail press
    if (onPress) {
      onPress();
    } else {
    }
  };

  const renderPhotoItem = ({ item: imageUri, index }: { item: string; index: number }) => {
    const isLoading = loadingImages[index] || false;
    const isCurrentPhoto = index === currentPhotoIndex;
    
    return (
      <Pressable
        onPress={() => {
          onPress?.();
        }}
        style={styles.photoTouchable}
      >
        <Image
          source={{ uri: imageUri }}
          style={[styles.photoImage, { opacity: isLoading ? 0 : 1 }]}
          resizeMode="cover"
          onLoad={() => {
            setLoadingImages(prev => ({
              ...prev,
              [index]: false
            }));
          }}
          onError={() => {
            setLoadingImages(prev => ({
              ...prev,
              [index]: false
            }));
          }}
        />
        
        {/* Loading spinner overlay - only show for current photo */}
        {isLoading && isCurrentPhoto && (
          <View style={styles.photoLoadingOverlay}>
            <LoadingSpinner size={32} color="white" />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View
      ref={containerRef}
      style={containerStyle}
    >
      {/* Preloader is now handled by VideoCard component */}
      
      {/* Photo carousel or video thumbnail */}
      {isPhotoPost ? (
        <View style={photoContainerStyle}>
          <FlatList
            data={video.images}
            renderItem={renderPhotoItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handlePhotoScroll}
            scrollEventThrottle={16}
            bounces={false}
            decelerationRate="fast"
            keyExtractor={(item, index) => `photo-${index}`}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
          
          {/* UI overlay - positioned to avoid blocking photo touch events */}
          <Pressable onPress={onAvatarPress} style={styles.avatarButton} pointerEvents="box-none">
            <Avatar
              imageSource={safeUserInfo.profilePicture}
              size={36}
              uri
              ringColor={avatarRingColor}
              expandable={false}
              alt={safeUserInfo.username}
            />
            <View style={styles.usernameContainer}>
              <Typography
                weight="600"
                size={16}
                lineHeight={17}
                color="#fff"
                style={styles.avatarText}>
                {safeUserInfo.username}
              </Typography>
              {safeUserInfo.subscription?.isVerified && (
                <VerificationBadge 
                  level={safeUserInfo.subscription.level}
                  size={14}
                  style={styles.verificationBadge}
                />
              )}
            </View>
          </Pressable>


          {/* Photo counter for multiple photos */}
          {video.images.length > 1 && (
            <View style={styles.photoCountContainer} pointerEvents="none">
              <View style={styles.photoCountBadge}>
                <Typography weight="500" size={12} color="#fff">
                  {currentPhotoIndex + 1}/{video.images.length}
                </Typography>
              </View>
            </View>
          )}

          {/* Animated pagination dots for photos */}
          {video.images.length > 1 && (
            <AnimatedPaginationDots
              totalPhotos={video.images.length}
              activeIndex={currentPhotoIndex}
              containerStyle={styles.dotsContainer}
            />
          )}
        </View>
      ) : (
        <>
          {/* Video preview or thumbnail */}
          {showPreview && video?.videoUrl ? (
            <VideoPreviewPlayer
              videoUrl={video.videoUrl}
              thumbnailUrl={video.thumbnail}
              shouldPlay={isAutoPlaying}
              width={screenWidth}
              height={dynamicThumbnailHeight}
              onError={(error) => handlePreviewError(error)}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <Image
              source={{ uri: video?.thumbnail }}
              resizeMode="cover"
              style={styles.thumbnail}
              onLoad={handleImageLoad}
            />
          )}

          {/* Reload Button Overlay */}
          {showReloadButton && !isPhotoPost && (
            <>
              {console.log('🎬 RELOAD: Rendering reload button for video:', video?._id?.slice(-8))}
              <TouchableOpacity
                style={styles.reloadOverlay}
                onPress={() => {
                  console.log('🎬 RELOAD: TouchableOpacity onPress triggered');
                  handleReloadAutoplay();
                }}
                activeOpacity={0.9}
              >
                <View style={styles.reloadButton}>
                  <Image
                    source={Icons.play}
                    style={styles.playIcon}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            </>
          )}
          
          {/* UI overlay for videos only */}
          <View style={styles.uiLayer}>
            <Pressable onPress={onAvatarPress} style={styles.avatarButton}>
              <Avatar
                imageSource={safeUserInfo.profilePicture}
                size={36}
                uri
                ringColor={avatarRingColor}
                expandable={false}
                alt={safeUserInfo.username}
              />
              <View style={styles.usernameContainer}>
                <Typography
                  weight="600"
                  size={16}
                  lineHeight={17}
                  color="#fff"
                  style={styles.avatarText}>
                  {safeUserInfo.username}
                </Typography>
                {safeUserInfo.subscription?.isVerified && (
                  <VerificationBadge 
                    level={safeUserInfo.subscription.level}
                    size={14}
                    style={styles.verificationBadge}
                  />
                )}
              </View>
            </Pressable>


            {/* Audio toggle and Duration badge for videos */}
            <View style={styles.bottomRightControls}>
              {/* Audio toggle button - only show when video is auto-playing */}
              {isAutoPlaying && (
                <TouchableOpacity
                  onPress={() => {
                    // IMMEDIATE UI feedback - don't wait for video operations
                    // console.log('🔊 AUDIO: Immediate mute toggle triggered');
                    toggleGlobalMute();
                  }}
                  style={styles.audioToggleContainer}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isGloballyMuted ? "volume-mute-outline" : "volume-high-outline"}
                    size={14}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}

              {/* Duration badge */}
              <View style={[
                styles.durationContainer,
                isAutoPlaying && videoDuration > 0 && styles.countdownContainer
              ]}>
                <Typography weight="500" size={12} color="#fff">
                  {displayDuration}
                </Typography>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
});

VideoCardThumbnail.displayName = 'VideoCardThumbnail';

// Calculate dimensions
const screenWidth = Dimensions.get('window').width;
const videoThumbnailHeight = screenWidth * (9 / 16); // 16:9 aspect ratio for videos

const maxPhotoHeight = screenWidth * (5 / 4); // Maximum photo height (4:5 portrait ratio)
const minPhotoHeight = screenWidth * (1 / 1.91); // Minimum photo height (1.91:1 landscape ratio)
const squarePhotoHeight = screenWidth; // 1:1 square ratio

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: 'relative',
    overflow: 'hidden',
  },
  videoContainer: {
    height: videoThumbnailHeight,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e1e1e1",
  },
  dimmedThumbnail: {
  },
  uiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  avatarButton: {
    position: "absolute",
    top: 10,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  avatarText: {
    // textShadowColor: "#00000099",
    // textShadowOffset: { width: 0, height: 1 },
    // textShadowRadius: 10,
  },
  verificationBadge: {
    marginTop: -3,
  },
  bottomRightControls: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
  },
  audioToggleContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  durationContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  countdownContainer: {
  },
  photoCountContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    zIndex: 10,
  },
  photoCountBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoContainer: {
    width: "100%",
    height: "100%",
    position: 'relative',
  },
  photoTouchable: {
    width: screenWidth,
    height: '100%',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  reloadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 15,
  },
  reloadButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playIcon: {
    width: 40,
    height: 40,
    tintColor: '#fff',
  },
  photoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});