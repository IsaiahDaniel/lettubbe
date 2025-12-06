import { useCallback, useEffect } from 'react';
import { usePlaylistStore } from '@/store/playlistStore';
import { VideoItem } from '@/store/feedStore';

interface UsePlaylistNavigationProps {
  onVideoChange: (video: VideoItem) => void;
  isPlaying?: boolean;
}

export const usePlaylistNavigation = ({
  onVideoChange,
  isPlaying = false,
}: UsePlaylistNavigationProps) => {
  const {
    isPlayingPlaylist,
    hasNextVideo,
    hasPreviousVideo,
    nextVideo,
    previousVideo,
    currentVideoIndex,
    currentPlaylist,
  } = usePlaylistStore();

  const navigateToNext = useCallback(() => {
    if (hasNextVideo()) {
      const next = nextVideo();
      if (next) {
        onVideoChange(next as VideoItem);
        return true;
      }
    }
    return false;
  }, [hasNextVideo, nextVideo, onVideoChange]);

  const navigateToPrevious = useCallback(() => {
    if (hasPreviousVideo()) {
      const prev = previousVideo();
      if (prev) {
        onVideoChange(prev as VideoItem);
        return true;
      }
    }
    return false;
  }, [hasPreviousVideo, previousVideo, onVideoChange]);

  const navigateToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < currentPlaylist.length) {
        const video = currentPlaylist[index];
        if (video) {
          onVideoChange(video as VideoItem);
          const { setCurrentIndex } = usePlaylistStore.getState();
          setCurrentIndex(index);
          return true;
        }
      }
      return false;
    },
    [currentPlaylist, onVideoChange]
  );

  // Auto-advance logic
  const autoAdvance = useCallback(() => {
    if (isPlayingPlaylist && hasNextVideo() && isPlaying) {
      setTimeout(() => {
        navigateToNext();
      }, 1000);
    }
  }, [isPlayingPlaylist, hasNextVideo, isPlaying, navigateToNext]);

  return {
    isPlayingPlaylist,
    currentVideoIndex,
    totalVideos: currentPlaylist.length,
    hasNext: hasNextVideo(),
    hasPrevious: hasPreviousVideo(),
    navigateToNext,
    navigateToPrevious,
    navigateToIndex,
    autoAdvance,
  };
};