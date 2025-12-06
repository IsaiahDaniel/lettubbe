import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { InboxMessage } from "../types/InboxTypes";

interface InboxReplyPreviewProps {
  message: InboxMessage;
  onPress?: (messageId: string) => void;
}

const InboxReplyPreview: React.FC<InboxReplyPreviewProps> = ({ message, onPress }) => {
  const { theme } = useCustomTheme();

  // Only show if message has repliedTo
  if (!message.repliedTo || typeof message.repliedTo === "string") {
    return null;
  }

  const replyMessage = message.repliedTo;
  const replyId = replyMessage._id || replyMessage.id;

  const handlePress = () => {
    if (onPress && replyId) {
      onPress(replyId);
    }
  };

  const getReplyUsername = () => {
    // Primary: use senderName if available (set during reply creation)
    if (replyMessage.senderName) {
      return replyMessage.senderName;
    }
    
    // Secondary: extract from userId if it's an object with user data
    if (typeof replyMessage.userId === "object" && replyMessage.userId) {
      const userObj = replyMessage.userId as any;
      if (userObj.firstName && userObj.lastName) {
        return `${userObj.firstName} ${userObj.lastName}`;
      }
      if (userObj.firstName) return userObj.firstName;
      if (userObj.username) return userObj.username;
      if (userObj.displayName) return userObj.displayName;
    }
    
    // Tertiary: check for other user fields on the message
    if (replyMessage.firstName && replyMessage.lastName) {
      return `${replyMessage.firstName} ${replyMessage.lastName}`;
    }
    if (replyMessage.firstName) return replyMessage.firstName;
    if (replyMessage.username) return replyMessage.username;
    if (replyMessage.displayName) return replyMessage.displayName;
    
    return "User";
  };

  const getReplyText = (text: string) => {
    // Handle special content types
    const videoLinkPattern = /^lettubbe:\/\/video\/([^?]+)\?data=(.+)$/;
    if (videoLinkPattern.test(text)) {
      return "post";
    }
    
    // Truncate long text
    const truncateText = (str: string, maxLength: number) => {
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + "...";
    };
    
    return truncateText(text, 60);
  };

  const getMessagePreview = () => {
    // Check for media attachments first
    const messageImages = replyMessage.images || replyMessage.mediaUrls?.images || [];
    const messageVideos = replyMessage.videos || replyMessage.mediaUrls?.videos || 
      (replyMessage.videoUrl ? [replyMessage.videoUrl] : []);
    const messageAudioUrl = replyMessage.audioUrl || replyMessage.mediaUrls?.audioUrl || '';
    const messageDocumentUrls = replyMessage.documentUrls || replyMessage.mediaUrls?.documentUrls || [];
    
    if (messageImages.length > 0) return '📷 Photo';
    if (messageVideos.length > 0) return '🎥 Video';
    if (messageAudioUrl) return '🎵 Audio';
    if (messageDocumentUrls.length > 0) return '📄 Document';
    
    // Return text content
    return getReplyText(replyMessage.text || "Message");
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
        {getReplyUsername()}
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

export default InboxReplyPreview;