import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import MentionText from "@/components/ui/MentionText";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { MessageRenderProps } from "@/helpers/types/chat/message.types";
import { extractUsername } from "@/helpers/utils/messageUtils";
import MessageAvatar from "../MessageAvatar";
import MessageTimestamp from "./MessageTimestamp";
import ReplyPreview from "./ReplyPreview";

const TextMessageRenderer: React.FC<MessageRenderProps> = ({
  item,
  isOwnMessage,
  formattedTime,
  shouldShowTimestamp,
  onUserPress,
  scrollToMessage,
  highlightedMessageId,
}) => {
  const { theme } = useCustomTheme();
  const username = extractUsername(item.userId);
  const userId = item.userId;
  const messageId = item._id || item.id;
  const isHighlighted = highlightedMessageId === messageId;

  // Log deleted message rendering
  if (item.isDeleted) {
    console.log("🏘️ [TEXT_MESSAGE_RENDERER] Rendering DELETED message:", {
      messageId: item._id || item.id,
      isDeleted: item.isDeleted,
      text: item.text?.substring(0, 50),
      willShowDeletedText: !!item.isDeleted,
      renderingDeletedBranch: true,
    });
  } else {
    console.log("🏘️ [TEXT_MESSAGE_RENDERER] Rendering NORMAL message:", {
      messageId: item._id || item.id,
      isDeleted: item.isDeleted,
      text: item.text?.substring(0, 50),
      renderingNormalBranch: true,
    });
  }

  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.userMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {!isOwnMessage && userId && (
        <MessageAvatar
          user={userId}
          onPress={() => onUserPress && onUserPress(typeof userId === "object" ? userId._id : userId)}
          disabled={!userId}
        />
      )}

      <View style={styles.messageWrapper}>
        {item.isDeleted ? (
          <View style={styles.deletedMessageContainer}>
            {!isOwnMessage && userId && (
              <TouchableOpacity
                onPress={() => onUserPress && onUserPress(typeof userId === "object" ? userId._id : userId)}
                activeOpacity={0.7}
                disabled={!userId}
              >
                <Typography
                  weight="500"
                  size={12}
                  color={Colors.general.primary}
                  style={styles.senderName}
                >
                  {username}
                </Typography>
              </TouchableOpacity>
            )}
            <Typography
              size={13}
              color="#667085"
              style={styles.deletedMessageText}
            >
              This message was deleted
            </Typography>
          </View>
        ) : (
          <View
            style={[
              styles.messageBubble,
              isOwnMessage
                ? [styles.userMessageBubble, { backgroundColor: Colors[theme].chatSender } ]
                : [
                    styles.otherMessageBubble,
                    { backgroundColor: Colors[theme].chatReceiver },
                  ],
              isHighlighted && {
                backgroundColor: Colors.general.primary + '20',
              },
            ]}
          >
            
            <ReplyPreview message={item} onPress={scrollToMessage} />
            
            {!isOwnMessage && userId && (
              <TouchableOpacity
                onPress={() => onUserPress && onUserPress(typeof userId === "object" ? userId._id : userId)}
                activeOpacity={0.7}
                disabled={!userId}
              >
                <Typography
                  weight="500"
                  size={12}
                  color={Colors.general.primary}
                  style={styles.senderName}
                >
                  {username}
                </Typography>
              </TouchableOpacity>
            )}

            <MentionText
              text={item.text || ''}
              mentions={[]}
              size={14}
              color={Colors[theme].textBold}
              style={[
                styles.messageText,
                {
                  textDecorationLine: 'none', // no underline by default
                }
              ]}
            />
          </View>
        )}

        <MessageTimestamp
          show={shouldShowTimestamp}
          time={formattedTime}
          isOwnMessage={isOwnMessage}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 15,
    flexDirection: "row",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageWrapper: {
    maxWidth: "75%",
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userMessageBubble: {
  },
  otherMessageBubble: {},
  senderName: {
    marginBottom: 2,
    marginHorizontal: 4,
  },
  messageText: {
    lineHeight: 18,
    fontSize: 14,
  },
  deletedMessageContainer: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  deletedMessageText: {
    lineHeight: 18,
    fontSize: 13,
    fontStyle: "italic",
  },
});

export default TextMessageRenderer;