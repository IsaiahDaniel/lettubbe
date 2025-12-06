import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { trackVideoPlay } from "@/services/feed.service";
import { useInteractionStore } from "@/hooks/interactions/useInteractionStore";

interface UseVideoPlayOptions {
  postId: string;
  initialPlaysCount?: number;
  onPlayTracked?: (newCount: number) => void;
  debounceTime?: number;
  isAutoplay?: boolean; // Whether this is an autoplay video
  autoplayThreshold?: number; // Percentage threshold for autoplay tracking (default 0.3 = 30%)
}

export const useVideoPlay = ({
  postId,
  initialPlaysCount = 0,
  onPlayTracked,
  debounceTime = 2000,
  isAutoplay = false,
  autoplayThreshold = 0.3,
}: UseVideoPlayOptions) => {
  const { getPlaysCount, updatePostPlaysCount } = useInteractionStore();
  const lastPlayTimeRef = useRef(0);
  const currentPostIdRef = useRef(postId);
  const autoplayTrackedRef = useRef(false); // Track if autoplay threshold was reached
  const autoplayStartTimeRef = useRef(0); // When autoplay started

  const trackPlayMutation = useMutation({
    mutationFn: async (postId: string) => {
      console.log(`Tracking play for post ${postId}...`);
      const response = await trackVideoPlay(postId);
      console.log("Track play response:", response);
      
      // Update local store with new count
      const newCount = getPlaysCount(postId);
      updatePostPlaysCount(postId, newCount);
      
      return { response, newCount };
    },
    onSuccess: ({ newCount }) => {
      console.log(`Video play tracked for post ${postId}, new count: ${newCount}`);
      onPlayTracked?.(newCount);
    },
    onError: (error) => {
      console.error("Error tracking video play:", error);
    },
  });

  // Get the current plays count from the store (this is the source of truth)
  const playsCount = getPlaysCount(postId) || initialPlaysCount;

  // Reset tracking when postId changes
  useEffect(() => {
    if (currentPostIdRef.current !== postId) {
      lastPlayTimeRef.current = 0;
      currentPostIdRef.current = postId;
      autoplayTrackedRef.current = false; // Reset autoplay tracking
      autoplayStartTimeRef.current = 0;
      
      // Update store with initial count for new post if not already set
      const currentStoreCount = getPlaysCount(postId);
      if (currentStoreCount === 0 && initialPlaysCount > 0) {
        updatePostPlaysCount(postId, initialPlaysCount);
      }
    }
  }, [postId, initialPlaysCount, updatePostPlaysCount, getPlaysCount]);

  // Update store when initialPlaysCount changes (for fresh data from API)
  useEffect(() => {
    if (initialPlaysCount > 0) {
      const currentStoreCount = getPlaysCount(postId);
      // Always update with the server-provided count
      if (currentStoreCount !== initialPlaysCount) {
        console.log(`Updating plays count for ${postId}: ${currentStoreCount} -> ${initialPlaysCount}`);
        updatePostPlaysCount(postId, initialPlaysCount);
      }
    }
  }, [initialPlaysCount, postId, getPlaysCount, updatePostPlaysCount]);

  const trackPlay = useCallback(() => {
    const now = Date.now();

    // Debounce to prevent multiple calls within the debounce time
    if (now - lastPlayTimeRef.current < debounceTime) {
      console.log("Play tracking debounced");
      return;
    }

    // Prevent multiple simultaneous tracking requests
    if (trackPlayMutation.isPending) {
      console.log("Play tracking already in progress");
      return;
    }

    lastPlayTimeRef.current = now;
    trackPlayMutation.mutate(postId);
  }, [postId, debounceTime, trackPlayMutation]);

  // Reset tracking state manually (mainly resets the debounce timer)
  const resetTracking = useCallback(() => {
    lastPlayTimeRef.current = 0;
    console.log(`Play tracking reset for post ${postId}`);
  }, [postId]);

  // Update plays count from external source (server data)
  const updatePlaysCount = useCallback(
    (newCount: number) => {
      updatePostPlaysCount(postId, newCount);
      console.log(
        `Plays count updated from server for post ${postId}: ${newCount}`
      );
    },
    [postId, updatePostPlaysCount]
  );

  // Track autoplay progress - call this from video player with currentTime and duration
  const trackAutoplayProgress = useCallback((currentTime: number, duration: number) => {
    if (!isAutoplay || !duration || duration <= 0 || autoplayTrackedRef.current) {
      return;
    }

    const progressPercentage = currentTime / duration;
    
    // If we haven't started tracking yet, record the start time
    if (autoplayStartTimeRef.current === 0 && progressPercentage > 0.01) {
      autoplayStartTimeRef.current = Date.now();
      // console.log(`🎥 [AUTOPLAY_TRACK] Started tracking autoplay for post ${postId}`);
    }

    // Check if we've reached the threshold
    if (progressPercentage >= autoplayThreshold) {
      // console.log(`🎥 [AUTOPLAY_TRACK] Reached ${(autoplayThreshold * 100).toFixed(0)}% threshold for post ${postId}`);
      autoplayTrackedRef.current = true;
      
      // Track the play automatically
      trackPlay();
    }
  }, [isAutoplay, autoplayThreshold, postId, trackPlay]);

  // Start autoplay tracking - call this when video starts playing automatically
  const startAutoplayTracking = useCallback(() => {
    if (!isAutoplay) return;
    
    autoplayTrackedRef.current = false;
    autoplayStartTimeRef.current = Date.now();
    // console.log(`🎥 [AUTOPLAY_TRACK] Autoplay tracking started for post ${postId}`);
  }, [isAutoplay, postId]);

  // Stop autoplay tracking - call this when video stops or changes
  const stopAutoplayTracking = useCallback(() => {
    if (!isAutoplay) return;
    
    autoplayStartTimeRef.current = 0;
    // console.log(`🎥 [AUTOPLAY_TRACK] Autoplay tracking stopped for post ${postId}`);
  }, [isAutoplay, postId]);

  return {
    playsCount,
    isTracking: trackPlayMutation.isPending,
    trackPlay,
    resetTracking,
    updatePlaysCount,
    // Autoplay tracking functions
    trackAutoplayProgress,
    startAutoplayTracking,
    stopAutoplayTracking,
    isAutoplayTracked: autoplayTrackedRef.current,
  };
};