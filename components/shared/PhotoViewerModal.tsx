import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, BackHandler, ScrollView, Text, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withRepeat } from 'react-native-reanimated';
import { useVideoPlayerData } from '@/hooks/videoplayer/useVideoPlayerData';
import VideoBottomSheets from '@/components/shared/videoplayer/VideoBottomSheets';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import UserProfileBottomSheet from '@/components/ui/Modals/UserProfileBottomSheet';
import Typography from '@/components/ui/Typography/Typography';
import MentionText from '@/components/ui/MentionText';
import Avatar from '@/components/ui/Avatar';
import { GlobalInteractionBar } from '@/components/shared/interactions/GlobalInteractionBar';
import { parseMentionsFromBackend } from '@/helpers/utils/mentionUtils';
import { MentionUser } from '@/store/videoUploadStore';
import { getPost } from '@/services/feed.service';
import { useGetVideoItemStore, VideoItem } from '@/store/feedStore';
import PhotoViewerSkeleton from '@/components/shared/skeletons/PhotoViewerSkeleton';
import { devLog } from '@/config/dev';
import AnimatedPaginationDots from '@/components/ui/AnimatedPaginationDots';
import SubscribeButton from '@/components/shared/profile/SubscribeButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Import ChatMediaViewer functionality
import { useMediaGestures } from '@/components/shared/chat/ChatMediaViewer/hooks/useMediaGestures';
import { useControlsVisibility } from '@/components/shared/chat/ChatMediaViewer/hooks/useControlsVisibility';
import { useMediaViewerState } from '@/components/shared/chat/ChatMediaViewer/hooks/useMediaViewerState';
import { MediaItem } from '@/components/shared/chat/ChatMediaViewer/types';
import { useHomeTabSafe } from '@/contexts/HomeTabContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Enhanced Photo Component with gesture support
const EnhancedPhoto: React.FC<{
  uri: string;
  index: number;
  currentIndex: number;
  onMediaPress: () => void;
  isLoading: boolean;
}> = ({ uri, index, currentIndex, onMediaPress, isLoading }) => {
  const isCurrentItem = index === currentIndex;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <View style={styles.photoSlide}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onMediaPress}
        style={styles.photoTouchable}
      >
        <Animated.Image
          source={{ uri }}
          style={[styles.photoImage, { opacity: imageLoaded ? 1 : 0 }]}
          resizeMode="contain"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
        
        {/* Loading spinner overlay */}
        {(!imageLoaded && isCurrentItem) && (
          <View style={styles.imageLoadingOverlay}>
            <LoadingSpinner size={40} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

interface PhotoViewerModalProps {
  visible: boolean;
  onClose: () => void;
}

const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ visible, onClose }) => {
  const { theme } = useCustomTheme();
  const insets = useSafeAreaInsets();
  const homeTabContext = useHomeTabSafe();
  const pauseBackgroundAutoplay = homeTabContext?.pauseBackgroundAutoplay;
  const resumeBackgroundAutoplay = homeTabContext?.resumeBackgroundAutoplay;
  
  const [userProfileUserId, setUserProfileUserId] = useState<string | undefined>(undefined);
  const params = useLocalSearchParams();
  const [isLoadingDeepLink, setIsLoadingDeepLink] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const {
    selectedItem,
    profileData,
    comments,
    activeSheet,
    setActiveSheet,
    displayPlaysCount,
    likeCount,
    commentCount,
    displayIsSubscribed,
    displaySubscriberCount,
    showSubscribeButton,
    isSubscribing,
    handleSubscriptionPress,
  } = useVideoPlayerData();

  // Transform selectedItem photos to MediaItem array
  const getMediaItems = useCallback((): MediaItem[] => {
    if (!selectedItem) return [];
    
    try {
      // Safely check for images array - ensure all checks are consistent
      const images = selectedItem.images;
      const hasImages = Array.isArray(images) && images.length > 0;
      
      const photoUrls: string[] = hasImages
        ? images
        : (selectedItem.photoUrl || selectedItem.thumbnail)
        ? [selectedItem.photoUrl || selectedItem.thumbnail].filter(Boolean) as string[]
        : [];
      
      // Filter out any undefined/null URLs
      const validUrls = photoUrls.filter(url => url && typeof url === 'string');
      
      return validUrls.map(uri => ({
        uri,
        type: 'image' as const,
        caption: selectedItem.description || '',
      }));
    } catch (error) {
      devLog('GENERAL', 'PhotoViewerModal: Error processing media items:', error);
      return [];
    }
  }, [selectedItem]);

  const mediaItems = getMediaItems();
  
  // Always initialize hooks in the same order, regardless of state
  const { currentIndex, setCurrentIndex, animationValues } = useMediaViewerState(
    visible, // visible when modal is shown
    0, // initial index
    onClose // onClose callback
  );

  const { showControls, resetHideControlsTimer, clearTimer } = useControlsVisibility(
    animationValues.controlsOpacity
  );

  // Add a function to hide controls immediately
  const hideControlsImmediately = useCallback(() => {
    clearTimer();
    animationValues.controlsOpacity.value = withTiming(0, { duration: 300 });
  }, [clearTimer, animationValues.controlsOpacity]);

  const { combinedGesture } = useMediaGestures({
    mediaItems,
    currentIndex,
    animationValues,
    onClose,
    onIndexChange: setCurrentIndex,
    onControlsShow: resetHideControlsTimer,
  });

  const handleMediaPress = useCallback(() => {
    // Toggle controls visibility when screen is tapped
    const currentOpacity = animationValues.controlsOpacity.value;
    
    if (currentOpacity > 0.5) {
      // Controls are visible, hide them immediately
      hideControlsImmediately();
    } else {
      // Controls are hidden, show them and start auto-hide timer
      resetHideControlsTimer();
    }
  }, [hideControlsImmediately, resetHideControlsTimer, animationValues.controlsOpacity]);

  // Handle status bar with useFocusEffect using native StatusBar API
  useFocusEffect(
    React.useCallback(() => {
      if (!visible) return;
      
      devLog('GENERAL', 'PHOTO_VIEWER_MODAL: Modal focused - setting status bar to light content');
      RNStatusBar.setBarStyle('light-content', true);
      RNStatusBar.setHidden(false, 'fade');
      
      return () => {
        devLog('GENERAL', 'PHOTO_VIEWER_MODAL: Modal unfocused - restoring status bar');
        // Restore based on theme
        const barStyle = theme === 'dark' ? 'light-content' : 'dark-content';
        RNStatusBar.setBarStyle(barStyle, true);
        RNStatusBar.setHidden(false, 'fade');
      };
    }, [theme, visible])
  );

  // Handle deep link with postId parameter when modal becomes visible
  useEffect(() => {
    if (!visible) return;
    
    const postId = params.photoId as string;
    
    // Only fetch if we have a postId and either no selectedItem or wrong item
    if (postId && (!selectedItem || selectedItem._id !== postId)) {
      devLog('GENERAL', 'PhotoViewerModal: Loading data for postId:', postId);
      setIsLoadingDeepLink(true);
      
      // Clear any existing data first
      const { setSelectedItem, clearThumbnailCache } = useGetVideoItemStore.getState();
      clearThumbnailCache();
      
      const fetchPostData = async () => {
        try {
          const response = await getPost(postId);
          
          if (response.data && (response.data.post || response.data._id)) {
            const postData = response.data.post || response.data;
            
            // Transform to VideoItem format for photos
            const isPhoto = postData.images && Array.isArray(postData.images) && postData.images.length > 0;
            
            const photoItem: VideoItem = {
              _id: postData._id,
              thumbnail: postData.thumbnail || (isPhoto ? postData.images[0] : ""),
              duration: postData.duration?.toString() || "",
              description: postData.description || "",
              videoUrl: postData.videoUrl || "",
              images: postData.images || [],
              photoUrl: isPhoto ? postData.images[0] : undefined,
              mediaType: 'photo' as const,
              mentions: postData.mentions || [],
              createdAt: postData.createdAt || "",
              comments: postData.comments || [],
              isCommentsAllowed: typeof postData.isCommentsAllowed === 'boolean' ? postData.isCommentsAllowed : undefined,
              reactions: {
                likes: postData.reactions?.likes || []
              },
              viewCount: postData.reactions?.totalViews || 0,
              commentCount: postData.comments?.length || 0,
              user: {
                username: postData.user?.username || "",
                subscribers: postData.user?.subscribers || [],
                _id: postData.user?._id || postData.user || "",
                firstName: postData.user?.firstName || "",
                lastName: postData.user?.lastName || "",
                profilePicture: postData.user?.profilePicture || ""
              }
            };
            
            setTimeout(() => {
              setSelectedItem(photoItem);
              devLog('GENERAL', 'PhotoViewerModal: Successfully loaded photo data');
            }, 100);
          } else {
            devLog('GENERAL', 'PhotoViewerModal: Post not found');
            onClose();
          }
        } catch (error) {
          devLog('GENERAL', 'PhotoViewerModal: Error fetching post data:', error);
          onClose();
        } finally {
          setIsLoadingDeepLink(false);
        }
      };
      
      fetchPostData();
    }
  }, [params.photoId, visible]);

  const hasMultiplePhotos = mediaItems.length > 1;

  // Auto-show comments if requested via params
  useEffect(() => {
    if (visible && params.showComments === 'true') {
      setTimeout(() => {
        if (setActiveSheet) {
          setActiveSheet('comments');
        }
      }, 500);
    }
  }, [params.showComments, visible]);

  // Pause background autoplay when modal opens
  useEffect(() => {
    devLog('GENERAL', '🎥 PhotoViewerModal autoplay effect - visible:', visible, 'pauseFn exists:', !!pauseBackgroundAutoplay, 'resumeFn exists:', !!resumeBackgroundAutoplay);
    
    if (visible) {
      devLog('GENERAL', '🎥 PhotoViewerModal opened - pausing background autoplay');
      pauseBackgroundAutoplay?.();
    } else {
      devLog('GENERAL', '🎥 PhotoViewerModal closed - resuming background autoplay');
      resumeBackgroundAutoplay?.();
    }

    return () => {
      resumeBackgroundAutoplay?.();
    };
  }, [visible]);

  // Handle Android hardware back button
  useEffect(() => {
    if (!visible) return;
    
    const backAction = () => {
      devLog('GENERAL', 'PhotoViewerModal: Hardware back button pressed');
      
      // Check if any bottom sheet is open first
      if (activeSheet) {
        devLog('GENERAL', 'PhotoViewerModal: Closing bottom sheet first');
        setActiveSheet(null);
        return true;
      }
      
      // If user profile sheet is open, close it first
      if (userProfileUserId) {
        devLog('GENERAL', 'PhotoViewerModal: Closing user profile sheet first');
        handleUserProfileClose();
        return true;
      }
      
      // Otherwise, close the PhotoViewerModal
      devLog('GENERAL', 'PhotoViewerModal: Closing PhotoViewerModal');
      onClose();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      devLog('GENERAL', 'PhotoViewerModal: Removing back handler');
      clearTimer();
      backHandler.remove();
    };
  }, [visible, activeSheet, userProfileUserId, clearTimer, onClose]);

  // Profile sheet handlers
  const handleUserProfileOpen = useCallback((userId: string) => {
    setUserProfileUserId(userId);
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  const handleUserProfileClose = useCallback(() => {
    setUserProfileUserId(undefined);
  }, []);

  // Handle description expansion
  const toggleDescriptionExpansion = useCallback(() => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
    resetHideControlsTimer(); // Reset timer when interacting with description
  }, [isDescriptionExpanded, resetHideControlsTimer]);

  // Handle hashtag press
  const handleHashtagPress = useCallback((hashtag: string) => {
    router.push(`/(tabs)/explore?search=${encodeURIComponent(hashtag)}`);
    resetHideControlsTimer(); // Reset timer when navigating
  }, [resetHideControlsTimer]);


  // Process mentions from backend format to frontend format
  const processedMentions = useMemo(() => {
    if (!selectedItem?.mentions || selectedItem.mentions.length === 0) return [];
    
    const { mentions: parsedMentions } = parseMentionsFromBackend(
      selectedItem.description || "",
      selectedItem.mentions
    );
    
    return parsedMentions;
  }, [selectedItem?.mentions, selectedItem?.description]);

  // Enhanced text truncation detection
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  
  // More accurate truncation check - accounts for mentions, line breaks, and screen width
  const isLongText = useMemo(() => {
    if (!selectedItem?.description) return false;
    
    const text = selectedItem.description;
    const hasLineBreaks = text.includes('\n');
    const estimatedCharsPerLine = Math.floor(SCREEN_WIDTH / 10); // More accurate estimate based on screen width
    const maxCharsFor3Lines = estimatedCharsPerLine * 3;
    
    // Check multiple criteria for text that might be truncated
    return text.length > maxCharsFor3Lines || 
           hasLineBreaks || 
           (text.length > 120 && (processedMentions.length > 0 || text.includes('#'))) ||
           isTextTruncated;
  }, [selectedItem?.description, processedMentions.length, isTextTruncated]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: animationValues.translateY.value },
      { scale: animationValues.scale.value },
    ],
    opacity: animationValues.opacity.value,
  }));

  const scrollAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animationValues.scrollX.value }],
  }));

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animationValues.controlsOpacity.value,
  }));

  // Use the same background opacity for modal transparency
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animationValues.backgroundOpacity.value,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    // Make background fade out with the modal
    const alpha = animationValues.backgroundOpacity.value;
    return {
      backgroundColor: `rgba(0, 0, 0, ${alpha})`,
    };
  });

  // Show skeleton loader if no photo data is available or loading deep link
  if (!visible) return null;
  
  if (!selectedItem || isLoadingDeepLink || mediaItems.length === 0) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <PhotoViewerSkeleton />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
        <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" hidden={false} />
        
        {/* Black background overlay */}
        <Animated.View style={[styles.overlay, backgroundAnimatedStyle]} />

        {/* User Details Header - Overlay */}
        <Animated.View style={[styles.userDetailsHeader, controlsAnimatedStyle, { paddingTop: 16 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.userInfoContainer}>
            <View style={styles.userDetailsRow}>
              <TouchableOpacity onPress={() => handleUserProfileOpen(selectedItem?.user?._id || '')}>
                <Avatar
                  imageSource={selectedItem?.user?.profilePicture}
                  size={40}
                  uri
                  ringColor="white"
                  ringThickness={2}
                  showRing={true}
                />
              </TouchableOpacity>
              
              <View style={styles.userTextInfo}>
                <Typography color="white" weight="600" size={14}>
                  {selectedItem?.user?.firstName} {selectedItem?.user?.lastName}
                </Typography>
                <Typography color="rgba(255,255,255,0.8)" size={12}>
                  {displaySubscriberCount} {displaySubscriberCount === 1 ? 'subscriber' : 'subscribers'}
                </Typography>
              </View>
              
              {!displayIsSubscribed && (
                <SubscribeButton
                  userId={selectedItem?.user?._id || ''}
                  initialIsSubscribed={displayIsSubscribed}
                  subscriberCount={displaySubscriberCount}
                  onSubscribe={handleSubscriptionPress}
                  onUnsubscribe={handleSubscriptionPress}
                  isLoading={isSubscribing}
                  variant="icon-only"
                  containerStyle={styles.iconSubscribeContainer}
                />
              )}
            </View>
          </View>
        </Animated.View>

        {/* Gesture-enabled media container */}
        <GestureDetector gesture={combinedGesture}>
          <Animated.View style={[styles.mediaContainer, containerAnimatedStyle]}>
            <Animated.View style={[styles.mediaScrollContainer, scrollAnimatedStyle]}>
              {mediaItems.map((item, index) => (
                <EnhancedPhoto
                  key={index}
                  uri={item.uri}
                  index={index}
                  currentIndex={currentIndex}
                  onMediaPress={handleMediaPress}
                  isLoading={false}
                />
              ))}
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        {/* Animated pagination dots for multiple photos */}
        {hasMultiplePhotos && (
          <Animated.View style={[styles.paginationContainer, controlsAnimatedStyle]}>
            <AnimatedPaginationDots
              totalPhotos={mediaItems.length}
              activeIndex={currentIndex}
            />
          </Animated.View>
        )}

        {/* Bottom Details Section */}
        <Animated.View style={[styles.bottomDetailsSection, controlsAnimatedStyle, { paddingBottom: insets.bottom + 20 }]}>
          {/* Photo Description */}
          {selectedItem?.description && (
            <View style={styles.descriptionContainer}>
              <ScrollView
                style={[
                  styles.descriptionScrollView,
                  !isDescriptionExpanded && { maxHeight: 'auto' } // Remove scroll when collapsed
                ]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.descriptionContentContainer}
                scrollEnabled={isDescriptionExpanded} // Only allow scrolling when expanded
              >
                <MentionText
                  text={selectedItem.description || ""}
                  mentions={processedMentions}
                  weight="400"
                  size={14}
                  color="white"
                  style={styles.descriptionText}
                  numberOfLines={isDescriptionExpanded ? undefined : 3}
                  onUserProfilePress={handleUserProfileOpen}
                  onHashtagPress={handleHashtagPress}
                  onTextLayout={(isTruncated) => setIsTextTruncated(isTruncated)}
                />
                
                {/* More/Less Button */}
                {(isLongText || isDescriptionExpanded) && (
                  <TouchableOpacity 
                    onPress={toggleDescriptionExpansion}
                    style={styles.moreButton}
                    activeOpacity={0.7}
                  >
                    <Typography 
                      color="rgba(255,255,255,0.8)" 
                      size={14} 
                      weight="600"
                      style={{ textDecorationLine: 'underline' }}
                    >
                      {isDescriptionExpanded ? 'less' : 'more'}
                    </Typography>
                  </TouchableOpacity>
                )}                
              </ScrollView>
            </View>
          )}

          {/* Interactions Bar */}
          <View style={styles.interactionsBar}>
            <GlobalInteractionBar
              postId={selectedItem?._id || ''}
              likeCount={likeCount}
              commentCount={commentCount}
              playsCount={displayPlaysCount}
              textColor="white"
              onCommentPress={() => setActiveSheet('comments')}
              onSharePress={() => setActiveSheet('share')}
              onPlayPress={() => {}}
              galleryRefetch={async () => {}}
              isCommentsAllowed={selectedItem?.isCommentsAllowed}
              isPhotoPost={true}
            />
          </View>
        </Animated.View>

        {/* Bottom Sheets */}
        {selectedItem && (
          <VideoBottomSheets
            activeSheet={activeSheet}
            onClose={() => setActiveSheet(null)}
            postId={selectedItem._id}
            playsCount={displayPlaysCount}
            videoData={{
              _id: selectedItem._id,
              thumbnail: selectedItem.thumbnail,
              images: selectedItem.images,
              duration: selectedItem.duration,
              description: selectedItem.description,
              user: {
                _id: selectedItem.user._id,
                username: selectedItem.user.username,
                firstName: selectedItem.user.firstName,
                lastName: selectedItem.user.lastName,
                profilePicture: selectedItem.user.profilePicture,
              }
            }}
          />
        )}

        {/* User Profile Bottom Sheet */}
        <UserProfileBottomSheet
          isVisible={!!userProfileUserId}
          onClose={handleUserProfileClose}
          userId={userProfileUserId}
        />
        </GestureHandlerRootView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  userDetailsHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 2,
  },
  closeButton: {
    marginRight: 12,
  },
  userInfoContainer: {
    flex: 1,
  },
  userDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userTextInfo: {
    flex: 1,
  },
  iconSubscribeContainer: {
    marginVertical: 0,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  mediaScrollContainer: {
    flexDirection: 'row',
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH * 100, // Large width for horizontal scrolling
  },
  photoSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoTouchable: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bottomDetailsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: 16,
    maxHeight: SCREEN_HEIGHT * 0.5, // Maximum 50% of screen height
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flex: 1,
  },
  descriptionScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.35, // Leave space for interactions bar
  },
  descriptionContentContainer: {
    paddingBottom: 8,
  },
  descriptionText: {
    lineHeight: 22,
  },
  moreButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
  },
  interactionsBar: {
    paddingHorizontal: 16,
    flexShrink: 0, // Prevent shrinking
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
});

export default PhotoViewerModal;