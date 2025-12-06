/**
 * Mention System Constants
 * All configuration values for the mentions feature
 */

// Search Configuration
export const MENTION_SEARCH_CONFIG = {
  MIN_CHARACTERS: 1,
  MAX_SUGGESTIONS: 10,
  DEBOUNCE_MS: 300,
  TIMEOUT_MS: 10000,
} as const;

// Cache Configuration
export const MENTION_CACHE_CONFIG = {
  STALE_TIME_MS: 30000, // 30 seconds
  GC_TIME_MS: 5 * 60 * 1000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 2,
} as const;

// UI Configuration
export const MENTION_UI_CONFIG = {
  SUGGESTION_HEIGHT: 320,
  INPUT_MIN_HEIGHT: 100,
  INPUT_MAX_HEIGHT: 200,
  FONT_SIZE: 16,
  LINE_HEIGHT: 22,
} as const;

// Regex Patterns
export const MENTION_PATTERNS = {
  // Enhanced patterns to support international usernames, dots, underscores, and hyphens
  MENTION_REGEX: /@([a-zA-Z0-9_.\u00a0-\u024f\u1e00-\u1eff]*)/g, // Matches @ followed by enhanced characters (including empty)
  MENTION_COMPLETE: /@([a-zA-Z0-9_.\u00a0-\u024f\u1e00-\u1eff]+)/g, // Matches @ followed by one or more enhanced characters
  MENTION_AT_CURSOR: /@([a-zA-Z0-9_.\u00a0-\u024f\u1e00-\u1eff]*)$/,
  USERNAME_VALIDATION: /^[a-zA-Z0-9_.\u00a0-\u024f\u1e00-\u1eff]+$/, // Enhanced validation for international usernames
  MENTION_DETECTION: /@/,
} as const;

// Error Messages
export const MENTION_ERROR_MESSAGES = {
  SEARCH_FAILED: 'Failed to search users. Please try again.',
  SEARCH_TIMEOUT: 'Search timeout - please try again',
  RATE_LIMITED: 'Too many requests - please wait a moment',
  SERVER_ERROR: 'Server error - please try again later',
  THRESHOLD_MESSAGE: 'Start typing to search users...',
  NO_RESULTS: 'No users found',
} as const;

// Animation Durations
export const MENTION_ANIMATIONS = {
  SUGGESTION_FADE: 200,
  KEYBOARD_DELAY: 50,
  FOCUS_DELAY: 100,
} as const;