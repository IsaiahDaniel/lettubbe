import { useRouter } from "expo-router";
import useAuth from "../auth/useAuth";
import { useCustomTheme } from "../useCustomTheme";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SheetType } from "@/components/shared/video";
import {
  PLAY_DEBOUNCE_TIME,
  PLAY_LOG_MILESTONE,
  SYNC_DEBOUNCE_TIME,
} from "@/constants/screen-constants/feed/videos/videos.constants";
import { useVideoPlay } from "../feeds/useVideoPlay";
import { formatTimePost } from "@/helpers/utils/util";
import { Colors } from "@/constants";
import { useInteractionStore } from "../interactions/useInteractionStore";
import { useGetUserIdState } from "@/store/UsersStore";

const useVideoCard = (
  video: any,
  galleryRefetch: any,
  propIsCurrentUserVideo: any,
  userInfo: any,
  skipInteractionSync: any,
  disableAvatarPress: any,
  onPress: any,
  onAvatarPress: any
) => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUserId } = useGetUserIdState();

  // Batch interaction store operations
  const { syncLikedPosts, syncBookmarkedPosts, syncPlaysCount } =
    useInteractionStore();

  // Consolidated state object to reduce state updates
  const [state, setState] = useState({
    activeSheet: null as SheetType | null,
    duration: null as number | null,
    showUserProfile: false,
    showEditSheet: false,
    showReportSheet: false,
    showNotInterestedSheet: false,
    selectedUserId: null as string | null,
  });

  // Single ref object for all tracking
  const tracking = useRef({
    hasInitializedSync: false,
    lastSyncTime: 0,
    lastPlayTime: 0,
  });

  // Optimized video play tracking
  const handlePlayTracked = useCallback(
    (newCount: number) => {
      if (newCount % PLAY_LOG_MILESTONE === 0) {
        console.log(`Play milestone for video ${video._id}: ${newCount}`);
      }
    },
    [video._id]
  );

  const { playsCount, trackPlay, trackAutoplayProgress, startAutoplayTracking, stopAutoplayTracking } = useVideoPlay({
    postId: video._id,
    initialPlaysCount: video.reactions?.totalViews || 0,
    onPlayTracked: handlePlayTracked,
    isAutoplay: false, // Disable autoplay tracking
    autoplayThreshold: 0.3, // 30% threshold (inactive)
  });

  // Optimized video press with debounc
  const handleVideoPress = useCallback(() => {
    const now = Date.now();
    if (now - tracking.current.lastPlayTime > PLAY_DEBOUNCE_TIME) {
      trackPlay();
      tracking.current.lastPlayTime = now;
    }
    onPress?.();
  }, [trackPlay, onPress]);

  // Memoized derived values - single computation
  const derivedData = useMemo(() => {
    const isCurrentUser =
      propIsCurrentUserVideo !== undefined
        ? propIsCurrentUserVideo
        : video?.user?._id === userDetails?._id;

    const displayUser = {
      firstName: userInfo?.firstName || video?.user?.firstName || "",
      lastName: userInfo?.lastName || video?.user?.lastName || "",
      profilePicture:
        userInfo?.profilePicture || video?.user?.profilePicture || "",
      username: userInfo?.username || video?.user?.username || "",
      subscription: userInfo?.subscription || video?.user?.subscription || undefined,
    };

    const videoData = {
      likeCount: video?.reactions?.likes?.length || 0,
      commentCount: video?.commentCount || 0,
      formattedTime: formatTimePost(video?.createdAt),
      textColor: Colors[theme].textBold,
      secondaryTextColor: Colors[theme].text,
      cardBackground: Colors[theme].cardBackground,
    };

    return { isCurrentUser, displayUser, videoData };
  }, [
    propIsCurrentUserVideo,
    video?.user?._id,
    video?.reactions?.likes?.length,
    video?.commentCount,
    video?.createdAt,
    userDetails?._id,
    userInfo,
    theme,
  ]);

  // Batch sync operations with better error handling and change detection
  useEffect(() => {
    if (
      skipInteractionSync ||
      !video ||
      !userDetails?._id ||
      tracking.current.hasInitializedSync
    ) {
      return;
    }

    const now = Date.now();
    if (now - tracking.current.lastSyncTime < SYNC_DEBOUNCE_TIME) {
      return;
    }

    tracking.current.hasInitializedSync = true;
    tracking.current.lastSyncTime = now;

    // Batch all sync operations - these now have internal change detection
    console.log(`🔄 [VIDEO_CARD] Syncing interactions for video ${video._id}`);
    
    try {
      if (video?.reactions?.likes) {
        syncLikedPosts([video]);
      }
      if (video?.isBookmarked !== undefined) {
        syncBookmarkedPosts([video]);
      }
      syncPlaysCount([video]);
    } catch (error) {
      console.error(`Sync errors for video ${video._id}:`, error);
      tracking.current.hasInitializedSync = false;
    }
  }, [video._id, userDetails?._id, skipInteractionSync]);

  // Optimized state setters using functional updates
  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Memoized menu handlers
  const menuHandlers = useMemo(
    () => ({
      handleEditPress: () => updateState({ showEditSheet: true }),
      handleReportPress: () => updateState({ showReportSheet: true }),
      handleNotInterestedPress: () =>
        updateState({ showNotInterestedSheet: true }),
      handleSaveToPlaylistPress: (videoId: string) => {
        router.push({
          pathname: "/(profile)/SaveToPlaylist",
          params: { videoId },
        });
      },
    }),
    [router, updateState]
  );

  // Query invalidation handlers
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["userFeeds"],
      exact: false,
    });
  }, [queryClient]);

  const handleEditSuccess = useCallback(() => {
    invalidateQueries();
    galleryRefetch?.();
  }, [invalidateQueries, galleryRefetch]);

  const handleReportSuccess = useCallback(() => {
    invalidateQueries();
  }, [invalidateQueries]);

  const handleNotInterestedSuccess = useCallback(() => {
    invalidateQueries();
    galleryRefetch?.();
  }, [invalidateQueries, galleryRefetch]);

  // Optimized duration handler with early exit
  const handleDurationChange = useCallback(
    (newDuration: number) => {
      if (state.duration === null && newDuration > 0) {
        updateState({ duration: newDuration });
      }
    },
    [state.duration, updateState]
  );

  // Avatar press handlers
  const handleAvatarPress = useCallback(() => {
    if (disableAvatarPress) {
      return;
    }

    if (onAvatarPress) {
      onAvatarPress();
    } else if (derivedData.isCurrentUser) {
      router.push("/(tabs)/profile");
    } else {
      updateState({
        showUserProfile: true,
        selectedUserId: video?.user?._id || null,
      });
      setUserId(video?.user?._id);
    }
  }, [
    disableAvatarPress,
    derivedData.isCurrentUser,
    router,
    onAvatarPress,
    video?.user?._id,
    updateState,
    setUserId,
  ]);

  const handleCommentAvatarPress = useCallback(
    (userId: string) => {
      if (disableAvatarPress) return;

      if (userId === userDetails?._id) {
        router.push("/(tabs)/profile");
      } else {
        updateState({
          selectedUserId: userId,
          showUserProfile: true,
        });
      }
    },
    [disableAvatarPress, router, userDetails?._id, updateState]
  );

  // Sheet handlers - batch state updates
  const sheetHandlers = useMemo(
    () => ({
      openComments: () => updateState({ activeSheet: "comments" }),
      openPlays: () => updateState({ activeSheet: "plays" }),
      openShare: () => updateState({ activeSheet: "share" }),
      closeSheet: () => updateState({ activeSheet: null }),
      closeEditSheet: () => updateState({ showEditSheet: false }),
      closeReportSheet: () => updateState({ showReportSheet: false }),
      closeNotInterestedSheet: () =>
        updateState({ showNotInterestedSheet: false }),
      closeUserProfile: () => {
        updateState({ showUserProfile: false });
        // Delayed cleanup to allow animation
        setTimeout(() => updateState({ selectedUserId: null }), 300);
      },
    }),
    [updateState]
  );

  return {
    theme,
    userDetails,
    router,
    queryClient,
    state,
    sheetHandlers,
    derivedData,
    tracking,
    playsCount,
    menuHandlers,
    handleCommentAvatarPress,
    handleVideoPress,
    handleEditSuccess,
    handleNotInterestedSuccess,
    handleDurationChange,
    setState,
    trackPlay,
    updateState,
    handleReportSuccess,
    handleAvatarPress,
    // Autoplay tracking functions
    trackAutoplayProgress,
    startAutoplayTracking,
    stopAutoplayTracking,
  };
};

export default useVideoCard;
