export const HASHTAG_PATTERNS = {
  // Matches # followed by alphanumeric characters and underscores
  HASHTAG_REGEX: /#([a-zA-Z0-9_]+)/g,
  HASHTAG_COMPLETE: /#([a-zA-Z0-9_]+)/g,
  HASHTAG_DETECTION: /#/,
  HASHTAG_VALIDATION: /^[a-zA-Z0-9_]+$/, // For validating hashtag content
} as const;

// UI Configuration
export const HASHTAG_UI_CONFIG = {
  COLOR: '#007AFF', // Blue color for hashtag highlighting
  FONT_WEIGHT: '600' as const,
  MIN_LENGTH: 1, // Minimum characters after # for valid hashtag
  MAX_LENGTH: 100, // Maximum hashtag length
} as const;

// Error Messages
export const HASHTAG_ERROR_MESSAGES = {
  SEARCH_FAILED: 'Failed to search hashtag. Please try again.',
  INVALID_HASHTAG: 'Invalid hashtag format',
  NO_RESULTS: 'No posts found for this hashtag',
} as const;