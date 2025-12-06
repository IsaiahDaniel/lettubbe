import { useCallback, useRef, useState, useMemo } from 'react';
import { ViewToken } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { usePostScrollView } from './usePostScrollView';

// Static viewability config - defined outside component to prevent FlatList warnings
const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 50, // 50% threshold = start/stop at 50% visible
  minimumViewTime: 100, // Small delay to prevent rapid switching during fast scrolls
  waitForInteraction: false,
};

interface AutoplayState {
  currentPlayingId: string | null;
  preloadedIds: Set<string>;
}

export const useVideoAutoplay = () => {
  const isFocused = useIsFocused();
  const [autoplayState, setAutoplayState] = useState<AutoplayState>({
    currentPlayingId: null,
    preloadedIds: new Set(),
  });
  
  // Initialize scroll view tracking
  const { trackScrollView, isTracking: isTrackingScrollView } = usePostScrollView();
  
  const viewabilityTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastViewableItemsRef = useRef<ViewToken[]>([]);

  // optimized for IMMEDIATE playback
  const VISIBILITY_THRESHOLD = 0.15; // 15% of video must be visible
  const MINIMUM_VIEW_TIME = 0; // INSTANT response - no delays
  const MAX_CONCURRENT_PRELOADS = 1; // Keep focused on current video
  const PRELOAD_BUFFER = 1; // Minimal preloading
  const MEMORY_CLEANUP_DISTANCE = 3; // Clean up videos more than 3 positions away

  const clearViewabilityTimeout = useCallback((videoId: string) => {
    const timeout = viewabilityTimeoutRef.current.get(videoId);
    if (timeout) {
      clearTimeout(timeout);
      viewabilityTimeoutRef.current.delete(videoId);
    }
  }, []);

  const shouldAutoplay = useCallback((videoId: string, isVisible: boolean): boolean => {
    // console.log('🎥 AUTOPLAY: shouldAutoplay check:', {
    //   videoId,
    //   isVisible,
    //   currentPlayingId: autoplayState.currentPlayingId,
    //   result: isVisible
    // });
    
    // Always allow autoplay when visible
    return isVisible;
  }, []); // Removed dependency to prevent cascading re-renders

  // Memory optimization: Clean up distant videos
  const cleanupDistantVideos = useCallback((currentVisibleItems: ViewToken[]) => {
    if (currentVisibleItems.length === 0) return;

    const visibleIndices = currentVisibleItems.map(item => item.index || 0);
    const minVisible = Math.min(...visibleIndices);
    const maxVisible = Math.max(...visibleIndices);

    // Clear timeouts for videos that are too far away
    viewabilityTimeoutRef.current.forEach((timeout, videoId) => {
      // Find this video's index from last known viewable items
      const videoIndex = lastViewableItemsRef.current.find(item => item.key === videoId)?.index;
      
      if (videoIndex !== undefined && videoIndex !== null) {
        const distanceFromVisible = Math.min(
          Math.abs(videoIndex - minVisible),
          Math.abs(videoIndex - maxVisible)
        );
        
        // Clean up if too far away and not currently playing
        if (distanceFromVisible > MEMORY_CLEANUP_DISTANCE && autoplayState.currentPlayingId !== videoId) {
          // console.log('🎥 AUTOPLAY: Cleaning up distant video:', videoId, 'at index:', videoIndex);
          clearViewabilityTimeout(videoId);
        }
      }
    });
  }, [autoplayState.currentPlayingId, clearViewabilityTimeout]);

  // Use ref to track preload state without triggering re-renders
  const preloadedIdsRef = useRef<Set<string>>(new Set());
  
  const updatePreloadList = useCallback((visibleItems: ViewToken[]) => {
    const newPreloadIds = new Set<string>();
    
    visibleItems.forEach(item => {
      if (item.key && newPreloadIds.size < MAX_CONCURRENT_PRELOADS) {
        newPreloadIds.add(item.key);
      }
    });

    // Update ref without triggering re-render
    preloadedIdsRef.current = newPreloadIds;
    
    // Only update state if significantly different to reduce re-renders
    if (newPreloadIds.size !== autoplayState.preloadedIds.size) {
      setAutoplayState(prev => ({
        ...prev,
        preloadedIds: newPreloadIds,
      }));
    }
  }, [autoplayState.preloadedIds.size]); // Only depend on size, not contents

  const forceStopAllVideos = useCallback(() => {
    // console.log('🎥 AUTOPLAY: 🛑 FORCE STOPPING ALL VIDEOS IMMEDIATELY');
    // Clear all timeouts
    viewabilityTimeoutRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    viewabilityTimeoutRef.current.clear();
    
    // Immediately clear playing state
    setAutoplayState(prev => ({
      ...prev,
      currentPlayingId: null,
    }));
  }, []);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // IMMEDIATE VIEWPORT PROCESSING - bypass all video operations
    // console.log('🎥 AUTOPLAY: ===== IMMEDIATE VIEWPORT PROCESSING =====');
    // console.log('🎥 AUTOPLAY: Visible items count:', viewableItems.length);
    viewableItems.forEach(item => {
      const post = item.item as any;
      // console.log('🎥 AUTOPLAY: Item visible:', {
      //   id: post?._id,
      //   index: item.index,
      //   hasVideo: !!post?.videoUrl,
      //   isViewable: item.isViewable
      // });
    });
    
    // PHASE 1: SCROLL VIEW TRACKING for ALL posts (videos + photos)
    const allVisiblePosts = viewableItems.filter(item => item.isViewable && item.key);
    
    // Track scroll views for all visible posts
    allVisiblePosts.forEach(item => {
      if (item.key) {
        trackScrollView(item.key);
      }
    });
    
    // PHASE 2: AUTOPLAY LOGIC for videos only
    const videoOnlyItems = viewableItems.filter(viewableItem => {
      const post = viewableItem.item as any;
      // A post is a video if it has a videoUrl, regardless of images array
      // Images array can contain thumbnails even for videos
      const hasVideo = !!post?.videoUrl;
      
      // Debug logging for pinned posts
      // if (post?.isPinned) {
      //   console.log('🎥 PINNED POST AUTOPLAY CHECK:', {
      //     postId: post?._id,
      //     hasVideo,
      //     videoUrl: post?.videoUrl,
      //     hasImages: post?.images?.length > 0,
      //     isPinned: post?.isPinned
      //   });
      // }
      
      return hasVideo;
    });

    const visibleVideoItems = videoOnlyItems.filter(item => item.isViewable);
    let newTargetVideoId: string | null = null;
    
    if (visibleVideoItems.length > 0) {
      const sortedVisibleItems = visibleVideoItems.sort((a, b) => (a.index || 0) - (b.index || 0));
      newTargetVideoId = sortedVisibleItems[0].key;
    }

    // Debounced state update to prevent excessive re-renders
    const shouldUpdateState = newTargetVideoId !== autoplayState.currentPlayingId && isFocused;
    
    if (shouldUpdateState) {
      // console.log('🎥 AUTOPLAY: ⚡ INSTANT viewport-driven update:', {
      //   from: autoplayState.currentPlayingId,
      //   to: newTargetVideoId,
      //   trigger: 'VIEWPORT_CHANGE',
      //   isFocused
      // });
      
      // Debounce state updates to prevent rapid fire re-renders
      setTimeout(() => {
        setAutoplayState(prev => {
          // Double-check condition to prevent stale updates
          if (prev.currentPlayingId !== newTargetVideoId) {
            return {
              ...prev,
              currentPlayingId: newTargetVideoId,
            };
          }
          return prev;
        });
      }, 50); // Small delay to batch rapid viewport changes
    } else if (!isFocused) {
      // console.log('🎥 AUTOPLAY: 🚫 Screen not focused - blocking autoplay:', {
      //   newTargetVideoId,
      //   isFocused
      // });
    } else {
      // console.log('🎥 AUTOPLAY: 🔄 No state change needed:', {
      //   newTargetVideoId,
      //   currentPlayingId: autoplayState.currentPlayingId,
      //   same: newTargetVideoId === autoplayState.currentPlayingId,
      //   isFocused
      // });
    }

    // PHASE 2: ASYNC detailed processing - defer heavy operations
    setTimeout(() => {
      // console.log('🎥 AUTOPLAY: Detailed processing (async):', {
      //   timestamp: new Date().toLocaleTimeString(),
      //   totalVisible: viewableItems.length,
      //   currentPlaying: newTargetVideoId,
      //   visibleVideos: visibleItems.length
      // });

      // Store current viewable items for comparison
      lastViewableItemsRef.current = viewableItems;

      // Update preload list (async)
      updatePreloadList(viewableItems);

      // Clear timeouts for videos that are no longer visible
      viewabilityTimeoutRef.current.forEach((timeout, videoId) => {
        const isStillVisible = videoOnlyItems.some(item => 
          item.key === videoId && item.isViewable
        );
        if (!isStillVisible) {
          clearViewabilityTimeout(videoId);
        }
      });

      // Perform memory cleanup for distant videos (async)
      cleanupDistantVideos(viewableItems);
    }, 0); // Defer all heavy operations to next tick
  }, [autoplayState.currentPlayingId, clearViewabilityTimeout, updatePreloadList, cleanupDistantVideos, forceStopAllVideos, isFocused, trackScrollView]); // Removed shouldAutoplay from deps to prevent cascades

  const isVideoPlaying = useCallback((videoId: string): boolean => {
    return autoplayState.currentPlayingId === videoId;
  }, [autoplayState.currentPlayingId]);

  const isVideoPreloaded = useCallback((videoId: string): boolean => {
    // Use ref for immediate check without dependency on state
    return preloadedIdsRef.current.has(videoId) || autoplayState.preloadedIds.has(videoId);
  }, [autoplayState.preloadedIds]);

  const forceStopVideo = useCallback((videoId: string) => {
    clearViewabilityTimeout(videoId);
    if (autoplayState.currentPlayingId === videoId) {
      setAutoplayState(prev => ({
        ...prev,
        currentPlayingId: null,
      }));
    }
  }, [autoplayState.currentPlayingId, clearViewabilityTimeout]);

  const cleanup = useCallback(() => {
    // Clear all timeouts
    viewabilityTimeoutRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    viewabilityTimeoutRef.current.clear();
    
    // Reset state
    setAutoplayState({
      currentPlayingId: null,
      preloadedIds: new Set(),
    });
  }, []);

  return {
    handleViewableItemsChanged,
    viewabilityConfig: VIEWABILITY_CONFIG,
    isVideoPlaying,
    isVideoPreloaded,
    forceStopVideo,
    cleanup,
    currentPlayingId: autoplayState.currentPlayingId,
    isAutoplayEnabled: true,
    // Scroll view tracking functions
    isTrackingScrollView,
  };
};