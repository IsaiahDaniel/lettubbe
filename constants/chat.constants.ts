// Chat screen animation and interaction constants
export const CHAT_CONSTANTS = {
  ANIMATION: {
    DURATION: 300,
    SPRING_TENSION: 120,
    SPRING_FRICTION: 8,
  },
  GESTURES: {
    VERTICAL_THRESHOLD: 50,
    SWIPE_THRESHOLD: 0.25, // 25% of screen width
    VELOCITY_THRESHOLD: 800,
    ACTIVE_OFFSET_X: [-2, 2] as [number, number],
    FAIL_OFFSET_Y: [-50, 50] as [number, number],
    MIN_DISTANCE: 10,
  },
  RETRY: {
    PROGRESSIVE_DELAY_BASE: 300, // 300ms, 600ms, 900ms
    MAX_RETRIES: 3,
  },
} as const;

// Chat filter types
export type ChatFilterTab = "All" | "Unread" | "Favorites" | "Archived";
export type HeaderTab = "Inbox" | "Communities";

// Default values
export const DEFAULT_VALUES = {
  SUBSCRIBER_COUNT: "0",
  UNKNOWN_USER: "Unknown User",
  CURRENT_USER_ID: "current_user",
} as const;