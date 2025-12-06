import { useState, useEffect, useRef, useCallback } from 'react';
import { useVideoPlayer as useExpoVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { MediaItem } from '../types';
import { clampTime } from '../utils/timeUtils';

export const useSingleVideoPlayer = (mediaItems: MediaItem[], currentIndex: number) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const currentVideoRef = useRef<string>('');
  
  const currentItem = mediaItems[currentIndex];
  const currentVideoUri = currentItem?.type === 'video' ? currentItem.uri : '';
  
  const videoPlayer = useExpoVideoPlayer(currentVideoUri, player => {
    player.loop = false;
    player.muted = false;
    player.playbackRate = 1.0;
  });

  const { isPlaying: playerIsPlaying } = useEvent(videoPlayer, "playingChange", {
    isPlaying: videoPlayer.playing,
  });

  const { status: playerStatus } = useEvent(videoPlayer, "statusChange", {
    status: videoPlayer.status,
  });

  const timeUpdateEvent = useEvent(videoPlayer, "timeUpdate", {
    currentTime: videoPlayer.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: videoPlayer.currentTime,
  });

  const resetVideoState = useCallback(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsDragging(false);
    setIsPlaying(false);
    setIsBuffering(true);
  }, []);

  const stopTimeUpdatePolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const startTimeUpdatePolling = useCallback(() => {
    stopTimeUpdatePolling();
    
    intervalRef.current = setInterval(() => {
      if (videoPlayer && !isDragging && !isBuffering) {
        try {
          const current = videoPlayer.currentTime || 0;
          const dur = videoPlayer.duration || 0;
          setCurrentTime(current);
          if (dur > 0 && dur !== Infinity) {
            setDuration(dur);
          }
        } catch (error) {
          // Ignore polling errors
        }
      }
    }, 200);
  }, [videoPlayer, isDragging, isBuffering, stopTimeUpdatePolling]);

  const handlePlayPause = useCallback(async () => {
    if (!currentItem || currentItem.type !== 'video' || !videoPlayer || isBuffering) {
      return;
    }

    try {
      const newPlayingState = !isPlaying;
      setIsPlaying(newPlayingState);
      
      if (newPlayingState) {
        // Always reset to beginning if we're at the very end or start
        if (currentTime >= duration && duration > 0) {
          videoPlayer.currentTime = 0;
          setCurrentTime(0);
        }
        await videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    } catch (error) {
      console.log('Error with play/pause:', error);
      setIsPlaying(!isPlaying);
    }
  }, [currentItem, videoPlayer, isBuffering, isPlaying, currentTime, duration]);

  const handleSeek = useCallback((time: number) => {
    if (!videoPlayer || !currentItem || currentItem.type !== 'video' || isBuffering) {
      return;
    }

    try {
      setIsDragging(true);
      const seekTime = clampTime(time, duration);
      videoPlayer.currentTime = seekTime;
      setCurrentTime(seekTime);
      setTimeout(() => setIsDragging(false), 200);
    } catch (error) {
      console.log('Error seeking:', error);
      setIsDragging(false);
    }
  }, [videoPlayer, currentItem, isBuffering, duration]);

  const cleanup = useCallback(() => {
    stopTimeUpdatePolling();
    if (videoPlayer && currentItem?.type === 'video') {
      try {
        videoPlayer.pause();
        setIsPlaying(false);
        setCurrentTime(0);
        setIsBuffering(true);
      } catch (error) {
        console.log('Error during video cleanup:', error);
      }
    }
  }, [videoPlayer, currentItem, stopTimeUpdatePolling]);

  // Handle video source changes
  useEffect(() => {
    if (currentVideoUri && currentVideoUri !== currentVideoRef.current) {
      currentVideoRef.current = currentVideoUri;
      
      // Reset state for new video
      resetVideoState();
      
      // Replace the video source
      if (videoPlayer) {
        try {
          videoPlayer.replace(currentVideoUri);
        } catch (error) {
          console.log('Error replacing video:', error);
        }
      }
    }
  }, [currentVideoUri, resetVideoState, videoPlayer]);

  // Handle player state changes
  useEffect(() => {
    setIsPlaying(playerIsPlaying);
  }, [playerIsPlaying]);

  // Handle player status changes
  useEffect(() => {
    if (playerStatus === 'readyToPlay') {
      setIsBuffering(false);
      
      // Auto-play when ready
      if (videoPlayer && currentItem?.type === 'video') {
        try {
          videoPlayer.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Error auto-playing video:', error);
        }
      }
    } else if (playerStatus === 'loading') {
      setIsBuffering(true);
    } else if (playerStatus === 'error') {
      setIsBuffering(false);
      console.log('Video player error');
    }
  }, [playerStatus, videoPlayer, currentItem]);

  // Handle time updates
  useEffect(() => {
    if (!isDragging && timeUpdateEvent && timeUpdateEvent.currentTime >= 0 && !isBuffering) {
      setCurrentTime(timeUpdateEvent.currentTime);
    }
  }, [timeUpdateEvent, isDragging, isBuffering]);

  // Handle duration updates
  useEffect(() => {
    if (videoPlayer && currentItem?.type === 'video' && !isBuffering) {
      const playerDuration = videoPlayer.duration;
      if (playerDuration && playerDuration > 0) {
        setDuration(playerDuration);
      }
    }
  }, [videoPlayer, currentItem, timeUpdateEvent, isBuffering]);

  // Start/stop polling based on video state
  useEffect(() => {
    if (!isBuffering && currentItem?.type === 'video') {
      startTimeUpdatePolling();
    } else {
      stopTimeUpdatePolling();
    }
    
    return () => stopTimeUpdatePolling();
  }, [isBuffering, currentItem, startTimeUpdatePolling, stopTimeUpdatePolling]);

  // Handle video end
  useEffect(() => {
    if (currentTime >= duration && duration > 0 && isPlaying && !isBuffering) {
      setIsPlaying(false);
      // Don't reset to 0 immediately - let user decide when to restart
      // prevents re-buffering when they want to play again
    }
  }, [currentTime, duration, isPlaying, isBuffering]);

  // Initialize video when component mounts or current video changes
  useEffect(() => {
    if (currentVideoUri && videoPlayer) {
      // Reset everything when video changes
      setCurrentTime(0);
      setIsPlaying(false);
      setIsBuffering(true);
    }
  }, [currentVideoUri, videoPlayer]);

  return {
    videoPlayer,
    isPlaying,
    duration,
    currentTime,
    isDragging,
    isBuffering,
    handlePlayPause,
    handleSeek,
    cleanup,
    isCurrentVideo: currentItem?.type === 'video',
  };
};