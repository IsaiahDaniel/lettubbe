import React, { memo, useMemo, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Pressable, 
  Dimensions,
  FlatList,
} from 'react-native';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import CircularProgress from '@/components/ui/CircularProgress';
import Avatar from '@/components/ui/Avatar';
import useVideoUploadStore from '@/store/videoUploadStore';
import useUser from '@/hooks/profile/useUser';
import { formatVideoDuration } from '@/helpers/utils/formatting';
import { useSimpleUpload } from '@/hooks/upload/useSimpleUpload';
import { Feather } from '@expo/vector-icons';

interface UploadProgressCardProps {
  progress?: number; // Made optional since we'll use internal progress
  isVideo?: boolean; // Made optional - will determine internally
  onPress?: () => void;
}

const UploadProgressCard: React.FC<UploadProgressCardProps> = ({
  progress,
  isVideo: isVideoProp,
  onPress,
}) => {
  const { theme } = useCustomTheme();
  const { profileData: user } = useUser();
  const { 
    selectedVideo, 
    selectedPhotos, 
    videoDetails, 
    postDetails, 
    isUploading, 
    uploadProgress, 
    uploadError,
    isCancelling
  } = useVideoUploadStore();
  const { cancelUpload } = useSimpleUpload();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // Determine content type
  const isVideo = selectedVideo !== null;
  const details = isVideo ? videoDetails : postDetails;
  
  // Show card only when uploading
  const hasContent = isUploading && (selectedVideo !== null || selectedPhotos.length > 0);
  const realProgress = uploadProgress;
  
  // Handle thumbnail load to get dimensions for both photos and videos
  const handleImageLoad = (event: any) => {
    if (event?.nativeEvent?.source) {
      const { width, height } = event.nativeEvent.source;
      setVideoDimensions({ width, height });
    }
  };

  // Reset dimensions when content changes
  useEffect(() => {
    setVideoDimensions(null);
  }, [selectedVideo?.uri, selectedPhotos]);


  // Get media content
  const videoThumbnail = selectedVideo?.uri;
  const photoImages = selectedPhotos.map(photo => photo.uri);
  const isPhotoPost = !isVideo && photoImages.length > 0;

  // Calculate container height based on actual dimensions when available
  const containerHeight = useMemo(() => {
    if (videoDimensions) {
      // Use actual aspect ratio from the media (works for both videos and photos)
      const aspectRatio = videoDimensions.width / videoDimensions.height;
      const calculatedHeight = screenWidth / aspectRatio;
      
      if (isPhotoPost) {
        // Apply photo-specific constraints to prevent extremely tall or short photos
        const maxPhotoHeight = screenWidth * 1.5; // 2:3 aspect ratio (portrait)
        const minPhotoHeight = screenWidth * 0.5; // 2:1 aspect ratio (landscape)
        
        return Math.min(Math.max(calculatedHeight, minPhotoHeight), maxPhotoHeight);
      } else {
        // Apply video-specific constraints
        const maxHeight = screenWidth * 1.5; // 2:3 aspect ratio
        const minHeight = screenWidth * 0.5; // 2:1 aspect ratio
        
        return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
      }
    }
    
    // Fallback to default ratios when dimensions not yet loaded
    if (isPhotoPost) {
      return squarePhotoHeight; // Default square ratio for photos
    }
    return videoThumbnailHeight; // Default 16:9 ratio for videos
  }, [videoDimensions, isPhotoPost, photoImages.length]);

  // Display duration for videos
  const displayDuration = useMemo(() => 
    selectedVideo?.duration ? formatVideoDuration(selectedVideo.duration) : "--:--", 
    [selectedVideo?.duration]
  );

  // User info with fallbacks
  const safeUserInfo = useMemo(() => ({
    firstName: user?.data?.firstName || "",
    profilePicture: user?.data?.profilePicture || "",
    username: user?.data?.username || ""
  }), [user?.data?.firstName, user?.data?.profilePicture, user?.data?.username]);

  // Status text
  const getStatusText = () => {
    if (uploadError) {
      return `Upload failed: ${uploadError}`;
    }
    if (realProgress === 0) {
      return `Preparing ${isVideo ? 'video' : 'photos'}...`;
    } else if (realProgress <= 5) {
      return `Preparing ${isVideo ? 'video' : 'photos'}...`;
    }
    return `Uploading ${isVideo ? 'video' : 'photos'}...`;
  };

  const handlePhotoScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const screenWidth = Dimensions.get('window').width;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentPhotoIndex(index);
  };

  const handleCancelUpload = () => {
    // Don't allow cancel if already cancelling or if upload is completed
    if (isCancelling || realProgress >= 100) {
      return;
    }
    
    console.log('🚫 Cancel button pressed');
    cancelUpload();
  };

  // Smart cancel button text based on progress and state
  const getCancelButtonText = () => {
    if (realProgress >= 100) {
      return 'Completed';
    }
    if (isCancelling) {
      return 'Cancelling...';
    }
    // For uploads that are too far along (>90%), show "Completing..."
    if (realProgress > 90) {
      return 'Completing...';
    }
    return 'Cancel';
  };

  // Smart cancel button color based on state
  const getCancelButtonColor = () => {
    if (realProgress >= 100) {
      return '#4CAF50'; // Green for completed
    }
    if (isCancelling) {
      return '#FF9800'; // Orange for cancelling
    }
    if (realProgress > 90) {
      return '#2196F3'; // Blue for completing
    }
    return Colors.general.blue; // Default blue for cancel
  };

  const renderPhotoItem = ({ item: imageUri, index }: { item: string; index: number }) => (
    <Pressable
      onPress={onPress}
      style={styles.photoTouchable}
    >
      <Image
        source={{ uri: imageUri }}
        style={styles.photoImage}
        resizeMode="cover"
      />
    </Pressable>
  );

  // Hide component if no content to show
  if (!hasContent) {
    return null;
  }

  // Don't render main content until dimensions are loaded or if no media URI exists
  const preloadUri = isPhotoPost ? (photoImages[0]) : videoThumbnail;
  const shouldRenderContent = videoDimensions !== null || !preloadUri;
  
  if (!shouldRenderContent && preloadUri) {
    return (
      <View style={{ height: 0 }}>
        {/* Hidden preloader to get dimensions */}
        <Image 
          source={{ uri: preloadUri }} 
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          onLoad={handleImageLoad}
        />
      </View>
    );
  }

  return (
    <View style={styles.videoContainer}>
      {/* Thumbnail Container */}
      <View style={styles.thumbnailContainer}>
        <View style={[
          styles.container, 
          isPhotoPost 
            ? { height: containerHeight }
            : { ...styles.videoContainerInner, height: containerHeight }
        ]}>
          {/* Photo carousel or video thumbnail */}
          {isPhotoPost && photoImages.length > 0 ? (
            <View style={[styles.photoContainer, { height: containerHeight }]}>
              <FlatList
                data={photoImages}
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
              
              {/* UI overlay for photos */}
              <View style={styles.uiLayer}>
                <Pressable style={styles.avatarButton} pointerEvents="box-none">
                  <Avatar 
                    imageSource={safeUserInfo.profilePicture} 
                    size={36} 
                    uri 
                    ringColor={Colors[theme].avatar} 
                    expandable={false}
                  />
                  <Typography
                    weight="600"
                    size={16}
                    lineHeight={17}
                    color="#fff"
                    style={styles.avatarText}>
                    {safeUserInfo.username}
                  </Typography>
                </Pressable>

                {/* Photo counter */}
                {photoImages.length > 1 && (
                  <View style={styles.durationContainer} pointerEvents="none">
                    <Typography weight="500" size={12} color="#fff">
                      {currentPhotoIndex + 1}/{photoImages.length}
                    </Typography>
                  </View>
                )}

                {/* Pagination dots */}
                {photoImages.length > 1 && (
                  <View style={styles.dotsContainer} pointerEvents="none">
                    {photoImages.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          index === currentPhotoIndex ? styles.activeDot : styles.inactiveDot,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : videoThumbnail ? (
            <>
              {/* Video thumbnail */}
              <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.videoThumbnailContainer}>
                <Image 
                  source={{ uri: videoThumbnail }} 
                  resizeMode="cover" 
                  style={styles.thumbnail}
                />
                
                {/* UI overlay for videos */}
                <View style={styles.uiLayer}>
                  <Pressable style={styles.avatarButton}>
                    <Avatar 
                      imageSource={safeUserInfo.profilePicture} 
                      size={36} 
                      uri 
                      ringColor={Colors[theme].avatar} 
                      expandable={false}
                    />
                    <Typography
                      weight="600"
                      size={16}
                      lineHeight={17}
                      color="#fff"
                      style={styles.avatarText}>
                      {safeUserInfo.username}
                    </Typography>
                  </Pressable>

                  {/* Duration badge for videos */}
                  <View style={styles.durationContainer}>
                    <Typography weight="500" size={12} color="#fff">
                      {displayDuration}
                    </Typography>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.videoThumbnailContainer}>
              {/* Placeholder for upload without media preview */}
              <View style={[styles.thumbnail, { backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' }]}>
                <Typography size={14} weight="500" textType='secondary'>
                  {isPhotoPost? 'Uploading Photos...' : 'Uploading Video...'}
                </Typography>
              </View>
              
              {/* UI overlay */}
              <View style={styles.uiLayer}>
                <Pressable style={styles.avatarButton}>
                  <Avatar 
                    imageSource={safeUserInfo.profilePicture} 
                    size={36} 
                    uri 
                    ringColor={Colors[theme].avatar} 
                    expandable={false}
                  />
                  <Typography
                    weight="600"
                    size={16}
                    lineHeight={17}
                    color="#fff"
                    style={styles.avatarText}>
                    {safeUserInfo.username}
                  </Typography>
                </Pressable>
              </View>
            </View>
          )}

          {/* Upload progress overlay - centered on thumbnail */}
          <View style={styles.progressOverlay}>
            <View style={styles.progressBackground}>
              <CircularProgress
                size={80}
                progress={realProgress}
                strokeWidth={6}
                showUploadIcon={false}
                backgroundColor="rgba(255, 255, 255, 0.3)"
                progressColor="#fff"
                iconColor="#fff"
                immediate={true}
              />
              {/* Cancel button in center of progress circle */}
              <TouchableOpacity 
                style={[styles.cancelButtonX, {
                  opacity: (realProgress >= 100 || isCancelling) ? 0.7 : 1
                }]}
                onPress={handleCancelUpload}
                activeOpacity={0.8}
                disabled={realProgress >= 100 || isCancelling}
              >
                {realProgress >= 100 ? (
                  <Feather name="check" size={24} color="#4CAF50" />
                ) : isCancelling ? (
                  <Feather name="loader" size={24} color="#FF9800" />
                ) : realProgress > 90 ? (
                  <Feather name="clock" size={24} color="#2196F3" />
                ) : (
                  <Feather name="x" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Interaction Bar */}
        <View style={styles.interactionContainer}>
          <View style={styles.statusSection}>
            <Typography size={14} weight="600" color={Colors[theme].textBold}>
              {getStatusText()}
            </Typography>
            <Typography size={12} weight="400" color={Colors[theme].textLight}>
              {`${realProgress.toFixed(1)}% complete`}
            </Typography>
          </View>
          <TouchableOpacity 
            style={[styles.cancelButton, { 
              backgroundColor: getCancelButtonColor(),
              opacity: (realProgress >= 100 || isCancelling) ? 0.7 : 1
            }]}
            onPress={handleCancelUpload}
            activeOpacity={0.8}
            disabled={realProgress >= 100 || isCancelling}
          >
            <Typography size={12} weight="600" color="#fff">
              {getCancelButtonText()}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.contentInfoContainer}>
            <TouchableOpacity style={styles.usernameButton} activeOpacity={0.7}>
              <Typography
                weight="600"
                size={14}
                lineHeight={20}
                style={styles.usernameText}
              >
                {safeUserInfo.username}
              </Typography>
            </TouchableOpacity>

            {details.description && (
              <Typography
                weight="400"
                size={14}
                lineHeight={20}
              >
                {details.description}
              </Typography>
            )}
          </View>

          <View style={styles.timeContainer}>
            <Typography weight="400" size={12} textType="secondary">
              Uploading now
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );
};

// Calculate dimensions
const screenWidth = Dimensions.get('window').width;
const videoThumbnailHeight = screenWidth * (9 / 16); // 16:9 aspect ratio for videos
const squarePhotoHeight = screenWidth; // 1:1 square ratio

const styles = StyleSheet.create({
  videoContainer: {
    marginBottom: 24,
  },
  thumbnailContainer: {
    position: "relative",
  },
  container: {
    width: "100%",
    position: 'relative',
    backgroundColor: "#f0f0f0",
    overflow: 'hidden',
  },
  videoContainerInner: {
    // Dynamic height will be set inline based on actual dimensions
    minHeight: videoThumbnailHeight, // Fallback height
  },
  videoThumbnailContainer: {
    width: "100%",
    height: "100%",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e1e1e1",
  },
  uiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  avatarButton: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  avatarText: {
    textShadowColor: "#00000099",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  durationContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 10,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  progressBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
    padding: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginLeft: 12,
  },
  cancelButtonX: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  interactionContainer: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusSection: {
    flex: 1,
    gap: 4,
  },
  metaContainer: {
    gap: 8,
  },
  contentInfoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  usernameButton: {
    flexDirection: "row",
  },
  usernameText: {
    marginRight: 4,
  },
  timeContainer: {
    marginTop: 4,
  },
});

export default memo(UploadProgressCard);