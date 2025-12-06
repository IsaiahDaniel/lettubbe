import React, {
  memo,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import {
  View,
  Image,
  TouchableOpacity,
  Animated,
  AppState,
} from "react-native";
import ScrollAwareFlatList from "@/components/ui/ScrollAwareFlatList";
import { Ionicons, Feather } from "@expo/vector-icons";
import Wrapper from "@/components/utilities/Wrapper2";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors, Icons, Images } from "@/constants";
import CustomBottomSheet from "@/components/ui/CustomBottomSheet";
import FilterPost from "@/components/shared/home/FilterPost";
import useGetUserFeeds from "@/hooks/feeds/useGetUserFeeds";
import useGetPinnedPosts from "@/hooks/feeds/useGetPinnedPosts";
import usePushNotifications from "@/hooks/notifications/usePushNotifications";
import useGetNotificationsCount from "@/hooks/notifications/useGetNotificationsCount";
import { Video } from "@/helpers/types/feed/types";
import useHomeScreenOptimization from "@/hooks/feeds/useHomeScreenOptimazation";
import { END_REACHED_THRESHOLD } from "@/constants/screen-constants/feed/feed/feed.constants";
import useHomeFeedConstants, { MemoizedNetworkError } from "@/hooks/feeds/useHomeFeedConstants";
import { useHomeTab } from "@/contexts/HomeTabContext";
import { useNavigationVisibility } from "@/contexts/NavigationVisibilityContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useVideoAutoplay } from "@/hooks/feeds/useVideoAutoplay";
import { useUpgradeAccountModal } from "@/hooks/profile/useUpgradeAccountModal";
import UpgradeAccountModal from "@/components/ui/Modals/UpgradeAccountModal";
import { useInteractionStore } from "@/hooks/interactions/useInteractionStore";
import useAuth from "@/hooks/auth/useAuth";


const HomeScreen = () => {
  // console.log('🏠 [HOMESCREEN] ===== COMPONENT RENDER START =====', new Date().toISOString());
  
  const { theme } = useCustomTheme();
  // console.log('🎨 [HOMESCREEN] Theme loaded:', theme);
  
  const { setScrollToTopAndRefresh, setPauseBackgroundAutoplay, setResumeBackgroundAutoplay } = useHomeTab();
  // console.log('🏠 [HOMESCREEN] HomeTab context functions retrieved');
  
  const { headerVisibilityValue } = useNavigationVisibility();
  // console.log('🔍 [HOMESCREEN] Navigation visibility context loaded');
  
  const insets = useSafeAreaInsets();
  // console.log('📱 [HOMESCREEN] Safe area insets:', insets);
  
  const queryClient = useQueryClient();
  // console.log('🔄 [HOMESCREEN] Query client initialized');

  // hooks
  // console.log('📊 [HOMESCREEN] Loading useGetUserFeeds...');
  const {
    feeds,
    isPending,
    selectedCategory,
    setSelectedCategory,
    setSelectedItem,
    setShowFilter,
    showFilter,
    handleEndReached,
    refetch,
    handleDeleteSuccess,
    refreshing,
    setRefreshing,
    onRefresh,
    isFetchingNextPage,
    hasNextPage,
    isError,
    error,
    isUsingCache,
  } = useGetUserFeeds();
  // console.log('📊 [HOMESCREEN] useGetUserFeeds loaded - feeds count:', feeds?.length || 0, 'isPending:', isPending, 'isError:', isError, 'isUsingCache:', isUsingCache);

  // Load pinned posts only after main feeds are available (either cached or fresh)
  const shouldLoadPinnedPosts = feeds.length > 0;

  // console.log('📌 [HOMESCREEN] Loading useGetPinnedPosts...');
  const {
    pinnedPosts,
    isPending: pinnedPostsPending,
    hasPinnedPosts,
    refetch: refetchPinnedPosts,
  } = useGetPinnedPosts(shouldLoadPinnedPosts);
  // console.log('📌 [HOMESCREEN] useGetPinnedPosts loaded - pinned count:', pinnedPosts?.length || 0, 'isPending:', pinnedPostsPending);

  // console.log('🔔 [HOMESCREEN] Loading push notifications...');
  const { expoPushToken } = usePushNotifications();
  // console.log('🔔 [HOMESCREEN] Push token loaded:', !!expoPushToken);
  
  // Load notifications count after main content is ready
  // console.log('🔔 [HOMESCREEN] Loading notifications count...');
  const { data: notificationsCount } = useGetNotificationsCount(shouldLoadPinnedPosts);
  // console.log('🔔 [HOMESCREEN] Notifications count loaded:', notificationsCount);
  
  // Upgrade modal hook
  // console.log('⬆️ [HOMESCREEN] Loading upgrade modal hook...');
  const { showModal: showUpgradeModal, triggerModalCheck, closeModal } = useUpgradeAccountModal();
  // console.log('⬆️ [HOMESCREEN] Upgrade modal hook loaded - showModal:', showUpgradeModal);

  // Get sync functions to sync pinned posts
  // console.log('🔄 [HOMESCREEN] Loading interaction store...');
  const { syncLikedPosts, syncBookmarkedPosts, syncPlaysCount, currentUserId } = useInteractionStore();
  // console.log('🔄 [HOMESCREEN] Interaction store loaded - currentUserId:', currentUserId);

  /**
   * Combine pinned posts with regular feeds
   * 
   * single data structure with pinned posts at the top,
   */
  // console.log('📋 [HOMESCREEN] Creating combinedFeeds - pinnedPosts:', pinnedPosts?.length || 0, 'feeds:', feeds?.length || 0);
  
  // Stabilized combinedFeeds with shallow comparison to prevent unnecessary recreation
  const combinedFeeds = useMemo(() => {
    // console.log('📋 [HOMESCREEN] useMemo: Checking if combinedFeeds needs recalculation...');

    // Always show feeds even if pinned posts haven't loaded yet
    const safePinnedPosts = Array.isArray(pinnedPosts) ? pinnedPosts : [];
    const safeFeeds = Array.isArray(feeds) ? feeds : [];

    // If we have no data at all, return empty array
    if (safePinnedPosts.length === 0 && safeFeeds.length === 0) {
      // console.log('📋 [HOMESCREEN] useMemo: No data available - returning empty array');
      return [];
    }

    // Only log when actually recalculating, not on every render
    // console.log('📋 [HOMESCREEN] useMemo: RECALCULATING - Processing', safePinnedPosts.length, 'pinned +', safeFeeds.length, 'regular feeds');

    const pinnedWithFlag = safePinnedPosts.map((post: Video) => ({
      ...post,
      isPinned: true,
    }));

    const combined = [...pinnedWithFlag, ...safeFeeds];
    // console.log('📋 [HOMESCREEN] useMemo: New combined feeds array created with', combined.length, 'items');
    return combined;
  }, [pinnedPosts, feeds]);
  
  // Stable reference to the combined feeds to reduce FlatList re-renders
  const stableCombinedFeedsRef = useRef(combinedFeeds);
  
  // Always update stable reference immediately when combinedFeeds changes for instant display
  useEffect(() => {
    // Always update the stable reference to ensure immediate display of cached posts
    stableCombinedFeedsRef.current = combinedFeeds;
    // console.log('📋 [HOMESCREEN] Updated stable reference with', combinedFeeds?.length || 0, 'items');
  }, [combinedFeeds]);

  // Sync pinned posts with interaction store
  useEffect(() => {
    // console.log('🔄 [HOMESCREEN] useEffect: Pinned posts sync triggered - currentUserId:', currentUserId, 'pinnedPosts.length:', pinnedPosts?.length || 0);
    
    if (!currentUserId || !pinnedPosts || pinnedPosts.length === 0) {
      // console.log('🔄 [HOMESCREEN] useEffect: Skipping sync - missing userId or no pinned posts');
      return;
    }

    // console.log('🔄 [HOMESCREEN] useEffect: SYNCING pinned posts separately:', pinnedPosts.length);
    
    // Add isPinned flag for sync recognition
    // console.log('🔄 [HOMESCREEN] useEffect: Creating pinnedWithFlag array...');
    const pinnedWithFlag = pinnedPosts.map((post: any) => {
      // console.log('🔄 [HOMESCREEN] useEffect: Mapping post for sync:', post._id);
      return {
        ...post,
        isPinned: true,
      };
    });

    // Sync pinned posts separately
    // console.log('🔄 [HOMESCREEN] useEffect: Starting sync operations...');
    // console.log('🔄 [HOMESCREEN] useEffect: 1/3 syncLikedPosts...');
    syncLikedPosts(pinnedWithFlag);
    // console.log('🔄 [HOMESCREEN] useEffect: 2/3 syncBookmarkedPosts...');
    syncBookmarkedPosts(pinnedWithFlag);
    // console.log('🔄 [HOMESCREEN] useEffect: 3/3 syncPlaysCount...');
    syncPlaysCount(pinnedWithFlag);
    // console.log('🔄 [HOMESCREEN] useEffect: All sync operations completed');
  }, [pinnedPosts, currentUserId]);

  // FlatList autoplay hook with scroll view tracking
  // console.log('🎥 [HOMESCREEN] Loading useVideoAutoplay...');
  const {
    handleViewableItemsChanged,
    viewabilityConfig,
    isVideoPlaying: flatListIsVideoPlaying,
    currentPlayingId: flatListCurrentPlayingId,
    cleanup: cleanupAutoplay,
    isTrackingScrollView,
  } = useVideoAutoplay();
  // console.log('🎥 [HOMESCREEN] useVideoAutoplay loaded - currentPlayingId:', flatListCurrentPlayingId, 'isTrackingScrollView:', isTrackingScrollView);

  // console.log('⚡ [HOMESCREEN] Loading useHomeScreenOptimization...');
  // Only show loading state if we have no cached posts and no fresh data yet
  const shouldShowLoading = feeds.length === 0 && isPending;

  const { hasNotifications, scrollRef, showError, flatListProps, showSkeletons, isLowMemory, handleFilterClose, showVideoFeed, handleMomentumScrollEnd, handleNotificationPress, handleScroll: originalHandleScroll, handleScrollBeginDrag, handleScrollEndDrag, handleVideoPress } = useHomeScreenOptimization(notificationsCount, isError, shouldShowLoading, setSelectedItem, setShowFilter, feeds.length);
  // console.log('⚡ [HOMESCREEN] useHomeScreenOptimization loaded - hasNotifications:', hasNotifications, 'showError:', showError, 'showSkeletons:', showSkeletons, 'isLowMemory:', isLowMemory, 'showVideoFeed:', showVideoFeed);

  // only handle UI scroll behavior
  const handleScroll = useCallback((event: any) => {
    // console.log('📜 [HOMESCREEN] handleScroll triggered - contentOffset.y:', event?.nativeEvent?.contentOffset?.y);
    originalHandleScroll(event);
  }, [originalHandleScroll]);

  // Stable refresh functions with refs to prevent dependency cascades
  const onRefreshRef = useRef(onRefresh);
  const refetchPinnedPostsRef = useRef(refetchPinnedPosts);
  
  // Update refs when functions change, but don't trigger re-renders
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);
  
  useEffect(() => {
    refetchPinnedPostsRef.current = refetchPinnedPosts;
  }, [refetchPinnedPosts]);

  // Refresh both regular feeds and pinned posts with stable reference
  const handleCombinedRefresh = useCallback(async () => {
    // console.log('🔄 [HOMESCREEN] handleCombinedRefresh: Starting combined refresh...');
    // console.log('🔄 [HOMESCREEN] handleCombinedRefresh: Running Promise.all for both feeds...');
    await Promise.all([
      onRefreshRef.current(),
      refetchPinnedPostsRef.current(),
    ]);
    // console.log('🔄 [HOMESCREEN] handleCombinedRefresh: Combined refresh completed');
  }, []); // No dependencies - using refs for stable reference

  const handleStreamingPress = () => {
    // console.log('📺 [HOMESCREEN] handleStreamingPress: Navigating to streaming...');
    router.push("/(streaming)");
  };
  
  // console.log('🎨 [HOMESCREEN] Loading useHomeFeedConstants...');
  const { styles, skeletonComponents, keyExtractor, renderVideoItem, renderFooter, refreshControl, uploadProgressCard  } = useHomeFeedConstants(handleVideoPress, handleDeleteSuccess, isFetchingNextPage, isLowMemory, handleCombinedRefresh, refreshing, flatListIsVideoPlaying);
  // console.log('🎨 [HOMESCREEN] useHomeFeedConstants loaded');
  

  // stable scroll-to-top function using refs
  const scrollToTopAndRefreshRef = useRef<(() => void) | null>(null);
  
  // Update the function ref when dependencies change
  useEffect(() => {
    // console.log('📜 [HOMESCREEN] useEffect: Setting up scrollToTopAndRefreshRef...');
    scrollToTopAndRefreshRef.current = () => {
      // console.log('📜 [HOMESCREEN] scrollToTopAndRefresh: Executing scroll to top and refresh...');
      // Scroll to top
      if (scrollRef.current) {
        // console.log('📜 [HOMESCREEN] scrollToTopAndRefresh: Scrolling to top...');
        scrollRef.current.scrollToOffset({ offset: 0, animated: true });
      }
      // Trigger refresh for both feeds and pinned posts
      // console.log('📜 [HOMESCREEN] scrollToTopAndRefresh: Triggering combined refresh...');
      handleCombinedRefresh();
    };
  }, [scrollRef, handleCombinedRefresh]);

  // Register scroll-to-top function once with stable reference
  useEffect(() => {
    // console.log('📜 [HOMESCREEN] useEffect: Registering stable scroll-to-top function...');
    const stableScrollToTopAndRefresh = () => {
      // console.log('📜 [HOMESCREEN] stableScrollToTopAndRefresh: Called from HomeTab context');
      scrollToTopAndRefreshRef.current?.();
    };

    setScrollToTopAndRefresh(stableScrollToTopAndRefresh);
    // console.log('📜 [HOMESCREEN] useEffect: Scroll-to-top function registered');
  }, [setScrollToTopAndRefresh]);

  // Register autoplay pause/resume functions for modal management
  useEffect(() => {
    // console.log('🎥 [HOMESCREEN] useEffect: Setting up autoplay pause/resume functions...');
    const pauseAutoplay = () => {
      // console.log('🎥 [HOMESCREEN] pauseAutoplay: Pausing autoplay for modal');
      cleanupAutoplay();
    };
    
    const resumeAutoplay = () => {
      // console.log('🎥 [HOMESCREEN] resumeAutoplay: Resuming autoplay after modal');
      // Autoplay will resume naturally through viewability detection
      // No explicit action needed - the system will detect visible videos
    };

    setPauseBackgroundAutoplay(pauseAutoplay);
    setResumeBackgroundAutoplay(resumeAutoplay);
    // console.log('🎥 [HOMESCREEN] useEffect: Autoplay pause/resume functions registered');
  }, [setPauseBackgroundAutoplay, setResumeBackgroundAutoplay, cleanupAutoplay]);

  // Stable reference to triggerModalCheck to prevent re-render loops
  const triggerModalCheckRef = useRef(triggerModalCheck);
  
  // Update ref when function changes, but don't trigger re-renders
  useEffect(() => {
    triggerModalCheckRef.current = triggerModalCheck;
  }, [triggerModalCheck]);

  // Focus effect throttling to prevent rapid re-execution
  const lastFocusTimeRef = useRef(0);
  const lastAutoInvalidationTimeRef = useRef(0);
  const FOCUS_THROTTLE_DELAY = 1000; // 1 second throttle
  const AUTO_INVALIDATION_THROTTLE_DELAY = 3000; // 3 second throttle for automatic focus-based invalidation only

  // Expose manual invalidation function for immediate post updates (no throttling)
  const handleManualInvalidation = useCallback(() => {
    // console.log('🔄 [HOMESCREEN] Manual invalidation triggered - bypassing throttle');
    queryClient.invalidateQueries({ queryKey: ['getNotificationsCount'] });
    queryClient.invalidateQueries({ queryKey: ['userFeeds'], exact: false, refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['pinnedPosts'] }); // Also invalidate pinned posts for new content
  }, [queryClient]);

  // Refresh notification count and feeds when returning to home screen
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTimeRef.current;
      const timeSinceLastAutoInvalidation = now - lastAutoInvalidationTimeRef.current;
      
      // Throttle focus effect to prevent rapid re-execution
      if (timeSinceLastFocus < FOCUS_THROTTLE_DELAY) {
        // console.log('🔍 [HOMESCREEN] useFocusEffect: Throttling focus effect - too soon since last execution');
        return;
      }
      
      lastFocusTimeRef.current = now;
      // console.log('🔍 [HOMESCREEN] useFocusEffect: Home screen gained focus');
      
      // Only throttle automatic invalidations from focus changes, not manual user actions
      if (timeSinceLastAutoInvalidation >= AUTO_INVALIDATION_THROTTLE_DELAY) {
        lastAutoInvalidationTimeRef.current = now;
        
        // Invalidate notification count to refresh the badge
        // console.log('🔍 [HOMESCREEN] useFocusEffect: Auto-invalidating notifications count query...');
        queryClient.invalidateQueries({ queryKey: ['getNotificationsCount'] });
        
        // Invalidate feeds to refresh interaction counts (likes, bookmarks, plays)
        // console.log('🔍 [HOMESCREEN] useFocusEffect: Auto-invalidating user feeds query...');
        queryClient.invalidateQueries({ queryKey: ['userFeeds'], exact: false, refetchType: 'all' });
      } else {
        console.log('🔍 [HOMESCREEN] useFocusEffect: Skipping auto-invalidation - too soon since last auto-invalidation');
        console.log('🔍 [HOMESCREEN] useFocusEffect: (Manual invalidation via user actions will still work immediately)');
      }
      
      // Trigger upgrade modal check when user visits home screen (but don\'t throttle this)
      // console.log('🔍 [HOMESCREEN] useFocusEffect: Triggering upgrade modal check...');
      triggerModalCheckRef.current();
      
      console.log('🔍 [HOMESCREEN] useFocusEffect: Focus effect completed');
    }, [queryClient]) // Removed triggerModalCheck dependency - using ref instead
  );

  // Cleanup autoplay on unmount
  useEffect(() => {
    // console.log('🎥 [HOMESCREEN] useEffect: Setting up component unmount cleanup...');
    return () => {
      // console.log('🎥 [HOMESCREEN] cleanup: Component unmounting - cleaning up autoplay');
      cleanupAutoplay();
    };
  }, [cleanupAutoplay]);

  // Trigger initial autoplay for first visible video with debouncing
  const initialAutoplayTriggeredRef = useRef(false);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const currentFeeds = stableCombinedFeedsRef.current;
    // console.log('🎥 [HOMESCREEN] useEffect: Initial autoplay check - combinedFeeds:', currentFeeds?.length || 0, 'isPending:', isPending, 'triggered:', initialAutoplayTriggeredRef.current);
    
    // Clear any existing timeout to prevent multiple triggers
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    
    if (currentFeeds && currentFeeds.length > 0 && !isPending && !initialAutoplayTriggeredRef.current) {
      // Mark as triggered to prevent multiple calls
      initialAutoplayTriggeredRef.current = true;
      // console.log('🎥 [HOMESCREEN] useEffect: Marked initial autoplay as triggered');
      
      // Debounced initial autoplay trigger
      autoplayTimeoutRef.current = setTimeout(() => {
        // console.log('🎥 [HOMESCREEN] useEffect: INITIAL AUTOPLAY - Triggering initial viewability check (one-time)');
        // Simulate first item being viewable
        if (currentFeeds[0]) {
          // console.log('🎥 [HOMESCREEN] useEffect: INITIAL AUTOPLAY - Simulating viewability for first item:', currentFeeds[0]._id);
          handleViewableItemsChanged({
            viewableItems: [{
              item: currentFeeds[0],
              key: currentFeeds[0]._id,
              index: 0,
              isViewable: true,
            }]
          });
        }
        autoplayTimeoutRef.current = null;
      }, 1000); // Increased delay to 1000ms for better stability
      
      return () => {
        // console.log('🎥 [HOMESCREEN] useEffect: Clearing initial autoplay timer');
        if (autoplayTimeoutRef.current) {
          clearTimeout(autoplayTimeoutRef.current);
          autoplayTimeoutRef.current = null;
        }
      };
    }
  }, [combinedFeeds, isPending]); // Keep combinedFeeds as dependency to trigger when data changes
  
  // Reset initial trigger flag when feeds change significantly
  useEffect(() => {
    const currentFeeds = stableCombinedFeedsRef.current;
    // console.log('🎥 [HOMESCREEN] useEffect: Reset trigger check - combinedFeeds:', currentFeeds?.length || 0);
    // Reset flag when feeds are refreshed or changed
    if (!currentFeeds || currentFeeds.length === 0) {
      // console.log('🎥 [HOMESCREEN] useEffect: Resetting initial autoplay trigger flag');
      initialAutoplayTriggeredRef.current = false;
    }
  }, [combinedFeeds]); // Keep combinedFeeds as dependency to detect when data changes

  // Stop videos when leaving home tab (navigation blur)
  useFocusEffect(
    useCallback(() => {
      // console.log('🔍 [HOMESCREEN] useFocusEffect: Tab gained focus - videos will auto-start based on visibility');
      
      // When tab loses focus, stop all videos immediately
      return () => {
        // console.log('🎥 [HOMESCREEN] useFocusEffect: Tab losing focus - stopping all videos');
        cleanupAutoplay();
      };
    }, [cleanupAutoplay])
  );
  
  // Also stop videos when navigating away from home screen entirely
  useEffect(() => {
    // console.log('🎥 [HOMESCREEN] useEffect: Setting up navigation cleanup...');
    return () => {
      // console.log('🎥 [HOMESCREEN] cleanup: Navigating away from home screen - stopping all videos');
      cleanupAutoplay();
    };
  }, [cleanupAutoplay]);

  // Pause autoplay when app goes to background
  useEffect(() => {
    // console.log('🎥 [HOMESCREEN] useEffect: Setting up app state change listener...');
    const handleAppStateChange = (nextAppState: string) => {
      // console.log('🎥 [HOMESCREEN] handleAppStateChange: App state changed to:', nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // console.log('🎥 [HOMESCREEN] handleAppStateChange: App backgrounded - pausing all autoplay');
        cleanupAutoplay();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    // console.log('🎥 [HOMESCREEN] useEffect: App state listener registered');

    return () => {
      // console.log('🎥 [HOMESCREEN] cleanup: Removing app state listener');
      subscription?.remove();
    };
  }, [cleanupAutoplay]);


  // Early return for error state
  if (showError) {
    // console.log('❌ [HOMESCREEN] Rendering error state - error:', error);
    return (
      <Wrapper>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <MemoizedNetworkError refetch={refetch} error={error} />
          </View>
        </View>
      </Wrapper>
    );
  }

  // console.log('🏠 [HOMESCREEN] ===== ABOUT TO RENDER MAIN UI =====');
  // console.log('🏠 [HOMESCREEN] Render state - showSkeletons:', showSkeletons, 'showVideoFeed:', showVideoFeed, 'combinedFeeds:', combinedFeeds?.length || 0);

  return (
    <Wrapper>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: Colors[theme].background,
              paddingTop: 10,
              paddingBottom: 10,
              paddingHorizontal: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              transform: [
                {
                  translateY: headerVisibilityValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-80, 0], // Move completely out of view
                  })
                }
              ],
              opacity: headerVisibilityValue,
            }
          ]}
        >
          <View style={styles.headerLeft}>
            <Image source={Icons.logoIcon} style={styles.logoIcon} />
            <Image
              source={Icons.logoText}
              style={styles.logoText}
              tintColor={Colors[theme].textBold}
            />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleStreamingPress} style={{paddingBottom: 4, paddingRight: 6}}>
              <Feather
                name="tv"
                size={24}
                color={Colors[theme].textBold}
              />
            </TouchableOpacity>
            {hasNotifications && <View style={styles.notificationDot} />}
            <TouchableOpacity onPress={handleNotificationPress}>
              <Ionicons
                name="notifications"
                size={24}
                color={Colors[theme].textBold}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Loading skeletons */}
        {showSkeletons && (
          <View style={{ flex: 1 }}>
            {/* {console.log('💀 [HOMESCREEN] Rendering skeleton components')} */}
            {skeletonComponents}
          </View>
        )}

        {/* Video Feed with enhanced scroll handling and memory management */}
        {showVideoFeed && (
          <>
            {console.log('📹 [HOMESCREEN] Rendering video feed - data length:', stableCombinedFeedsRef.current?.length || 0)}
            <ScrollAwareFlatList
              ref={scrollRef}
              data={stableCombinedFeedsRef.current} // Use stable reference to prevent unnecessary re-renders
              renderItem={renderVideoItem}
              keyExtractor={keyExtractor}
              onEndReached={handleEndReached}
              onEndReachedThreshold={END_REACHED_THRESHOLD}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={uploadProgressCard}
              ListFooterComponent={renderFooter}
              refreshControl={refreshControl}
              contentContainerStyle={{ paddingTop: 60 }}
              // Enhanced scroll event handlers
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              // FlatList viewability detection as backup
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              // memory-aware performance optimizations AFTER viewability props
              {...flatListProps}
            />
          </>
        )}

        {/* Filter Bottom Sheet */}
        <CustomBottomSheet
          title="Personalize Feed"
          isVisible={showFilter}
          onClose={handleFilterClose}
          sheetheight={400}
        >
          <FilterPost />
        </CustomBottomSheet>

        {/* Upgrade Account Modal */}
        <UpgradeAccountModal
          visible={showUpgradeModal}
          onClose={closeModal}
        />
      </View>
      {/* {console.log('🏠 [HOMESCREEN] ===== COMPONENT RENDER COMPLETE =====', new Date().toISOString())} */}
    </Wrapper>
  );
};

export default memo(HomeScreen, (prevProps, nextProps) => {
  console.log('🔄 [HOMESCREEN] memo: Checking if component should re-render...');
  // HomeScreen has no props, so it should only re-render on internal state changes
  const shouldSkipRender = JSON.stringify(prevProps) === JSON.stringify(nextProps);
  console.log('🔄 [HOMESCREEN] memo: Should skip render:', shouldSkipRender);
  return shouldSkipRender;
});