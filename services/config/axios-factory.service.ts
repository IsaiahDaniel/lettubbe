import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { devLog } from '@/config/dev';
import { createAuthInterceptor } from './auth-interceptor.service';
import { handleLogout } from './logout-handler.service';

import { baseURL } from '../../config/axiosInstance';

/**
 * Axios Factory Service
 * 
 * Creates configured Axios instances with authentication, retry logic,
 * and proper error handling.
 */

interface AxiosFactoryConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: (retryCount: number) => number;
}

export class AxiosFactoryService {
  private readonly defaultConfig: Required<AxiosFactoryConfig> = {
    timeout: 10000,
    retries: 3,
    retryDelay: (retryCount: number) => retryCount * 1000
  };
  
  private cachedInstance: AxiosInstance | null = null;
  private lastConfig: string | null = null;
  private authInterceptor: any = null;

  /**
   * Creates a fully configured Axios instance with authentication and retry logic
   * Uses caching to prevent performance issues from repeated instance creation
   */
  async createAuthenticatedInstance(config: AxiosFactoryConfig = {}): Promise<AxiosInstance> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const configHash = JSON.stringify(finalConfig);
    
    // Return cached instance if configuration hasn't changed
    if (this.cachedInstance && this.lastConfig === configHash) {
      return this.cachedInstance;
    }
    
    // Create new instance if cache miss or config changed
    const instance = this.createBaseInstance(finalConfig);
    
    // Add authentication interceptors
    this.addAuthenticationInterceptors(instance);
    
    // Configure retry logic
    axiosRetry(instance, {
      retries: finalConfig.retries,
      retryDelay: (retryCount) => {
        devLog('API_REQUESTS', `Retry attempt: ${retryCount}`);
        return finalConfig.retryDelay(retryCount);
      },
      retryCondition: (error) => {
        // Don't retry on auth errors (handled by interceptors)
        if (error?.response?.status === 401 || error?.response?.status === 440) {
          return false;
        }
        
        // Retry on network errors and 5xx status codes
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               (error?.response && error.response.status >= 500) || 
               false;
      },
    });
    
    // Cache the instance and config
    this.cachedInstance = instance;
    this.lastConfig = configHash;
    
    devLog('AUTH', 'Authenticated Axios instance created and cached successfully');
    return instance;
  }

  /**
   * Creates the base Axios instance with core configuration
   */
  private createBaseInstance(config: Required<AxiosFactoryConfig>): AxiosInstance {
    return axios.create({
      baseURL: baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Adds authentication request and response interceptors
   */
  private addAuthenticationInterceptors(instance: AxiosInstance): void {
    this.authInterceptor = createAuthInterceptor({
      onLogout: () => handleLogout()
    });

    this.authInterceptor.addRequestInterceptor(instance);
    this.authInterceptor.addResponseInterceptor(instance);
  }

  /**
   * Invalidates the cached instance (call when auth state changes)
   */
  invalidateCache(): void {
    // Cleanup existing instance if it exists
    if (this.cachedInstance && this.authInterceptor) {
      this.authInterceptor.cleanup(this.cachedInstance);
    }
    
    this.cachedInstance = null;
    this.lastConfig = null;
    this.authInterceptor = null;
    devLog('AUTH', 'Axios instance cache invalidated and cleaned up');
  }

  /**
   * Complete cleanup for app shutdown
   */
  cleanup(): void {
    this.invalidateCache();
    devLog('AUTH', 'AxiosFactoryService cleanup completed');
  }
}

// Create singleton instance
export const axiosFactoryService = new AxiosFactoryService();