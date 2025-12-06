import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 15,
    flexDirection: "column",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageWrapper: {
    maxWidth: "75%",
    alignSelf: "flex-start",
  },
  userMessageWrapper: {
    alignSelf: "flex-end",
  },
  videoMessageWrapper: {
    maxWidth: "85%",
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 8,
  },
  userMessageBubble: {
    paddingHorizontal: 12,
  },
  otherMessageBubble: {
    paddingHorizontal: 12,
  },
  messageText: {
    fontSize: 14,
  },
  userMessageText: {
  },
  otherMessageText: {
    // color: "white",
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginHorizontal: 4,
    gap: 4,
  },
  userTimestampContainer: {
    justifyContent: "flex-end",
  },
  otherTimestampContainer: {
    justifyContent: "flex-start",
  },
  timestamp: {
    fontSize: 11,
  },
  timestampDot: {
  },
  deletedMessageContainer: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  deletedMessageText: {
    lineHeight: 18,
    fontSize: 13,
    fontStyle: 'italic',
  },
});