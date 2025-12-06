/**
 * Format numbers for display (e.g., 1000 -> 1K)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return num.toString();
};

// Cache for formatted timestamps to avoid recalculation
const timeAgoCache = new Map<string, { result: string; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

/**
 * Format timestamp to "time ago" format (with caching)
 */
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const cacheKey = `${timestamp}`;
  
  // Check cache first
  const cached = timeAgoCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }
  
  const seconds = Math.floor((now - timestamp) / 1000);

  let result: string;
  
  // Less than a minute
  if (seconds < 60) {
    result = "just now";
  }
  // Less than an hour
  else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    result = `${minutes}m ago`;
  }
  // Less than a day
  else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    result = `${hours}h ago`;
  }
  // Less than a week
  else if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    result = `${days}d ago`;
  }
  // Less than a month
  else if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800);
    result = `${weeks}w ago`;
  }
  // Less than a year
  else if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    result = `${months}mo ago`;
  }
  // More than a year
  else {
    const years = Math.floor(seconds / 31536000);
    result = `${years}y ago`;
  }
  
  // Cache the result
  timeAgoCache.set(cacheKey, { result, timestamp: now });
  
  // Clean up old cache entries (keep only last 100)
  if (timeAgoCache.size > 100) {
    const keys = Array.from(timeAgoCache.keys());
    const oldKeys = keys.slice(0, keys.length - 100);
    oldKeys.forEach(key => timeAgoCache.delete(key));
  }
  
  return result;
};

/**
 * Format duration (seconds) to mm:ss format
 */

export const formatDuration = (seconds: number | null | undefined): string => {
  // Handle edge cases: null, undefined, NaN, negative values
  if (
    seconds === null ||
    seconds === undefined ||
    isNaN(Number(seconds)) ||
    Number(seconds) < 0
  ) {
    return "--:--";
  }

  const mins = Math.floor(Number(seconds) / 60);
  const secs = Math.floor(Number(seconds) % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format a full date
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatVideoDuration = (
  duration: string | number | null | undefined
): string => {
  // Return placeholder if no duration
  if (duration === null || duration === undefined) {
    return "--:--";
  }
  
  // If already in proper format (MM:SS or HH:MM:SS), return as is
  if (typeof duration === 'string') {
    // Check if already in MM:SS or HH:MM:SS format
    if (/^\d+:\d{2}(:\d{2})?$/.test(duration)) {
      return duration;
    }
    
    // Try to parse as seconds
    const totalSeconds = parseFloat(duration);
    if (isNaN(totalSeconds)) {
      return "--:--";
    }
    
    duration = totalSeconds;
  }
  
  // Convert seconds to MM:SS or HH:MM:SS
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  
  // Include hours if there are any
  if (hours > 0) {
    return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
  
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};
