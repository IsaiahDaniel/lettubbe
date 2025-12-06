import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { CommunityMessage } from "@/helpers/types/chat/message.types";
import { extractUsername } from "@/helpers/utils/messageUtils";
import { truncateText } from "@/helpers/utils/util";

interface ReplyPreviewProps {
  message: CommunityMessage;
  onPress?: (messageId: string) => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, onPress }) => {
  const { theme } = useCustomTheme();

  if (!message.repliedTo || typeof message.repliedTo === "string") {
    return null;
  }

  const replyMessage = message.repliedTo;
  const replyUsername = extractUsername(replyMessage.userId);
  const replyId = replyMessage._id || replyMessage.id;

  const handlePress = () => {    
    if (onPress && replyId) {
      console.log("🎯 [REPLY_PREVIEW] Calling onPress with replyId:", replyId);
      onPress(replyId);
    } else {
      console.log("🎯 [REPLY_PREVIEW] Not calling onPress:", {
        hasOnPress: !!onPress,
        hasReplyId: !!replyId
      });
    }
  };

  const getMessagePreview = () => {
    // check if replyMessage has media properties
    const isMediaMessage = (msg: any): msg is CommunityMessage => {
      return msg && typeof msg === 'object' && msg.hasOwnProperty('_id');
    };
    
    if (isMediaMessage(replyMessage)) {
      // Check for media attachments first
      const messageImages = replyMessage.images || [];
      const messageVideos = replyMessage.videoUrl ? [replyMessage.videoUrl] : [];
      const messageAudioUrl = replyMessage.audioUrl || '';
      const messageDocumentUrls = replyMessage.documentUrls || [];
      
      if (messageImages.length > 0) return 'Photo';
      if (messageVideos.length > 0) return 'Video';
      if (messageAudioUrl) return 'Audio';
      if (messageDocumentUrls.length > 0) return 'Document';
    }
    
    // Handle special content types
    const videoLinkPattern = /^lettubbe:\/\/video\/([^?]+)\?data=(.+)$/;
    const photoLinkPattern = /^lettubbe:\/\/photo\/([^?]+)$/;
    
    if (videoLinkPattern.test(replyMessage.text || '')) {
      return "Video Post";
    }
    if (photoLinkPattern.test(replyMessage.text || '')) {
      return "Photo Post";
    }
    
    // Return truncated text content
    return truncateText(replyMessage.text || "Message", 60);
  };

  return (
    <TouchableOpacity
      style={[
        styles.replyContainer,
        {
          backgroundColor: Colors[theme].cardBackground,
          borderLeftColor: Colors.general.primary,
        },
      ]}
      onPress={handlePress}
      disabled={!onPress || !replyId}
      activeOpacity={0.7}
    >
      <Typography
        style={[styles.replyUsernameText, { color: Colors.general.primary }]}
      >
        {replyUsername}
      </Typography>
      <Typography
        style={[styles.replyText, { color: Colors[theme].textLight }]}
      >
        {getMessagePreview()}
      </Typography>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  replyContainer: {
    padding: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
    borderRadius: 8,
  },
  replyUsernameText: {
    fontSize: 11,
    fontWeight: "600",
  },
  replyText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
});

export default ReplyPreview;