import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Dimensions } from 'react-native';

interface ThumbnailPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VideoTransitionContextType {
  isTransitioning: boolean;
  thumbnailPosition: ThumbnailPosition | null;
  setThumbnailPosition: (position: ThumbnailPosition) => void;
  startTransition: () => void;
  endTransition: () => void;
  clearThumbnailPosition: () => void;
}

const VideoTransitionContext = createContext<VideoTransitionContextType | undefined>(undefined);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const VideoTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [thumbnailPosition, setThumbnailPositionState] = useState<ThumbnailPosition | null>(null);

  const setThumbnailPosition = useCallback((position: ThumbnailPosition) => {
    console.log('VideoTransitionContext: setThumbnailPosition called with:', position);
    setThumbnailPositionState(position);
  }, []);

  const startTransition = useCallback(() => {
    console.log('VideoTransitionContext: startTransition called');
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    console.log('VideoTransitionContext: endTransition called');
    setIsTransitioning(false);
  }, []);

  const clearThumbnailPosition = useCallback(() => {
    setThumbnailPositionState(null);
  }, []);

  const value: VideoTransitionContextType = {
    isTransitioning,
    thumbnailPosition,
    setThumbnailPosition,
    startTransition,
    endTransition,
    clearThumbnailPosition,
  };

  return (
    <VideoTransitionContext.Provider value={value}>
      {children}
    </VideoTransitionContext.Provider>
  );
};

export const useVideoTransition = () => {
  const context = useContext(VideoTransitionContext);
  if (context === undefined) {
    throw new Error('useVideoTransition must be used within a VideoTransitionProvider');
  }
  return context;
};