import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Icons } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { MentionInput } from "@/components/ui/inputs/mentions";
import { MentionUser } from "@/store/videoUploadStore";

interface CommentInputProps {
  commentText: string;
  setCommentText: (text: string) => void;
  handleAddComment: () => void;
  replyTo: string | null;
  replyToUsername: string;
  cancelReply: () => void;
  theme: string;
  isSubmitting?: boolean;
  onMentionsChange?: (mentions: MentionUser[]) => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
  commentText,
  setCommentText,
  handleAddComment,
  replyTo,
  replyToUsername,
  cancelReply,
  isSubmitting = false,
  onMentionsChange,
}) => {
  const { theme } = useCustomTheme();

  const handleSend = () => {
    if (commentText.trim() && !isSubmitting) {
      handleAddComment();
    }
  };

  const isDisabled = !commentText.trim() || isSubmitting;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={styles.container}
    >
      {/* Reply indicator */}
      {replyTo && (
        <View style={styles.replyIndicator}>
          <Typography size={12} color={Colors.general.primary}>
            Replying to @{replyToUsername}
          </Typography>
          <TouchableOpacity onPress={cancelReply}>
            <Feather name="x" size={16} color={Colors.general.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, { borderBottomColor: Colors[theme].borderColor }]}>
          <MentionInput
            value={commentText}
            onChangeText={setCommentText}
            onMentionsChange={onMentionsChange}
            placeholder={replyTo ? `Reply to ${replyToUsername}...` : "Add a comment"}
            multiline
            style={[styles.textInput, { color: Colors[theme].textBold }]}
            suggestionsPosition="above"
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sendButton
          ]}
          onPress={handleSend}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          <Image
            source={Icons.send}
            style={[
              { width: 24, height: 24 }
            ]}
            tintColor={isDisabled ? Colors[theme].textLight : Colors[theme].textBold}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    borderBottomWidth: 1,
  },
  textInput: {
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: 'bottom',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  replyIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0, 212, 123, 0.1)",
    alignItems: "center",
    marginBottom: 8,
    marginHorizontal: 16,
  },
});

export default CommentInput;