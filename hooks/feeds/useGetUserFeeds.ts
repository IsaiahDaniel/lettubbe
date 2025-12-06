import { getFeeds } from "@/services/feed.service";
import { useGetVideoItemStore } from "@/store/feedStore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { ensureArray } from "@/helpers/utils/util";
import usePushNotifications from "../notifications/usePushNotifications";
import { useInteractionStore } from "@/hooks/interactions/useInteractionStore";
import useAuth from "@/hooks/auth/useAuth";
import { useAuthContext } from "@/contexts/AuthProvider";
import { feedCacheService, CachedPost } from "@/services/simple-feed-cache.service";
import { imageDimensionsCache } from "@/services/image-dimensions-cache.service";
import { devLog } from "@/config/dev";

const useGetUserFeeds = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [isUsingCache, setIsUsingCache] = useState(true);
  const [cacheLoaded, setCacheLoaded] = useState(true);
  const { setSelectedItem } = useGetVideoItemStore();
  const { userDetails } = useAuth();
  const { cachedPosts } = useAuthContext(); // Get cached posts from AuthProvider
  const {
    syncLikedPosts,
    syncBookmarkedPosts,
    syncPlaysCount,
    currentUserId
  } = useInteractionStore();

  // Refs for optimization
  const lastSyncedFeedsLength = useRef(0);
  const lastEndReachedTime = useRef(0);
  const isSyncing = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedFresh = useRef(false);
  const hasLoadedCache = useRef(false);

  // Sync interactions when user becomes available and we have cached posts
  useEffect(() => {
    if (currentUserId && cachedPosts.length > 0) {
      devLog('CACHE', 'Syncing cached interactions from AuthProvider');
      feedCacheService.getCachedInteractions().then(cachedInteractions => {
        if (cachedInteractions.likes.length > 0 || cachedInteractions.bookmarks.length > 0) {
          devLog('CACHE', 'Syncing cached interactions after user load');
          syncLikedPosts(cachedPosts);
          syncBookmarkedPosts(cachedPosts);
          syncPlaysCount(cachedPosts);
        }
      });

      // Preload dimensions into memory cache for immediate access
      cachedPosts.forEach(post => {
        if (post.thumbnailDimensions && post.thumbnail) {
          imageDimensionsCache.cacheDimensions(
            post.thumbnail,
            post.thumbnailDimensions.width,
            post.thumbnailDimensions.height
          );
        }
      });
    }
  }, [currentUserId, cachedPosts.length]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ["userFeeds", selectedCategory],
    queryFn: async ({ pageParam = 1 }) => {
      devLog('API', `Fetching fresh feeds - page ${pageParam}`, 'API_REQUESTS');
      const result = await getFeeds({ pageParam });

      // Cache the first page of fresh data
      if (pageParam === 1 && result?.data && currentUserId) {
        hasFetchedFresh.current = true;

        // Update cache with fresh data
        await feedCacheService.cacheFeed(result.data, {
          likes: Array.from(syncLikedPosts.length ? [] : []), // Will be synced below
          bookmarks: Array.from(syncBookmarkedPosts.length ? [] : []),
          playsCount: {},
        });

        // Mark that fresh data has been fetched
        hasFetchedFresh.current = true;
      }

      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.data || !Array.isArray(lastPage.data) || lastPage.data.length === 0) {
        return undefined;
      }

      const currentPage = Array.isArray(allPages) ? allPages.length : 0;
      const hasMore = lastPage.hasNextPage === true && lastPage.data.length > 0;

      return hasMore ? currentPage + 1 : undefined;
    },
    // cache configuration from QueryProvider
    enabled: !!currentUserId, // Only fetch when user is available
  });

  // Handle transition from cached to fresh data when query completes
  useEffect(() => {
    if (hasFetchedFresh.current && !isPending && isUsingCache && data?.pages && data.pages.length > 0) {
      setTimeout(() => {
        setIsUsingCache(false);
        devLog('CACHE', 'Smoothly transitioned from cached to fresh data');
      }, 100);
    }
  }, [isPending, isUsingCache, data?.pages]);

  // Smart feeds processing - use cached posts if available, fresh data otherwise
  const feeds = useMemo(() => {
    // If we have fresh data, use it
    if (data?.pages && Array.isArray(data.pages) && !isUsingCache) {
      const allFeeds = data.pages.reduce((acc, page) => {
        const pageData = ensureArray(page?.data || page);
        return [...acc, ...pageData];
      }, []);
      return Array.isArray(allFeeds) ? allFeeds : [];
    }

    // If we have cached posts, always return them immediately
    if (cachedPosts.length > 0) {
      devLog('CACHE', `Using ${cachedPosts.length} cached posts for display`);
      console.log('🔥 [FEEDS_HOOK] Returning cached posts:', cachedPosts.length);
      return cachedPosts;
    }

    // Default to empty array
    console.log('🔥 [FEEDS_HOOK] Returning empty array - no cached posts');
    return [];
  }, [data?.pages, isUsingCache, cachedPosts]);

  // User ID is now managed globally in _layout.tsx, no local initialization needed

  // Storing sync functions in refs to prevent effect re-runs
  const syncFunctionsRef = useRef({
    syncLikedPosts,
    syncBookmarkedPosts,
    syncPlaysCount
  });

  // Update refs when functions change
  useEffect(() => {
    syncFunctionsRef.current = {
      syncLikedPosts,
      syncBookmarkedPosts,
      syncPlaysCount
    };
  }, [syncLikedPosts, syncBookmarkedPosts, syncPlaysCount]);

  // Memoize sync operations to prevent infinite loops
  const performSync = useCallback(async (feedsToSync: any[]) => {
    // Double-check if sync is already in progress or component is unmounting
    if (isSyncing.current || !syncFunctionsRef.current) return;
    
    // Ensure feedsToSync is always an array
    const safeFeeds = ensureArray(feedsToSync);
    if (safeFeeds.length === 0) return;
    
    isSyncing.current = true;
    try {
      // Batch all sync operations using current refs
      const { syncLikedPosts: currentSyncLiked, syncBookmarkedPosts: currentSyncBookmarked, syncPlaysCount: currentSyncPlays } = syncFunctionsRef.current;
      
      // Additional safety check - ensure functions exist
      if (currentSyncLiked && currentSyncBookmarked && currentSyncPlays) {
        await Promise.all([
          currentSyncLiked(safeFeeds),
          currentSyncBookmarked(safeFeeds),
          currentSyncPlays(safeFeeds)
        ]);
        
        lastSyncedFeedsLength.current = safeFeeds.length;
      }
    } catch (error) {
      console.error("Error syncing interactions:", error);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  // Optimized sync with debouncing and batching
  useEffect(() => {
    if (!currentUserId || feeds.length === 0) {
      return;
    }

    const feedsLengthChanged = feeds.length !== lastSyncedFeedsLength.current;
    const significantChange = Math.abs(feeds.length - lastSyncedFeedsLength.current) >= 3;
    
    if (feedsLengthChanged && significantChange) {
      // Clear existing timeout to prevent multiple concurrent syncs
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }

      // Debounce sync operations
      syncTimeoutRef.current = setTimeout(() => {
        performSync(feeds);
        syncTimeoutRef.current = null; // Clear ref after execution
      }, 500); // 500ms debounce
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [feeds.length, currentUserId]);

  // Optimized end reached handler with debouncing
  const handleEndReached = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastEndReachedTime.current;
    
    // Debounce end reached calls (minimum 1 second between calls)
    if (timeSinceLastCall < 1000) {
      return;
    }
    
    if (hasNextPage && !isFetchingNextPage) {
      lastEndReachedTime.current = now;
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Optimized refetch with loading state
  const refetchFeeds = useCallback(async () => {
    if (refreshing) return; // Prevent concurrent refetches
    
    try {
      const result = await refetch();
      return result;
    } catch (error) {
      console.error("Error refetching feeds:", error);
      throw error;
    }
  }, [refetch, refreshing]);

  // Memoized delete success handler
  const handleDeleteSuccess = useCallback(() => {
    refetchFeeds();
  }, [refetchFeeds]);

  // refresh handler with cache update
  const onRefresh = useCallback(async () => {
    devLog('CACHE', 'Pull to refresh started');
    if (refreshing) {
      devLog('CACHE', 'Already refreshing, skipping');
      return;
    }

    setRefreshing(true);

    try {
      // Force fresh data fetch
      hasFetchedFresh.current = false;
      setIsUsingCache(false);

      const result = await refetch();
      devLog('CACHE', 'Pull to refresh completed successfully');
    } catch (error) {
      devLog('CACHE', 'Error during pull to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      // Reset sync state
      isSyncing.current = false;
      hasLoadedCache.current = false;
    };
  }, []);


  return {
    feeds,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending: cachedPosts.length === 0 ? isPending : false, // Show loading only if no cached posts available
    selectedCategory,
    setSelectedCategory,
    setShowFilter,
    showFilter,
    setSelectedItem,
    handleEndReached,
    refetch: refetchFeeds,
    handleDeleteSuccess,
    refreshing,
    setRefreshing,
    onRefresh,
    isError,
    error,
    isUsingCache,
  };
};

export default useGetUserFeeds;