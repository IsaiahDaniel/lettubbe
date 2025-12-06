import { AxiosInstance } from 'axios';
import { axiosFactoryService } from '@/services/config/axios-factory.service';
import { setGlobalLogoutCallback as setLogoutCallback } from '@/services/config/logout-handler.service';
import { invalidate as invalidateTokenCache } from '@/services/config/token-cache.service';
import { registerTokenCacheInvalidator } from '@/helpers/utils/storage';

const isDev = false;

export const rootBaseUrl = isDev ? "https://dev.lettubbe.com/" : "https://api.lettubbe.com";
export const baseURL = isDev ? "https://dev.lettubbe.com/api/v1" : "https://api.lettubbe.com/api/v1";

// export const rootBaseUrl = isDev ? "http://10.162.157.98:5000" : "http://10.162.157.98:5000";
// export const baseURL = isDev ? "http://10.162.157.98:5000/api/v1" : "http://10.162.157.98:5000/api/v1";

// Register token cache invalidation with storage utility
registerTokenCacheInvalidator(() => invalidateTokenCache());

/**
 * Sets global logout callback (called by AuthProvider)
 */
export const setGlobalLogoutCallback = (callback: (() => Promise<void>) | null): void => {
  setLogoutCallback(callback);
};

/**
 * Gets authenticated Axios instance
 */
export const getInstance = async (): Promise<AxiosInstance> => {
  return axiosFactoryService.createAuthenticatedInstance();
};

// For edge cases

// /**
//  * Invalidates token cache (for storage utility integration)
//  */
// export const invalidateTokenCacheExport = (): void => {
//   invalidateTokenCache();
// };

// /**
//  * Invalidates the cached Axios instance (call when auth state changes)
//  */
// export const invalidateAxiosCache = (): void => {
//   axiosFactoryService.invalidateCache();
// };

// /**
//  * Complete cleanup for app shutdown - call this in app lifecycle hooks
//  */
// export const cleanupAxiosResources = (): void => {
//   axiosFactoryService.cleanup();
// };
