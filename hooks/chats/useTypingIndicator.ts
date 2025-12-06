import { useState, useCallback } from 'react';
import { TypingState } from '@/helpers/types/chat/chat-message.types';

export const useTypingIndicator = () => {
  const [typingState, setTypingState] = useState<TypingState>({
    isTyping: false,
    otherUserTyping: false,
  });

  const startTyping = useCallback(() => {
    setTypingState(prev => ({ ...prev, isTyping: true }));
  }, []);

  const stopTyping = useCallback(() => {
    setTypingState(prev => ({ ...prev, isTyping: false }));
  }, []);

  const setOtherUserTyping = useCallback((isTyping: boolean) => {
    setTypingState(prev => ({ ...prev, otherUserTyping: isTyping }));
  }, []);

  const resetTyping = useCallback(() => {
    setTypingState({ isTyping: false, otherUserTyping: false });
  }, []);

  return {
    ...typingState,
    startTyping,
    stopTyping,
    setOtherUserTyping,
    resetTyping,
  };
};