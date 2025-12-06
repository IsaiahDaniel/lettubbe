import { useState, useEffect } from 'react';
import { imageDimensionsCache, ImageDimensions } from '@/services/image-dimensions-cache.service';
import { devLog } from '@/config/dev';

export const useImageDimensions = (imageUrl: string | undefined) => {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setDimensions(null);
      return;
    }

    const loadDimensions = async () => {
      // Check for cached dimensions first (sync check for memory cache)
      const cachedSync = imageDimensionsCache.getCachedDimensionsSync(imageUrl);
      if (cachedSync) {
        setDimensions(cachedSync);
        return;
      }

      setIsLoading(true);

      try {
        // Check AsyncStorage cache and measure if needed
        const result = await imageDimensionsCache.measureAndCacheDimensions(imageUrl);
        setDimensions(result);
      } catch (error) {
        devLog('CACHE', 'Error loading image dimensions:', error);
        setDimensions(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadDimensions();
  }, [imageUrl]);

  // Return dimensions in the format expected by VideoCardThumbnail
  return {
    dimensions: dimensions ? {
      width: dimensions.width,
      height: dimensions.height,
    } : null,
    aspectRatio: dimensions?.aspectRatio,
    isLoading,
  };
};

// Hook for preloading multiple image dimensions
export const usePreloadImageDimensions = (imageUrls: string[]) => {
  useEffect(() => {
    if (imageUrls.length === 0) return;

    const preload = async () => {
      try {
        await imageDimensionsCache.preloadDimensions(imageUrls);
      } catch (error) {
        devLog('CACHE', 'Error preloading image dimensions:', error);
      }
    };

    preload();
  }, [imageUrls.join(',')]); // Re-run when URLs change
};