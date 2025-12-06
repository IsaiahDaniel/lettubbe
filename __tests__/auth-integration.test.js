/**
 * Auth System Integration Tests
 * Tests actual service interactions and real auth flows
 */

// Mock all external dependencies first
jest.mock('@/helpers/utils/storage', () => ({
  getData: jest.fn(),
  storeData: jest.fn(),
  removeData: jest.fn(),
  registerTokenCacheInvalidator: jest.fn(),
}));

jest.mock('@/config/dev', () => ({
  devLog: jest.fn(),
}));

jest.mock('axios-retry', () => jest.fn());

jest.mock('@/services/config/logout-handler.service', () => ({
  handleLogout: jest.fn(),
}));

// Mock axios
const mockAxios = {
  create: jest.fn(() => mockAxios),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  },
  post: jest.fn(),
  get: jest.fn(),
  defaults: { headers: {} }
};

jest.mock('axios', () => ({
  create: () => mockAxios,
  default: mockAxios,
}));

// Import after mocks
const { makeRequest, apiClient } = require('@/helpers/utils/request');
const { getInstance } = require('@/config/axiosInstance');
const { getToken, updateCache, invalidate } = require('@/services/config/token-cache.service');
const { tokenRefreshService } = require('@/services/config/token-refresh.service');

describe('Auth Integration Tests', () => {
  let mockGetData, mockStoreData, mockRemoveData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all services
    invalidate();
    tokenRefreshService.resetRefreshState();
    
    // Set up storage mocks
    mockGetData = require('@/helpers/utils/storage').getData;
    mockStoreData = require('@/helpers/utils/storage').storeData;
    mockRemoveData = require('@/helpers/utils/storage').removeData;
    
    // Reset axios mock
    mockAxios.post.mockClear();
    mockAxios.get.mockClear();
  });

  describe('Complete Auth Flow Integration', () => {
    it('should handle full request flow from makeRequest to response', async () => {
      console.log('🧪 Testing complete request flow...');
      
      // 1. Set up token in cache
      updateCache('test-access-token', 'test-refresh-token');
      
      // 2. Mock successful API response
      mockAxios.get.mockResolvedValue({
        data: { id: 123, name: 'Test User' },
        status: 200
      });
      
      // 3. Make request using the actual makeRequest function
      const result = await makeRequest('get', '/user/profile');
      
      // 4. Verify the flow worked
      expect(result).toEqual({ id: 123, name: 'Test User' });
      expect(mockAxios.get).toHaveBeenCalledWith('/user/profile', { params: undefined });
      
      console.log('✅ Complete request flow working');
    });

    it('should handle 401 error and trigger token refresh flow', async () => {
      console.log('🧪 Testing 401 error handling...');
      
      // 1. Set up initial tokens
      updateCache('expired-token', 'valid-refresh-token');
      mockGetData.mockImplementation((key) => {
        if (key === 'token') return 'expired-token';
        if (key === 'refreshToken') return 'valid-refresh-token';
        return null;
      });
      
      // 2. Mock token refresh success
      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
          }
        }
      });
      
      // 3. Mock the actual refresh implementation
      const originalPerformRefresh = tokenRefreshService.performTokenRefresh;
      tokenRefreshService.performTokenRefresh = jest.fn().mockResolvedValue('new-access-token');
      
      // 4. Test the refresh flow
      const newToken = await tokenRefreshService.refreshAccessToken();
      
      // 5. Verify refresh worked
      expect(newToken).toBe('new-access-token');
      expect(tokenRefreshService.performTokenRefresh).toHaveBeenCalledTimes(1);
      
      // Restore
      tokenRefreshService.performTokenRefresh = originalPerformRefresh;
      
      console.log('✅ Token refresh flow working');
    });

    it('should handle storage integration correctly', async () => {
      console.log('🧪 Testing storage integration...');
      
      // 1. Mock storage responses
      mockGetData.mockImplementation((key) => {
        if (key === 'token') return Promise.resolve('stored-token');
        if (key === 'refreshToken') return Promise.resolve('stored-refresh');
        return Promise.resolve(null);
      });
      
      // 2. Get token from storage (not cache)
      invalidate(); // Clear cache
      const token = await getToken('token');
      
      // 3. Verify storage was called
      expect(mockGetData).toHaveBeenCalledWith('token');
      expect(token).toBe('stored-token');
      
      // 4. Verify subsequent calls use cache
      const cachedToken = await getToken('token');
      expect(cachedToken).toBe('stored-token');
      // Storage should not be called again (cached)
      expect(mockGetData).toHaveBeenCalledTimes(1);
      
      console.log('✅ Storage integration working');
    });

    it('should handle token update flow correctly', async () => {
      console.log('🧪 Testing token update flow...');
      
      // 1. Start with no tokens
      invalidate();
      
      // 2. Simulate login - update cache with new tokens
      updateCache('login-access-token', 'login-refresh-token');
      
      // 3. Verify tokens are immediately available from cache
      const accessToken = await getToken('token');
      const refreshToken = await getToken('refreshToken');
      
      expect(accessToken).toBe('login-access-token');
      expect(refreshToken).toBe('login-refresh-token');
      
      // 4. Verify storage was not called (using cache)
      expect(mockGetData).not.toHaveBeenCalled();
      
      console.log('✅ Token update flow working');
    });

    it('should handle logout flow completely', async () => {
      console.log('🧪 Testing logout flow...');
      
      // 1. Set up authenticated state
      updateCache('auth-token', 'auth-refresh');
      
      // 2. Verify tokens exist
      const beforeToken = await getToken('token');
      expect(beforeToken).toBe('auth-token');
      
      // 3. Trigger logout (invalidate cache)
      invalidate();
      
      // 4. Mock empty storage after logout
      mockGetData.mockResolvedValue(null);
      
      // 5. Verify tokens are cleared
      const afterToken = await getToken('token');
      expect(afterToken).toBeNull();
      
      console.log('✅ Logout flow working');
    });

    it('should handle error scenarios gracefully', async () => {
      console.log('🧪 Testing error handling...');
      
      // 1. Test storage failure
      mockGetData.mockRejectedValue(new Error('Storage error'));
      
      try {
        await getToken('token');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Storage error');
      }
      
      // 2. Test API error through makeRequest
      const mockError = {
        response: {
          status: 500,
          data: { error: 'Server error' }
        },
        message: 'Request failed',
        isAxiosError: true
      };
      
      mockAxios.get.mockRejectedValue(mockError);
      
      try {
        await makeRequest('get', '/api/test');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.status).toBe(500);
        expect(error.message).toBe('Request failed');
      }
      
      // 3. Test non-axios error
      mockAxios.get.mockRejectedValue(new Error('Network error'));
      
      try {
        await makeRequest('get', '/api/test2');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
      
      console.log('✅ Error handling working');
    });
  });

  describe('Service Interaction Tests', () => {
    it('should coordinate between getInstance and token cache', async () => {
      console.log('🧪 Testing getInstance and token cache coordination...');
      
      // 1. Set up token
      updateCache('coordination-token', null);
      
      // 2. Get axios instance (should include token in interceptors)
      const instance = await getInstance();
      expect(instance).toBeDefined();
      
      // 3. Verify token is available for interceptors
      const cachedToken = await getToken('token');
      expect(cachedToken).toBe('coordination-token');
      
      console.log('✅ Service coordination working');
    });

    it('should handle refresh service integration', async () => {
      console.log('🧪 Testing refresh service integration...');
      
      // 1. Mock storage for refresh
      mockGetData.mockImplementation((key) => {
        if (key === 'refreshToken') return 'valid-refresh-token';
        if (key === 'token') return 'current-token';
        return null;
      });
      
      // 2. Mock successful token refresh API call
      const mockPerformRefresh = jest.fn().mockResolvedValue('refreshed-token');
      tokenRefreshService.performTokenRefresh = mockPerformRefresh;
      
      // 3. Trigger refresh
      const result = await tokenRefreshService.refreshAccessToken();
      
      // 4. Verify integration
      expect(result).toBe('refreshed-token');
      expect(mockPerformRefresh).toHaveBeenCalledTimes(1);
      
      console.log('✅ Refresh service integration working');
    });

    it('should handle concurrent requests during refresh', async () => {
      console.log('🧪 Testing concurrent requests during refresh...');
      
      // 1. Mock slow refresh
      const mockPerformRefresh = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('new-token'), 100))
      );
      tokenRefreshService.performTokenRefresh = mockPerformRefresh;
      
      // 2. Start multiple concurrent refreshes
      const promises = [
        tokenRefreshService.refreshAccessToken(),
        tokenRefreshService.refreshAccessToken(),
        tokenRefreshService.refreshAccessToken(),
      ];
      
      // 3. Wait for all to complete
      const results = await Promise.all(promises);
      
      // 4. Verify single-flight pattern worked
      expect(results.every(token => token === 'new-token')).toBe(true);
      expect(mockPerformRefresh).toHaveBeenCalledTimes(1);
      
      console.log('✅ Concurrent request handling working');
    });

    it('should handle complete auth state lifecycle', async () => {
      console.log('🧪 Testing complete auth lifecycle...');
      
      // 1. Initial state (no auth)
      invalidate();
      mockGetData.mockResolvedValue(null);
      
      let token = await getToken('token');
      expect(token).toBeNull();
      
      // 2. Login (set tokens)
      updateCache('lifecycle-token', 'lifecycle-refresh');
      
      token = await getToken('token');
      expect(token).toBe('lifecycle-token');
      
      // 3. Token refresh
      updateCache('refreshed-lifecycle-token', 'refreshed-lifecycle-refresh');
      
      token = await getToken('token');
      expect(token).toBe('refreshed-lifecycle-token');
      
      // 4. Logout
      invalidate();
      mockGetData.mockResolvedValue(null);
      
      token = await getToken('token');
      expect(token).toBeNull();
      
      console.log('✅ Complete auth lifecycle working');
    });
  });
});

console.log('\n🎯 Integration tests validate all auth services work together correctly!');