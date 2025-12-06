import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import { MentionInputProps } from '@/helpers/types/mentions.types';
import { useMentionInput } from '@/hooks/mentions/useMentionInput';
import MentionSuggestions from './MentionSuggestions';

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChangeText,
  onMentionsChange,
  placeholder = "What's happening?",
  multiline = true,
  maxLength = 500,
  style,
}) => {
  const { theme } = useCustomTheme();
  const textInputRef = useRef<TextInput>(null);

  // custom hook for mention logic
  const {
    showSuggestions,
    currentMentionQuery,
    users,
    isLoading,
    error,
    handleTextChange,
    handleSelectionChange,
    handleUserSelect,
    mentions,
  } = useMentionInput(value, onChangeText, onMentionsChange);

  // keep it simple

  // Memoize the input focus handler
  const handleInputFocus = useCallback(() => {
    textInputRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        ref={textInputRef}
        style={[
          styles.textInput,
          {
            backgroundColor: Colors[theme].inputBackground,
            color: Colors[theme].text,
            borderColor: Colors[theme].borderColor,
          },
          style,
        ]}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        placeholderTextColor={Colors[theme].textLight}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical="top"
        autoFocus={false}
        blurOnSubmit={false}
        accessibilityLabel="Mention input field"
        accessibilityHint="Type @ followed by username to mention someone"
      />

      {/* Suggestions dropdown */}
      {showSuggestions && currentMentionQuery.length > 0 && (
        <MentionSuggestions
          users={users}
          isLoading={isLoading}
          error={error}
          query={currentMentionQuery}
          onUserSelect={handleUserSelect}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 100,
    maxHeight: 200,
  },
});

export default MentionInput;