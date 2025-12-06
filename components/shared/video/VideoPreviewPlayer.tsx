import React, { memo, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioStore } from '@/store/audioStore';
import { devLog } from '@/config/dev';
import VideoProgressBar from './VideoProgressBar';
import VideoShimmerEffect from './VideoShimmerEffect';

interface VideoPreviewPlayerProps {
  videoUrl: string;
  shouldPlay: boolean;
  width: number;
  height: number;
  thumbnailUrl?: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  onPlaybackStart?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoPreviewPlayer = memo<VideoPreviewPlayerProps>(({
  videoUrl,
  shouldPlay,
  width,
  height,
  thumbnailUrl,
  onLoadStart,
  onLoadEnd,
  onError,
  onPlaybackStart,
  onTimeUpdate,
}) => {
  
  const { isGloballyMuted } = useAudioStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const mountedRef = useRef(true);
  const playbackStartedRef = useRef(false);
  // use single player reference from hook
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values for smooth transitions - start visible
  const videoOpacity = useSharedValue(1); // Start visible immediately
  const videoScale = useSharedValue(1); // Start at normal scale

  // Non-blocking pause helper to prevent UI freezing
  const performNonBlockingPause = useCallback((player: any, reason: string) => {
    // Clear any existing pause timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    
    // Perform pause in next tick to avoid blocking current execution
    pauseTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      
      try {
        // console.log(`🎥 VIDEO_PREVIEW: ⚡ Non-blocking pause (${reason})`);
        if (player && typeof player.pause === 'function') {
          player.pause();
        }
      } catch (error) {
        devLog('VIDEO_PREVIEW', `Non-blocking pause failed (${reason}):`, error);
      } finally {
        pauseTimeoutRef.current = null;
      }
    }, 0); // Execute in next tick
  }, []);

  // Early validation of video URL
  const isValidVideoUrl = useMemo(() => {
    if (!videoUrl || typeof videoUrl !== 'string') {
      devLog('VIDEO_PREVIEW', 'Invalid video URL:', videoUrl);
      return false;
    }
    
    // Basic URL validation
    try {
      new URL(videoUrl);
      return true;
    } catch {
      devLog('VIDEO_PREVIEW', 'Malformed video URL:', videoUrl);
      return false;
    }
  }, [videoUrl]);

  // Set error state immediately for invalid URLs
  useEffect(() => {
    if (!isValidVideoUrl) {
      setHasError(true);
      onError?.('Invalid video URL');
    }
  }, [isValidVideoUrl, onError]);

  // Reset state and animations when video URL changes
  useEffect(() => {
    setProgress(0);
    setBufferProgress(0);
    setDuration(0);
    setHasError(false);
    setIsLoading(true);
    
    // Reset flags
    playbackStartedRef.current = false;
    
    // Keep video visible during transitions
    videoOpacity.value = 1; // Keep visible
    videoScale.value = 1; // Keep normal scale
  }, [videoUrl]);

  // Create video player with optimizations for large video files
  const player = useVideoPlayer(isValidVideoUrl ? videoUrl : '', (player) => {
    try {
      if (!isValidVideoUrl) {
        devLog('VIDEO_PREVIEW', 'Skipping player initialization for invalid URL');
        return;
      }
      
      devLog('VIDEO_PREVIEW', 'Initializing preview player for:', videoUrl);
      
      // Configure for preview playback with optimizations
      player.loop = true; // Seamless looping
      player.muted = isGloballyMuted; // Respect global mute state
      
      // Set up duration tracking
      if (player.duration && player.duration > 0) {
        setDuration(player.duration);
      }
      
      // Optimize for preview - allow partial loading
      try {
        // Set buffer preferences for faster start
        if ('allowsExternalPlayback' in player) {
          player.allowsExternalPlayback = false; // Keep local for faster start
        }
        
        // Enable background loading if available
        if ('preload' in player) {
          player.preload = 'metadata'; // Only load metadata initially for faster start
        }
        
        // Set up progressive loading behavior
        try {
          // Attempt to set buffer preferences if available
          if (typeof (player as any).preferredForwardBufferDuration !== 'undefined') {
            (player as any).preferredForwardBufferDuration = 5; // 5 seconds ahead
          }
          if (typeof (player as any).playbackBufferFull !== 'undefined') {
            (player as any).playbackBufferFull = 10; // 10 seconds buffer
          }
        } catch (bufferError) {
          devLog('VIDEO_PREVIEW', 'Buffer configuration failed (non-critical):', bufferError);
        }
      } catch (optimizationError) {
        devLog('VIDEO_PREVIEW', 'Player optimization failed (non-critical):', optimizationError);
      }
      
      // Don't auto-play on initialization, wait for shouldPlay
      if (shouldPlay && mountedRef.current) {
        player.play();
      }
    } catch (error) {
      devLog('VIDEO_PREVIEW', 'Preview player initialization error:', error);
      setHasError(true);
      onError?.(error);
    }
  });

  // Cleanup on unmount with aggressive player handling
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      // console.log('🎥 VIDEO_PREVIEW: 🛑 COMPONENT UNMOUNTING - Aggressive cleanup for:', videoUrl);
      mountedRef.current = false;
      playbackStartedRef.current = false;
      
      // AGGRESSIVE CLEANUP: prioritize stopping over graceful handling
      if (player) {
        try {
          // Multiple pause attempts for heavy videos
          if (typeof player.pause === 'function') {
            player.pause();
          }
          
          // Force reset position to 0 to fully stop resource usage
          if (typeof player.currentTime !== 'undefined') {
            try {
              player.currentTime = 0;
            } catch (resetError) {
              // Ignore reset errors during cleanup
            }
          }
          
          // Force mute to reduce resource usage
          if (typeof player.muted !== 'undefined') {
            try {
              player.muted = true;
            } catch (muteError) {
              // Ignore mute errors during cleanup
            }
          }
          
          // console.log('🎥 VIDEO_PREVIEW: ✅ Aggressive cleanup completed');
        } catch (error) {
          // Silently handle cleanup errors as they're expected during fast scrolling
          devLog('VIDEO_PREVIEW', 'Player cleanup (expected during scroll):', error);
        }
      }
      
      // Clear any pending timeouts immediately
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      // Clear progress updates immediately
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
        progressUpdateRef.current = null;
      }
      
      // Clear any pending pause operations
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
    };
  }, [player]);

  // Progress tracking system
  useEffect(() => {
    if (!player || !shouldPlay || !mountedRef.current) {
      return;
    }

    // Set up progress tracking with throttled updates (60fps max)
    const updateProgress = () => {
      try {
        if (!mountedRef.current || !player) return;

        const currentTime = player.currentTime || 0;
        const totalDuration = player.duration || 0;
        
        // LOOP HANDLING: Check if video reached the end and manually restart if needed
        if (totalDuration > 0) {
          // Check if we're at or very close to the end (within 0.2 seconds)
          const isNearEnd = currentTime >= (totalDuration - 0.2);
          
          if (isNearEnd) {
            // console.log('🔄 VIDEO_PREVIEW: Near end detected - manually restarting loop', {
            //   currentTime: currentTime.toFixed(2),
            //   duration: totalDuration.toFixed(2),
            //   remaining: (totalDuration - currentTime).toFixed(2)
            // });
            
            // Force restart the video to ensure smooth looping
            setTimeout(() => {
              if (mountedRef.current && player && typeof player.currentTime !== 'undefined') {
                try {
                  player.currentTime = 0;
                  // console.log('🔄 VIDEO_PREVIEW: Manually reset currentTime to 0');
                } catch (resetError) {
                  // console.log('🔄 VIDEO_PREVIEW: Failed to reset currentTime:', resetError);
                }
              }
            }, 0);
          }
          
          // Simple loop detection when video actually restarts
          // if (currentTime < 0.5 && totalDuration > 0) {
          //   console.log('🔄 VIDEO_PREVIEW: Loop detected - video restarted at:', currentTime.toFixed(2));
          // }
          
          const progressPercent = Math.min(currentTime / totalDuration, 1);
          setProgress(progressPercent);
          
          // Notify parent component of time updates for countdown
          if (onTimeUpdate) {
            onTimeUpdate(currentTime, totalDuration);
          }
          
          // Update duration if not set
          if (duration === 0) {
            setDuration(totalDuration);
          }
          
          // If we have duration, video metadata is loaded
          if (isLoading && totalDuration > 0) {
            setIsLoading(false);
            devLog('VIDEO_PREVIEW', 'Cleared loading state based on duration:', totalDuration);
          }
          
          // If we're getting progress updates, video is definitely loaded
          if (isLoading && currentTime > 0) {
            setIsLoading(false);
            devLog('VIDEO_PREVIEW', 'Cleared loading state based on progress:', currentTime);
          }
        }

        // Track buffer progress (always update regardless of loading state)
        if (totalDuration > 0) {
          // Estimate buffer progress - simplified
          const estimatedBuffer = Math.min((currentTime / totalDuration) + 0.1, 1);
          setBufferProgress(estimatedBuffer);
        }
      } catch (error) {
        devLog('VIDEO_PREVIEW', 'Progress tracking error:', error instanceof Error ? error.message : String(error));
      }
    };

    // Start progress tracking
    if (progressUpdateRef.current) {
      clearInterval(progressUpdateRef.current);
    }
    
    // Throttled progress updates for heavy videos - reduced it from 20fps to 5fps
    progressUpdateRef.current = setInterval(updateProgress, 200); // 5fps updates to reduce load

    return () => {
      if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
        progressUpdateRef.current = null;
      }
    };
  }, [shouldPlay, player, isLoading, duration]);

  // Handle play/pause based on shouldPlay prop with emergency timeout
  useEffect(() => {
    if (!player || !mountedRef.current) return;

    // EMERGENCY TIMEOUT: If video operations take too long, force through
    const emergencyTimeout = setTimeout(() => {
      if (mountedRef.current) {
        console.log('🚨 VIDEO_PREVIEW: Emergency timeout - video operation took too long');
        // Don't block - just log and continue
      }
    }, 2000); // 2 second emergency timeout

    try {
      // Verify player is still valid before operations
      if (typeof player.pause !== 'function') {
        clearTimeout(emergencyTimeout);
        devLog('VIDEO_PREVIEW', 'Player no longer valid, skipping operation');
        return;
      }

      if (shouldPlay && !hasError) {
        // console.log('▶️ VIDEO_PREVIEW: ASYNC PLAY command for:', videoUrl.slice(-20));
        
        // ASYNC PLAY: Don't block UI thread
        setTimeout(() => {
          try {
            if (!mountedRef.current || hasError) return;
            
            // console.log('🎬 VIDEO_PREVIEW: Starting preview playback for:', videoUrl.slice(-20));
            
            // Reset to beginning for a fresh start
            if (typeof player.currentTime !== 'undefined') {
              player.currentTime = 0;
            }
            player.play();
            
            // If play() succeeds, assume video is loaded enough to play
            setIsLoading(false);
            // console.log('🎬 VIDEO_PREVIEW: Cleared loading state after play() succeeded');
            
            onLoadStart?.();
            
            // Track if playback actually started
            if (!playbackStartedRef.current) {
              onPlaybackStart?.();
              playbackStartedRef.current = true;
            }
          } catch (asyncPlayError) {
            console.log('🚨 VIDEO_PREVIEW: Async play failed:', asyncPlayError);
          }
        }, 0);
        
      } else {
        // console.log('⏹️ VIDEO_PREVIEW: IMMEDIATE STOP command for:', videoUrl.slice(-20));
        
        // IMMEDIATE PAUSE: Use non-blocking pause
        performNonBlockingPause(player, 'shouldPlay=false');
        
        // Reset playback started flag immediately
        playbackStartedRef.current = false;
        
        // For loading videos, try to interrupt loading without blocking
        if (player.status === 'loading') {
          setTimeout(() => {
            try {
              if (mountedRef.current && player.currentTime !== undefined) {
                player.currentTime = 0;
              }
            } catch (resetError) {
              // Ignore reset errors to prevent blocking
            }
          }, 0);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      devLog('VIDEO_PREVIEW', 'Error controlling playback (player may be released):', errorMessage);
      // Don't set error state for player release errors during cleanup
      if (!errorMessage.includes('already released')) {
        setHasError(true);
        onError?.(errorMessage);
      }
    } finally {
      // Always clear emergency timeout
      clearTimeout(emergencyTimeout);
    }
  }, [shouldPlay, player, videoUrl, hasError, onLoadStart, onPlaybackStart, onError]);

  // ASYNC mute state sync - don't block audio button
  useEffect(() => {
    if (!player || !mountedRef.current) return;

    // Use setTimeout to prevent blocking audio button interactions
    const syncMuteAsync = setTimeout(() => {
      try {
        // Verify player is still valid before mute operation
        if (typeof player.muted !== 'undefined' && mountedRef.current) {
          // console.log('🔊 VIDEO_PREVIEW: Async mute sync to:', isGloballyMuted);
          player.muted = isGloballyMuted;
          devLog('VIDEO_PREVIEW', 'Updated preview mute state:', isGloballyMuted);
        }
      } catch (error) {
        devLog('VIDEO_PREVIEW', 'Error updating mute state (player may be released):', error);
      }
    }, 0); // Execute in next tick to avoid blocking

    return () => {
      clearTimeout(syncMuteAsync);
    };
  }, [isGloballyMuted, player]);

  // Handle video loading states with timeout protection
  useEffect(() => {
    devLog('VIDEO_PREVIEW', 'Status change effect setup for:', videoUrl, 'Player exists:', !!player);
    
    if (!player || !mountedRef.current) return;

    const handleStatusChange = () => {
      try {
        const status = player.status;
        devLog('VIDEO_PREVIEW', 'Status changed:', {
          videoUrl,
          status,
          isLoading,
          hasError,
          shouldPlay,
          duration: player.duration || 0
        });
        
        if (!mountedRef.current) return; // Component unmounted
        
        switch (status) {
          case 'loading':
            devLog('VIDEO_PREVIEW', 'Video loading started for:', videoUrl);
            setIsLoading(true);
            setHasError(false);
            break;
          case 'readyToPlay':
            devLog('VIDEO_PREVIEW', 'Video ready to play:', videoUrl);
            setIsLoading(false);
            setHasError(false);
            // Clear any loading timeout since video is ready
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
            onLoadEnd?.();
            
            // Set duration when video is ready
            if (player.duration && player.duration > 0) {
              setDuration(player.duration);
            }
            
            // Try to start playback immediately if we should be playing
            // helps with large files that are ready but not auto-playing
            if (shouldPlay && mountedRef.current) {
              try {
                if (player && typeof player.play === 'function') {
                  player.play();
                  // Ensure loading is cleared when readyToPlay + play succeeds
                  if (isLoading) {
                    setIsLoading(false);
                    devLog('VIDEO_PREVIEW', 'Cleared loading state after readyToPlay + play');
                  }
                  devLog('VIDEO_PREVIEW', 'Started playback after readyToPlay');
                }
              } catch (playError) {
                devLog('VIDEO_PREVIEW', 'Error starting playback on ready:', playError);
              }
            }
            break;
          case 'error':
            devLog('VIDEO_PREVIEW', 'Video load error for:', videoUrl);
            setIsLoading(false);
            setHasError(true);
            onError?.('Video failed to load');
            break;
          default:
            devLog('VIDEO_PREVIEW', 'Unknown video status for', videoUrl, ':', status);
        }
      } catch (error) {
        devLog('VIDEO_PREVIEW', 'Error handling status change:', error);
        if (mountedRef.current) {
          setHasError(true);
        }
      }
    };

    // Initial status check
    handleStatusChange();

    // Progressive loading timeout - start with shorter timeout, extend if needed
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Much longer timeout for preview videos
    let timeoutDuration = 30000; // 30 seconds base timeout
    
    // Increase timeout based on estimated file size (heuristic)
    try {
      if (videoUrl.includes('.mp4') || videoUrl.includes('video')) {
        timeoutDuration = 45000; // 45 seconds for video files
      }
      if (videoUrl.includes('s3.') || videoUrl.includes('amazonaws')) {
        timeoutDuration = 60000; // 60 seconds for S3 files (large videos)
      }
    } catch (urlCheckError) {
      // Use default timeout
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        devLog('VIDEO_PREVIEW', 'Preview loading timeout, falling back to thumbnail for:', videoUrl);
        setHasError(true);
        setIsLoading(false);
        onError?.('Loading timeout');
      }
    }, timeoutDuration);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
    
  }, [player, onLoadEnd, onError, isLoading]);

  // Animated styles for smooth transitions
  const videoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: videoOpacity.value,
      transform: [{ scale: videoScale.value }],
    };
  });

  // Don't render if there's an error or invalid URL - parent should show thumbnail instead
  if (hasError || !isValidVideoUrl) {
    return null;
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Thumbnail background - shows while video loads */}
      {thumbnailUrl && (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      
      {/* Video player on top */}
      <Animated.View style={[styles.video, videoAnimatedStyle]}>
        <VideoView
          player={player}
          style={[
            styles.video,
            {
              opacity: isLoading || !shouldPlay || progress === 0 ? 0 : 1, // Hide until first frame is rendered
            }
          ]}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          // Optimize for preview playback
          startsPictureInPictureAutomatically={false}
        />
      </Animated.View>
      
      {/* Progress bar at bottom edge - only show when actually playing video content */}
      <VideoProgressBar
        progress={progress}
        bufferProgress={bufferProgress}
        duration={duration}
        width={width}
        isVisible={!hasError && shouldPlay && duration > 0 && !isLoading && (progress > 0 || bufferProgress > 0)}
      />
      
      {/* Shimmer effect for loading */}
      <VideoShimmerEffect
        width={width}
        height={height}
        isVisible={isLoading}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.thumbnailUrl === nextProps.thumbnailUrl &&
    prevProps.shouldPlay === nextProps.shouldPlay &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height
  );
});

VideoPreviewPlayer.displayName = 'VideoPreviewPlayer';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default VideoPreviewPlayer;