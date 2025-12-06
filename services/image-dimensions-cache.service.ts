import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { devLog } from '@/config/dev';

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  url: string;
  cachedAt: number;
}

class ImageDimensionsCacheService {
  private readonly CACHE_KEY = 'imageDimensionsCache';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MEMORY_CACHE = new Map<string, ImageDimensions>();

  async getCachedDimensions(imageUrl: string): Promise<ImageDimensions | null> {
    try {
      // Check memory cache first (fastest)
      const memoryResult = this.MEMORY_CACHE.get(imageUrl);
      if (memoryResult) {
        return memoryResult;
      }

      // Check AsyncStorage cache
      const cacheString = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cacheString) return null;

      const cache: Record<string, ImageDimensions> = JSON.parse(cacheString);
      const cached = cache[imageUrl];

      if (!cached) return null;

      // Check if expired
      const isExpired = Date.now() - cached.cachedAt > this.CACHE_DURATION;
      if (isExpired) {
        delete cache[imageUrl];
        await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      // Add to memory cache for faster future access
      this.MEMORY_CACHE.set(imageUrl, cached);
      return cached;
    } catch (error) {
      devLog('CACHE', 'Error getting cached dimensions:', error);
      return null;
    }
  }

  async cacheDimensions(imageUrl: string, width: number, height: number): Promise<void> {
    try {
      const dimensions: ImageDimensions = {
        width,
        height,
        aspectRatio: width / height,
        url: imageUrl,
        cachedAt: Date.now(),
      };

      // Store in memory cache immediately
      this.MEMORY_CACHE.set(imageUrl, dimensions);

      // Store in AsyncStorage
      const cacheString = await AsyncStorage.getItem(this.CACHE_KEY);
      const cache: Record<string, ImageDimensions> = cacheString ? JSON.parse(cacheString) : {};

      cache[imageUrl] = dimensions;
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));

      devLog('CACHE', `Cached dimensions for image: ${width}x${height}`, 'PERFORMANCE');
    } catch (error) {
      devLog('CACHE', 'Error caching dimensions:', error);
    }
  }

  async measureAndCacheDimensions(imageUrl: string): Promise<ImageDimensions | null> {
    try {
      // Check if already cached
      const cached = await this.getCachedDimensions(imageUrl);
      if (cached) {
        return cached;
      }

      // Measure the image
      return new Promise((resolve) => {
        Image.getSize(
          imageUrl,
          (width, height) => {
            this.cacheDimensions(imageUrl, width, height);
            resolve({
              width,
              height,
              aspectRatio: width / height,
              url: imageUrl,
              cachedAt: Date.now(),
            });
          },
          (error) => {
            devLog('CACHE', `Failed to measure image dimensions for ${imageUrl}:`, error);
            resolve(null);
          }
        );
      });
    } catch (error) {
      devLog('CACHE', 'Error measuring image dimensions:', error);
      return null;
    }
  }

  async preloadDimensions(imageUrls: string[]): Promise<void> {
    try {
      const uncachedUrls = [];

      // Check which URLs need measuring
      for (const url of imageUrls) {
        const cached = await this.getCachedDimensions(url);
        if (!cached) {
          uncachedUrls.push(url);
        }
      }

      if (uncachedUrls.length === 0) {
        devLog('CACHE', 'All image dimensions already cached');
        return;
      }

      devLog('CACHE', `Pre-measuring ${uncachedUrls.length} image dimensions`);

      // Measure dimensions in parallel with limited concurrency
      const promises = uncachedUrls.map(url => this.measureAndCacheDimensions(url));
      await Promise.allSettled(promises);

      devLog('CACHE', `Completed pre-measuring image dimensions`);
    } catch (error) {
      devLog('CACHE', 'Error preloading dimensions:', error);
    }
  }

  async clearOldCache(): Promise<void> {
    try {
      const cacheString = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cacheString) return;

      const cache: Record<string, ImageDimensions> = JSON.parse(cacheString);
      const now = Date.now();

      // Remove expired entries
      const cleanedCache: Record<string, ImageDimensions> = {};
      let removedCount = 0;

      for (const [url, dimensions] of Object.entries(cache)) {
        if (now - dimensions.cachedAt < this.CACHE_DURATION) {
          cleanedCache[url] = dimensions;
        } else {
          removedCount++;
          // Also remove from memory cache
          this.MEMORY_CACHE.delete(url);
        }
      }

      if (removedCount > 0) {
        await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cleanedCache));
        devLog('CACHE', `Cleaned ${removedCount} expired image dimension entries`);
      }
    } catch (error) {
      devLog('CACHE', 'Error cleaning cache:', error);
    }
  }

  getCachedDimensionsSync(imageUrl: string): ImageDimensions | null {
    return this.MEMORY_CACHE.get(imageUrl) || null;
  }
}

export const imageDimensionsCache = new ImageDimensionsCacheService();