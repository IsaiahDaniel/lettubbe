import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for lazy loading features after delay
 */

export const useLazyFeatures = (delay: number = 1000) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEnabled(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isEnabled;
};

/**
 * Hook for lazy loading upload features only when needed
 * Activates when user first interacts with file picker
 */
export const useLazyUploadFeatures = () => {
  const [isUploadEnabled, setIsUploadEnabled] = useState(false);

  const enableUploads = useCallback(() => {
    setIsUploadEnabled(true);
  }, []);

  return {
    isUploadEnabled,
    enableUploads,
  };
};

/**
 * Hook for lazy loading profile features after messages are loaded
 * Improves perceived performance by prioritizing message display
 */
export const useLazyProfileFeatures = (messagesLoaded: boolean, delay: number = 500) => {
  const [isProfileEnabled, setIsProfileEnabled] = useState(false);

  useEffect(() => {
    if (messagesLoaded) {
      const timer = setTimeout(() => {
        setIsProfileEnabled(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [messagesLoaded, delay]);

  return isProfileEnabled;
};

/**
 * Hook for optimized parameter extraction
 * Reduces redundant memoization by grouping related parameters
 */
export const useInboxParams = (searchParams: any) => {
  const [params] = useState(() => ({
    chatId: searchParams.Id?.toString() || '',
    username: searchParams.username?.toString() || '',
    displayName: searchParams.displayName?.toString() || '',
    userId: searchParams.userId?.toString() || '',
    subscriberCount: searchParams.subscriberCount?.toString() || '0',
    avatar: searchParams.avatar?.toString() || '',
    shareVideoData: searchParams.shareVideoData?.toString() || '',
  }));

  return params;
};