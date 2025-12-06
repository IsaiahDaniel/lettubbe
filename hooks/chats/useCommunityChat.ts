import { useRef } from "react";
import { FlatList } from "react-native";
import { useCommunitySocket } from "./useCommunitySocket";
import { useCommunityMessages } from "./useCommunityMessages";
import { useCommunityTyping } from "./useCommunityTyping";
import { useMessageActions } from "./useMessageActions";

interface UseCommunityCharProps {
  communityId: string;
  isUserMember: boolean;
  isPublic: boolean;
  uploadedImages: string[];
  setUploadedImageUrls: (urls: string[]) => void;
  setUploadedVideoUrls: (urls: string[]) => void;
  uploadedVideoUrls: string[];
  uploadedAudioUrl?: string;
  setUploadedAudioUrl?: (url: string) => void;
  uploadedDocumentUrls?: string[];
  setUploadedDocumentUrls?: (urls: string[]) => void;
  uploadedDocumentDetails?: Array<{url: string; name: string; size: number; type: string}>;
  enabled?: boolean;
}

const useCommunityChat = ({
  communityId,
  isUserMember,
  isPublic,
  uploadedImages,
  setUploadedImageUrls,
  setUploadedVideoUrls,
  uploadedVideoUrls,
  uploadedAudioUrl,
  setUploadedAudioUrl,
  uploadedDocumentUrls = [],
  setUploadedDocumentUrls,
  uploadedDocumentDetails = [],
  enabled = true,
}: UseCommunityCharProps) => {
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    setMessages,
    addNewMessage,
    setPreviousMessages,
    markMessageAsDeleted,
    addOptimisticMessage,
    updateMessage,
  } = useCommunityMessages();

  const {
    isTyping,
    typingUsers,
    addTypingUser,
    removeTypingUser,
    startTyping,
    stopTyping,
  } = useCommunityTyping();

  const {
    socket,
    loadingMessages,
    messagesError,
    retryConnection,
    emitTyping,
    emitStoppedTyping,
    sendMessage,
  } = useCommunitySocket({
    communityId,
    isUserMember,
    isPublic,
    onNewMessage: addNewMessage,
    onPreviousMessages: setPreviousMessages,
    onMessageDeleted: markMessageAsDeleted,
    onUserTyping: addTypingUser,
    onUserStoppedTyping: (data) => removeTypingUser(data.userId),
    enabled,
  });

  const {
    chatMessage,
    setChatMessage,
    replyMessage,
    setReplyMessage,
    showReplyMessage,
    setShowReplyMessage,
    handleSendChat,
    sendMediaMessage,
    sendVoiceMessage,
    sendDocumentMessage,
  } = useMessageActions({
    communityId,
    sendMessage,
    emitStoppedTyping,
    addOptimisticMessage,
    updateMessage,
    uploadedImages,
    setUploadedImageUrls,
    setUploadedVideoUrls,
    uploadedVideoUrls,
    uploadedAudioUrl,
    setUploadedAudioUrl,
    uploadedDocumentUrls,
    setUploadedDocumentUrls,
    uploadedDocumentDetails,
  });

  const handleTypingStart = () => {
    if (!isTyping) {
      startTyping();
      emitTyping();
    }
  };

  const handleTypingStop = () => {
    if (isTyping) {
      stopTyping();
      emitStoppedTyping();
    }
  };

  return {
    handleSendChat,
    sendMediaMessage,
    sendVoiceMessage,
    sendDocumentMessage,
    flatListRef,
    chatMessage,
    setChatMessage,
    setMessages,
    showReplyMessage,
    setShowReplyMessage,
    loadingMessages,
    messagesError,
    retryConnection,
    messages,
    replyMessage,
    setReplyMessage,
    isTyping,
    typingUsers,
    handleTypingStart,
    handleTypingStop,
  };
};

export default useCommunityChat;