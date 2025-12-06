import axios from 'axios';
import { storeData, removeData } from '@/helpers/utils/storage';
import { devLog } from '@/config/dev';
import { getToken, updateCache, invalidate } from './token-cache.service';

import { baseURL } from '../../config/axiosInstance';

/**
 * Token Refresh Service
 * 
 * Handles the authentication token refresh process with error handling,
 * validation, and secure storage management.
 */

interface TokenRefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string | null;
}

export class TokenRefreshService {
  private refreshPromise: Promise<string> | null = null;
  private refreshAttempts: number = 0;
  private lastRefreshTime: number = 0;
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  private readonly MIN_REFRESH_INTERVAL_MS = 1000; // Prevent rapid refresh attempts

  /**
   * Refreshes the access token using the stored refresh token
   * Implements single-flight pattern to prevent concurrent refreshes
   */
  async refreshAccessToken(): Promise<string> {
    // If a refresh is already in progress, return the existing promise
    if (this.refreshPromise) {
      devLog('AUTH', '🔄 Token refresh already in progress, waiting for completion');
      return this.refreshPromise;
    }

    // Check rate limiting
    const now = Date.now();
    if (now - this.lastRefreshTime < this.MIN_REFRESH_INTERVAL_MS) {
      throw new Error('Token refresh rate limited - too many attempts');
    }

    // Check max attempts
    if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
      throw new Error('Maximum token refresh attempts exceeded');
    }

    devLog('AUTH', '🔄 Starting token refresh process');
    
    // Create the refresh promise
    this.refreshPromise = this.performTokenRefresh()
      .then(accessToken => {
        // Success - reset attempts and clear promise
        this.refreshAttempts = 0;
        this.lastRefreshTime = now;
        this.refreshPromise = null;
        devLog('AUTH', '🔄 Token refresh completed successfully');
        return accessToken;
      })
      .catch(error => {
        // Failure - increment attempts and clear promise
        this.refreshAttempts++;
        this.lastRefreshTime = now;
        this.refreshPromise = null;
        devLog('AUTH', `🔄 Token refresh failed (attempt ${this.refreshAttempts}/${this.MAX_REFRESH_ATTEMPTS})`, error?.message);
        throw error;
      });

    return this.refreshPromise;
  }

  /**
   * Performs the actual token refresh logic
   */
  private async performTokenRefresh(): Promise<string> {
    const { refreshToken, currentToken } = await this.getTokensForRefresh();
    
    this.validateRefreshToken(refreshToken);
    
    const response = await this.makeRefreshRequest(refreshToken, currentToken);
    const result = await this.processRefreshResponse(response);
    
    return result.accessToken;
  }

  /**
   * Retrieves tokens needed for refresh process
   */
  private async getTokensForRefresh(): Promise<{ refreshToken: string | null; currentToken: string | null }> {
    const refreshToken = await getToken('refreshToken');
    const currentToken = await getToken('token');
    
    devLog('AUTH', '🔄 Retrieved tokens for refresh:', {
      hasRefreshToken: !!refreshToken,
      hasCurrentToken: !!currentToken,
      refreshTokenLength: refreshToken?.length,
      currentTokenLength: currentToken?.length,
    });
    
    return { refreshToken, currentToken };
  }

  /**
   * Validates that refresh token is available and properly formatted
   */
  private validateRefreshToken(refreshToken: string | null): asserts refreshToken is string {
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      throw new Error("No valid refresh token available");
    }
  }

  /**
   * Makes the actual refresh request to the backend
   */
  private async makeRefreshRequest(refreshToken: string, currentToken: string | null): Promise<TokenRefreshResponse> {
    devLog('AUTH', '🔄 Making refresh request to backend');
    
    const refreshAxios = axios.create();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Include current access token if available
    if (currentToken && typeof currentToken === 'string' && currentToken.trim() !== '') {
      headers.Authorization = `Bearer ${currentToken}`;
    }
    
    const response = await refreshAxios.post<TokenRefreshResponse>(`${baseURL}/auth/refreshToken`, {
      refreshToken: refreshToken
    }, {
      headers
    });

    return response.data;
  }

  /**
   * Processes the refresh response and stores new tokens
   */
  private async processRefreshResponse(responseData: TokenRefreshResponse): Promise<TokenRefreshResult> {
    devLog('AUTH', '🔄 Processing refresh response:', {
      success: responseData.success,
      message: responseData.message,
      hasAccessToken: !!responseData.data?.accessToken,
      hasNewRefreshToken: !!responseData.data?.refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = responseData.data;
    
    this.validateAccessToken(accessToken);
    
    // Store new access token
    await storeData("token", accessToken);
    
    // Handle refresh token update or cleanup
    const finalRefreshToken = await this.handleRefreshTokenUpdate(newRefreshToken);
    
    // Update cache with new tokens
    updateCache(accessToken, finalRefreshToken);
    
    return {
      accessToken,
      refreshToken: finalRefreshToken
    };
  }

  /**
   * Validates the new access token received from server
   */
  private validateAccessToken(accessToken: string): asserts accessToken is string {
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
      throw new Error("Invalid access token received from server");
    }
  }

  /**
   * Handles refresh token update or removal based on server response
   */
  private async handleRefreshTokenUpdate(newRefreshToken?: string): Promise<string | null> {
    if (newRefreshToken && typeof newRefreshToken === 'string' && newRefreshToken.trim() !== '') {
      await storeData("refreshToken", newRefreshToken);
      devLog('AUTH', '🔄 New refresh token stored successfully');
      return newRefreshToken;
    } else {
      // Server didn't provide new refresh token - clear the old one
      devLog('AUTH', '🔄 ⚠️ No new refresh token provided - clearing old token');
      await removeData("refreshToken");
      devLog('AUTH', '🔄 ⚠️ WARNING: User will need to re-login when access token expires');
      return null;
    }
  }

  /**
   * Handles cleanup when refresh fails
   */
  async handleRefreshFailure(): Promise<void> {
    devLog('AUTH', '🔄 Cleaning up tokens after refresh failure');
    
    await Promise.all([
      removeData("token"),
      removeData("refreshToken")
    ]);
    
    invalidate();
    this.resetRefreshState();
  }

  /**
   * Resets the refresh state - useful for testing or forced cleanup
   */
  resetRefreshState(): void {
    this.refreshPromise = null;
    this.refreshAttempts = 0;
    this.lastRefreshTime = 0;
    devLog('AUTH', '🔄 Token refresh state reset');
  }

  /**
   * Gets refresh status for monitoring
   */
  getRefreshStatus() {
    return {
      isRefreshing: !!this.refreshPromise,
      attempts: this.refreshAttempts,
      lastRefreshTime: this.lastRefreshTime,
      canRefresh: this.refreshAttempts < this.MAX_REFRESH_ATTEMPTS
    };
  }
}

// Create singleton instance
export const tokenRefreshService = new TokenRefreshService();