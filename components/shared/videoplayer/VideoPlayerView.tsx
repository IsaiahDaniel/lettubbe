import React, { useState, useRef, useEffect } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Text,
  Animated,
  ActivityIndicator,
  Dimensions,
  BackHandler,
} from "react-native";
import * as ScreenOrientation from 'expo-screen-orientation';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoControls } from "@/hooks/videoplayer/useVideoControls";
import { formatDuration } from "@/helpers/utils/formatting";
import { Colors } from "@/constants";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { devLog } from "@/config/dev";
import { GlobalInteractionBar } from "@/components/shared/interactions/GlobalInteractionBar";
import { useAudioStore } from "@/store/audioStore";

interface VideoPlayerViewProps {
  videoUrl: string;
  isFullscreen?: boolean;
  onBack: () => void;
  onPlayTracked?: () => void;
  onVideoEnd?: () => void;
  showPlaylistControls?: boolean;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onFullscreenToggle?: () => void;
  shouldPause?: boolean;
  isMainPlayer?: boolean; // New prop to distinguish main player from autoplay
  // Interaction props for fullscreen mode
  interactionProps?: {
    postId: string;
    likeCount: number;
    commentCount: number;
    playsCount: number;
    onCommentPress: () => void;
    onSharePress: () => void;
    onPlayPress: () => void;
    galleryRefetch: () => Promise<void>;
    isCommentsAllowed?: boolean;
  };
}

const { width: initialWidth, height: initialHeight } = Dimensions.get("window");

const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  videoUrl,
  isFullscreen: propIsFullscreen,
  onBack,
  onPlayTracked,
  onVideoEnd,
  showPlaylistControls = false,
  onNextVideo,
  onPreviousVideo,
  hasNext = false,
  hasPrevious = false,
  onFullscreenChange,
  onFullscreenToggle,
  interactionProps,
  shouldPause = false,
  isMainPlayer = true, // Default to true for main video player
}) => {
  const insets = useSafeAreaInsets();
  const { isGloballyMuted } = useAudioStore();
  const {
    showControls,
    handleShowControls,
    handleScreenTap,
    setKeepControlsVisible,
    isFullscreen,
    toggleFullscreen: hookToggleFullscreen
  } = useVideoControls();

  // Handle fullscreen toggle
  const handleToggleFullscreen = async () => {
    if (onFullscreenToggle) {
      onFullscreenToggle();
    } else {
      await hookToggleFullscreen();
      if (onFullscreenChange) {
        onFullscreenChange(!isFullscreen);
      }
    }
  };

  // Handle back button - exit fullscreen if in fullscreen, otherwise call onBack
  const handleBackPress = () => {
    if (isFullscreen) {
      handleToggleFullscreen();
    } else {
      onBack();
    }
  };

  // Listen for orientation changes
  useEffect(() => {
    let subscription: any = null;
    
    try {
      subscription = Dimensions.addEventListener('change', ({ window }) => {
        setScreenDimensions({
          width: window.width,
          height: window.height,
          windowWidth: window.width,
          windowHeight: window.height,
        });
      });
    } catch (error) {
      console.warn('Failed to setup Dimensions listener:', error);
    }

    return () => {
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      } catch (error) {
        console.warn('Failed to cleanup Dimensions listener:', error);
      }
    };
  }, []);

  const [isPlaying, setIsPlaying] = useState(true);
  // Main player starts unmuted, autoplay starts muted
  const [isMuted, setIsMuted] = useState(isMainPlayer ? false : isGloballyMuted);
  const [currentTime, setCurrentTime] = useState(0);
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const window = Dimensions.get("window");
    const screen = Dimensions.get("screen");
    return { 
      width: screen.width, 
      height: screen.height,
      windowWidth: window.width,
      windowHeight: window.height
    };
  });
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const fullscreenAnim = useRef(new Animated.Value(0)).current;
  const playTrackedRef = useRef(false);
  const playerValidRef = useRef(true);
  const mountedRef = useRef(true);
  const { quality: networkQuality, isSlowConnection } = useNetworkQuality();

  // Handle dimension changes for orientation support
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      setScreenDimensions({ 
        width: screen.width, 
        height: screen.height,
        windowWidth: window.width,
        windowHeight: window.height
      });
    });

    return () => subscription?.remove();
  }, []);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      playerValidRef.current = false;
      
      // Deactivate wake lock
      try {
        deactivateKeepAwake();
      } catch (error) {
        console.warn('Failed to deactivate wake lock on unmount:', error);
      }
    };
  }, []);

  // Create video source with validation
  const videoSource = React.useMemo(() => {
    devLog('VIDEO_PLAYER', 'Creating video source for URL:', videoUrl);
    
    // Validate video URL
    if (!videoUrl || typeof videoUrl !== 'string') {
      devLog('VIDEO_PLAYER', 'Invalid video URL provided:', videoUrl);
      setVideoError(true);
      return null;
    }

    // Check if URL is reachable (basic validation)
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
      devLog('VIDEO_PLAYER', 'Video URL is not a valid HTTP(S) URL:', videoUrl);
      setVideoError(true);
      return null;
    }
    
    // If videoUrl is already a complete source object, use it directly
    if (typeof videoUrl === 'object' && videoUrl !== null && 'uri' in videoUrl) {
      devLog('VIDEO_PLAYER', 'Using existing source object:', videoUrl);
      return videoUrl;
    }
    
    // Simple source object
    const source = videoUrl;
    
    devLog('VIDEO_PLAYER', 'Created simple video source:', source);
    return source;
  }, [videoUrl]);

  const player = useVideoPlayer(videoSource || '', (player) => {
    try {
      if (!videoSource) {
        devLog('VIDEO_PLAYER', 'No valid video source available');
        playerValidRef.current = false;
        setIsBuffering(false);
        setVideoError(true);
        return;
      }

      devLog('VIDEO_PLAYER', 'Player initializing with source:', videoUrl);
      playerValidRef.current = true;
      player.loop = false;
      playTrackedRef.current = false;
      
      // Set initial mute state: main player unmuted, autoplay muted
      const initialMuted = isMainPlayer ? false : isGloballyMuted;
      player.muted = initialMuted;
      setIsMuted(initialMuted);
      
      devLog('VIDEO_PLAYER', `Player audio state: ${isMainPlayer ? 'main player (unmuted)' : 'autoplay (muted)'}`);
      
      // Auto-play after initialization
      player.play();
    } catch (error) {
      devLog('VIDEO_PLAYER', 'Player initialization error:', error);
      playerValidRef.current = false;
      setIsBuffering(false);
      setVideoError(true);
    }
  });

  // Subscribe to player events
  const { isPlaying: playerIsPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });


  // Update playing state
  useEffect(() => {
    setIsPlaying(playerIsPlaying);
  }, [playerIsPlaying]);

  // Sync player mute state with global audio state (only for autoplay, not main player)
  useEffect(() => {
    if (!mountedRef.current || !player || !playerValidRef.current) return;
    
    // Main players manage their own audio state independently
    if (isMainPlayer) return;
    
    try {
      player.muted = isGloballyMuted;
      setIsMuted(isGloballyMuted);
      devLog('VIDEO_PLAYER', 'Synced autoplay mute state with global:', isGloballyMuted);
    } catch (error) {
      devLog('VIDEO_PLAYER', 'Error syncing mute state:', error);
      playerValidRef.current = false;
    }
  }, [isGloballyMuted, player, isMainPlayer]);

  // Screen wake lock - keep screen awake when video is playing
  useEffect(() => {
    const handleScreenWakeLock = async () => {
      try {
        if (isPlaying && !videoEnded) {
          // Keep screen awake when video is playing
          await activateKeepAwakeAsync();
          devLog('VIDEO_PLAYER', 'Screen wake lock activated');
        } else {
          // Allow screen to sleep when video is paused or ended
          deactivateKeepAwake();
          devLog('VIDEO_PLAYER', 'Screen wake lock deactivated');
        }
      } catch (error) {
        devLog('VIDEO_PLAYER', 'Error managing screen wake lock:', error);
      }
    };

    handleScreenWakeLock();

    // Cleanup: Always deactivate wake lock when component unmounts
    return () => {
      deactivateKeepAwake();
    };
  }, [isPlaying, videoEnded]);

  // Handle shouldPause prop to pause/resume video
  useEffect(() => {
    if (!mountedRef.current || !player || !playerValidRef.current) return;
    
    try {
      if (shouldPause) {
        devLog('VIDEO_PLAYER', 'Pausing video due to navigation/app state');
        try {
          player.pause();
        } catch (playerError) {
          playerValidRef.current = false;
        }
      } else {
        devLog('VIDEO_PLAYER', 'Resuming video due to navigation/app state');
        // Only resume if the video was previously playing and not ended
        if (!videoEnded) {
          try {
            player.play();
          } catch (playerError) {
            playerValidRef.current = false;
          }
        }
      }
    } catch (error) {
      devLog('VIDEO_PLAYER', 'Error handling shouldPause:', error);
      playerValidRef.current = false;
    }
  }, [shouldPause, player, videoEnded]);

  // Update buffering state and handle errors
  useEffect(() => {
    devLog('VIDEO_PLAYER', 'Video status changed to:', status);
    setIsBuffering(status === "loading");
    
    // Log all possible statuses for debugging
    if (status === "idle") devLog('VIDEO_PLAYER', 'Video is idle');
    if (status === "loading") devLog('VIDEO_PLAYER', 'Video is loading');
    if (status === "readyToPlay") {
      devLog('VIDEO_PLAYER', 'Video is ready to play');
      setVideoError(false); // Clear error when video loads successfully
    }
    if (status === "error") {
      devLog('VIDEO_PLAYER', 'Video encountered an error');
      setVideoError(true);
      setIsBuffering(false);
      playerValidRef.current = false;
    }
  }, [status]);

  // Get duration from player with better error handling
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let mounted = true;
    
    const checkDuration = () => {
      try {
        // Early exit if component unmounted
        if (!mounted || !mountedRef.current || !playerValidRef.current) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return;
        }

        // Basic player validation - less strict to avoid blocking valid players
        if (!player || typeof player !== 'object' || player === null) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return;
        }

        // try-catch specifically for duration access
        let playerDuration;
        try {
          playerDuration = player.duration;
        } catch (durationError) {
          // Player object has been released, stop checking
          playerValidRef.current = false;
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return;
        }

        // Check if duration is valid
        if (typeof playerDuration === 'number' && playerDuration > 0 && !isNaN(playerDuration)) {
          setDuration(playerDuration);
          // Clear interval once we have duration
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch (error) {
        // Silently handle - player might be transitioning
        playerValidRef.current = false;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    // Only start if player exists and appears valid
    if (!player || typeof player !== 'object' || player === null) {
      return;
    }

    // Check immediately
    checkDuration();

    // Only start interval if we don't have duration yet and component is mounted
    if (duration === 0 && mounted && playerValidRef.current) {
      interval = setInterval(checkDuration, 2000); // Reduced frequency for better performance
    }

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [player, duration]);

  // Track play after 1 second
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isPlaying && !playTrackedRef.current && onPlayTracked) {
      timer = setTimeout(() => {
        if (isPlaying && !playTrackedRef.current) {
          onPlayTracked();
          playTrackedRef.current = true;
        }
      }, 1000);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
  }, [isPlaying, onPlayTracked]);

  // Update current time manually
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let mounted = true;
    
    const updateCurrentTime = () => {
      try {
        if (!mounted || !mountedRef.current || !playerValidRef.current || isSeeking || !player) {
          return;
        }
        
        // Safely access currentTime with try-catch
        try {
          const currentPlayerTime = player.currentTime;
          if (typeof currentPlayerTime === 'number' && !isNaN(currentPlayerTime) && mounted && mountedRef.current) {
            setCurrentTime(currentPlayerTime);
          }
        } catch (timeError) {
          // Player has been released, stop tracking
          playerValidRef.current = false;
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch (error) {
        // Silently handle - this is called frequently
        playerValidRef.current = false;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    // Only start interval if player is valid and not seeking
    if (playerValidRef.current && player && !isSeeking) {
      interval = setInterval(updateCurrentTime, 500); // Reduced frequency for better performance
    }

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [player, isSeeking]);

  // Handle video end
  useEffect(() => {
    if (duration > 0 && currentTime >= duration - 0.5 && !videoEnded) {
      setVideoEnded(true);
      setIsPlaying(false);
      try {
        if (mountedRef.current && playerValidRef.current && player && typeof player === 'object') {
          try {
            player.pause();
          } catch (playerError) {
            playerValidRef.current = false;
          }
        }
      } catch (error) {
        console.error('Video end pause error:', error);
        playerValidRef.current = false;
      }
      setKeepControlsVisible(true);
      handleShowControls(); // Show controls when video ends
      if (onVideoEnd) {
        onVideoEnd();
      }
    }
  }, [currentTime, duration, videoEnded, onVideoEnd, player, handleShowControls, setKeepControlsVisible]);

  // Animate controls
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showControls ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showControls, fadeAnim]);

  // Initialize fullscreen animation based on prop
  useEffect(() => {
    fullscreenAnim.setValue(propIsFullscreen ? 1 : 0);
  }, []);

  // Reset player validity when video URL changes
  useEffect(() => {
    devLog('VIDEO_PLAYER', 'Video URL changed to:', videoUrl);
    playerValidRef.current = true; // Start as valid since player is being recreated
    setDuration(0);
    setCurrentTime(0);
    setVideoEnded(false);
    setIsBuffering(true);
    setVideoError(false); // Reset error state for new video
  }, [videoUrl]);

  // Auto-play when player is ready
  useEffect(() => {
    devLog('VIDEO_PLAYER', 'Player status changed:', status, 'Player valid:', playerValidRef.current);
    let timer: NodeJS.Timeout | null = null;
    
    if (playerValidRef.current && player && status === "readyToPlay") {
      devLog('VIDEO_PLAYER', 'Attempting auto-play...');
      timer = setTimeout(() => {
        try {
          if (mountedRef.current && playerValidRef.current && player && typeof player === 'object') {
            try {
              player.play();
              devLog('VIDEO_PLAYER', 'Auto-play initiated');
            } catch (playerError) {
              devLog('VIDEO_PLAYER', 'Auto-play player error:', playerError);
              playerValidRef.current = false;
            }
          }
        } catch (error) {
          devLog('VIDEO_PLAYER', 'Auto-play error:', error);
          playerValidRef.current = false;
        }
      }, 50); // Shorter delay
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
  }, [player, status]);

  // Animate fullscreen state changes
  useEffect(() => {
    Animated.timing(fullscreenAnim, {
      toValue: isFullscreen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFullscreen, fullscreenAnim]);

  // Handle hardware back button for Android
  useEffect(() => {
    const backAction = () => {
      if (isFullscreen) {
        handleToggleFullscreen();
        return true; // Prevent default behavior
      }
      // Always use the onBack callback instead of default behavior
      onBack();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [isFullscreen, handleToggleFullscreen, onBack]);

  const handlePlayPause = () => {
    try {
      if (!mountedRef.current || !playerValidRef.current || !player || typeof player !== 'object') return;
      
      if (videoEnded) {
        try {
          player.currentTime = 0;
          setVideoEnded(false);
          setCurrentTime(0);
          setKeepControlsVisible(false);
          player.play();
        } catch (playerError) {
          playerValidRef.current = false;
          return;
        }
      } else if (isPlaying) {
        try {
          player.pause();
        } catch (playerError) {
          playerValidRef.current = false;
          return;
        }
      } else {
        try {
          player.play();
        } catch (playerError) {
          playerValidRef.current = false;
          return;
        }
      }
      handleShowControls();
    } catch (error) {
      console.error('Play/pause error:', error);
      playerValidRef.current = false;
    }
  };

  const handleMute = () => {
    try {
      if (!mountedRef.current || !playerValidRef.current || !player || typeof player !== 'object') return;
      try {
        player.muted = !isMuted;
        setIsMuted(!isMuted);
      } catch (playerError) {
        playerValidRef.current = false;
      }
    } catch (error) {
      console.error('Mute error:', error);
      playerValidRef.current = false;
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeek = (value: number) => {
    setCurrentTime(value);
  };

  const handleSeekComplete = (value: number) => {
    try {
      if (!mountedRef.current || !playerValidRef.current || !player || typeof player !== 'object') return;
      try {
        player.currentTime = value;
        setIsSeeking(false);
        if (videoEnded && value < duration - 0.5) {
          setVideoEnded(false);
          player.play();
        }
      } catch (playerError) {
        playerValidRef.current = false;
      }
    } catch (error) {
      console.error('Seek error:', error);
      playerValidRef.current = false;
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Dynamic container style based on fullscreen and orientation
  const getContainerStyle = () => {
    if (isFullscreen) {
      return [
        styles.fullscreenContainer,
        {
          width: screenDimensions.width,
          height: screenDimensions.height,
          transform: [{
            scale: fullscreenAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            })
          }],
          opacity: fullscreenAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          })
        }
      ];
    } else {
      return [
        styles.container,
        {
          width: screenDimensions.windowWidth,
          height: screenDimensions.windowWidth * (9 / 16), // 16:9 aspect ratio for portrait
        }
      ];
    }
  };

  return (
    <Animated.View style={getContainerStyle()}>
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={styles.videoWrapper}>
          <VideoView
            key={videoUrl}
            player={player}
            style={styles.video}
            contentFit={isFullscreen && screenDimensions.width > screenDimensions.height ? "cover" : "contain"}
            nativeControls={false}
          />

          {/* Loading Indicator */}
          {isBuffering && !videoError && (
            <View style={styles.loadingContainer} pointerEvents="none">
              <ActivityIndicator size="large" color="white" />
            </View>
          )}

          {/* Error State */}
          {videoError && (
            <View style={styles.errorContainer} pointerEvents="box-none">
              <View style={styles.errorContent} pointerEvents="auto">
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    devLog('VIDEO_PLAYER', 'Retrying video playback for URL:', videoUrl);
                    setVideoError(false);
                    setIsBuffering(true);
                    playerValidRef.current = true;
                    setCurrentTime(0);
                    setDuration(0);
                    setVideoEnded(false);
                    
                    // Try to reinitialize the player
                    try {
                      if (mountedRef.current && player && playerValidRef.current) {
                        player.replace(videoSource || '');
                        setTimeout(() => {
                          if (mountedRef.current && playerValidRef.current && player) {
                            try {
                              player.play();
                            } catch (playError) {
                              playerValidRef.current = false;
                              setVideoError(true);
                              setIsBuffering(false);
                            }
                          }
                        }, 100);
                      }
                    } catch (retryError) {
                      devLog('VIDEO_PLAYER', 'Retry failed:', retryError);
                      playerValidRef.current = false;
                      setVideoError(true);
                      setIsBuffering(false);
                    }
                  }}
                  style={styles.retryIconButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={48} color="white" />
                </TouchableOpacity>
                <Text style={styles.errorTitle}>Video Unavailable</Text>
                <Text style={styles.errorMessage}>
                  Unable to load video. Please check your internet connection and try again.
                </Text>
              </View>
            </View>
          )}

          {/* Invisible touch layer when controls are hidden */}
          {!showControls && (
            <TouchableWithoutFeedback onPress={handleScreenTap}>
              <View style={styles.touchLayer} />
            </TouchableWithoutFeedback>
          )}

          {/* Controls Overlay */}
          <Animated.View
            style={[styles.controlsOverlay, { opacity: fadeAnim }]}
            pointerEvents={showControls ? "auto" : "none"}
          >
            {/* Top Controls */}
            <View style={styles.topSection}>
              <LinearGradient
                colors={["rgba(0,0,0,0.5)", "transparent"]}
                style={styles.topGradient}
              >
                <View style={styles.topControls}>
                  <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
                    <Ionicons name="chevron-down" size={24} color="white" />
                  </TouchableOpacity>
                  <View style={styles.topRightControls}>
                    <TouchableOpacity style={styles.iconButton}>
                      {/* <Ionicons
                        name="settings-outline"
                        size={20}
                        color="white"
                      /> */}
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Center Controls */}
            <View style={styles.centerSection}>
              {/* previous button */}
              <TouchableOpacity
                onPress={hasPrevious && onPreviousVideo ? () => {
                  try {
                    onPreviousVideo();
                  } catch (error) {
                    console.error('Error calling onPreviousVideo:', error);
                  }
                } : undefined}
                style={[
                  styles.skipButton,
                  !hasPrevious && styles.disabledButton
                ]}
                activeOpacity={hasPrevious ? 0.7 : 1}
              >
                <Ionicons 
                  name="play-skip-back" 
                  size={36} 
                  color={hasPrevious ? "white" : "rgba(255, 255, 255, 0.3)"} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePlayPause}
                style={styles.playPauseButton}
              >
                {videoEnded ? (
                  <Ionicons name="reload" size={40} color="white" />
                ) : (
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={40}
                    color="white"
                  />
                )}
              </TouchableOpacity>

              {/* next button */}
              <TouchableOpacity
                onPress={hasNext && onNextVideo ? () => {
                  try {
                    onNextVideo();
                  } catch (error) {
                    console.error('Error calling onNextVideo:', error);
                  }
                } : undefined}
                style={[
                  styles.skipButton,
                  !hasNext && styles.disabledButton
                ]}
                activeOpacity={hasNext ? 0.7 : 1}
              >
                <Ionicons 
                  name="play-skip-forward" 
                  size={36} 
                  color={hasNext ? "white" : "rgba(255, 255, 255, 0.3)"} 
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={[
              styles.bottomSection,
              isFullscreen && { paddingBottom: insets.bottom }
            ]}>
              {/* Time, Progress ajd full screen */}
              <View style={styles.progressSection}>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
                <TouchableOpacity
                  onPress={handleToggleFullscreen}
                  style={styles.fullscreenToggle}
                >
                  <Ionicons
                    name={isFullscreen ? "contract" : "expand"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground} />
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                    },
                  ]}
                />
                <Slider
                  style={styles.progressSlider}
                  value={currentTime}
                  minimumValue={0}
                  maximumValue={duration || 1}
                  onValueChange={handleSeek}
                  onSlidingStart={handleSeekStart}
                  onSlidingComplete={handleSeekComplete}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor={Colors.general.primary}
                />
              </View>

              {/* Interaction Bar for Fullscreen Mode */}
              {isFullscreen && interactionProps && (
                <View style={styles.fullscreenInteractionContainer}>
                  <GlobalInteractionBar
                    postId={interactionProps.postId}
                    likeCount={interactionProps.likeCount}
                    commentCount={interactionProps.commentCount}
                    playsCount={interactionProps.playsCount}
                    textColor="white"
                    onCommentPress={interactionProps.onCommentPress}
                    onSharePress={interactionProps.onSharePress}
                    onPlayPress={interactionProps.onPlayPress}
                    galleryRefetch={interactionProps.galleryRefetch}
                    isCommentsAllowed={interactionProps.isCommentsAllowed}
                  />
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "#000",
  },
  disabledButton: {
    
  },
  videoWrapper: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 10,
  },
  errorContent: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryIconButton: {
    padding: 12,
    marginBottom: 8,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topSection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topGradient: {
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 32,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRightControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 12,
  },
  centerSection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 60,
  },
  skipButton: {
    padding: 8,
  },
  playPauseButton: {
    padding: 8,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  timeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
  },
  fullscreenButton: {
    padding: 4,
  },
  progressBarContainer: {
    height: 20,
    position: "relative",
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  progressBarBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 0,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: Colors.general.primary,
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  progressSlider: {
    position: "absolute",
    left: -9,
    right: -9,
    bottom: -8,
    height: 20,
  },
  fullscreenInteractionContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  bottomControlsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  fullscreenToggle: {
  },
  muteButton: {
    padding: 4,
  },
});

export default VideoPlayerView;