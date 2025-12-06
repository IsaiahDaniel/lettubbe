import AsyncStorage from '@react-native-async-storage/async-storage';
import { devLog } from "@/config/dev";
import { imageDimensionsCache } from './image-dimensions-cache.service';

export interface CachedPost {
  _id: string;
  thumbnail: string;
  images?: string[];
  photoUrl?: string;
  duration: string;
  description: string;
  videoUrl: string;
  mediaType?: 'photo' | 'video';
  createdAt: string;
  reactions: {
    likes: string[];
    totalViews?: number;
  };
  user: {
    username: any;
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  commentCount?: number;
  isCommentsAllowed?: boolean;
  isPinned?: boolean;
  thumbnailDimensions?: {
    width: number;
    height: number;
  };
}

export interface FeedCacheData {
  posts: CachedPost[];
  timestamp: number;
  userInteractions: {
    likes: string[];
    bookmarks: string[];
    playsCount: Record<string, number>;
  };
}

class SimpleFeedCacheService {
  private readonly CACHE_KEY = 'homeFeedCache';
  private readonly MAX_POSTS = 10;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async getCachedFeed(): Promise<FeedCacheData | null> {
    try {
      const cachedDataString = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cachedDataString) {
        devLog('CACHE', 'No cached feed data found');
        return null;
      }

      const cachedData: FeedCacheData = JSON.parse(cachedDataString);

      // Check if cache is expired
      const isExpired = Date.now() - cachedData.timestamp > this.CACHE_DURATION;
      if (isExpired) {
        devLog('CACHE', 'Cached feed data expired, removing');
        await this.clearCache();
        return null;
      }

      devLog('CACHE', `Retrieved ${cachedData.posts.length} cached posts from AsyncStorage`);
      return cachedData;
    } catch (error) {
      devLog('CACHE', 'Error retrieving cached feed:', error);
      return null;
    }
  }

  async cacheFeed(posts: any[], userInteractions?: {
    likes: string[];
    bookmarks: string[];
    playsCount: Record<string, number>;
  }): Promise<void> {
    try {
      // Pre-measure and cache image dimensions for all posts
      const imageUrls: string[] = [];
      posts.slice(0, this.MAX_POSTS).forEach(post => {
        if (post.thumbnail) imageUrls.push(post.thumbnail);
        if (post.images && Array.isArray(post.images)) {
          imageUrls.push(...post.images);
        }
        if (post.photoUrl) imageUrls.push(post.photoUrl);
      });

      // Start background dimension caching (don't wait for it)
      imageDimensionsCache.preloadDimensions(imageUrls).catch(error =>
        devLog('CACHE', 'Background dimension preloading failed:', error)
      );

      // Cache posts with any available dimensions
      const postsToCache = await Promise.all(
        posts.slice(0, this.MAX_POSTS).map(async post => {
          // Get cached dimensions for thumbnail
          const thumbnailDimensions = post.thumbnail
            ? await imageDimensionsCache.getCachedDimensions(post.thumbnail)
            : null;

          return {
            _id: post._id,
            thumbnail: post.thumbnail,
            images: post.images,
            photoUrl: post.photoUrl,
            duration: post.duration,
            description: post.description, // Keep full description
            videoUrl: post.videoUrl,
            mediaType: post.mediaType,
            createdAt: post.createdAt,
            reactions: {
              likes: post.reactions?.likes || [],
              totalViews: post.reactions?.totalViews || post.totalViews || 0,
            },
            user: {
              username: post.user?.username,
              _id: post.user?._id,
              firstName: post.user?.firstName,
              lastName: post.user?.lastName,
              profilePicture: post.user?.profilePicture,
            },
            commentCount: post.commentCount || 0,
            isCommentsAllowed: post.isCommentsAllowed,
            isPinned: post.isPinned,
            // Include cached thumbnail dimensions
            thumbnailDimensions: thumbnailDimensions ? {
              width: thumbnailDimensions.width,
              height: thumbnailDimensions.height,
            } : undefined,
          };
        })
      );

      const cacheData: FeedCacheData = {
        posts: postsToCache,
        timestamp: Date.now(),
        userInteractions: userInteractions || {
          likes: [],
          bookmarks: [],
          playsCount: {},
        },
      };

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      devLog('CACHE', `Cached ${postsToCache.length} posts successfully in AsyncStorage`);
    } catch (error) {
      devLog('CACHE', 'Error caching feed:', error);
    }
  }

  async updateUserInteractions(interactions: {
    likes: string[];
    bookmarks: string[];
    playsCount: Record<string, number>;
  }): Promise<void> {
    try {
      const cachedData = await this.getCachedFeed();
      if (!cachedData) return;

      cachedData.userInteractions = interactions;
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cachedData));
      devLog('CACHE', 'Updated user interactions in AsyncStorage cache');
    } catch (error) {
      devLog('CACHE', 'Error updating user interactions:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      devLog('CACHE', 'Feed cache cleared from AsyncStorage');
    } catch (error) {
      devLog('CACHE', 'Error clearing cache:', error);
    }
  }

  async isCacheValid(): Promise<boolean> {
    const cachedData = await this.getCachedFeed();
    return cachedData !== null;
  }

  // Get just the posts for immediate display
  async getCachedPosts(): Promise<CachedPost[]> {
    const cachedData = await this.getCachedFeed();
    return cachedData?.posts || [];
  }

  // Get user interactions from cache
  async getCachedInteractions(): Promise<{
    likes: string[];
    bookmarks: string[];
    playsCount: Record<string, number>;
  }> {
    const cachedData = await this.getCachedFeed();
    return cachedData?.userInteractions || {
      likes: [],
      bookmarks: [],
      playsCount: {},
    };
  }
}

export const feedCacheService = new SimpleFeedCacheService();