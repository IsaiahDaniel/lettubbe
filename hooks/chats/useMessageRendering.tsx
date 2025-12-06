import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { useCustomTheme } from "../useCustomTheme";
import useAuth from "../auth/useAuth";
import { CommunityMessage, CommunityMessageWithContext, MessageType, MessageListItem } from "@/helpers/types/chat/message.types";
import { 
  extractUserId, 
  extractUsername, 
  getUserProfilePicture,
  formatMessageTime, 
  getMessageType, 
  shouldShowTimestamp,
  isOwnMessage as checkIsOwnMessage,
  getImageList,
  getVideoUri,
  getAudioUri,
  getDocumentUrls,
  getDocumentDetails,
  extractPhotoDataFromMessage,
  extractVideoDataFromMessage,
  extractStreamDataFromMessage
} from "@/helpers/utils/messageUtils";

// Static imports for components
import TextMessageRenderer from "@/components/shared/chat/renderers/TextMessageRenderer";
import ChatImageRenderer from "@/components/shared/chat/ChatImageRenderer";
import ChatVideoRenderer from "@/components/shared/chat/ChatVideoRenderer";
import VoiceMessageRenderer from "@/components/shared/chat/renderers/VoiceMessageRenderer";
import DocumentMessageRenderer from "@/components/shared/chat/renderers/DocumentMessageRenderer";
import CommunityInviteRenderer from "@/components/shared/chat/renderers/CommunityInviteRenderer";
import SharedPhotoCard from "@/components/shared/chat/SharedPhotoCard";
import SharedVideoCard from "@/components/shared/chat/SharedVideoCard";
import SharedStreamCard from "@/components/shared/chat/SharedStreamCard";

interface UseMessageRenderingProps {
  messages?: CommunityMessage[];
  replyMessage?: CommunityMessage | null;
  setReplyMessage?: (message: CommunityMessage | null) => void;
  scrollToMessage?: (messageId: string) => void;
  onMediaPress?: (mediaItems: any[], initialIndex: number, senderName: string, timestamp: string) => void;
  onRetryUpload?: (messageId: string) => void;
  highlightedMessageId?: string | null;
}

export const useMessageRendering = ({
  messages = [],
  replyMessage,
  setReplyMessage,
  scrollToMessage,
  onMediaPress,
  onRetryUpload,
  highlightedMessageId,
}: UseMessageRenderingProps) => {
  const { userDetails } = useAuth();
  const router = useRouter();

  const handleUserPress = useCallback((userId: string, messageItem: CommunityMessage) => {
    if (!userId || !messageItem?.userId) {
      console.warn("Cannot navigate to profile: missing user data");
      return;
    }

    const profileParams = new URLSearchParams({
      userId: userId,
      username: extractUsername(messageItem.userId),
      displayName: extractUsername(messageItem.userId),
      subscriberCount: "0",
      avatar: getUserProfilePicture(messageItem.userId) || "",
    });

    router.push(`/(chat)/${userId}/Profile?${profileParams.toString()}` as any);
  }, [router]);

  const createMediaPressHandler = useCallback((item: CommunityMessage) => 
    (mediaItems: any[], initialIndex: number) => {
      if (onMediaPress) {
        // Extract username from userId for the media viewer
        const senderName = extractUsername(item.userId);
        const timestamp = formatMessageTime(item.createdAt);
        onMediaPress(mediaItems, initialIndex, senderName, timestamp);
      }
    }, [onMediaPress]);

  const handleRetry = useCallback((messageId: string) => {
    if (onRetryUpload) {
      onRetryUpload(messageId);
    }
  }, [onRetryUpload]);

  const buildBaseMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const messageUserId = extractUserId(item.userId);
    // Use pre-calculated isCurrentUser if available (from MessageUIHelper), otherwise calculate
    const hasPreCalculated = 'isCurrentUser' in item;
    const isOwn = hasPreCalculated
      ? (item as CommunityMessageWithContext).isCurrentUser 
      : checkIsOwnMessage(item, userDetails._id);
    
    // Log deleted message status
    if (item.isDeleted) {
      console.log(`🏘️ [MESSAGE_RENDERING] Building props for DELETED message:`, {
        index,
        messageId: item._id || item.id,
        text: item.text?.substring(0, 50),
        isDeleted: item.isDeleted,
        isOwn,
      });
    }
    
    const formattedTime = formatMessageTime(item.createdAt);
    const showTimestamp = shouldShowTimestamp(item, messages, index);

    return {
      item,
      index,
      isOwnMessage: isOwn,
      formattedTime,
      shouldShowTimestamp: showTimestamp,
      onUserPress: (userId: string) => handleUserPress(userId, item),
      scrollToMessage,
      highlightedMessageId,
    };
  }, [userDetails._id, messages, handleUserPress, scrollToMessage, highlightedMessageId]);

  const buildImageMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const baseProps = buildBaseMessageProps(item, index);
    return {
      ...baseProps,
      images: getImageList(item),
      caption: item.text,
      onPress: createMediaPressHandler(item),
      isUploading: item.isUploading || false,
      uploadProgress: (item as any).uploadProgress || 0,
      uploadError: item.uploadError || false,
      onRetry: () => handleRetry(item._id || item.id || ''),
      useOwnPositioning: true,
    };
  }, [buildBaseMessageProps, createMediaPressHandler, handleRetry]);

  const buildVideoMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const videoUri = getVideoUri(item);
    const baseProps = buildBaseMessageProps(item, index);
    
    return {
      ...baseProps,
      videoUrl: videoUri || '',
      caption: item.text,
      onPress: createMediaPressHandler(item),
      isUploading: item.isUploading || false,
      uploadProgress: (item as any).uploadProgress || 0,
      uploadError: item.uploadError || false,
      onRetry: () => handleRetry(item._id || item.id || ''),
      useOwnPositioning: true,
    };
  }, [buildBaseMessageProps, createMediaPressHandler, handleRetry]);

  const buildAudioMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const audioUri = getAudioUri(item);
    const baseProps = buildBaseMessageProps(item, index);
    
    
    return {
      ...baseProps,
      audioUri: audioUri || '',
      duration: item.audioDuration || 0,
      isCurrentUser: baseProps.isOwnMessage,
      caption: item.text,
      isUploading: item.isUploading || false,
      uploadProgress: (item as any).uploadProgress || 0,
      uploadError: item.uploadError || false,
      onRetry: () => handleRetry(item._id || item.id || ''),
      // additional props for positioning
      item,
      formattedTime: baseProps.formattedTime,
      shouldShowTimestamp: baseProps.shouldShowTimestamp,
      onUserPress: baseProps.onUserPress,
      useOwnPositioning: true, // Community chat uses own positioning
      highlightedMessageId,
      scrollToMessage,
    };
  }, [buildBaseMessageProps, handleRetry, userDetails._id]);

  const buildTextMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const baseProps = buildBaseMessageProps(item, index);
    
    // Log text message props for deleted messages
    if (item.isDeleted) {
      console.log(`🏘️ [MESSAGE_RENDERING] buildTextMessageProps for DELETED message:`, {
        messageId: item._id || item.id,
        isDeleted: item.isDeleted,
        text: item.text?.substring(0, 50),
        basePropsItem: {
          isDeleted: baseProps.item.isDeleted,
          text: baseProps.item.text?.substring(0, 50),
        }
      });
    }
    
    return {
      ...baseProps,
      onMediaPress,
    };
  }, [buildBaseMessageProps, onMediaPress]);

  const buildDocumentMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const baseProps = buildBaseMessageProps(item, index);
    const documentUrls = getDocumentUrls(item);
    const documentDetails = getDocumentDetails(item);
    const primaryDocument = documentDetails[0];
    
    return {
      ...baseProps,
      documentUrl: documentUrls[0] || '',
      documentName: primaryDocument?.name,
      documentSize: primaryDocument?.size || 0,
      documentType: primaryDocument?.type || 'application/octet-stream',
      isCurrentUser: baseProps.isOwnMessage,
      caption: item.text,
      isUploading: item.isUploading || false,
      uploadProgress: (item as any).uploadProgress || 0,
      uploadError: item.uploadError || false,
      onRetry: () => handleRetry(item._id || item.id || ''),
      // additional props for positioning
      item,
      formattedTime: baseProps.formattedTime,
      shouldShowTimestamp: baseProps.shouldShowTimestamp,
      onUserPress: baseProps.onUserPress,
      useOwnPositioning: true, // Community chat uses own positioning
    };
  }, [buildBaseMessageProps, handleRetry]);

  const buildSharedPhotoMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const baseProps = buildBaseMessageProps(item, index);
    const photoData = extractPhotoDataFromMessage(item.text);
    
    return {
      photoData,
      messageSender: extractUserId(item.userId) === userDetails._id ? userDetails : item.userId,
      isCurrentUser: baseProps.isOwnMessage,
      // additional props for positioning
      item,
      formattedTime: baseProps.formattedTime,
      shouldShowTimestamp: baseProps.shouldShowTimestamp,
      onUserPress: baseProps.onUserPress,
      useOwnPositioning: true, // Community chat uses own positioning
    };
  }, [buildBaseMessageProps, userDetails]);

  const buildSharedVideoMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const baseProps = buildBaseMessageProps(item, index);
    const videoData = extractVideoDataFromMessage(item.text);
    
    return {
      videoData,
      messageSender: extractUserId(item.userId) === userDetails._id ? userDetails : item.userId,
      isCurrentUser: baseProps.isOwnMessage,
      // additional props for positioning
      item,
      formattedTime: baseProps.formattedTime,
      shouldShowTimestamp: baseProps.shouldShowTimestamp,
      onUserPress: baseProps.onUserPress,
      useOwnPositioning: true, // Community chat uses own positioning
    };
  }, [buildBaseMessageProps, userDetails]);

  const buildSharedStreamMessageProps = useCallback((item: CommunityMessage, index?: number) => {
    const baseProps = buildBaseMessageProps(item, index);
    const streamData = extractStreamDataFromMessage(item.text);
    
    return {
      streamId: streamData?.streamId || '',
      onPress: () => router.push(`/(streaming)/stream/${streamData?.streamId}` as any),
      // additional props for positioning  
      item,
      formattedTime: baseProps.formattedTime,
      shouldShowTimestamp: baseProps.shouldShowTimestamp,
      onUserPress: baseProps.onUserPress,
      isCurrentUser: baseProps.isOwnMessage,
      useOwnPositioning: true, // Community chat uses own positioning
    };
  }, [buildBaseMessageProps, router]);

  const renderMessage = useCallback(({ item, index }: { item: CommunityMessage; index?: number }) => {
    const messageType = getMessageType(item);

    // Log all message rendering attempts
    if (item.isDeleted) {
      console.log(`🏘️ [MESSAGE_RENDERING] Rendering DELETED message:`, {
        messageId: item._id || item.id,
        messageType,
        text: item.text?.substring(0, 50),
        isDeleted: item.isDeleted,
      });
    }

    switch (messageType) {
      case 'text':
        return React.createElement(TextMessageRenderer, buildTextMessageProps(item, index));
      case 'image':
        return React.createElement(ChatImageRenderer, buildImageMessageProps(item, index));
      case 'video':
        return React.createElement(ChatVideoRenderer, buildVideoMessageProps(item, index));
      case 'audio':
        return React.createElement(VoiceMessageRenderer, buildAudioMessageProps(item, index));
      case 'document':
        return React.createElement(DocumentMessageRenderer, buildDocumentMessageProps(item, index));
      case 'shared_photo':
        return React.createElement(SharedPhotoCard, buildSharedPhotoMessageProps(item, index));
      case 'shared_video':
        return React.createElement(SharedVideoCard, buildSharedVideoMessageProps(item, index));
      case 'stream':
        return React.createElement(SharedStreamCard, buildSharedStreamMessageProps(item, index));
      case 'community_invite':
        return React.createElement(CommunityInviteRenderer, buildTextMessageProps(item, index));
      default:
        return React.createElement(TextMessageRenderer, buildTextMessageProps(item, index));
    }
  }, [buildTextMessageProps, buildImageMessageProps, buildVideoMessageProps, buildAudioMessageProps, buildDocumentMessageProps, buildSharedPhotoMessageProps, buildSharedVideoMessageProps, buildSharedStreamMessageProps]);

  return {
    renderMessage,
    handleUserPress,
  };
};