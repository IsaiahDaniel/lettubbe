import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Dimensions, BackHandler } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import type { AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av/build/AV';
import { useRouter } from 'expo-router';
import Typography from '@/components/ui/Typography/Typography';
import RemixIcon from 'react-native-remix-icon';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import useVideoUploadStore from '@/store/videoUploadStore';
import Slider from '@react-native-community/slider';
import Wrapper from '@/components/utilities/Wrapper2';
import AppButton from '@/components/ui/AppButton';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/ui/CustomAlert';

interface VideoInstance {
  unloadAsync: () => Promise<void>;
  pauseAsync: () => Promise<void>;
  playAsync: () => Promise<void>;
  setPositionAsync: (positionMillis: number) => Promise<void>;
  setProgressUpdateIntervalAsync: (intervalMillis: number) => Promise<void>;
  stopAsync: () => Promise<void>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


const SLIDER_UPDATE_INTERVAL = 500; // milliseconds - increased for performance from 250
const VIDEO_UPDATE_INTERVAL = 1000; // milliseconds - increased for performance from 500
const THUMBNAIL_QUALITY = 0.5; // Lower for better performance

// Memory management constants
const MAX_VIDEO_SIZE_MB = 100; // 100MB threshold for compression
const MAX_RESOLUTION = 1920; // 1080p max resolution
const MEMORY_EFFICIENT_BITRATE = 2000000; // 2 Mbps for compressed videos

export default function VideoEditorScreen() {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const { showConfirm, showError, alertConfig, isVisible, hideAlert } = useCustomAlert();
  const videoRef = useRef<VideoInstance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [readyForPlayback, setReadyForPlayback] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [hasCheckedMetadata, setHasCheckedMetadata] = useState(false);
  const lastPositionRef = useRef<number>(0);
  const appStateRef = useRef(AppState.currentState);
  const metadataCheckRef = useRef<boolean>(false);
  const promptSaveDraftRef = useRef<() => void>();
  
  const { 
    selectedVideo, 
    setSelectedVideo,
    setEditedVideoUri,
    openDetailsScreen,
    closeFullScreenEditor,
    saveDraft,
    setVideoDetails,
    isDetailsScreen
  } = useVideoUploadStore();

  // Check video metadata only once per video
  const checkVideoMetadata = useCallback(async () => {
    if (!selectedVideo?.uri || metadataCheckRef.current || hasCheckedMetadata) {
      return;
    }
    
    metadataCheckRef.current = true;
    
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(selectedVideo.uri);
      console.log('Video file info (one-time check):', fileInfo);
      
      const fileSizeMB = (fileInfo.exists && 'size' in fileInfo && fileInfo.size) ? fileInfo.size / (1024 * 1024) : 0;
      
      // Get video metadata if available
      let metadata = null;
      try {
        if (selectedVideo.width && selectedVideo.height) {
          metadata = {
            width: selectedVideo.width,
            height: selectedVideo.height,
            duration: selectedVideo.duration || 0,
          };
        }
      } catch (error: unknown) {
        console.log('Could not get video metadata:', error);
      }
      
      const videoMeta = { 
        ...metadata,
        fileSizeMB,
        uri: selectedVideo.uri 
      };
      
      setVideoMetadata(videoMeta);
      setHasCheckedMetadata(true);
      
      // Check if video needs special handling
      if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
        console.log(`⚠️ Large video detected: ${fileSizeMB.toFixed(1)}MB`);
      }
      
      if (metadata && (metadata.width > MAX_RESOLUTION || metadata.height > MAX_RESOLUTION)) {
        console.log(`⚠️ High resolution video detected: ${metadata.width}x${metadata.height}`);
      }
      
    } catch (error: unknown) {
      console.error('Error checking video metadata:', error);
    }
  }, [selectedVideo, hasCheckedMetadata]);

  // Generate thumbnail with memory management - only once
  const generateThumbnail = useCallback(async () => {
    if (!selectedVideo?.uri || thumbnailUri) return; // Don't regenerate if we already have one
    
    try {
      // Use lower quality for large videos
      const quality = videoMetadata?.fileSizeMB > MAX_VIDEO_SIZE_MB ? 0.3 : THUMBNAIL_QUALITY;
      
      console.log(`Generating thumbnail for video (${videoMetadata?.fileSizeMB?.toFixed(1) || 'unknown'}MB) with quality ${quality}`);
      
      const { uri } = await VideoThumbnails.getThumbnailAsync(selectedVideo.uri, {
        time: 500,
        quality,
      });
      setThumbnailUri(uri);
      setVideoDetails({ thumbnailUri: uri });
    } catch (e: unknown) {
      console.warn("Couldn't generate thumbnail", e);
      
      // Fallback with minimal parameters for phone-recorded videos
      try {
        console.log("Attempting minimal thumbnail generation...");
        const { uri } = await VideoThumbnails.getThumbnailAsync(selectedVideo.uri, {
          time: 0,
          quality: 0.2, // Very low quality for problematic videos
        });
        setThumbnailUri(uri);
        setVideoDetails({ thumbnailUri: uri });
        console.log("Minimal thumbnail generation successful");
      } catch (fallbackError: unknown) {
        console.error("All thumbnail generation failed:", fallbackError);
        setThumbnailUri(null);
        setVideoDetails({ thumbnailUri: "" });
      }
    }
  }, [selectedVideo?.uri, videoMetadata?.fileSizeMB, thumbnailUri, setVideoDetails]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background
        if (videoRef.current && isPlaying) {
          videoRef.current.pauseAsync().catch(console.error);
        }
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App is coming to foreground - don't auto-resume to save resources
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isPlaying]);

  // Focus effect for navigation handling - run only once
  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      
      // Only run initial setup if video exists and we haven't checked metadata
      if (!selectedVideo) {
        router.back();
        return;
      }
      
      // Check metadata and generate thumbnail only once
      const initializeVideo = async () => {
        if (!hasCheckedMetadata && isFocused) {
          await checkVideoMetadata();
        }
        if (isFocused && !thumbnailUri) {
          generateThumbnail();
        }
      };
      
      const timer = setTimeout(initializeVideo, 100);

      // Clean up when screen loses focus
      return () => {
        isFocused = false;
        clearTimeout(timer);
        if (videoRef.current) {
          videoRef.current.pauseAsync().catch(console.error);
        }
      };
    }, [selectedVideo, router]) // Removed dependencies that cause re-runs     }, [selectedVideo, generateThumbnail, router])
  );

  // Handle component mount/unmount and reset metadata check on video change
  useEffect(() => {
    // Reset metadata check when video changes
    if (selectedVideo?.uri) {
      metadataCheckRef.current = false;
      setHasCheckedMetadata(false);
    }
    
    // Clean up when component unmounts
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(console.error);
      }
      metadataCheckRef.current = false;
    };
  }, [selectedVideo?.uri]);

  // Video status update handler with aggressive optimizations
  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!('isLoaded' in status) || !status.isLoaded) {
      if ('error' in status) {
        setVideoError(status.error || "Unknown error");
        setIsLoading(false);
        console.error("Video playback error:", status.error);
      }
      return;
    }

    // Status is loaded, handle the update
    const statusSuccess = status as AVPlaybackStatusSuccess;
    
    // Only update loading state when it changes
    if (isLoading && statusSuccess.isLoaded) {
      setIsLoading(false);
      setReadyForPlayback(true);
    }
    
    // Update playing state only when it changes
    if (isPlaying !== statusSuccess.isPlaying) {
      setIsPlaying(statusSuccess.isPlaying);
    }
    
    // Only update position if not currently seeking and throttle updates
    if (!isSeeking && statusSuccess.isPlaying) {
      const newTime = statusSuccess.positionMillis / 1000;
      // Only update if significant change (throttle to reduce renders)
      if (Math.abs(newTime - lastPositionRef.current) > 0.5) {
        lastPositionRef.current = newTime;
        setCurrentTime(newTime);
      }
    }
    
    // Set duration only once
    if (statusSuccess.durationMillis && duration === 0) {
      setDuration(statusSuccess.durationMillis / 1000);
      
      // Update video metadata in store only once
      if (selectedVideo && !selectedVideo.duration) {
        const updatedVideo = {
          ...selectedVideo,
          duration: statusSuccess.durationMillis / 1000,
        };
        setSelectedVideo(updatedVideo);
      }
    }
  }, [isPlaying, isLoading, duration, isSeeking, selectedVideo, setSelectedVideo]);
  
  // Optimized play/pause with error handling
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current || !readyForPlayback) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        // If at the end, start from beginning
        if (Math.abs(currentTime - duration) < 0.5) {
          await videoRef.current.setPositionAsync(0);
        }
        await videoRef.current.playAsync();
      }
    } catch (error: unknown) {
      console.error("Error toggling play state:", error);
      // Try to recover
      if (videoRef.current) {
        try {
          await videoRef.current.stopAsync();
          await videoRef.current.playAsync();
        } catch (e: unknown) {
          showError("Playback Error", "Failed to play video. Try reloading the app.");
        }
      }
    }
  }, [isPlaying, currentTime, duration, readyForPlayback, showError]);

  // Better slider interaction handling
  const handleSliderSlidingStart = useCallback(() => {
    setIsSeeking(true);
    if (videoRef.current && isPlaying) {
      videoRef.current.pauseAsync().catch(console.error);
    }
  }, [isPlaying]);
  
  const handleSliderValueChange = useCallback((value: number) => {
    // Just update the current time for UI feedback while dragging
    setCurrentTime(value);
  }, []);
  
  const handleSliderSlidingComplete = useCallback(async (value: number) => {
    if (!videoRef.current) return;
    
    try {
      // Set position in video
      await videoRef.current.setPositionAsync(Math.floor(value * 1000));
      
      // Resume if it was playing
      if (isPlaying) {
        await videoRef.current.playAsync();
      }
    } catch (error: unknown) {
      console.error("Error seeking:", error);
    } finally {
      setIsSeeking(false);
    }
  }, [isPlaying]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  const handleNext = useCallback(async () => {
    if (!selectedVideo) return;
    
    try {
      setIsProcessingVideo(true);
      
      // For large videos, show warning and cleanup aggressively
      if (videoMetadata?.fileSizeMB > MAX_VIDEO_SIZE_MB) {
        console.log(`Processing large video (${videoMetadata.fileSizeMB.toFixed(1)}MB) - applying memory optimizations`);
      }
      
      // Pause and unload video before navigating to free memory
      if (videoRef.current) {
        await videoRef.current.pauseAsync().catch(console.error);
        await videoRef.current.stopAsync().catch(console.error);
        await videoRef.current.unloadAsync().catch(console.error);
      }
      
      // Force multiple garbage collection cycles for large videos
      if (videoMetadata?.fileSizeMB > MAX_VIDEO_SIZE_MB && global.gc) {
        for (let i = 0; i < 3; i++) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      setEditedVideoUri(selectedVideo.uri);
      setVideoDetails({
        thumbnailUri: thumbnailUri || "",
        // Add video metadata for upload optimization
        ...(videoMetadata && {
          videoMetadata: {
            fileSizeMB: videoMetadata.fileSizeMB,
            resolution: videoMetadata.width && videoMetadata.height ? `${videoMetadata.width}x${videoMetadata.height}` : undefined,
            requiresCompression: videoMetadata.fileSizeMB > MAX_VIDEO_SIZE_MB
          }
        })
      });
      openDetailsScreen();
      
      // Additional cleanup for memory
      setVideoMetadata(null);
      
      // Force final garbage collection
      if (global.gc) {
        global.gc();
      }
      
      // Longer delay for large videos to ensure cleanup
      const delay = videoMetadata?.fileSizeMB > MAX_VIDEO_SIZE_MB ? 300 : 100;
      setTimeout(() => {
        setIsProcessingVideo(false);
        router.push('/videoDetails');
      }, delay);
      
    } catch (error: unknown) {
      console.error("Navigation error:", error);
      setIsProcessingVideo(false);
      
      // Check if it's an OutOfMemoryError
      const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
      if (errorMessage.includes('OutOfMemoryError')) {
        showError(
          "Memory Error", 
          "This video is too large for your device. Please try recording a shorter video or reducing the quality.",
          () => router.back()
        );
      } else {
        showError("Error", "Something went wrong. Please try again.");
      }
    }
  }, [selectedVideo, thumbnailUri, videoMetadata, setEditedVideoUri, setVideoDetails, openDetailsScreen, router, showError]);

  const promptSaveDraft = useCallback(() => {
    if (!selectedVideo) {
      closeFullScreenEditor();
      router.back();
      return;
    }
    
    // Pause video before showing alert
    if (videoRef.current && isPlaying) {
      videoRef.current.pauseAsync().catch(console.error);
    }
    
    showConfirm(
      "Save as Draft",
      "Would you like to save your progress as a draft?",
      async () => {
        if (selectedVideo) {
          try {
            await saveDraft(selectedVideo, thumbnailUri || undefined);
            closeFullScreenEditor();
            router.back();
          } catch (error: unknown) {
            console.error("Error saving draft:", error);
            showError("Error", "Failed to save draft");
          }
        }
      },
      () => {
        closeFullScreenEditor();
        router.back();
      },
      "Save Draft",
      "Don't Save",
      "primary"
    );
  }, [selectedVideo, thumbnailUri, closeFullScreenEditor, router, saveDraft, isPlaying, showConfirm, showError]);

  // Keep the ref updated with the latest function
  useEffect(() => {
    promptSaveDraftRef.current = promptSaveDraft;
  }, [promptSaveDraft]);

  // Hardware back button handler - set up once and use refs to avoid excessive re-renders
  useEffect(() => {
    console.log('🔄 VideoEditor BackHandler useEffect - setting up listener (one time)');
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Get the current state directly from the store to avoid stale closure issues
      const currentState = useVideoUploadStore.getState();
      console.log('📱 VideoEditor hardware back button pressed - isDetailsScreen:', currentState.isDetailsScreen);
      
      if (currentState.isDetailsScreen) {
        console.log('🚫 VideoEditor BackHandler - details screen is open, not handling');
        return false; // Let the details screen handle it
      }
      
      console.log('✅ VideoEditor BackHandler - showing save draft prompt');
      // Call promptSaveDraft using the ref to get the latest function
      if (promptSaveDraftRef.current) {
        promptSaveDraftRef.current();
      }
      return true; // Prevent default back behavior
    });

    return () => {
      console.log('🧹 VideoEditor BackHandler cleanup');
      backHandler.remove();
    };
  }, []); // Empty dependency array to prevent excessive re-renders

  // Configure video for better performance when ready
  useEffect(() => {
    if (videoRef.current && readyForPlayback) {
      // Set a reasonable update interval to reduce CPU usage
      videoRef.current.setProgressUpdateIntervalAsync(VIDEO_UPDATE_INTERVAL)
        .catch(console.error);
    }
  }, [readyForPlayback]);

  // Show error state if video failed to load
  if (videoError) {
    return (
      <Wrapper>
        <View style={styles.errorContainer}>
          <RemixIcon name="error-warning-fill" size={48} color={Colors.general.error} />
          <Typography size={16} weight="500" style={{ marginTop: 16, textAlign: 'center' }}>
            Error loading video: {videoError}
          </Typography>
          <AppButton 
            title="Go Back" 
            variant="primary" 
            handlePress={() => router.back()}
            style={{ marginTop: 24 }}
          />
        </View>
      </Wrapper>
    );
  }

  if (!selectedVideo) {
    return (
      <Wrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.general.primary} />
        </View>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: Colors[theme].background }]}>
          <TouchableOpacity onPress={promptSaveDraft} style={styles.leftHeaderButton} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <Feather name="chevron-left" size={30} color={Colors[theme].text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter} />
          
          <AppButton 
            title={isProcessingVideo ? "Processing..." : "Next"} 
            variant="compact" 
            handlePress={handleNext}
            disabled={isProcessingVideo}
          />
        </View>

        <View style={[styles.videoContainer, { height: SCREEN_HEIGHT * 0.4 }]}>
          
          {(isLoading || isProcessingVideo) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              {/* {isProcessingVideo && (
                <Typography size={14} weight="400" style={{ color: '#FFFFFF', marginTop: 8 }}>
                  Processing video...
                </Typography>
              )} */}
            </View>
          )}
          
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: selectedVideo.uri }}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false} // Disable looping for large videos to save memory
            shouldPlay={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            useNativeControls={false}
            posterSource={thumbnailUri ? { uri: thumbnailUri } : undefined}
            usePoster={true}
            rate={1.0}
            volume={videoMetadata?.fileSizeMB > MAX_VIDEO_SIZE_MB ? 0.8 : 1.0} // Lower volume for large videos
            isMuted={false}
            progressUpdateIntervalMillis={videoMetadata?.fileSizeMB > MAX_VIDEO_SIZE_MB ? VIDEO_UPDATE_INTERVAL * 3 : VIDEO_UPDATE_INTERVAL * 2}
            positionMillis={0}
            onLoad={() => {
              setIsLoading(false);
              console.log('Video loaded successfully');
            }}
            onReadyForDisplay={() => {
              setReadyForPlayback(true);
              console.log('Video ready for display');
            }}
            onError={(error: unknown) => {
              console.error("Video error:", error);
              const errorMessage = error && typeof error === 'object' && 'message' in error 
                ? String(error.message) 
                : typeof error === 'string' 
                ? error 
                : "Failed to load video";
              setVideoError(errorMessage);
              
              // Try to free memory
              if (global.gc) {
                global.gc();
              }
            }}
          />
          
          <TouchableOpacity 
            style={styles.playPauseButton}
            onPress={togglePlayPause}
            disabled={!readyForPlayback}
            hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
          >
            <RemixIcon 
              name={isPlaying ? "pause-fill" : "play-fill"} 
              size={40} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.controlsContainer}>
          <Typography size={12} weight="400" style={styles.timeText}>
            {formatTime(currentTime)}
          </Typography>
          
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onSlidingStart={handleSliderSlidingStart}
            onValueChange={handleSliderValueChange} 
            onSlidingComplete={handleSliderSlidingComplete}
            minimumTrackTintColor={Colors.general.primary}
            maximumTrackTintColor="#CCCCCC"
            thumbTintColor={Colors.general.primary}
            disabled={!readyForPlayback || isLoading}
          />
          
          <Typography size={12} weight="400" style={styles.timeText}>
            {formatTime(duration)}
          </Typography>
        </View>


        <View style={styles.draftButtonContainer}>
          <TouchableOpacity 
            style={[styles.draftButton, { backgroundColor: Colors[theme].background }]}
            onPress={promptSaveDraft}
          >
            <RemixIcon name="save-line" size={20} color={Colors[theme].text} />
            <Typography size={14} weight="500" style={{ marginLeft: 8 }}>
              Save as Draft 
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={isVisible}
        title={alertConfig?.title || ""}
        message={alertConfig?.message || ""}
        primaryButton={alertConfig?.primaryButton}
        secondaryButton={alertConfig?.secondaryButton}
        onClose={hideAlert}
        variant={alertConfig?.variant}
      />
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  leftHeaderButton: {
    alignItems: 'flex-start',
    padding: 4, 
  },
  headerCenter: {
    flex: 1,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playPauseButton: {
    position: 'absolute',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    zIndex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
    height: 40, // Increase touch target size
  },
  timeText: {
    width: SCREEN_WIDTH * 0.1,
    textAlign: 'center',
  },
  editToolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  editTool: {
    alignItems: 'center',
    padding: 8,
  },
  draftButtonContainer: {
    marginTop: 60,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});