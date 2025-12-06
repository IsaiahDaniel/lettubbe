import React, { useCallback, useMemo, useRef } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

// Hooks and utilities
import useAuth from "@/hooks/auth/useAuth";
import useChat from "@/hooks/chats/useChat";
import useMarkConversationRead from "@/hooks/chats/useMarkConversationRead";
import { useScrollBehavior } from "@/hooks/chats/useScrollBehavior";
import { useMessageUI } from "@/hooks/chats/useMessageUI";
import { useOptimisticMessages } from "../hooks/useOptimisticMessages";

// Components
import ChatSkeletonLoader from "@/components/shared/chat/ChatMessageSkeleton";
import NetworkError from "@/components/shared/NetworkError";
import DateSeparator from "@/components/shared/chat/DateSeparator";
import { MessageRenderer } from "./MessageRenderer";

// Services and utils
import { groupMessagesByDate, flattenMessagesWithSeparators } from "@/helpers/utils/dateUtils";

// Types
import { InboxProfile } from "../types/InboxTypes";

interface MessageViewProps {
  chatId: string;
  userId: string;
  currentUserId: string;
  profile: InboxProfile;
  userDetails: any;
  otherUser: any;
  theme: string;
  onMediaPress: (mediaItems: Array<{ uri: string, type: 'image' | 'video', caption?: string }>, initialIndex?: number) => void;
  onSendMessage?: (message: string) => void;
  uploadedImageUrls?: string[];
  uploadedVideoUrls?: string[];
  uploadedAudioUrl?: string;
  uploadedDocumentUrls?: string[];
  uploadedDocumentDetails?: Array<{url: string; name: string; size: number; type: string}>;
  setUploadedImageUrls?: (urls: string[]) => void;
  setUploadedVideoUrls?: (urls: string[]) => void;
  setUploadedAudioUrl?: (url: string) => void;
  setUploadedDocumentUrls?: (urls: string[]) => void;
  onSendMediaMessage?: (sendMediaMessage: (caption: string, mediaAssets: any[]) => void) => void;
  onReceiveSendFunction?: (sendFunction: (message: string) => void) => void;
  onTypingStateChange?: (otherUserTyping: boolean, handleTypingStart: () => void, handleTypingStop: () => void) => void;
  onReplyChange?: (replyMessage: any) => void;
  onLongPress?: (event: any, message: any) => void;
  onReceiveUpdateMessages?: (updateMessages: (updater: (prevMessages: any[]) => any[]) => void) => void;
  longPressedMessageId?: string | null;
  profileSection?: React.ReactNode;
}

const MessageView: React.FC<MessageViewProps> = ({
  chatId,
  userId,
  currentUserId,
  profile,
  userDetails,
  otherUser,
  theme,
  onMediaPress,
  onSendMessage,
  onSendMediaMessage,
  uploadedImageUrls = [],
  uploadedVideoUrls = [],
  uploadedAudioUrl = "",
  uploadedDocumentUrls = [],
  uploadedDocumentDetails = [],
  setUploadedImageUrls,
  setUploadedVideoUrls,
  setUploadedAudioUrl,
  setUploadedDocumentUrls,
  onReceiveSendFunction,
  onTypingStateChange,
  onReplyChange,
  onLongPress,
  onReceiveUpdateMessages,
  longPressedMessageId,
  profileSection,
}) => {
  const queryClient = useQueryClient();
  const markedAsReadRef = useRef<string | null>(null);
  const lastMarkReadTime = useRef<number>(0);

  // Mark conversation as read
  const markConversationRead = useMarkConversationRead();

  // Memoize arrays to prevent infinite re-renders in useChat
  const memoizedUploadedImageUrls = useMemo(() => uploadedImageUrls, [uploadedImageUrls.length, uploadedImageUrls.join(',')]);
  const memoizedUploadedVideoUrls = useMemo(() => uploadedVideoUrls, [uploadedVideoUrls.length, uploadedVideoUrls.join(',')]);
  const memoizedUploadedAudioUrl = useMemo(() => uploadedAudioUrl, [uploadedAudioUrl]);
  const memoizedUploadedDocumentUrls = useMemo(() => uploadedDocumentUrls, [uploadedDocumentUrls.length, uploadedDocumentUrls.join(',')]);
  const memoizedUploadedDocumentDetails = useMemo(() => uploadedDocumentDetails, [uploadedDocumentDetails.length, uploadedDocumentDetails.map(d => d.url).join(',')]);

  // Core chat functionality
  const {
    handleSendChat,
    messages,
    loadingMessages,
    messagesError,
    retryConnection,
    markMessagesAsRead,
    flatListRef,
    otherUserTyping,
    handleTypingStart,
    handleTypingStop,
    updateMessages,
  } = useChat(
    memoizedUploadedImageUrls, 
    setUploadedImageUrls || (() => {}),
    memoizedUploadedVideoUrls, 
    setUploadedVideoUrls || (() => {}),
    memoizedUploadedAudioUrl, 
    setUploadedAudioUrl || (() => {}),
    chatId, 
    memoizedUploadedDocumentUrls, 
    setUploadedDocumentUrls || (() => {}),
    memoizedUploadedDocumentDetails
  );

  // Optimistic messages for better UX
  const memoizedHandleSendChat = useCallback((messageText: string, skipOptimisticMessage?: boolean, replyMessage?: any, onSent?: () => void, onError?: (error: any) => void) => {
    return handleSendChat(messageText, skipOptimisticMessage, replyMessage, onSent, onError);
  }, [handleSendChat]);

  const {
    optimisticMessages,
    sendMediaMessage,
  } = useOptimisticMessages(
    messages, 
    memoizedUploadedImageUrls, 
    memoizedUploadedVideoUrls, 
    memoizedUploadedAudioUrl, 
    memoizedUploadedDocumentUrls, 
    memoizedUploadedDocumentDetails, 
    memoizedHandleSendChat, 
    currentUserId
  );

  // Handle sending messages
  const handleSendMessage = useCallback((messageText: string, replyMessage?: any) => {
    return memoizedHandleSendChat(messageText, false, replyMessage);
  }, [memoizedHandleSendChat]);

  // Connect onSendMessage and onSendMediaMessage props
  React.useEffect(() => {
    if (onSendMediaMessage && sendMediaMessage) {
      onSendMediaMessage(sendMediaMessage);
    }
  }, [onSendMediaMessage, sendMediaMessage]);

  // Connect the send function to parent
  React.useEffect(() => {
    if (onReceiveSendFunction && handleSendMessage) {
      onReceiveSendFunction(handleSendMessage);
    }
  }, [onReceiveSendFunction, handleSendMessage]);

  // Connect the updateMessages function to parent
  React.useEffect(() => {
    if (onReceiveUpdateMessages && updateMessages) {
      onReceiveUpdateMessages(updateMessages);
    }
  }, [onReceiveUpdateMessages, updateMessages]);

  // Handle reply
  const handleReply = useCallback((message: any) => {
    if (onReplyChange) {
      // Extract user name from message
      const senderName = message.userId === currentUserId ? 
        userDetails?.username || 'You' : 
        profile?.displayName || otherUser?.username || 'User';
      
      const replyMessage = {
        ...message,
        senderName
      };
      
      onReplyChange(replyMessage);
    }
  }, [onReplyChange, currentUserId, userDetails, profile, otherUser]);

  // Connect typing state to parent - use ref to prevent infinite loops
  const prevTypingStateRef = useRef({
    otherUserTyping: false,
    hasNotified: false,
  });

  React.useEffect(() => {
    if (onTypingStateChange) {
      // Only notify if typing state actually changed or this is the first time
      if (otherUserTyping !== prevTypingStateRef.current.otherUserTyping || !prevTypingStateRef.current.hasNotified) {
        console.log("⌨️ [MESSAGE_VIEW] Notifying parent of typing state change:", {
          otherUserTyping,
          previousState: prevTypingStateRef.current.otherUserTyping,
          hasNotified: prevTypingStateRef.current.hasNotified
        });
        onTypingStateChange(otherUserTyping, handleTypingStart, handleTypingStop);
        prevTypingStateRef.current = {
          otherUserTyping,
          hasNotified: true,
        };
      }
    } else {
      console.log("⌨️ [MESSAGE_VIEW] No onTypingStateChange callback provided");
    }
  }, [onTypingStateChange, otherUserTyping]); // Removed handleTypingStart/Stop from deps to prevent infinite loop

  // Auto-mark messages as read when screen is focused
  const stableMarkMessagesAsRead = useCallback(() => {
    if (markMessagesAsRead) {
      try {
        markMessagesAsRead();
      } catch (error) {
        console.error("Error marking messages as read via socket:", error);
      }
    }
  }, [markMessagesAsRead]);

  const stableMarkConversationRead = useCallback(() => {
    const now = Date.now();
    const timeSinceLastMark = now - lastMarkReadTime.current;
    
    // console.log('🔍 [DEBUG] stableMarkConversationRead called:', {
    //   markConversationRead: !!markConversationRead,
    //   isPending: markConversationRead?.isPending,
    //   chatId,
    //   timeSinceLastMark,
    //   shouldThrottle: timeSinceLastMark < 5000
    // });
    
    // Throttle to prevent infinite loops - only mark as read every 5 seconds
    if (timeSinceLastMark < 5000) {
      console.log('⏸️ [DEBUG] Throttling mark as read - too soon');
      return;
    }
    
    if (markConversationRead && !markConversationRead.isPending && chatId) {
      console.log('✅ [DEBUG] Calling markConversationRead.mutate with:', chatId);
      lastMarkReadTime.current = now;
      markConversationRead.mutate(chatId);
      // Cache invalidation is now handled in the mutation's onSuccess
    } else {
      console.log('❌ [DEBUG] Conditions not met for mutation');
    }
  }, [markConversationRead, chatId]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 [DEBUG] useFocusEffect triggered:', {
        chatId,
        chatIdType: typeof chatId,
        markedAsReadRefCurrent: markedAsReadRef.current,
        shouldProcess: chatId && typeof chatId === 'string' && markedAsReadRef.current !== chatId
      });
      
      if (chatId && typeof chatId === 'string') {
        console.log('✅ [DEBUG] Processing focus effect for chatId:', chatId);
        
        // Only mark messages as read via socket if this is a new conversation
        if (markedAsReadRef.current !== chatId) {
          markedAsReadRef.current = chatId;
          stableMarkMessagesAsRead();
        }

        // Always call HTTP endpoint to ensure consistency
        console.log('⏰ [DEBUG] Calling stableMarkConversationRead immediately');
        stableMarkConversationRead();

        return () => {
          if (chatId && markedAsReadRef.current === chatId) {
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && 
                       key[0] === "getUserConversations" && 
                       (key.length === 1 || key[1] === "infinite");
              }
            });
          }
        };
      }
      return () => {};
    }, [chatId, stableMarkMessagesAsRead, stableMarkConversationRead, queryClient])
  );

  // Combine real and optimistic messages (cleanup happens on send, not server response)
  const allMessages = useMemo(() => {
    const realMessages = messages || [];
    const optimisticMsgs = optimisticMessages.map(opt => ({
      _id: opt.id,
      id: opt.id,
      text: opt.text,
      userId: currentUserId,
      time: opt.time,
      createdAt: opt.time,
      isCurrentUser: true,
      images: opt.images,
      videos: opt.videos,
      audioUrl: opt.audioUrl,
      videoUrl: opt.videoUrl,
      documentUrls: opt.documentUrls,
      documentDetails: opt.documentDetails,
      repliedTo: opt.repliedTo,
      isOptimistic: true,
      isUploading: opt.isUploading,
      isSent: opt.isSent,
      uploadProgress: opt.uploadProgress,
      uploadError: opt.uploadError,
      retryFn: opt.retryFn,
    }));

    return [...realMessages, ...optimisticMsgs];
  }, [messages, optimisticMessages, currentUserId]);

  // Process messages with date separators
  const messagesWithDateSeparators = useMemo(() => {
    if (!allMessages || allMessages.length === 0) return [];
    
    const groupedMessages = groupMessagesByDate(allMessages);
    const flattenedMessages = flattenMessagesWithSeparators(groupedMessages);
    return flattenedMessages;
  }, [allMessages]);

  // Reversed array for FlatList (inverted list needs reversed data)
  const reversedMessagesWithSeparators = useMemo(() => {
    return [...messagesWithDateSeparators].reverse();
  }, [messagesWithDateSeparators]);

  // Scroll behavior and message UI state
  const inboxMessageUIState = useMessageUI();
  const scrollBehavior = useScrollBehavior(reversedMessagesWithSeparators, inboxMessageUIState.highlightMessage);

  // Render functions
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (item.type === "dateSeparator") {
      return <DateSeparator date={item.displayDate} />;
    }

    return (
      <MessageRenderer
        message={item}
        index={index}
        currentUserId={currentUserId}
        profile={profile}
        userDetails={userDetails}
        otherUser={otherUser}
        theme={theme}
        onMediaPress={onMediaPress}
        onReply={handleReply}
        onLongPress={onLongPress}
        longPressedMessageId={longPressedMessageId}
        scrollToMessage={scrollBehavior.scrollToMessage}
        highlightedMessageId={inboxMessageUIState.highlightedMessageId}
      />
    );
  };

  const getItemLayout = useCallback((data: any, index: number) => {
    const ESTIMATED_MESSAGE_HEIGHT = 80;
    return {
      length: ESTIMATED_MESSAGE_HEIGHT,
      offset: ESTIMATED_MESSAGE_HEIGHT * index,
      index,
    };
  }, []);

  if (loadingMessages) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <ChatSkeletonLoader />
      </View>
    );
  }

  if (messagesError) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <NetworkError
          error={messagesError}
          refetch={retryConnection}
        />
      </View>
    );
  }

  if (messagesWithDateSeparators.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reversedMessagesWithSeparators}
        ref={scrollBehavior.flatListRef}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          if (!item) return `fallback-${index}`;
          if (item.type === 'dateSeparator') {
            return item.id || `separator-${index}`;
          }
          return item.id?.toString() || item._id?.toString() || `msg-${index}-${item.text?.slice(0, 5) || 'empty'}`;
        }}
        // ListFooterComponent={profileSection}
        contentContainerStyle={styles.messagesList}
        inverted={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        initialNumToRender={20}
        windowSize={10}
        getItemLayout={getItemLayout}
        disableVirtualization={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
  },
});

export default MessageView;