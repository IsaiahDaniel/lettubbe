import React from "react";
import { View } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants/Colors";
import { MessageRenderProps } from "../types/InboxTypes";
import { MessageExtractorService } from "../services/MessageExtractorService";
import { TimestampService } from "../services/TimestampService";
import { CommunityInviteMessage } from "./message-types/CommunityInviteMessage";
import { MediaAttachmentMessage } from "./message-types/MediaAttachmentMessage";
import { RegularMessage } from "./message-types/RegularMessage";
import { StreamMessage } from "./message-types/StreamMessage";
import { styles } from "../styles/MessageStyles";
import SwipeableMessage from "./SwipeableMessage";
import InboxReplyPreview from "./InboxReplyPreview";
import { useCustomTheme } from '@/hooks/useCustomTheme';

export const MessageRenderer: React.FC<MessageRenderProps> = ({
  message,
  index,
  currentUserId,
  profile,
  userDetails,
  otherUser,
  onMediaPress,
  onReply,
  onLongPress,
  longPressedMessageId,
  scrollToMessage,
  highlightedMessageId
}) => {
  const { theme } = useCustomTheme();
  if (!message || typeof message !== 'object') return null;

  const isUser = message.userId?.toString() === currentUserId?.toString();
  const formattedTime = TimestampService.formatMessageTime(message.time || message.createdAt);
  const messageId = message.id?.toString() || message._id?.toString() || `msg-${index}`;
  const isLongPressed = longPressedMessageId === messageId;
  const isHighlighted = highlightedMessageId === messageId;

  // Extract message data
  const videoData = MessageExtractorService.extractVideoData(message.text);
  const photoData = MessageExtractorService.extractPhotoData(message.text);
  const audioData = MessageExtractorService.extractAudioData(message.text);
  const inviteData = MessageExtractorService.extractCommunityInviteData(message.text);
  const streamData = MessageExtractorService.extractStreamData(message);

  // Check message types
  const isCommunityInvite = !!inviteData;
  const isVideoMessage = !!videoData;
  const isPhotoMessage = !!photoData;
  const isAudioMessage = !!audioData;
  const isStreamMessage = !!streamData;

  // Handle deleted messages with special styling FIRST - before checking media
  if (message.isDeleted === true || message.isDeleted === "true" || message.isDeleted === 1) {
    console.log("🗑️ [DEBUG] Rendering deleted message:", messageId);
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View style={[styles.messageWrapper, isUser && styles.userMessageWrapper]}>
          <View style={styles.deletedMessageContainer}>
            <Typography
              size={13}
              color="#667085"
              style={styles.deletedMessageText}
            >
              This message was deleted
            </Typography>
          </View>
          {/* Show timestamp for deleted messages */}
          <View
            style={[
              styles.timestampContainer,
              isUser
                ? styles.userTimestampContainer
                : styles.otherTimestampContainer,
            ]}
          >
            <Typography
              style={[styles.timestamp, { color: Colors[theme].textLight }]}
              size={11}
            >
              {formattedTime}
            </Typography>
          </View>
        </View>
      </View>
    );
  }

  // Check for media attachments
  const messageImages = message.images || message.mediaUrls?.images || [];
  const messageVideos = message.videos || message.mediaUrls?.videos || 
    (message.videoUrl ? [message.videoUrl] : []);
  const messageAudioUrl = message.audioUrl || message.mediaUrls?.audioUrl || '';
  const messageDocumentUrls = message.documentUrls || message.mediaUrls?.documentUrls || 
    (message.documentUrl ? [message.documentUrl] : []);
  const messageDocumentDetails = message.documentDetails || message.mediaUrls?.documentDetails || [];
  const hasMediaAttachments = messageImages.length > 0 || messageVideos.length > 0 || !!messageAudioUrl || messageDocumentUrls.length > 0;


  // Debug document details extraction
  if (messageDocumentUrls.length > 0) {
    console.log("📄 [MESSAGE_RENDERER] Document extraction:", {
      messageId,
      documentUrls: messageDocumentUrls,
      documentDetails: messageDocumentDetails,
      hasDocumentDetails: messageDocumentDetails.length > 0,
      rawMessage: {
        documentUrls: message.documentUrls,
        documentUrl: message.documentUrl,
        documentDetails: message.documentDetails,
        mediaUrls: message.mediaUrls
      }
    });
  }
  
  // Handle deleted messages with special styling
  // console.log("🗑️ [DEBUG] MessageRenderer - Message deletion check:", {
  //   messageId,
  //   isDeleted: message.isDeleted,
  //   isDeletedType: typeof message.isDeleted,
  //   messageText: message.text?.substring(0, 50),
  //   rawMessage: JSON.stringify(message).substring(0, 200)
  // });
  
  if (message.isDeleted === true || message.isDeleted === "true" || message.isDeleted === 1) {
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View style={[styles.messageWrapper, isUser && styles.userMessageWrapper]}>
          <View style={styles.deletedMessageContainer}>
            <Typography
              size={13}
              color="#667085"
              style={styles.deletedMessageText}
            >
              This message was deleted
            </Typography>
          </View>
          {/* Show timestamp for deleted messages */}
          <View
            style={[
              styles.timestampContainer,
              isUser
                ? styles.userTimestampContainer
                : styles.otherTimestampContainer,
            ]}
          >
            <Typography
              style={[styles.timestamp, { color: Colors[theme].textLight }]}
              size={11}
            >
              {formattedTime}
            </Typography>
          </View>
        </View>
      </View>
    );
  }

  // Skip rendering completely empty messages (no text, no media)
  const hasContent = message.text?.trim() || hasMediaAttachments || isCommunityInvite || isVideoMessage || isPhotoMessage || isAudioMessage || isStreamMessage;
  if (!hasContent) {
    console.log("🚫 [MESSAGE_RENDERER] Skipping empty message:", { messageId, text: message.text, hasMedia: hasMediaAttachments });
    return null;
  }

  const commonProps = {
    message,
    isUser,
    formattedTime,
    theme,
    currentUserId,
    profile,
    userDetails,
    otherUser,
    scrollToMessage,
    highlightedMessageId,
    isHighlighted
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const handleLongPress = (event: any) => {
    if (onLongPress) {
      onLongPress(event, message);
    }
  };

  const messageContent = (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {isCommunityInvite ? (
        <CommunityInviteMessage 
          {...commonProps}
          inviteData={inviteData}
          replyMessage={message.repliedTo}
        />
      ) : isStreamMessage ? (
        <StreamMessage
          {...commonProps}
          streamData={streamData}
          replyMessage={message.repliedTo}
          retryFn={message.retryFn}
          isOptimistic={message.isOptimistic}
          isSent={message.isSent}
          uploadError={message.uploadError}
          isUploading={message.isUploading}
        />
      ) : hasMediaAttachments ? (
        <MediaAttachmentMessage
          {...commonProps}
          messageImages={messageImages}
          messageVideos={messageVideos}
          messageAudioUrl={messageAudioUrl}
          messageDocumentUrls={messageDocumentUrls}
          messageDocumentDetails={messageDocumentDetails}
          onMediaPress={onMediaPress}
          replyMessage={message.repliedTo}
          retryFn={message.retryFn}
          isOptimistic={message.isOptimistic}
          isSent={message.isSent}
          uploadError={message.uploadError}
          isUploading={message.isUploading}
        />
      ) : (
        <RegularMessage
          {...commonProps}
          isVideoMessage={isVideoMessage}
          isPhotoMessage={isPhotoMessage}
          isAudioMessage={isAudioMessage}
          isStreamMessage={isStreamMessage}
          videoData={videoData}
          photoData={photoData}
          audioData={audioData}
          streamData={streamData}
          replyMessage={message.repliedTo}
          retryFn={message.retryFn}
          isOptimistic={message.isOptimistic}
          isSent={message.isSent}
          uploadError={message.uploadError}
          isUploading={message.isUploading}
        />
      )}
    </View>
  );

  // Wrap with swipeable if onReply or onLongPress is provided
  if (onReply || onLongPress) {
    return (
      <SwipeableMessage
        onReply={handleReply}
        isCurrentUser={isUser}
        onLongPress={onLongPress ? handleLongPress : undefined}
      >
        {messageContent}
      </SwipeableMessage>
    );
  }

  return messageContent;
};