import { useState, useRef, useEffect } from 'react';
import { TextInput, Keyboard } from 'react-native';

interface UseChatInputStateProps {
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export const useChatInputState = ({ onTypingStart, onTypingStop }: UseChatInputStateProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (message: string) => {
    // Only set to unfocused if there's no message content
    // This allows keyboard dismissal to be the primary way to exit focus with content
    if (!message.trim()) {
      setIsFocused(false);
    }
  };

  const handleTypingStart = (text: string) => {
    if (text.length > 0 && !typingTimeoutRef.current) {
      onTypingStart?.();
    }
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onTypingStop?.();
  };

  const setTypingTimeout = (text: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop?.();
        typingTimeoutRef.current = null;
      }, 2000);
    } else {
      onTypingStop?.();
      typingTimeoutRef.current = null;
    }
  };

  // Listen for keyboard events to handle focus state
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Add a small delay to check if input is still focused
      setTimeout(() => {
        // Only dismiss focus if the input is not actually focused
        if (inputRef.current && !inputRef.current.isFocused()) {
          setIsFocused(false);
        }
      }, 100);
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      keyboardDidHideListener.remove();
    };
  }, []);

  return {
    isFocused,
    inputRef,
    handleFocus,
    handleBlur,
    handleTypingStart,
    handleTypingStop,
    setTypingTimeout,
  };
};