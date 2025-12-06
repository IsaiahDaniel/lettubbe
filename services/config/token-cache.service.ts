import { getData } from '@/helpers/utils/storage';

let tokenCache: string | null = null;
let refreshTokenCache: string | null = null;

// Promise-based caching to prevent race conditions
let tokenPromise: Promise<string | null> | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;
let cacheTimestamp: number = 0;

// Cache TTL - tokens expire from cache after 5 minutes for security
const CACHE_TTL_MS = 5 * 60 * 1000;

export const getToken = async (key: 'token' | 'refreshToken'): Promise<string | null> => {
  const now = Date.now();
  
  // Check if cache is expired
  if (now - cacheTimestamp > CACHE_TTL_MS) {
    invalidate();
  }
  
  // Return cached value if available
  const cached = key === 'token' ? tokenCache : refreshTokenCache;
  if (cached) {
    return cached;
  }
  
  // Return in-flight promise if exists (prevents concurrent fetches)
  const existingPromise = key === 'token' ? tokenPromise : refreshTokenPromise;
  if (existingPromise) {
    return existingPromise;
  }
  
  // Create new fetch promise
  const promise = getData<string>(key).then(token => {
    // Update cache
    if (key === 'token') {
      tokenCache = token;
      tokenPromise = null; // Clear promise
    } else {
      refreshTokenCache = token;
      refreshTokenPromise = null; // Clear promise
    }
    cacheTimestamp = now;
    return token;
  }).catch(error => {
    // Clear promise on error
    if (key === 'token') {
      tokenPromise = null;
    } else {
      refreshTokenPromise = null;
    }
    throw error;
  });
  
  // Store promise to prevent concurrent requests
  if (key === 'token') {
    tokenPromise = promise;
  } else {
    refreshTokenPromise = promise;
  }
  
  return promise;
};

export const updateCache = (accessToken: string, refreshToken: string | null): void => {
  tokenCache = accessToken;
  refreshTokenCache = refreshToken;
  cacheTimestamp = Date.now();
  
  // Clear any in-flight promises since we have fresh data
  tokenPromise = null;
  refreshTokenPromise = null;
};

export const invalidate = (): void => {
  tokenCache = null;
  refreshTokenCache = null;
  tokenPromise = null;
  refreshTokenPromise = null;
  cacheTimestamp = 0;
};