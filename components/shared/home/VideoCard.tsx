import React, {
  memo,
  useState,
  useMemo,
  useEffect,
} from "react";
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from "react-native";
import { VideoCardThumbnail } from "../video/VideoCardThumbnail";
import { VideoCardMetaInfo } from "../video/VideoCardMetaInfo";
import { VideoCardCommentBox } from "../video/VideoCardCommentBox";
import { VideoCardBottomSheets } from "../video/VideoCardBottomSheets";
import UserProfile from "@/components/ui/Modals/UserProfile";
import NotInterestedBottomSheet from "./NotInterested";
import AppMenu from "@/components/ui/AppMenu";
import useVideoCardMenu from "@/hooks/feeds/useVideoCardMenu";
import CustomBottomSheet from "@/components/ui/CustomBottomSheet";
import EditVideo from "@/components/shared/video/EditVideo";
import ReportVideo from "@/components/shared/home/ReportVideo";
import { GlobalInteractionBar } from "@/components/shared/interactions/GlobalInteractionBar";
import useGetComments from "@/hooks/feeds/useGetComments";
import { VideoCardProps } from "@/helpers/types/feed/video.types";
import { DeletingState, MenuDots } from "@/constants/screen-constants/feed/videos/video.constants";
import useVideoCard from "@/hooks/videoplayer/useVideoCard";
import { arePropsEqual } from "@/helpers/utils/screen-functions/feeds/videos";
import UserProfileBottomSheet from "@/components/ui/Modals/UserProfileBottomSheet";
import { router } from "expo-router";
import { useGetVideoItemStore } from "@/store/feedStore";
import { Colors, Icons } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Typography from "@/components/ui/Typography/Typography";
import { useImageDimensions } from "@/hooks/shared/useImageDimensions";
import { imageDimensionsCache } from "@/services/image-dimensions-cache.service";


const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPress,
  onAvatarPress,
  shouldLoadMetadata = false,
  onDeleteSuccess,
  isCurrentUserVideo: propIsCurrentUserVideo,
  userInfo,
  disableAvatarPress = false,
  galleryRefetch,
  skipInteractionSync = false,
  topComment,
  isAutoPlaying = false,
}) => {
  const { setSelectedItem } = useGetVideoItemStore();
  const [stableUserId, setStableUserId] = useState<string | null>(null);
  const { theme } = useCustomTheme();

  // Determine if this is a photo post and get the appropriate image URL
  const isPhotoPost = useMemo(() =>
    video?.images && video.images.length > 0,
    [video?.images]
  );

  const imageUrl = useMemo(() => {
    return isPhotoPost ? (video?.images?.[0] || video?.thumbnail) : video?.thumbnail;
  }, [isPhotoPost, video?.images, video?.thumbnail]);

  // Check for cached dimensions from the post data first, then memory cache
  const syncCachedDimensions = useMemo(() => {
    // First priority: dimensions stored with the cached post
    if (video?.thumbnailDimensions) {
      return {
        width: video.thumbnailDimensions.width,
        height: video.thumbnailDimensions.height
      };
    }

    // Second priority: memory cache
    if (!imageUrl) return null;
    const syncDimensions = imageDimensionsCache.getCachedDimensionsSync(imageUrl);
    return syncDimensions ? { width: syncDimensions.width, height: syncDimensions.height } : null;
  }, [video?.thumbnailDimensions, imageUrl]);

  // Use cached dimensions hook for async loading
  const { dimensions: asyncCachedDimensions, isLoading: isDimensionsLoading } = useImageDimensions(imageUrl);

  // Fallback state for dimensions if cache miss
  const [fallbackDimensions, setFallbackDimensions] = useState<{ width: number; height: number } | null>(null);

  // Use sync cached dimensions first, then async cached, then fallback
  const videoDimensions = syncCachedDimensions || asyncCachedDimensions || fallbackDimensions;

  // Render immediately if we have cached dimensions, otherwise wait for fallback dimensions
  const shouldRenderCard = videoDimensions !== null;

  // Simple skeleton animation
  const skeletonOpacity = useState(new Animated.Value(0.3))[0];
  
  useEffect(() => {
    const skeletonAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (!shouldRenderCard) {
      skeletonAnimation.start();
    } else {
      skeletonAnimation.stop();
    }
    
    return () => skeletonAnimation.stop();
  }, [shouldRenderCard, skeletonOpacity]);

  //
  if (!video?.user) {
    console.warn('VideoCard: video.user is null/undefined', {
      videoId: video?._id,
      hasVideo: !!video,
      videoKeys: video ? Object.keys(video) : 'no video',
      userValue: video?.user
    });
  }

  // Handle fallback image load only if no cached dimensions are available
  const handleImageLoad = (event: any) => {
    if (!syncCachedDimensions && !asyncCachedDimensions && event?.nativeEvent?.source) {
      const { width, height } = event.nativeEvent.source;
      setFallbackDimensions({ width, height });
    }
  };

  // Reset fallback dimensions when content changes
  useEffect(() => {
    setFallbackDimensions(null);
  }, [video?._id, video?.thumbnail, video?.images]);

  // Custom press handler for photos
  const handlePress = () => {
    if (isPhotoPost) {
      // Create media item for photo viewer
      const mediaItem = {
        _id: video._id,
        thumbnail: video.thumbnail,
        duration: video.duration?.toString() || "",
        description: video.description || "",
        videoUrl: video.videoUrl || "",
        photoUrl: video.images?.[0] || video.thumbnail || "",
        images: video.images || [],
        mediaType: 'photo' as const,
        createdAt: video.createdAt,
        comments: video.comments || [],
        reactions: {
          likes: video.reactions?.likes || []
        },
        viewCount: video.reactions?.totalViews || 0,
        commentCount: video.comments?.length || 0,
        user: video.user ? {
          username: video.user.username || "",
          subscribers: video.user.subscribers || [],
          _id: video.user._id || "",
          firstName: video.user.firstName || "",
          lastName: video.user.lastName || "",
          profilePicture: video.user.profilePicture || ""
        } : {
          username: "",
          subscribers: [],
          _id: "",
          firstName: "",
          lastName: "",
          profilePicture: ""
        },
        isCommentsAllowed: video.isCommentsAllowed
      };

      // Set the selected item in the store (this will trigger the modal)
      setSelectedItem(mediaItem);
    } else {
      onPress?.();
    }
  };
  
  const { state, playsCount, handleVideoPress, derivedData, handleDurationChange, handleAvatarPress, menuHandlers, sheetHandlers, handleCommentAvatarPress, handleEditSuccess, handleNotInterestedSuccess, handleReportSuccess, trackAutoplayProgress, startAutoplayTracking, stopAutoplayTracking  } = useVideoCard(video, galleryRefetch, propIsCurrentUserVideo, userInfo, skipInteractionSync, disableAvatarPress, handlePress, onAvatarPress);
  
  // Set stable userId when modal opens
  useEffect(() => {
    if (state.showUserProfile && state.selectedUserId && !stableUserId) {
      console.log('🎯 [STABLE_USER] Setting stable userId:', state.selectedUserId);
      setStableUserId(state.selectedUserId);
    }
  }, [state.showUserProfile, state.selectedUserId, stableUserId]);

  // Optimized comments fetch - only when actually needed
  const shouldFetchComments = state.activeSheet === 'comments' || topComment !== undefined;
  const { data: actualComments } = useGetComments(video._id, {
    enabled: shouldFetchComments,
  });

  // Menu configuration
  const { menuOptions, handleMenuSelect, isDeleting } = useVideoCardMenu({
    videoId: video._id,
    isCurrentUserVideo: derivedData.isCurrentUser,
    isPhotoPost: isPhotoPost,
    onDeleteSuccess,
    onEditPress: menuHandlers.handleEditPress,
    onReportPress: menuHandlers.handleReportPress,
    onNotInterestedPress: menuHandlers.handleNotInterestedPress,
    onSaveToPlaylistPress: menuHandlers.handleSaveToPlaylistPress,
  });


  // Show simple skeleton while dimensions are loading
  if (!shouldRenderCard) {
    const screenWidth = Dimensions.get('window').width;
    const thumbnailHeight = screenWidth * (9 / 16); // 16:9 aspect ratio

    return (
      <View style={{ marginBottom: 40 }}>
        {/* Skeleton thumbnail */}
        <Animated.View
          style={{
            width: '100%',
            height: thumbnailHeight,
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e0e0e0',
            opacity: skeletonOpacity,
          }}
        />

        {/* Skeleton author row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 10 }}>
          <Animated.View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e0e0e0',
              opacity: skeletonOpacity,
            }}
          />
          <Animated.View
            style={{
              width: 100,
              height: 12,
              borderRadius: 4,
              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e0e0e0',
              marginLeft: 10,
              opacity: skeletonOpacity,
            }}
          />
        </View>

        {/* Hidden preloader to get dimensions - only if no cached dimensions */}
        {!syncCachedDimensions && !asyncCachedDimensions && imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
            onLoad={handleImageLoad}
          />
        )}
      </View>
    );
  }

  // Return appropriate content based on state
  return isDeleting ? (
    <DeletingState />
  ) : (
    <View style={styles.videoContainer}>
      <View style={styles.thumbnailContainer}>
        {isPhotoPost ? (
          // For photos, don't wrap in TouchableOpacity to allow swiping
          <VideoCardThumbnail
            video={video}
            userInfo={derivedData.displayUser}
            duration={video?.duration}
            shouldLoadMetadata={shouldLoadMetadata}
            onDurationChange={handleDurationChange}
            onAvatarPress={handleAvatarPress}
            onPress={handleVideoPress}
            isAutoPlaying={isAutoPlaying}
            enablePreview={false} // Photos don't have previews
            videoDimensions={videoDimensions}
            onAutoplayProgressUpdate={trackAutoplayProgress}
            onAutoplayStart={startAutoplayTracking}
            onAutoplayStop={stopAutoplayTracking}
          />
        ) : (
          // For videos, wrap in TouchableOpacity for tap to play
          <TouchableOpacity onPress={handleVideoPress} activeOpacity={0.9}>
            <VideoCardThumbnail
              video={video}
              userInfo={derivedData.displayUser}
              duration={video?.duration}
              shouldLoadMetadata={shouldLoadMetadata}
              onDurationChange={handleDurationChange}
              onAvatarPress={handleAvatarPress}
              onPress={handleVideoPress}
              isAutoPlaying={isAutoPlaying}
              enablePreview={!isPhotoPost && !!video?.videoUrl} // Enable previews for videos only
              videoDimensions={videoDimensions}
              onAutoplayProgressUpdate={trackAutoplayProgress}
              onAutoplayStart={startAutoplayTracking}
              onAutoplayStop={stopAutoplayTracking}
              />
          </TouchableOpacity>
        )}

        {menuOptions.length > 0 && (
          <View style={styles.menuContainer}>
            <AppMenu
              width={200}
              trigger={() => <MenuDots />}
              options={menuOptions}
              selectedOption=""
              onSelect={handleMenuSelect}
            />
          </View>
        )}

        {/* Pinned indicator - positioned at bottom of thumbnail */}
        {video?.isPinned && (
          <View style={[styles.pinnedIndicator, {shadowColor: Colors[theme].text}]}>
            <Image source={Icons.pinned} style={styles.pinnedIcon} />
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <GlobalInteractionBar
          postId={video._id}
          likeCount={derivedData.videoData.likeCount}
          commentCount={derivedData.videoData.commentCount}
          playsCount={playsCount}
          textColor={derivedData.videoData.textColor}
          onCommentPress={sheetHandlers.openComments}
          onSharePress={sheetHandlers.openShare}
          onPlayPress={sheetHandlers.openPlays}
          galleryRefetch={galleryRefetch}
          isCommentsAllowed={video?.isCommentsAllowed}
          isPhotoPost={isPhotoPost}
        />

        <VideoCardMetaInfo
          description={video?.description}
          formattedTime={derivedData.videoData.formattedTime}
          mentions={video?.mentions}
          username={derivedData.displayUser.username}
          onUsernamePress={handleAvatarPress}
          postId={video._id} 
          likeCount={derivedData.videoData.likeCount} 
          onAvatarPress={handleCommentAvatarPress}
          userSubscription={derivedData.displayUser.subscription}
        />

        {/* {video?.isCommentsAllowed && derivedData.videoData.commentCount > 0 && (
          <VideoCardCommentBox
            commentCount={derivedData.videoData.commentCount}
            onPress={sheetHandlers.openComments}
            backgroundColor={derivedData.videoData.cardBackground}
            comments={actualComments}
            onAvatarPress={handleCommentAvatarPress}
          />
        )} */}
      </View>

      <VideoCardBottomSheets
        activeSheet={state.activeSheet}
        onClose={sheetHandlers.closeSheet}
        postId={video._id}
        textColor={derivedData.videoData.textColor}
        authorId={video?.user?._id || ""}
        isCommentsAllowed={video?.isCommentsAllowed}
        videoData={{
          _id: video._id,
          thumbnail: video.thumbnail,
          images: video.images, // For photo posts
          duration: video.duration,
          description: video.description || "",
          user: video.user && video.user._id ? {
            _id: video.user._id,
            username: video.user.username || "",
            firstName: video.user.firstName,
            lastName: video.user.lastName,
            profilePicture: video.user.profilePicture,
          } : null,
        }}
      />

      {!disableAvatarPress && (
        <UserProfileBottomSheet
          isVisible={state.showUserProfile}
          onClose={() => {
            setStableUserId(null);
            sheetHandlers.closeUserProfile();
          }}
          userId={stableUserId || undefined}
        />
      )}

      <CustomBottomSheet
        isVisible={state.showEditSheet}
        onClose={sheetHandlers.closeEditSheet}
        sheetheight={700}
      >
        <EditVideo
          video={{
            ...video,
            user: video.user === null ? undefined : video.user
          }}
          onClose={sheetHandlers.closeEditSheet}
          onSuccess={handleEditSuccess}
        />
      </CustomBottomSheet>

      <CustomBottomSheet
        isVisible={state.showReportSheet}
        onClose={sheetHandlers.closeReportSheet}
        sheetheight={600}
      >
        <ReportVideo
          videoId={video._id}
          onClose={sheetHandlers.closeReportSheet}
          onSuccess={handleReportSuccess}
        />
      </CustomBottomSheet>

      <CustomBottomSheet
        isVisible={state.showNotInterestedSheet}
        onClose={sheetHandlers.closeNotInterestedSheet}
        sheetheight={600}
      >
        <NotInterestedBottomSheet
          videoId={video._id}
          onClose={sheetHandlers.closeNotInterestedSheet}
          onSuccess={handleNotInterestedSuccess}
        />
      </CustomBottomSheet>

    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    marginBottom: 24,
  },
  thumbnailContainer: {
    position: "relative",
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  menuContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  deletingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },
  pinnedIndicator: {
    position: "absolute",
    bottom: -16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    zIndex: 100,
    elevation: 2,
    shadowRadius: 8,
  },
  pinnedIcon: {
    width: 64,
    height: 35,
  },
});


export default memo(VideoCard, arePropsEqual);