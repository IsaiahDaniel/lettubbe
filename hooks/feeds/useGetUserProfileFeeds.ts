import { getUserProfileFeeds } from "@/services/feed.service";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useInteractionStore } from "@/hooks/interactions/useInteractionStore";
import useAuth from "@/hooks/auth/useAuth";

const useGetUserProfileFeeds = (userId: string, options?: { enabled?: boolean }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { userDetails } = useAuth();
  const { 
    syncLikedPosts, 
    syncBookmarkedPosts, 
    syncPlaysCount 
  } = useInteractionStore();

  // Refs for optimization
  const lastSyncedFeedsLength = useRef(0);
  const lastEndReachedTime = useRef(0);
  const isSyncing = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    queryKey: ["userProfileFeeds", userId],
    queryFn: ({ pageParam = 1 }) => {
      // Only log every 5th page to reduce noise
      if (pageParam % 5 === 1) {
        console.log("Fetching user profile page:", pageParam, "for userId:", userId);
      }
      return getUserProfileFeeds({ userId, pageParam });
    },
    initialPageParam: 1,
    enabled: options?.enabled ?? !!userId,
    getNextPageParam: (lastPage, allPages) => {
      console.log('getNextPageParam - lastPage structure:', {
        hasData: !!lastPage?.data,
        dataLength: lastPage?.data?.length,
        hasNextPage: lastPage?.hasNextPage,
        nextPage: lastPage?.nextPage
      });
      
      // hasNextPage field from response
      if (lastPage?.hasNextPage && lastPage?.nextPage) {
        console.log('Has next page, returning:', lastPage.nextPage);
        return lastPage.nextPage;
      }
      
      console.log('No more pages available');
      return undefined;
    },
    //   optimization options  
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  // Optimized feeds processing - handle uploads endpoint data structure
  const feeds = useMemo(() => {
    if (!data?.pages) {
      console.log('No pages data available');
      return [];
    }
    
    // Handle the uploads endpoint structure: page.data is the array directly
    const allFeeds = data.pages.reduce((acc, page) => {
      console.log('Processing page:', page);
      const pageData = page?.data || [];
      console.log('Page data extracted:', pageData, 'Length:', pageData.length);
      return [...acc, ...pageData];
    }, []);
    
    // Only log significant changes
    const lengthChanged = allFeeds.length !== lastSyncedFeedsLength.current;
    if (lengthChanged && Math.abs(allFeeds.length - lastSyncedFeedsLength.current) >= 1) {
      console.log("Profile feeds count change:", lastSyncedFeedsLength.current, "->", allFeeds.length);
      console.log("Profile feeds data:", allFeeds.slice(0, 2)); // Log first 2 items
    }
    
    return allFeeds;
  }, [data?.pages]);

  // Note: User ID management moved to AuthProvider to prevent race conditions

  // Optimized sync with debouncing and batching 
  useEffect(() => {
    if (!userDetails?._id || feeds.length === 0 || isSyncing.current) {
      return;
    }

    const feedsLengthChanged = feeds.length !== lastSyncedFeedsLength.current;
    const significantChange = Math.abs(feeds.length - lastSyncedFeedsLength.current) >= 3;
    
    if (feedsLengthChanged && significantChange) {
      // Clear existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Debounce sync operations
      syncTimeoutRef.current = setTimeout(async () => {
        if (isSyncing.current) return;
        
        isSyncing.current = true;
        // console.log("Syncing interaction state for profile feeds", feeds.length, "feeds");
        
        try {
          // Batch all sync operations
          await Promise.all([
            syncLikedPosts(feeds),
            syncBookmarkedPosts(feeds),
            syncPlaysCount(feeds)
          ]);
          
          lastSyncedFeedsLength.current = feeds.length;
          // console.log("Profile feeds interaction sync completed successfully");
        } catch (error) {
          console.error("Error syncing profile feeds interactions:", error);
        } finally {
          isSyncing.current = false;
        }
      }, 500); // 500ms debounce
    }

    // Cleanup timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [feeds.length, userDetails?._id, syncLikedPosts, syncBookmarkedPosts, syncPlaysCount]);

  // Optimized end reached handler with debouncing 
  const handleEndReached = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastEndReachedTime.current;
    
    // Debounce end reached calls (minimum 1 second between calls)
    if (timeSinceLastCall < 1000) {
      return;
    }
    
    if (hasNextPage && !isFetchingNextPage) {
      console.log("Fetching next profile page - hasNext:", hasNextPage);
      lastEndReachedTime.current = now;
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Optimized refetch with loading state 
  const refetchFeeds = useCallback(async () => {
    if (refreshing) return; // Prevent concurrent refetches
    
    console.log("Refetching profile feeds...");
    try {
      const result = await refetch();
      console.log("Profile feeds refetch completed");
      return result;
    } catch (error) {
      console.error("Error refetching profile feeds:", error);
      throw error;
    }
  }, [refetch, refreshing]);

  // Memoized delete success handler 
  const handleDeleteSuccess = useCallback(() => {
    console.log("Profile video deleted, refreshing feed");
    refetchFeeds();
  }, [refetchFeeds]);

  // Optimized refresh handler 
  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    
    console.log("Starting profile feeds refresh...");
    setRefreshing(true);
    
    try {
      await refetch();
      console.log("Profile feeds refresh completed successfully");
    } catch (error) {
      console.error("Error refreshing profile feeds:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refreshing]);

  // Cleanup effect 
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      isSyncing.current = false;
    };
  }, []);

  // Log significant state changes 
  useEffect(() => {
    const feedsCount = feeds?.length || 0;
    if (feedsCount > 0 && feedsCount % 10 === 0) {
      console.log("UserProfile - Total feeds:", feedsCount);
      console.log("UserProfile - Has next page:", hasNextPage);
      console.log("UserProfile - Is fetching next page:", isFetchingNextPage);
    }
  }, [feeds?.length, hasNextPage, isFetchingNextPage]);

  return {
    feeds,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    handleEndReached,
    refetch: refetchFeeds,
    handleDeleteSuccess,
    refreshing, 
    setRefreshing,
    onRefresh,
    isError,
    error
  };
};

export default useGetUserProfileFeeds;