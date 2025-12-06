import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { devLog } from '@/config/dev';
import { getPost } from '@/services/feed.service';
import { useGetVideoItemStore } from '@/store/feedStore';

// Flag to prevent normal app navigation when deep link is being processed
let isProcessingDeepLink = false;
let deepLinkCleanupFunction: (() => void) | null = null;

/**
 * Check if a deep link is currently being processed
 */
export const getIsProcessingDeepLink = (): boolean => {
  return isProcessingDeepLink;
};

export interface DeepLinkData {
  type: 'video' | 'photo' | 'community' | 'streaming' | 'unknown';
  id: string;
  url: string;
}

/**
 * Parse a deep link URL and extract relevant information
 */
export const parseDeepLink = (url: string): DeepLinkData | null => {
  try {
    devLog('DEEPLINK', 'Parsing URL:', url);
    console.log('DEEPLINK DEBUG: Parsing URL:', url);
    
    // Handle both custom schemes and https URLs
    const parsedUrl = new URL(url);
    const { hostname, pathname } = parsedUrl;
    
    // For lettubbe.com URLs  
    if (hostname === 'lettubbe.com' || hostname === 'www.lettubbe.com') {
      const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
      
      if (pathSegments.length >= 2) {
        const [type, id] = pathSegments;
        
        if (['video', 'photo', 'community', 'streaming'].includes(type) && id) {
          return {
            type: type as 'video' | 'photo' | 'community' | 'streaming',
            id,
            url
          };
        }
      }
    }
    
    // For lettubbe.online URLs
    if (hostname === 'lettubbe.online' || hostname === 'www.lettubbe.online') {
      const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
      
      if (pathSegments.length >= 2) {
        const [type, id] = pathSegments;
        
        if (type === 'streaming' && id) {
          return {
            type: 'streaming',
            id,
            url
          };
        }
      }
    }
    
    // For custom app scheme URLs (lettubbe://, myapp://, etc.)
    if (['lettubbe', 'myapp', 'com.lettubbe.myapp', 'exp+lettubbe'].includes(parsedUrl.protocol.replace(':', ''))) {
      console.log('DEEPLINK DEBUG: Found custom scheme URL');
      
      // For custom schemes, the format is: lettubbe://video/id
      // So hostname is the type, and pathname contains the id
      const type = parsedUrl.hostname;
      const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);
      const id = pathSegments[0]; // First path segment is the ID
      
      console.log('DEEPLINK DEBUG: Extracted type from hostname:', type, 'id from pathname:', id);
      
      if (['video', 'photo', 'community', 'streaming'].includes(type) && id) {
        const result = {
          type: type as 'video' | 'photo' | 'community' | 'streaming',
          id,
          url
        };
        console.log('DEEPLINK DEBUG: Parsed custom scheme result:', result);
        return result;
      }
    }
    
    devLog('DEEPLINK', 'URL format not recognized:', url);
    return null;
    
  } catch (error) {
    devLog('DEEPLINK', 'Error parsing URL:', error);
    return null;
  }
};


/**
 * Navigate to the appropriate screen based on deep link data
 */
export const navigateToDeepLink = async (linkData: DeepLinkData): Promise<void> => {
  try {
    console.log('🚀 DEEPLINK: navigateToDeepLink called with:', linkData);
    devLog('DEEPLINK', 'Navigating to:', linkData);
    
    // Validate linkData before proceeding
    if (!linkData || !linkData.type || !linkData.id) {
      console.log('🚀 DEEPLINK: Invalid link data, aborting navigation');
      router.replace('/(tabs)');
      isProcessingDeepLink = false;
      return;
    }
    
    // Navigate directly to the content with postId - components handle their own loading
    try {
      switch (linkData.type) {
        case 'photo':
          console.log('🎯 DEEPLINK: Loading photo data for store-based navigation with postId:', linkData.id);
          try {
            // Fetch post data to set in store
            const response = await getPost(linkData.id);
            
            if (response.data && (response.data.post || response.data._id)) {
              const postData = response.data.post || response.data;
              
              // Transform to VideoItem format for photos
              const isPhoto = postData.images && Array.isArray(postData.images) && postData.images.length > 0;
              
              const photoItem = {
                _id: postData._id,
                thumbnail: postData.thumbnail || (isPhoto ? postData.images[0] : ""),
                duration: postData.duration?.toString() || "",
                description: postData.description || "",
                videoUrl: postData.videoUrl || "",
                images: postData.images || [],
                photoUrl: isPhoto ? postData.images[0] : "",
                mediaType: 'photo' as const,
                mentions: postData.mentions || [],
                createdAt: postData.createdAt || "",
                comments: postData.comments || [],
                isCommentsAllowed: typeof postData.isCommentsAllowed === 'boolean' ? postData.isCommentsAllowed : undefined,
                reactions: {
                  likes: postData.reactions?.likes || []
                },
                viewCount: postData.reactions?.totalViews || 0,
                commentCount: postData.comments?.length || 0,
                user: {
                  username: postData.user?.username || "",
                  subscribers: postData.user?.subscribers || [],
                  _id: postData.user?._id || postData.user || "",
                  firstName: postData.user?.firstName || "",
                  lastName: postData.user?.lastName || "",
                  profilePicture: postData.user?.profilePicture || ""
                }
              };
              
              // Set the selected item in the store
              const { setSelectedItem } = useGetVideoItemStore.getState();
              setSelectedItem(photoItem);
              
              // Navigate to tabs - PhotoViewerModal will show automatically
              router.replace('/(tabs)');
            } else {
              console.log('🎯 DEEPLINK: Photo post not found, falling back to tabs');
              router.replace('/(tabs)');
            }
          } catch (error) {
            console.log('🎯 DEEPLINK: Error fetching photo data:', error);
            router.replace('/(tabs)');
          }
          break;
          
        case 'video':
          console.log('🎯 DEEPLINK: Navigating directly to VideoPlayerWrapper with postId:', linkData.id);
          router.replace(`/(home)/VideoPlayerWrapper?postId=${linkData.id}`);
          break;
          
        case 'community':
          console.log('🎯 DEEPLINK: Navigating to Community with id:', linkData.id);
          router.replace(`/community/${linkData.id}`);
          break;
          
        case 'streaming':
          console.log('🎯 DEEPLINK: Navigating to Stream with id:', linkData.id);
          router.replace(`/stream/${linkData.id}`);
          break;
          
        default:
          console.log('DEEPLINK: Unknown link type:', linkData.type);
          router.replace('/(tabs)');
      }
    } catch (navigationError) {
      console.log('🎯 DEEPLINK: Error in specific navigation, falling back to tabs:', navigationError);
      router.replace('/(tabs)');
    }
    
    // Always reset the processing flag
    isProcessingDeepLink = false;
    
  } catch (error) {
    console.log('DEEPLINK: Critical error in navigateToDeepLink:', error);
    // Defensive fallback - try multiple navigation approaches
    try {
      router.replace('/(tabs)');
    } catch (fallbackError) {
      console.log('DEEPLINK: Even fallback navigation failed:', fallbackError);
      // Last resort - try to reset app state
      setTimeout(() => {
        try {
          router.replace('/');
        } catch (lastResortError) {
          console.log('DEEPLINK: Last resort navigation failed:', lastResortError);
        }
      }, 1000);
    }
    isProcessingDeepLink = false;
  }
};

/**
 * Wait for app stores and critical services to be ready
 */
const waitForAppReady = async (): Promise<boolean> => {
  console.log('🔗 DEEPLINK: Waiting for app to be ready...');
  let attempts = 0;
  const maxAttempts = 8; // 2 seconds max wait
  
  while (attempts < maxAttempts) {
    try {
      // Check if required modules are available
      if (typeof router?.replace === 'function') {
        console.log('🔗 DEEPLINK: App readiness check passed');
        return true;
      }
    } catch (error) {
      console.log('🔗 DEEPLINK: App not ready yet, attempt:', attempts + 1);
    }
    
    await new Promise(resolve => setTimeout(resolve, 250));
    attempts++;
  }
  
  console.log('🔗 DEEPLINK: App readiness check failed after max attempts');
  return false;
};

/**
 * Handle initial URL when app is opened via deep link
 */
export const handleInitialURL = async (): Promise<void> => {
  try {
    console.log('🔗 DEEPLINK: handleInitialURL called');
    
    // Minimal wait for app initialization - direct navigation approach
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if app is ready before proceeding
    const isAppReady = await waitForAppReady();
    if (!isAppReady) {
      console.log('🔗 DEEPLINK: App not ready, aborting deep link processing');
      isProcessingDeepLink = false;
      return;
    }
    
    const initialUrl = await Linking.getInitialURL();
    
    if (initialUrl) {
      console.log('🔗 DEEPLINK: Initial URL detected:', initialUrl);
      devLog('DEEPLINK', 'Initial URL detected:', initialUrl);
      
      // Set flag to prevent normal app navigation
      isProcessingDeepLink = true;
      
      // Validate URL format before processing
      if (!isValidDeepLink(initialUrl)) {
        console.log('🔗 DEEPLINK: Invalid URL format');
        isProcessingDeepLink = false;
        return;
      }
      
      const linkData = parseDeepLink(initialUrl);
      
      if (linkData) {
        // Minimal wait before direct navigation
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Final readiness check before navigation
        const finalReadyCheck = await waitForAppReady();
        if (!finalReadyCheck) {
          console.log('🔗 DEEPLINK: Final readiness check failed, aborting navigation');
          router.replace('/(tabs)');
          isProcessingDeepLink = false;
          return;
        }
        
        // Wrap navigation in try-catch for crash prevention
        try {
          await navigateToDeepLink(linkData);
        } catch (navError) {
          console.log('🔗 DEEPLINK: Navigation error, falling back to home:', navError);
          router.replace('/(tabs)');
          isProcessingDeepLink = false;
        }
      } else {
        console.log('🔗 DEEPLINK: Failed to parse URL');
        router.replace('/(tabs)');
        isProcessingDeepLink = false;
      }
    } else {
      console.log('🔗 DEEPLINK: No initial URL found');
    }
  } catch (error) {
    console.log('🔗 DEEPLINK: Error handling initial URL:', error);
    // Always ensure we don't leave the app in a broken state
    try {
      router.replace('/(tabs)');
    } catch (fallbackError) {
      console.log('🔗 DEEPLINK: Even fallback navigation failed:', fallbackError);
    }
    isProcessingDeepLink = false;
  }
};

/**
 * Initialize deep linking system with proper cleanup
 */
export const initializeDeepLinking = (): (() => void) => {
  console.log('🔗 DEEPLINK: Initializing deep linking system');
  
  // Clean up any existing listeners
  if (deepLinkCleanupFunction) {
    try {
      deepLinkCleanupFunction();
    } catch (cleanupError) {
      console.log('🔗 DEEPLINK: Error during existing cleanup:', cleanupError);
    }
    deepLinkCleanupFunction = null;
  }
  
  // Reset processing flag on initialization
  isProcessingDeepLink = false;
  
  // Add safety timeout to prevent infinite blocking
  const safetyTimeout = setTimeout(() => {
    if (isProcessingDeepLink) {
      console.log('🔗 DEEPLINK: Safety timeout - forcing reset after 5 seconds');
      isProcessingDeepLink = false;
      try {
        router.replace('/(tabs)');
      } catch (error) {
        console.log('🔗 DEEPLINK: Error in safety timeout navigation:', error);
      }
    }
  }, 5000); // 5 second maximum processing time
  
  // Handle initial URL if app was opened via deep link - with error boundaries
  try {
    handleInitialURL();
  } catch (initialUrlError) {
    console.log('🔗 DEEPLINK: Error handling initial URL:', initialUrlError);
    isProcessingDeepLink = false;
  }
  
  // Set up listener for runtime deep links - with error boundaries
  try {
    deepLinkCleanupFunction = setupDeepLinkListener();
  } catch (listenerError) {
    console.log('🔗 DEEPLINK: Error setting up listener:', listenerError);
    deepLinkCleanupFunction = null;
  }
  
  return () => {
    console.log('🔗 DEEPLINK: Cleaning up deep linking system');
    try {
      // Clear safety timeout
      clearTimeout(safetyTimeout);
      
      if (deepLinkCleanupFunction) {
        deepLinkCleanupFunction();
        deepLinkCleanupFunction = null;
      }
    } catch (cleanupError) {
      console.log('🔗 DEEPLINK: Error during cleanup:', cleanupError);
    } finally {
      isProcessingDeepLink = false;
    }
  };
};

/**
 * Set up listener for incoming deep links while app is running
 */
export const setupDeepLinkListener = (): (() => void) => {
  const handleURL = (event: { url: string }) => {
    try {
      console.log('🔗 DEEPLINK LISTENER: Incoming URL while app running:', event.url);
      devLog('DEEPLINK', 'Incoming URL while app running:', event.url);
      
      // Validate URL format before processing
      if (!isValidDeepLink(event.url)) {
        console.log('🔗 DEEPLINK LISTENER: Invalid URL format, ignoring:', event.url);
        devLog('DEEPLINK', 'Invalid URL format, ignoring:', event.url);
        return;
      }
      
      const linkData = parseDeepLink(event.url);
      console.log('🔗 DEEPLINK LISTENER: Parsed runtime link data:', linkData);
      
      if (linkData) {
        console.log('🔗 DEEPLINK LISTENER: Calling navigateToDeepLink for runtime URL');
        // Set flag to prevent any competing navigation
        isProcessingDeepLink = true;
        console.log('🔗 DEEPLINK LISTENER: Set isProcessingDeepLink = true for runtime URL');
        navigateToDeepLink(linkData);
      } else {
        console.log('🔗 DEEPLINK LISTENER: Failed to parse runtime URL, ignoring');
        devLog('DEEPLINK', 'Failed to parse URL, ignoring');
      }
    } catch (error) {
      console.log('🔗 DEEPLINK LISTENER: Error handling incoming URL:', error);
      devLog('DEEPLINK', 'Error handling incoming URL:', error);
    }
  };
  
  console.log('🔗 DEEPLINK LISTENER: Setting up addEventListener');
  const subscription = Linking.addEventListener('url', handleURL);
  
  console.log('🔗 DEEPLINK LISTENER: Listener setup complete');
  
  // Return cleanup function
  return () => {
    console.log('🔗 DEEPLINK LISTENER: Removing listener');
    subscription?.remove();
  };
};

/**
 * Generate a deep link URL for sharing
 */
export const generateDeepLink = (type: 'video' | 'photo' | 'community' | 'streaming', id: string): string => {
  const domain = type === 'streaming' ? 'lettubbe.online' : 'lettubbe.com';
  return `https://${domain}/${type}/${id}`;
};

/**
 * Validate if a URL is a valid deep link format
 */
export const isValidDeepLink = (url: string): boolean => {
  try {
    console.log('DEEPLINK DEBUG: Validating URL:', url);
    // Basic URL validation
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      console.log('DEEPLINK DEBUG: Invalid URL - empty or not string');
      return false;
    }
    
    // Check if it's a valid URL format
    const parsedUrl = new URL(url);
    console.log('DEEPLINK DEBUG: Parsed URL:', {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname
    });
    
    // Check for lettubbe.com domain
    if (parsedUrl.hostname === 'lettubbe.com' || parsedUrl.hostname === 'www.lettubbe.com') {
      const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);
      
      // Must have exactly 2 path segments: type and id
      if (pathSegments.length !== 2) {
        return false;
      }
      
      const [type, id] = pathSegments;
      
      // Valid types for .com domain
      if (!['video', 'photo', 'community'].includes(type)) {
        return false;
      }
      
      // ID should be a non-empty string
      if (!id || id.trim().length === 0) {
        return false;
      }
      
      return true;
    }
    
    // Check for lettubbe.online domain
    if (parsedUrl.hostname === 'lettubbe.online' || parsedUrl.hostname === 'www.lettubbe.online') {
      const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);
      
      // Must have exactly 2 path segments: type and id
      if (pathSegments.length !== 2) {
        return false;
      }
      
      const [type, id] = pathSegments;
      
      // Only streaming is valid for .online domain
      if (type !== 'streaming') {
        return false;
      }
      
      // ID should be a non-empty string
      if (!id || id.trim().length === 0) {
        return false;
      }
      
      return true;
    }
    
    // Check for custom app schemes
    const customSchemes = ['lettubbe', 'myapp', 'com.lettubbe.myapp', 'exp+lettubbe'];
    const scheme = parsedUrl.protocol.replace(':', '');
    console.log('DEEPLINK DEBUG: Checking scheme:', scheme);
    
    if (customSchemes.includes(scheme)) {
      console.log('DEEPLINK DEBUG: Found matching custom scheme');
      
      // For custom schemes, the format is: lettubbe://video/id
      // So hostname is the type, and pathname contains the id
      const type = parsedUrl.hostname;
      const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);
      const id = pathSegments[0]; // First path segment is the ID
      
      console.log('DEEPLINK DEBUG: Type from hostname:', type, 'ID from pathname:', id);
      
      if (type && id) {
        const isValid = ['video', 'photo', 'community', 'streaming'].includes(type) && 
               typeof id === 'string' && id.trim().length > 0;
        console.log('DEEPLINK DEBUG: Validation result:', isValid);
        return isValid;
      } else {
        console.log('DEEPLINK DEBUG: Missing type or id');
      }
    } else {
      console.log('DEEPLINK DEBUG: Scheme not in custom schemes list');
    }
    
    console.log('DEEPLINK DEBUG: URL validation failed');
    return false;
    
  } catch (error) {
    devLog('DEEPLINK', 'URL validation error:', error);
    return false;
  }
};