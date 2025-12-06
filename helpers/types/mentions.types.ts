import { MentionUser } from '@/store/videoUploadStore';

/**
 * Mention System Type Definitions
 */

// Core Types
export interface ParsedMention {
  start: number;
  end: number;
  username: string;
}

export interface TextSegment {
  text: string;
  isMention: boolean;
  isUrl: boolean;
  isHashtag: boolean;
  mention?: MentionUser;
  hashtag?: string;
}

export interface MentionPosition {
  start: number;
  end: number;
}

export interface TextSelection {
  start: number;
  end: number;
}

// Detection Result
export interface MentionDetectionResult {
  isTypingMention: boolean;
  query: string;
  mentionStart: number;
  mentionEnd: number;
}

// Search Types
export interface SearchUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface SearchUsersResponse {
  success: boolean;
  data: SearchUser[];
}

// Component Props
export interface MentionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onMentionsChange?: (mentions: MentionUser[]) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  style?: any;
  suggestionsPosition?: 'above' | 'below';
}

export interface MentionTextProps {
  text: string;
  mentions?: MentionUser[];
  style?: any;
  size?: number;
  weight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  color?: string;
  numberOfLines?: number;
  onMentionPress?: (mention: MentionUser) => void;
  onUserProfilePress?: (userId: string) => void;
  onHashtagPress?: (hashtag: string) => void;
  onTextLayout?: (isTruncated: boolean) => void;
}

export interface MentionSuggestionsProps {
  users: SearchUser[];
  isLoading: boolean;
  error: string | null;
  query: string;
  onUserSelect: (user: SearchUser) => void;
}

// Backend Types
export interface MentionNotificationData {
  userId: string;
  type: 'mention';
  message: string;
  postId: string;
  postType: 'video' | 'photo';
}

export interface BackendMentionData {
  description: string;
  mentions: Partial<MentionUser>[];
}

// Hook Return Types
export interface UseMentionInputReturn {
  showSuggestions: boolean;
  currentMentionQuery: string;
  users: SearchUser[];
  isLoading: boolean;
  error: string | null;
  handleTextChange: (text: string) => void;
  handleSelectionChange: (event: { nativeEvent: { selection: { start: number; end: number } } }) => void;
  handleUserSelect: (user: SearchUser) => void;
  mentions: MentionUser[];
}

// State Types
export interface MentionInputState {
  showSuggestions: boolean;
  currentMentionQuery: string;
  mentionPosition: MentionPosition;
  mentions: MentionUser[];
  selection: TextSelection;
}

// Validation Types
export interface MentionValidationResult {
  isValid: boolean;
  errors: string[];
  validMentions: MentionUser[];
}