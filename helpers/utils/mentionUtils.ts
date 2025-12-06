import { MentionUser, DisplayMentionUser } from '@/store/videoUploadStore';
import { MENTION_PATTERNS } from '@/constants/mentions';
import { HASHTAG_PATTERNS } from '@/constants/hashtags';

export interface ParsedMention {
  start: number;
  end: number;
  username: string;
}

export interface ParsedHashtag {
  start: number;
  end: number;
  hashtag: string;
}

/**
 * Extract all @mention patterns from text
 * @param text - The text to parse
 * @returns Array of parsed mention objects with positions
 */

export const extractMentionsFromText = (text: string): ParsedMention[] => {
  const mentionRegex = MENTION_PATTERNS.MENTION_COMPLETE;
  const mentions: ParsedMention[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      start: match.index,
      end: match.index + match[0].length,
      username: match[1],
    });
  }

  return mentions;
};

/**
 * Get unique usernames from text
 * @param text - The text to parse
 * @returns Array of unique usernames (without @ symbol)
 */
export const getUniqueUsernamesFromText = (text: string): string[] => {
  const mentions = extractMentionsFromText(text);
  const usernames = mentions.map(mention => mention.username);
  return [...new Set(usernames)]; // Remove duplicates
};

/**
 * Extract all #hashtag patterns from text
 * @param text - The text to parse
 * @returns Array of parsed hashtag objects with positions
 */
export const extractHashtagsFromText = (text: string): ParsedHashtag[] => {
  const hashtagRegex = HASHTAG_PATTERNS.HASHTAG_COMPLETE;
  const hashtags: ParsedHashtag[] = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push({
      start: match.index,
      end: match.index + match[0].length,
      hashtag: match[1],
    });
  }

  return hashtags;
};

/**
 * Get unique hashtags from text
 * @param text - The text to parse
 * @returns Array of unique hashtags (without # symbol)
 */
export const getUniqueHashtagsFromText = (text: string): string[] => {
  const hashtags = extractHashtagsFromText(text);
  const hashtagTexts = hashtags.map(hashtag => hashtag.hashtag);
  return [...new Set(hashtagTexts)]; // Remove duplicates
};

/**
 * Check if text contains any mentions
 * @param text - The text to check
 * @returns Boolean indicating if mentions exist
 */
export const textContainsMentions = (text: string): boolean => {
  return MENTION_PATTERNS.MENTION_DETECTION.test(text);
};

/**
 * Check if text contains any hashtags
 * @param text - The text to check
 * @returns Boolean indicating if hashtags exist
 */
export const textContainsHashtags = (text: string): boolean => {
  return HASHTAG_PATTERNS.HASHTAG_DETECTION.test(text);
};

/**
 * Replace mentions in text with formatted versions
 * @param text - Original text
 * @param mentions - Array of mention user data
 * @param formatter - Optional function to format each mention
 * @returns Formatted text
 */
export const formatMentionsInText = (
  text: string,
  mentions: MentionUser[],
  formatter?: (mention: MentionUser) => string
): string => {
  let formattedText = text;
  
  mentions.forEach(mention => {
    const mentionText = `@${mention.username}`;
    const replacement = formatter ? formatter(mention) : mentionText;
    
    // Replace all instances of this mention
    const regex = new RegExp(`@${mention.username}\\b`, 'g');
    formattedText = formattedText.replace(regex, replacement);
  });

  return formattedText;
};

/**
 * Validate mention data for backend submission
 * @param mentions - Array of mention user data
 * @returns Array of validated usernames
 */
export const validateMentionsForBackend = (mentions: MentionUser[]): string[] => {
  return mentions
    .filter(mention => mention.username)
    .map(mention => mention.username);
};

/**
 * Filter out invalid mentions
 * @param mentions - Array of mention user data
 * @returns Array of valid mentions
 */
export const filterValidMentions = (mentions: MentionUser[]): MentionUser[] => {
  return mentions.filter(mention => mention.username);
};

/**
 * Create mention data structure for backend API
 * @param text - The description text
 * @param mentions - Array of mention user data
 * @returns Object with text and usernames for API submission
 */
export const prepareMentionsForBackend = (text: string, mentions: MentionUser[]) => {
  const validMentions = filterValidMentions(mentions);
  
  // Extract manually typed mentions that aren't in the mentions array
  const textMentions = extractMentionsFromText(text);
  const manualMentions = textMentions
    .filter(parsed => !mentions.some(m => m.username === parsed.username))
    .map(parsed => ({ username: parsed.username }));
  
  // Combine valid mentions with manual mentions
  const allMentions = [...validMentions, ...manualMentions];
  
  return {
    description: text,
    mentions: validateMentionsForBackend(allMentions),
  };
};

/**
 * Parse text with mentions, hashtags and URLs, create segments for rendering
 */
export const parseTextWithMentions = (text: string, mentions: (MentionUser | DisplayMentionUser)[] = []): Array<{
  text: string;
  isMention: boolean;
  isUrl: boolean;
  isHashtag: boolean;
  mention?: MentionUser | DisplayMentionUser;
  hashtag?: string;
}> => {
  if (!text) {
    return [{ text, isMention: false, isUrl: false, isHashtag: false }];
  }

  // Find all mentions, hashtags and URLs in text and sort by position
  const patterns = [];
  
  // Find mentions
  const mentionRegex = MENTION_PATTERNS.MENTION_COMPLETE;
  let mentionMatch;
  while ((mentionMatch = mentionRegex.exec(text)) !== null) {
    patterns.push({
      start: mentionMatch.index,
      end: mentionMatch.index + mentionMatch[0].length,
      text: mentionMatch[0],
      type: 'mention',
      username: mentionMatch[1]
    });
  }
  
  // Find hashtags
  const hashtagRegex = HASHTAG_PATTERNS.HASHTAG_COMPLETE;
  let hashtagMatch;
  while ((hashtagMatch = hashtagRegex.exec(text)) !== null) {
    patterns.push({
      start: hashtagMatch.index,
      end: hashtagMatch.index + hashtagMatch[0].length,
      text: hashtagMatch[0],
      type: 'hashtag',
      hashtag: hashtagMatch[1]
    });
  }
  
  // Find URLs - matches http://, https://, www., and domain.extension patterns
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    patterns.push({
      start: urlMatch.index,
      end: urlMatch.index + urlMatch[0].length,
      text: urlMatch[0],
      type: 'url'
    });
  }
  
  // Sort by position
  patterns.sort((a, b) => a.start - b.start);
  
  const segments = [];
  let lastIndex = 0;
  
  patterns.forEach(pattern => {
    // Add text before pattern (if any)
    if (pattern.start > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, pattern.start),
        isMention: false,
        isUrl: false,
        isHashtag: false,
      });
    }
    
    // Add pattern segment
    if (pattern.type === 'mention') {
      const mentionData = mentions.find(m => m.username === pattern.username);
      segments.push({
        text: pattern.text,
        isMention: true,
        isUrl: false,
        isHashtag: false,
        mention: mentionData,
      });
    } else if (pattern.type === 'hashtag') {
      segments.push({
        text: pattern.text,
        isMention: false,
        isUrl: false,
        isHashtag: true,
        hashtag: pattern.hashtag,
      });
    } else if (pattern.type === 'url') {
      segments.push({
        text: pattern.text,
        isMention: false,
        isUrl: true,
        isHashtag: false,
      });
    }
    
    lastIndex = pattern.end;
  });
  
  // Add remaining text (if any)
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isMention: false,
      isUrl: false,
      isHashtag: false,
    });
  }

  return segments;
};

/**
 * Parse mentions from backend response and merge with text
 * @param text - Description text from backend
 * @param mentionsData - Mentions array from backend
 * @returns Object with parsed text and mention data
 */
export const parseMentionsFromBackend = (
  text: string, 
  mentionsData: Array<{
    userId?: string;
    _id?: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  } | null> = []
): { text: string; mentions: DisplayMentionUser[] } => {
  const mentions: DisplayMentionUser[] = mentionsData
    .filter(mention => mention !== null && mention !== undefined)
    .map(mention => ({
      userId: mention.userId || mention._id,
      username: mention.username,
      firstName: mention.firstName,
      lastName: mention.lastName,
      profilePicture: mention.profilePicture,
    }));

  return {
    text,
    mentions,
  };
};