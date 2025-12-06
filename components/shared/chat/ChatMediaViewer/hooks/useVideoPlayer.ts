import { useState, useEffect, useRef } from 'react';
import { useVideoPlayer as useExpoVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { MediaItem } from '../types';
import { clampTime } from '../utils/timeUtils';

export const useVideoPlayer = (currentItem: MediaItem | undefined, currentIndex: number) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const videoPlayer = useExpoVideoPlayer(
    currentItem?.type === 'video' ? currentItem.uri : '',
    player => {
      player.loop = false;
      player.muted = false;
    }
  );

  const intervalRef = useRef<NodeJS.Timeout>();

  const { isPlaying: playerIsPlaying } = useEvent(videoPlayer, "playingChange", {
    isPlaying: videoPlayer.playing,
  });

  const timeUpdateEvent = useEvent(videoPlayer, "timeUpdate", {
    currentTime: videoPlayer.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: videoPlayer.currentTime,
  });

  const resetVideoState = () => {
    setCurrentTime(0);
    setDuration(0);
    setIsDragging(false);
    setIsPlaying(false);
  };

  const startTimeUpdatePolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (videoPlayer && !isDragging) {
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
  };

  const stopTimeUpdatePolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };

  const handlePlayPause = async () => {
    if (currentItem?.type === 'video' && videoPlayer) {
      try {
        const newPlayingState = !isPlaying;
        setIsPlaying(newPlayingState);
        
        if (newPlayingState) {
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
    }
  };

  const handleSeek = (time: number) => {
    if (videoPlayer && currentItem?.type === 'video') {
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
    }
  };

  const initializeVideoPlayer = () => {
    if (currentItem?.type === 'video' && videoPlayer) {
      resetVideoState();
      videoPlayer.replace(currentItem.uri);
      
      setTimeout(() => {
        try {
          videoPlayer.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Error auto-playing video:', error);
        }
      }, 300);
      
      startTimeUpdatePolling();
    }
  };

  useEffect(() => {
    setIsPlaying(playerIsPlaying);
  }, [playerIsPlaying]);

  useEffect(() => {
    if (videoPlayer && currentItem?.type === 'video') {
      const playerDuration = videoPlayer.duration;
      if (playerDuration && playerDuration > 0) {
        setDuration(playerDuration);
      }
    }
  }, [videoPlayer, currentItem, timeUpdateEvent]);

  useEffect(() => {
    if (!isDragging && timeUpdateEvent && timeUpdateEvent.currentTime >= 0) {
      setCurrentTime(timeUpdateEvent.currentTime);
    }
  }, [timeUpdateEvent, isDragging]);

  useEffect(() => {
    initializeVideoPlayer();
    return () => {
      stopTimeUpdatePolling();
      if (videoPlayer && currentItem?.type === 'video') {
        try {
          videoPlayer.pause();
        } catch (error) {
          console.log('Error pausing video on cleanup:', error);
        }
      }
    };
  }, [currentIndex, currentItem, videoPlayer]);

  useEffect(() => {
    if (currentTime >= duration && duration > 0 && isPlaying) {
      setIsPlaying(false);
      setTimeout(() => {
        if (videoPlayer) {
          videoPlayer.currentTime = 0;
          setCurrentTime(0);
        }
      }, 100);
    }
  }, [currentTime, duration, isPlaying, videoPlayer]);

  const cleanup = () => {
    stopTimeUpdatePolling();
    if (videoPlayer && currentItem?.type === 'video') {
      try {
        videoPlayer.pause();
        setIsPlaying(false);
      } catch (error) {
        console.log('Error during video cleanup:', error);
      }
    }
  };

  return {
    videoPlayer,
    isPlaying,
    duration,
    currentTime,
    isDragging,
    handlePlayPause,
    handleSeek,
    cleanup,
  };
};