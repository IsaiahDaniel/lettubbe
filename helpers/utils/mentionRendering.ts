import { MentionUser, DisplayMentionUser } from '@/store/videoUploadStore';
import { TextSegment } from '@/helpers/types/mentions.types';
import { parseTextWithMentions } from '@/helpers/utils/mentionUtils';
import { Colors } from '@/constants';
import { MENTION_PATTERNS } from '@/constants/mentions';

/**
 * Get color for mention text
 */
export const getMentionColor = (): string => {
  return "#007AFF";
};

/**
 * Parse text for rich text overlay (input styling)
 */
export const parseTextForOverlay = (text: string, textColor: string): Array<{
  text: string;
  color: string;
  key: string;
}> => {
  if (!text) return [];

  const segments = [];
  let lastIndex = 0;

  // Find all mentions in the text (including partial ones)
  const mentionRegex = MENTION_PATTERNS.MENTION_REGEX;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        color: textColor,
        key: `text_${lastIndex}_${match.index}`,
      });
    }

    // Add mention
    segments.push({
      text: match[0],
      color: Colors.general.blue,
      key: `mention_${match.index}_${match.index + match[0].length}`,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      color: textColor,
      key: `text_${lastIndex}_${text.length}`,
    });
  }

  return segments;
};

/**
 * Render mention segments for display components
 */
export const renderMentionSegments = (
  text: string,
  mentions: (MentionUser | DisplayMentionUser)[] = []
): TextSegment[] => {
  return parseTextWithMentions(text, mentions);
};

/**
 * Get display name for mention user
 */
export const getMentionDisplayName = (mention?: MentionUser | DisplayMentionUser): string => {
  if (!mention) return '';
  
  if (mention && 'firstName' in mention && mention.firstName && mention.lastName) {
    return `${mention.firstName} ${mention.lastName}`;
  }
  if (mention && 'firstName' in mention && mention.firstName) {
    return mention.firstName;
  }
  if (mention && 'lastName' in mention && mention.lastName) {
    return mention.lastName;
  }
  return mention.username || '';
};

/**
 * Generate accessibility label for mention
 */
export const getMentionAccessibilityLabel = (mention?: MentionUser | DisplayMentionUser): string => {
  if (!mention) return 'Mention';
  
  const displayName = getMentionDisplayName(mention);
  return `Mention of ${displayName}, username ${mention.username || ''}`;
};

/**
 * Create mention text for insertion
 */
export const createMentionText = (username: string): string => {
  return `@${username} `;
};

/**
 * Validate mention text format
 */
export const isValidMentionFormat = (text: string): boolean => {
  return /^@[a-zA-Z0-9_.\u00a0-\u024f\u1e00-\u1eff]+\s*$/.test(text);
};