/**
 * Mentions Module Exports
 * Central export point for all mention-related components and utilities
 */

// Components
export { default as MentionInput } from '../MentionInput';
export { default as MentionText } from '../../MentionText';
export { default as MentionSuggestions } from '../MentionSuggestions';

// Hooks
export { useMentionInput } from '../../../../hooks/mentions/useMentionInput';

// Types
export type {
  MentionInputProps,
  MentionTextProps,
  MentionSuggestionsProps,
  ParsedMention,
  TextSegment,
  SearchUser,
  MentionDetectionResult,
  UseMentionInputReturn,
  MentionInputState,
  MentionValidationResult,
} from '../../../../helpers/types/mentions.types';

// Constants
export {
  MENTION_SEARCH_CONFIG,
  MENTION_CACHE_CONFIG,
  MENTION_UI_CONFIG,
  MENTION_PATTERNS,
  MENTION_ERROR_MESSAGES,
  MENTION_ANIMATIONS,
} from '../../../../constants/mentions';

// Utilities
export {
  extractMentionsFromText,
  getUniqueUsernamesFromText,
  textContainsMentions,
  formatMentionsInText,
  validateMentionsForBackend,
  filterValidMentions,
  prepareMentionsForBackend,
  parseMentionsFromBackend,
} from '../../../../helpers/utils/mentionUtils';

export {
  getMentionColor,
  parseTextForOverlay,
  renderMentionSegments,
  getMentionDisplayName,
  getMentionAccessibilityLabel,
  createMentionText,
  isValidMentionFormat,
} from '../../../../helpers/utils/mentionRendering';