import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import { useVideoTransition as useVideoTransitionContext } from '@/contexts/VideoTransitionContext';

interface ThumbnailDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const useVideoTransitionHook = () => {
  const { thumbnailPosition, setThumbnailPosition, clearThumbnailPosition } = useVideoTransitionContext();

  const storeThumbnailDimensions = useCallback((dimensions: ThumbnailDimensions) => {
    setThumbnailPosition(dimensions);
  }, [setThumbnailPosition]);

  const getThumbnailDimensions = useCallback(() => {
    return thumbnailPosition;
  }, [thumbnailPosition]);

  const clearThumbnailDimensions = useCallback(() => {
    clearThumbnailPosition();
  }, [clearThumbnailPosition]);

  // Calculate video player transition values
  const getTransitionValues = useCallback(() => {
    const thumbnail = thumbnailPosition;
    if (!thumbnail) {
      // Default fallback values
      return {
        initialScale: 0.1,
        initialX: SCREEN_WIDTH / 2,
        initialY: 200,
      };
    }

    const targetWidth = SCREEN_WIDTH;
    const targetHeight = SCREEN_WIDTH * (9 / 16); // 16:9 aspect ratio
    
    const scaleX = thumbnail.width / targetWidth;
    const scaleY = thumbnail.height / targetHeight;
    const scale = Math.min(scaleX, scaleY);

    const centerX = thumbnail.x + thumbnail.width / 2;
    const centerY = thumbnail.y + thumbnail.height / 2;
    
    const targetCenterX = SCREEN_WIDTH / 2;
    const targetCenterY = targetHeight / 2;

    return {
      initialScale: scale,
      initialX: centerX - targetCenterX,
      initialY: centerY - targetCenterY,
    };
  }, [thumbnailPosition]);

  return {
    storeThumbnailDimensions,
    getThumbnailDimensions,
    clearThumbnailDimensions,
    getTransitionValues,
  };
};