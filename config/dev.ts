// Development configuration
export const DEV_CONFIG = {
  // Enable/disable console logs by category
  // Set to true only for specific debugging needs
  LOGS: {
    VIDEO_PREVIEW: false, // Video preview system logs
    SCROLL_EVENTS: false, // Scroll handling logs  
    VIDEO_PLAYER: false, // Video player status logs
    API_REQUESTS: false, // Network requests (disabled for performance)
    NAVIGATION: false, // Route navigation
    AUTH: true, // Authentication flows
    SOCKET: false, // Socket.io connections
    GENERAL: true, // General app logs
    DEEPLINK: true, // Deep link handling
    SECURITY: true, // Security operations 
    CHAT: true, // Chat system logs
    FONT: true,
    CACHE: true,
    API: true
  },
  
  // Performance settings
  PERFORMANCE: {
    ENABLE_VIEWPORT_LOGGING: false, // Viewport measurements
    ENABLE_MEMORY_LOGGING: false, // Memory usage tracking
    ENABLE_RENDER_LOGGING: false, // Component render tracking
  }
};

// Console log wrapper that respects dev config
export const devLog = (category: keyof typeof DEV_CONFIG.LOGS, message: string, ...args: any[]) => {
  if (__DEV__ && DEV_CONFIG.LOGS[category]) {
    console.log(`[${category}] ${message}`, ...args);
  }
};

// Performance log wrapper
export const perfLog = (type: keyof typeof DEV_CONFIG.PERFORMANCE, message: string, ...args: any[]) => {
  if (__DEV__ && DEV_CONFIG.PERFORMANCE[type]) {
    console.log(`[PERF-${type}] ${message}`, ...args);
  }
};