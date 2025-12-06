interface QueuedRequest {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  timeoutId?: NodeJS.Timeout;
}

// Configuration constants
const MAX_QUEUE_SIZE = 50; // Maximum number of queued requests
const QUEUE_TIMEOUT_MS = 30000; // 30 seconds timeout for queued requests
const CLEANUP_INTERVAL_MS = 60000; // Clean up expired requests every minute

let isRefreshing = false;
let failedRequestsQueue: QueuedRequest[] = [];
let cleanupIntervalId: NodeJS.Timeout | null = null;

// Start cleanup interval on first use
const startCleanupInterval = (): void => {
  if (cleanupIntervalId) return;
  
  cleanupIntervalId = setInterval(() => {
    cleanupExpiredRequests();
  }, CLEANUP_INTERVAL_MS);
};

// Clean up expired requests
const cleanupExpiredRequests = (): void => {
  const now = Date.now();
  const expiredRequests: QueuedRequest[] = [];
  
  failedRequestsQueue = failedRequestsQueue.filter(request => {
    const isExpired = (now - request.timestamp) > QUEUE_TIMEOUT_MS;
    if (isExpired) {
      expiredRequests.push(request);
      return false;
    }
    return true;
  });
  
  // Reject expired requests
  expiredRequests.forEach(request => {
    if (request.timeoutId) {
      clearTimeout(request.timeoutId);
    }
    request.reject(new Error('Request queue timeout - token refresh took too long'));
  });
};

export const isTokenRefreshInProgress = (): boolean => isRefreshing;

export const setRefreshStatus = (refreshing: boolean): void => {
  isRefreshing = refreshing;
  
  // Start cleanup when refresh begins
  if (refreshing) {
    startCleanupInterval();
  }
};

export const queueFailedRequest = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Clean up expired requests first
    cleanupExpiredRequests();
    
    // Check queue bounds
    if (failedRequestsQueue.length >= MAX_QUEUE_SIZE) {
      reject(new Error('Request queue is full - too many concurrent requests'));
      return;
    }
    
    // Create timeout for this specific request
    const timeoutId = setTimeout(() => {
      const index = failedRequestsQueue.findIndex(req => req.timeoutId === timeoutId);
      if (index !== -1) {
        failedRequestsQueue.splice(index, 1);
      }
      reject(new Error('Request timeout while waiting for token refresh'));
    }, QUEUE_TIMEOUT_MS);
    
    // Add to queue
    failedRequestsQueue.push({
      resolve,
      reject,
      timestamp: Date.now(),
      timeoutId
    });
  });
};

export const processQueue = (error: any = null, newToken: string | null = null): void => {
  // Process all queued requests
  failedRequestsQueue.forEach(({ resolve, reject, timeoutId }) => {
    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Resolve or reject based on result
    if (error) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });
  
  // Clear the queue
  failedRequestsQueue = [];
};

// Cleanup function for app shutdown
export const cleanup = (): void => {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
  
  // Clear all pending timeouts and reject remaining requests
  failedRequestsQueue.forEach(({ reject, timeoutId }) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    reject(new Error('Application shutting down'));
  });
  
  failedRequestsQueue = [];
  isRefreshing = false;
};

// Get queue statistics for monitoring
export const getQueueStats = () => ({
  queueLength: failedRequestsQueue.length,
  isRefreshing,
  oldestRequestAge: failedRequestsQueue.length > 0 
    ? Date.now() - Math.min(...failedRequestsQueue.map(r => r.timestamp))
    : 0
});