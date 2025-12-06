import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';

const { width: screenWidth } = Dimensions.get('window');

interface LiveChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  style?: any;
  showEmojiPicker?: boolean;
  onEmojiPickerToggle?: (show: boolean) => void;
}

export interface LiveChatInputRef {
  addEmoji: (emoji: string) => void;
  focus: () => void;
}

const POPULAR_EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '👏', '😍', '😢', '😮', '🎉'];

export const LiveChatInput = forwardRef<LiveChatInputRef, LiveChatInputProps>(({
  onSend,
  placeholder = "Add a comment...",
  style,
  showEmojiPicker = false,
  onEmojiPickerToggle
}, ref) => {
  const { theme } = useCustomTheme();
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    addEmoji: (emoji: string) => {
      setMessage(prev => prev + emoji);
    },
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
      onEmojiPickerToggle?.(false);
      inputRef.current?.blur();
    }
  };

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      // Closing emoji picker - keep keyboard open
      onEmojiPickerToggle?.(false);
    } else {
      // Opening emoji picker - keep keyboard open
      onEmojiPickerToggle?.(true);
      // Ensure input stays focused so keyboard remains open
      if (!inputRef.current?.isFocused()) {
        inputRef.current?.focus();
      }
    }
  };

  const hasText = message.trim().length > 0;

  return (
    <View style={[styles.container, style]}>
      {/* Input Row */}
      <View style={styles.inputRow}>
        {/* Emoji Button */}
        {/* <TouchableOpacity
          style={styles.emojiToggleButton}
          onPress={toggleEmojiPicker}
        >
          <Ionicons 
            name={showEmojiPicker ? "close" : "happy-outline"} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity> */}

        {/* Text Input */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <View style={styles.underline} />
        </View>

        {/* Send Button */}
        {hasText && (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// Separate Emoji Picker Component
interface EmojiPickerProps {
  visible: boolean;
  onEmojiPress: (emoji: string) => void;
  style?: any;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  visible,
  onEmojiPress,
  style
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.emojiPicker, style]}>
      <View style={styles.emojiGrid}>
        {POPULAR_EMOJIS.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emojiButton}
            onPress={() => onEmojiPress(emoji)}
          >
            <Text style={styles.emojiText}>
              {emoji}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emojiPicker: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
  },
  emojiButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emojiText: {
    fontSize: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  emojiToggleButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
    minHeight: 32,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  sendButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default LiveChatInput;