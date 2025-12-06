import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants/Colors";

interface ReplyMessagePreviewProps {
  replyMessage: any;
  animatedStyle: any;
  onClose: () => void;
}

const ReplyMessagePreview: React.FC<ReplyMessagePreviewProps> = ({
  replyMessage,
  animatedStyle,
  onClose,
}) => {
  const { theme } = useCustomTheme();

  if (!replyMessage) return null;

  const getUsername = () => {
    if (typeof replyMessage.userId === "object" &&
        replyMessage.userId &&
        "username" in replyMessage.userId) {
      return (replyMessage.userId as { username?: string }).username ?? "Unknown";
    }
    return "Unknown";
  };

  const getMessagePreview = () => {
    // Check for media attachments first
    const messageImages = replyMessage.images || [];
    const messageVideos = replyMessage.videoUrl ? [replyMessage.videoUrl] : [];
    const messageAudioUrl = replyMessage.audioUrl || '';
    const messageDocumentUrls = replyMessage.documentUrls || [];
    
    if (messageImages.length > 0) return 'Photo';
    if (messageVideos.length > 0) return 'Video';
    if (messageAudioUrl) return 'Audio';
    if (messageDocumentUrls.length > 0) return 'Document';
    
    // Handle special content types (shared posts)
    const videoLinkPattern = /^lettubbe:\/\/video\/([^?]+)\?data=(.+)$/;
    const photoLinkPattern = /^lettubbe:\/\/photo\/([^?]+)$/;
    
    if (videoLinkPattern.test(replyMessage.text || '')) {
      return "Video Post";
    }
    if (photoLinkPattern.test(replyMessage.text || '')) {
      return "Photo Post";
    }
    
    // Return text content
    return replyMessage.text || "Message";
  };

  return (
    <Animated.View style={[animatedStyle, styles.replyMessageWrapper]}>
      <View
        style={[
          styles.replyMessageContainer,
          // { backgroundColor: Colors[theme].background },
        ]}
      >
        <View style={[
          styles.replyMessageContent,
          { backgroundColor: Colors[theme].cardBackground }
        ]}>
          <View style={styles.replyIndicator} />
          <View style={styles.replyTextContainer}>
            <Typography
              style={styles.replyingToText}
              size={12}
              color={Colors[theme].textLight}
            >
              Replying to {getUsername()}
            </Typography>
            <Typography
              style={styles.replyMessageText}
              numberOfLines={1}
              color={Colors[theme].textLight}
            >
              {getMessagePreview()}
            </Typography>
          </View>
          <Pressable style={styles.closeReplyButton} onPress={onClose}>
            <Ionicons
              name="close"
              size={18}
              color={Colors[theme].textLight}
            />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  replyMessageWrapper: {
    position: "relative",
    zIndex: 10,
    backgroundColor: "transparent",
  },
  replyMessageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1000,
    position: "relative",
  },
  replyMessageContent: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  replyIndicator: {
    width: 4,
    height: 32,
    backgroundColor: Colors.general.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  replyTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  replyingToText: {
    fontWeight: "600",
    marginBottom: 2,
  },
  replyMessageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  closeReplyButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default ReplyMessagePreview;