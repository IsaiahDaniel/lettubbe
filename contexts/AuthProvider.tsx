import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getData, removeData, storeData } from '@/helpers/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInteractionStore } from '@/hooks/interactions/useInteractionStore';
import { router } from 'expo-router';
import { devLog } from '@/config/dev';
import axios from 'axios';
import { baseURL, setGlobalLogoutCallback } from '@/config/axiosInstance';
import { feedCacheService, CachedPost } from '@/services/simple-feed-cache.service';

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  profilePicture?: string;
  [key: string]: any;
}

interface AuthContextType {
  userDetails: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  logout: () => Promise<void>;
  refreshAuthData: () => Promise<void>;
  cachedPosts: CachedPost[];
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Centralized auth state management with single source of truth for user ID
 * 
 * Provides auth state to all components while exclusively managing user ID
 * in InteractionStore to prevent race conditions and state conflicts
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedPosts, setCachedPosts] = useState<CachedPost[]>([]);
  const initializationRef = useRef(false);

  const { setCurrentUserId, resetStore } = useInteractionStore();

  /**
   * Load auth data from AsyncStorage with proper error handling
   * 
   * Ensures auth data is fully loaded before setting loading to false
   */
  const loadAuthData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      devLog('AUTH', 'AUTH_PROVIDER: Loading auth data from storage');
      
      // Load user and token in parallel for better performance
      const [user, tokenValue, refreshTokenValue] = await Promise.all([
        getData<User>("userInfo"),
        getData<string>("token"),
        getData<string>("refreshToken")
      ]);
      
      devLog('AUTH', 'AUTH_PROVIDER: Loaded data:', { 
        hasUser: !!user, 
        hasToken: !!tokenValue,
        hasRefreshToken: !!refreshTokenValue,
        userId: user?._id 
      });

      // Set auth data directly - let axios interceptor handle token refresh when needed
      if (tokenValue && user) {
        devLog('AUTH', 'AUTH_PROVIDER: Setting auth data - axios interceptor will handle refresh when needed');
        setUserDetails(user);
        setToken(tokenValue);
      } else {
        devLog('AUTH', 'AUTH_PROVIDER: Missing required auth data - checking if user data is valid');

        // If we have user info but no token, this is an incomplete auth state
        // Clear user info to force proper re-authentication
        if (user && !tokenValue) {
          devLog('AUTH', 'AUTH_PROVIDER: User info exists but token missing - clearing user data for clean state');
          await removeData("userInfo");
          setUserDetails(null);
          setToken(null);
        } else {
          // Only set auth data if we have all required pieces or if everything is missing
          setUserDetails(user);
          setToken(tokenValue);
        }
      }

      // Load cached posts immediately for instant display
      try {
        devLog('AUTH', 'AUTH_PROVIDER: Loading cached posts for instant app startup');
        const cached = await feedCacheService.getCachedPosts();
        if (cached.length > 0) {
          setCachedPosts(cached);
          devLog('AUTH', `AUTH_PROVIDER: Loaded ${cached.length} cached posts for instant display`);
        }
      } catch (cacheError) {
        devLog('AUTH', 'AUTH_PROVIDER: Error loading cached posts:', cacheError);
        // Don't fail auth loading if cache fails
      }

      return Promise.resolve();
    } catch (error: unknown) {
      devLog('AUTH', 'AUTH_PROVIDER: Error loading auth data:', error);
      // Set safe defaults on error to prevent app crash
      setUserDetails(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Centralized logout with proper cleanup
   *
   * Ensures all auth-related data is cleared consistently without
   * using nuclear AsyncStorage.clear() that removes onboarding flags
   */
  const logout = async (): Promise<void> => {
    try {
      devLog('AUTH', 'AUTH_PROVIDER: Starting logout process');

      // Check if user was actually authenticated before logout
      const wasAuthenticated = !!(userDetails && token);
      devLog('AUTH', 'AUTH_PROVIDER: User was authenticated:', wasAuthenticated);

      // Clear specific auth-related keys instead of AsyncStorage.clear()
      await Promise.all([
        removeData("userInfo"),
        removeData("token"),
        removeData("expoPushToken")
      ]);

      // Reset auth state
      setUserDetails(null);
      setToken(null);

      // Reset interaction store
      resetStore();

      devLog('AUTH', 'AUTH_PROVIDER: Logout completed successfully');

      // Only navigate to standalone login if user was actually authenticated
      if (wasAuthenticated) {
        devLog('AUTH', 'AUTH_PROVIDER: User was authenticated, navigating to standalone login');
        router.replace("/(auth)/StandaloneLoginContent");
      } else {
        devLog('AUTH', 'AUTH_PROVIDER: User was not authenticated, skipping navigation');
      }

    } catch (error: unknown) {
      devLog('AUTH', 'AUTH_PROVIDER: Error during logout:', error);
      // Only navigate if we had auth data that needed clearing
      const wasAuthenticated = !!(userDetails && token);
      if (wasAuthenticated) {
        router.replace("/(auth)/StandaloneLoginContent");
      }
    }
  };

  /**
   * Public method to refresh auth data
   * 
   * Allows components to trigger auth data reload when needed
   */
  const refreshAuthData = async (): Promise<void> => {
    await loadAuthData();
  };

  /**
   * Initialize auth data on mount
   *
   * Loads auth data once when provider mounts
   */
  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      loadAuthData();
    }
  }, []);

  /**
   * Register logout callback with axios interceptor
   *
   * Updates the callback whenever logout function changes to prevent stale closures
   */
  useEffect(() => {
    setGlobalLogoutCallback(logout);

    // Cleanup: unregister callback when component unmounts
    return () => {
      setGlobalLogoutCallback(null);
    };
  }, [logout]);

  /**
   * EXCLUSIVELY manage user ID in InteractionStore with sync coordination
   * 
   * This is the ONLY place where setCurrentUserId should be called.
   * Also coordinates interaction sync to ensure it happens when auth is ready.
   */
  useEffect(() => {
    const userId = userDetails?._id || null;
    
    if (userId && !isLoading) {
      devLog('AUTH', 'AUTH_PROVIDER: Setting user ID in InteractionStore:', userId);
      setCurrentUserId(userId);
      
      // DOING THIS LATER - Trigger interaction sync here once auth is confirmed
      // This ensures sync happens exactly once when user is authenticated
      // and prevents race conditions with components trying to sync before user ID is set
      
    } else {
      devLog('AUTH', 'AUTH_PROVIDER: Clearing user ID from InteractionStore');
      setCurrentUserId(null);
    }
  }, [userDetails?._id, isLoading, setCurrentUserId]);

  // Derived values
  const isAuthenticated = !!(userDetails && token);
  const userId = userDetails?._id || null;

  const contextValue: AuthContextType = {
    userDetails,
    token,
    isLoading,
    isAuthenticated,
    userId,
    logout,
    refreshAuthData,
    cachedPosts,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Safe hook for consuming auth context
 * 
 * Provides type-safe access to auth state with clear error messaging
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthProvider;