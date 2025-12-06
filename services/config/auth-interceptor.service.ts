import { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { devLog } from '@/config/dev';
import { getToken } from './token-cache.service';
import { tokenRefreshService } from './token-refresh.service';
import { isTokenRefreshInProgress, setRefreshStatus, queueFailedRequest, processQueue, cleanup } from './request-queue.service';

/**
 * Auth Interceptor Service
 * 
 * Manages request and response interceptors for handling authentication,
 * token refresh, and logout scenarios.
 */

interface AuthInterceptorConfig {
  onLogout: () => Promise<void>;
}

export class AuthInterceptorService {
  private config: AuthInterceptorConfig;
  private requestInterceptorId?: number;
  private responseInterceptorId?: number;

  constructor(config: AuthInterceptorConfig) {
    this.config = config;
  }

  /**
   * Adds request interceptor to automatically attach auth tokens
   */
  addRequestInterceptor(instance: AxiosInstance): void {
    this.requestInterceptorId = instance.interceptors.request.use(
      async (config) => {
        const currentToken = await getToken('token');
        
        if (currentToken && typeof currentToken === 'string' && currentToken.trim() !== '') {
          config.headers.Authorization = `Bearer ${currentToken}`;
        } else {
          // Remove Authorization header if no valid token
          delete config.headers.Authorization;
        }
        
        return config;
      },
      (error) => {
        devLog('AUTH', 'Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Adds response interceptor to handle token refresh and authentication errors
   */
  addResponseInterceptor(instance: AxiosInstance): void {
    this.responseInterceptorId = instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        devLog('AUTH', '🔄 Response interceptor caught error:', {
          status: error.response?.status,
          url: originalRequest?.url,
          hasRetried: !!originalRequest._retry,
          isRefreshing: isTokenRefreshInProgress(),
          errorMessage: error.message,
          skipAuthInterceptor: !!originalRequest?.skipAuthInterceptor
        });

        // Skip auth handling if flag is set
        if (originalRequest?.skipAuthInterceptor) {
          devLog('AUTH', 'Skipping auth interceptor due to skipAuthInterceptor flag');
          return Promise.reject(error);
        }

        // Handle logout scenarios (440 status)
        if (error.response?.status === 440) {
          devLog('AUTH', '440 status detected - triggering logout');
          await this.config.onLogout();
          return Promise.reject(error);
        }

        // Check if token refresh is needed
        if (this.shouldRefreshToken(error) && !originalRequest._retry) {
          return this.handleTokenRefresh(instance, originalRequest, error);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Determines if token refresh should be attempted based on error
   */
  private shouldRefreshToken(error: AxiosError): boolean {
    const status = error.response?.status;
    const errorData = error.response?.data as any;

    // Handle 401 Unauthorized
    if (status === 401) {
      return true;
    }

    // Handle 403 with specific refresh token errors
    if (status === 403 && errorData?.error?.includes?.('Invalid or expired refresh token')) {
      return true;
    }

    // Handle 500 with JWT expired errors
    if (status === 500 && errorData?.stack) {
      const hasJwtError = errorData.stack.includes('jwt expired') || 
                         errorData.stack.includes('TokenExpiredError');
      return hasJwtError;
    }

    return false;
  }

  /**
   * Handles the token refresh process for failed requests
   */
  private async handleTokenRefresh(
    instance: AxiosInstance, 
    originalRequest: any, 
    originalError: AxiosError
  ): Promise<any> {
    devLog('AUTH', 'JWT expiration detected - attempting token refresh', {
      statusCode: originalError.response?.status,
      requestUrl: originalRequest?.url
    });

    // If already refreshing, queue this request
    if (isTokenRefreshInProgress()) {
      devLog('AUTH', 'Already refreshing - queuing request');
      
      const newToken = await queueFailedRequest();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return instance(originalRequest);
    }

    // Mark as retried and start refresh process
    originalRequest._retry = true;
    setRefreshStatus(true);

    try {
      devLog('AUTH', 'Starting token refresh process');
      
      const newToken = await tokenRefreshService.refreshAccessToken();
      
      // Process queued requests with new token
      processQueue(null, newToken);
      
      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      devLog('AUTH', 'Retrying original request with new token');
      
      return instance(originalRequest);
      
    } catch (refreshError: any) {
      devLog('AUTH', 'Token refresh failed - triggering logout', {
        refreshErrorStatus: refreshError?.response?.status,
        refreshErrorMessage: refreshError?.response?.data?.error || refreshError?.message,
        originalRequestUrl: originalRequest?.url
      });
      
      // Handle refresh failure cleanup since token service no longer does it
      await tokenRefreshService.handleRefreshFailure();
      
      // Process queued requests with error
      processQueue(refreshError, null);
      
      // Trigger logout
      await this.config.onLogout();
      
      return Promise.reject(refreshError);
      
    } finally {
      setRefreshStatus(false);
    }
  }

  /**
   * Cleanup method to remove interceptors and clear resources
   */
  cleanup(instance: AxiosInstance): void {
    if (this.requestInterceptorId !== undefined) {
      instance.interceptors.request.eject(this.requestInterceptorId);
    }
    if (this.responseInterceptorId !== undefined) {
      instance.interceptors.response.eject(this.responseInterceptorId);
    }
    
    // Cleanup request queue
    cleanup();
  }
}

export const createAuthInterceptor = (config: AuthInterceptorConfig): AuthInterceptorService => {
  return new AuthInterceptorService(config);
};