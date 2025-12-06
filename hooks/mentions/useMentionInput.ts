import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { TextInput } from 'react-native';
import { MentionUser } from '@/store/videoUploadStore';
import { 
  MentionInputState, 
  UseMentionInputReturn, 
  SearchUser, 
  MentionDetectionResult 
} from '@/helpers/types/mentions.types';
import { MENTION_SEARCH_CONFIG, MENTION_ANIMATIONS, MENTION_PATTERNS } from '@/constants/mentions';
import { 
  extractMentionsFromText, 
  filterValidMentions 
} from '@/helpers/utils/mentionUtils';
import useSearchUsers from '@/hooks/useSearchUsers';

/**
 * mention input functionality
 * Handles mention detection, user search, and text manipulation
 */
export const useMentionInput = (
  value: string,
  onChangeText: (text: string) => void,
  onMentionsChange?: (mentions: MentionUser[]) => void
): UseMentionInputReturn => {
  const textInputRef = useRef<TextInput>(null);
  
  const [state, setState] = useState<MentionInputState>({
    showSuggestions: false,
    currentMentionQuery: '',
    mentionPosition: { start: 0, end: 0 },
    mentions: [],
    selection: { start: 0, end: 0 },
  });

  // Search users when we have a mention query (minimum 1 character)
  const shouldSearch = state.currentMentionQuery.length >= MENTION_SEARCH_CONFIG.MIN_CHARACTERS;
  const { users, isLoading, error } = useSearchUsers(shouldSearch ? state.currentMentionQuery : '');

  // Initialize selection state when value changes externally
  useEffect(() => {
    setState(prev => ({
      ...prev,
      selection: { start: value.length, end: value.length }
    }));
  }, []);

  // Parse mentions from text
  const parsedMentions = useMemo(() => {
    return extractMentionsFromText(value);
  }, [value]);

  /**
   * Detect mention at current cursor position
   */
  const detectMentionAtCursor = useCallback((text: string, cursorPosition: number): MentionDetectionResult => {
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(MENTION_PATTERNS.MENTION_AT_CURSOR);

    if (mentionMatch && mentionMatch.index !== undefined) {
      const query = mentionMatch[1];
      const mentionStart = mentionMatch.index;
      
      const afterCursor = text.substring(cursorPosition, cursorPosition + 1);
      const isTypingMention = afterCursor === '' || afterCursor === ' ' || afterCursor === '\n';
      
      return {
        isTypingMention,
        query,
        mentionStart,
        mentionEnd: cursorPosition,
      };
    }

    return {
      isTypingMention: false,
      query: '',
      mentionStart: 0,
      mentionEnd: 0,
    };
  }, []);

  /**
   * Update the mentions array when text changes
   */
  const updateMentionsList = useCallback((text: string) => {
    const currentMentions = parsedMentions.map(parsed => {
      const existingMention = state.mentions.find(m => m.username === parsed.username);
      return existingMention || { username: parsed.username };
    });

    const validMentions = filterValidMentions(currentMentions);
    setState(prev => ({ ...prev, mentions: currentMentions }));
    onMentionsChange?.(validMentions);
  }, [parsedMentions, state.mentions, onMentionsChange]);

  /**
   * Handle text changes and detect @mentions
   */
  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
    
    const detection = detectMentionAtCursor(text, state.selection.start);
    
    setState(prev => ({
      ...prev,
      currentMentionQuery: detection.query,
      mentionPosition: {
        start: detection.mentionStart,
        end: detection.mentionEnd,
      },
      showSuggestions: detection.isTypingMention && detection.query.length >= 0,
    }));
    
    updateMentionsList(text);
  }, [state.selection.start, detectMentionAtCursor, updateMentionsList, onChangeText]);

  /**
   * Handle selection changes (cursor movement)
   */
  const handleSelectionChange = useCallback((event: { nativeEvent: { selection: { start: number; end: number } } }) => {
    const newSelection = event.nativeEvent.selection;
    setState(prev => ({ ...prev, selection: newSelection }));
    
    const detection = detectMentionAtCursor(value, newSelection.start);
    setState(prev => ({
      ...prev,
      currentMentionQuery: detection.query,
      mentionPosition: {
        start: detection.mentionStart,
        end: detection.mentionEnd,
      },
      showSuggestions: detection.isTypingMention && detection.query.length >= 0,
    }));
  }, [value, detectMentionAtCursor]);

  /**
   * Handle user selection from suggestions
   */
  const handleUserSelect = useCallback((user: SearchUser) => {
    const mentionText = `@${user.username} `;
    const newText = 
      value.substring(0, state.mentionPosition.start) +
      mentionText +
      value.substring(state.mentionPosition.end);

    const newCursorPosition = state.mentionPosition.start + mentionText.length;

    // Add user to mentions
    const newMention: MentionUser = {
      username: user.username,
    };

    const updatedMentions = [
      ...state.mentions.filter(m => m.username !== user.username), 
      newMention
    ];
    
    // Update state but keep input focused and don't immediately hide suggestions
    setState(prev => ({
      ...prev,
      mentions: updatedMentions,
      showSuggestions: false,
      currentMentionQuery: '',
      selection: { start: newCursorPosition, end: newCursorPosition },
    }));
    
    onMentionsChange?.(filterValidMentions(updatedMentions));
    
    // Update text first, then handle selection
    onChangeText(newText);
    
    // Ensure the input stays focused and cursor is positioned correctly
    requestAnimationFrame(() => {
      if (textInputRef.current) {
        textInputRef.current.setNativeProps({
          selection: { start: newCursorPosition, end: newCursorPosition }
        });
      }
    });
  }, [value, state.mentionPosition, state.mentions, onChangeText, onMentionsChange]);

  return {
    showSuggestions: state.showSuggestions,
    currentMentionQuery: state.currentMentionQuery,
    users,
    isLoading,
    error: error?.message || null,
    handleTextChange,
    handleSelectionChange,
    handleUserSelect,
    mentions: state.mentions,
  };
};