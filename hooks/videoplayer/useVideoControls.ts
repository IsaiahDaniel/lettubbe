import { useState, useRef, useEffect, useCallback } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Dimensions } from 'react-native';
import { useAudioStore } from "@/store/audioStore";

export const useVideoControls = () => {
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keepControlsVisible, setKeepControlsVisible] = useState(false);
  
  // Use global audio store instead of local mute state
  const { isGloballyMuted } = useAudioStore();
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleShowControls = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    if (!keepControlsVisible) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        controlsTimeoutRef.current = null;
      }, 3000);
    }
  }, [keepControlsVisible]);

  const handleScreenTap = useCallback(() => {
    if (showControls) {
      // If controls are showing, hide them
      setShowControls(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    } else {
      // If controls are hidden, show them
      handleShowControls();
    }
  }, [showControls, handleShowControls]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
    handleShowControls();
  }, [isPlaying, handleShowControls]);

  const toggleMute = useCallback(() => {
    console.warn('Individual video mute is disabled. Use global audio toggle on video thumbnail.');
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (isFullscreen) {
        // When exiting fullscreen, return to portrait
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } else {
        // When entering fullscreen, allow all orientations
        // This lets the user control the orientation
        await ScreenOrientation.unlockAsync();
      }
      setIsFullscreen(!isFullscreen);
      handleShowControls();
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }, [isFullscreen, handleShowControls]);

  useEffect(() => {
    handleShowControls();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      
      // Safely reset screen orientation
      try {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        ).catch((error) => {
          console.warn('Failed to reset screen orientation on cleanup:', error);
        });
      } catch (error) {
        console.warn('Failed to access screen orientation on cleanup:', error);
      }
    };
  }, [handleShowControls]);

  return {
    showControls,
    isPlaying,
    isMuted: isGloballyMuted, // Return global mute state instead of local
    isFullscreen,
    togglePlay,
    toggleMute,
    toggleFullscreen,
    handleScreenTap,
    handleShowControls,
    setIsPlaying,
    setKeepControlsVisible,
  };
};