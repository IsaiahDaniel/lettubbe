import { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { trackPostScrollView, trackMultipleScrollViews } from "@/services/feed.service";

interface ScrollTracker {
  [postId: string]: number; // timestamp of last scroll view
}

interface UsePostScrollViewOptions {
  sessionDuration?: number; // in milliseconds, default 5 minutes
  cleanupInterval?: number; // how often to cleanup old entries, default 24 hours
  debounceDelay?: number; // debounce delay for scroll tracking, default 1 second
  maxRetries?: number; // maximum retry attempts, default 3
  baseRetryDelay?: number; // base delay for exponential backoff, default 1 second
}

export const usePostScrollView = ({
  sessionDuration = 5 * 60 * 1000, // 15 minutes
  cleanupInterval = 24 * 60 * 60 * 1000, // 24 hours
  debounceDelay = 1000, // 1 second debounce
  maxRetries = 3, // maximum retry attempts
  baseRetryDelay = 1000, // 1 second base delay
}: UsePostScrollViewOptions = {}) => {
  const [scrollTracker, setScrollTracker] = useState<ScrollTracker>({});
  const lastCleanupRef = useRef(0);
  const pendingTracksRef = useRef<Set<string>>(new Set());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Retry with exponential backoff (only for single posts, multiple posts handle their own retries)
  const retryWithBackoff = useCallback(async (
    postId: string, 
    attempt: number = 0
  ): Promise<any> => {
    try {
      // console.log(`Tracking scroll view for post ${postId} (attempt ${attempt + 1})...`);
      const response = await trackPostScrollView(postId);
      // console.log("Track scroll view response:", response);
      retryCountRef.current = 0; // Reset retry count on success
      return response;
    } catch (error: any) {
      const isNetworkError = !error.response || error.code === 'NETWORK_ERROR' || error.code === 'ENOTFOUND';
      const isServerError = error.response?.status >= 500;
      const shouldRetry = (isNetworkError || isServerError) && attempt < maxRetries;
      
      if (shouldRetry) {
        const delay = baseRetryDelay * Math.pow(2, attempt); // Exponential backoff
        // console.log(`Retrying scroll tracking in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(postId, attempt + 1);
      } else {
        // console.error(`Failed to track scroll view after ${attempt + 1} attempts:`, error);
        throw error;
      }
    }
  }, [maxRetries, baseRetryDelay]);

  const trackScrollViewMutation = useMutation({
    mutationFn: async (postIds: string | string[]) => {
      // Handle multiple posts with staggered calls, single posts with retry logic
      if (Array.isArray(postIds)) {
        return trackMultipleScrollViews(postIds);
      } else {
        return retryWithBackoff(postIds);
      }
    },
    // onSuccess: (_, postIds) => {
    //   if (Array.isArray(postIds)) {
    //     // console.log(`Multiple scroll views tracked for ${postIds.length} posts`);
    //   } else {
    //     // console.log(`Post scroll view tracked for ${postIds}`);
    //   }
    // },
    // onError: (error, postIds) => {
    //   if (Array.isArray(postIds)) {
    //     console.error(`Error tracking multiple scroll views for ${postIds.length} posts:`, error);
    //   } else {
    //     console.error(`Error tracking scroll view for ${postIds}:`, error);
    //   }
    // },
    // Add retry configuration at the mutation level as well
    retry: false, // We handle retries manually
  });

  // Check if we can track scroll view for this post (5-minute session logic)
  const canTrackScrollView = useCallback((postId: string): boolean => {
    const lastViewTime = scrollTracker[postId];
    if (!lastViewTime) {
      return true; // First time viewing this post
    }
    
    const timeSinceLastView = Date.now() - lastViewTime;
    return timeSinceLastView >= sessionDuration;
  }, [scrollTracker, sessionDuration]);

  // Clean up old entries to prevent memory bloat
  const cleanupOldEntries = useCallback(() => {
    const now = Date.now();
    
    // Only cleanup if it's been more than an hour since last cleanup
    if (now - lastCleanupRef.current < 60 * 60 * 1000) {
      return;
    }

    setScrollTracker(prev => {
      const cleaned: ScrollTracker = {};
      let removedCount = 0;
      
      Object.entries(prev).forEach(([postId, timestamp]) => {
        // Remove entries older than cleanupInterval
        if (now - timestamp < cleanupInterval) {
          cleaned[postId] = timestamp;
        } else {
          removedCount++;
        }
      });
      
      // if (removedCount > 0) {
      //   console.log(`Cleaned up ${removedCount} old scroll view entries`);
      // }
      
      return cleaned;
    });

    lastCleanupRef.current = now;
  }, [cleanupInterval]);

  // Process pending tracks with batching (internal function)
  const processPendingTracks = useCallback(() => {
    const postsToTrack = Array.from(pendingTracksRef.current);
    pendingTracksRef.current.clear();

    if (postsToTrack.length === 0) return;

    // Process in background to avoid main thread blocking
    setTimeout(() => {
      // Run cleanup only once per batch
      cleanupOldEntries();
      
      // Filter posts that can be tracked and extract actual video IDs
      const validPostsToTrack: string[] = [];
      const trackingTimestamp = Date.now();

      postsToTrack.forEach(postId => {
        // Check if we can track this post (5-minute session window)
        if (!canTrackScrollView(postId)) {
          const lastViewTime = scrollTracker[postId];
          const timeRemaining = sessionDuration - (trackingTimestamp - lastViewTime);
          const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
          // console.log(`Scroll view for ${postId} blocked - ${minutesRemaining} minutes remaining in session`);
          return;
        }

        // Extract actual video ID from prefixed React key
        const actualVideoId = postId.startsWith('pinned-') || postId.startsWith('regular-') 
          ? postId.replace(/^(pinned-|regular-)/, '') 
          : postId;
        
        validPostsToTrack.push(actualVideoId);
      });

      if (validPostsToTrack.length === 0) return;

      // Update tracker with current timestamp for all valid posts BEFORE making API call
      setScrollTracker(prev => {
        const updated = { ...prev };
        postsToTrack.forEach(postId => {
          if (validPostsToTrack.includes(postId.replace(/^(pinned-|regular-)/, ''))) {
            updated[postId] = trackingTimestamp;
          }
        });
        return updated;
      });

      // Handle API calls based on number of posts
      if (validPostsToTrack.length === 1) {
        // Single post - use individual endpoint with retry logic
        trackScrollViewMutation.mutate(validPostsToTrack[0]);
      } else {
        // Multiple posts - use staggered individual calls
        trackScrollViewMutation.mutate(validPostsToTrack);
      }
    }, 0); // Move to next tick to avoid blocking scroll
  }, [
    canTrackScrollView,
    scrollTracker,
    sessionDuration,
    trackScrollViewMutation,
    cleanupOldEntries,
  ]);

  // Debounced track scroll view function
  const trackScrollView = useCallback((postId: string) => {
    // Add to pending tracks immediately (non-blocking)
    pendingTracksRef.current.add(postId);
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new debounced timeout
    debounceTimeoutRef.current = setTimeout(() => {
      processPendingTracks();
      debounceTimeoutRef.current = null;
    }, debounceDelay);
  }, [processPendingTracks, debounceDelay]);

  // Get session info for a post (for debugging)
  const getSessionInfo = useCallback((postId: string) => {
    const lastViewTime = scrollTracker[postId];
    if (!lastViewTime) {
      return { hasBeenViewed: false, canTrack: true };
    }

    const timeSinceLastView = Date.now() - lastViewTime;
    const canTrack = timeSinceLastView >= sessionDuration;
    const timeUntilNextTrack = canTrack ? 0 : sessionDuration - timeSinceLastView;

    return {
      hasBeenViewed: true,
      lastViewTime,
      timeSinceLastView,
      canTrack,
      timeUntilNextTrack,
      minutesUntilNextTrack: Math.ceil(timeUntilNextTrack / (60 * 1000)),
    };
  }, [scrollTracker, sessionDuration]);

  // Manual cleanup function
  const clearAllSessions = useCallback(() => {
    setScrollTracker({});
    pendingTracksRef.current.clear();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    // console.log('All scroll view sessions cleared');
  }, []);

  return {
    trackScrollView,
    isTracking: trackScrollViewMutation.isPending,
    getSessionInfo,
    clearAllSessions,
    // Expose some stats for debugging
    trackedPostsCount: Object.keys(scrollTracker).length,
    pendingTracksCount: pendingTracksRef.current.size,
  };
};