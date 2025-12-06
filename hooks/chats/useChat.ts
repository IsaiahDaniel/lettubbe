import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { FlatList } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import useAuth from "../auth/useAuth";
import { useGetUserIdState } from "@/store/UsersStore";
import { ChatHookParams, ConversationDetails } from "@/helpers/types/chat/chat-message.types";
import { createTempMessage } from "@/helpers/utils/chat/message-processor";
import { handleChatError } from "@/helpers/utils/chat/error-handler";
import { useMessageState } from "./useMessageState";
import { useTypingIndicator } from "./useTypingIndicator";
import { useOnlineUsers } from "./useOnlineUsers";
import { useReadReceipts } from "./useReadReceipts";
import { useConnectionManager } from "./useConnectionManager";
import React from "react";

const useChat = (
  uploadedImages: string[], 
  setUploadedImageUrls: (urls: string[]) => void,  
  uploadedVideoUrls: string[] = [], 
  setUploadedVideoUrls: (urls: string[]) => void,
  uploadedAudioUrl: string = "",
  setUploadedAudioUrl: (url: string) => void,
  conversationId?: string,
  uploadedDocumentUrls: string[] = [],
  setUploadedDocumentUrls?: (urls: string[]) => void,
  uploadedDocumentDetails: Array<{url: string; name: string; size: number; type: string}> = []
) => {
  const { userDetails, token } = useAuth();
  const { userId } = useGetUserIdState();
  const queryClient = useQueryClient();
  
  // Debug auth data
  // console.log("🔐 [CHAT] Auth data check:", {
  //   hasUserDetails: !!userDetails,
  //   userDetailsId: userDetails?._id,
  //   hasToken: !!token,
  //   userIdFromStore: userId,
  //   tokenLength: token?.length
  // });

  // Track userDetails changes
  // React.useEffect(() => {
  //   console.log("🔄 [CHAT] userDetails changed:", {
  //     hasUserDetails: !!userDetails,
  //     userDetailsId: userDetails?._id,
  //     isEmptyObject: userDetails && Object.keys(userDetails).length === 0,
  //     keys: userDetails ? Object.keys(userDetails) : 'null'
  //   });
  // }, [userDetails]);
  
  const [chatMessage, setChatMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messageState = useMessageState();
  const typingIndicator = useTypingIndicator();
  const onlineUsers = useOnlineUsers();
  const readReceipts = useReadReceipts();
  
  // Memoize arrays to prevent dependency changes
  const stableUploadedImages = useMemo(() => uploadedImages, [uploadedImages.length, uploadedImages.join(',')]);
  const stableUploadedVideoUrls = useMemo(() => uploadedVideoUrls, [uploadedVideoUrls.length, uploadedVideoUrls.join(',')]);
  const stableUploadedDocumentUrls = useMemo(() => uploadedDocumentUrls, [uploadedDocumentUrls.length, uploadedDocumentUrls.join(',')]);

  // Show loading when auth data is not ready
  const isAuthReady = Boolean(token && userDetails?._id && userId);
  
  // Store hook references to prevent infinite re-renders
  const hookRefs = useRef({
    messageState,
    typingIndicator,
    onlineUsers,
    readReceipts,
    userDetails,
    token,
  });
  hookRefs.current = {
    messageState,
    typingIndicator,
    onlineUsers,
    readReceipts,
    userDetails,
    token,
  };
  
  useEffect(() => {
    if (isAuthReady) {
      hookRefs.current.messageState.resetMessages();
    }
  }, [isAuthReady]);

  const handleNewMessage = useCallback((data: any) => {
    const rawMessageUserId = data.sender || data.userId;
    const messageUserId = typeof rawMessageUserId === 'object' ? rawMessageUserId._id : rawMessageUserId?.toString();
    const isFromOtherUser = messageUserId && messageUserId !== userDetails?._id?.toString();
    
    // Check if message belongs to current conversation
    const currentConversationId = `${userDetails?._id}-${userId}`;
    const reverseConversationId = `${userId}-${userDetails?._id}`;
    const messageConversationId = data.conversationId || data.conversation_id;
    
    // Determine if this message belongs to the current conversation
    const belongsToCurrentConversation = 
      // Direct conversation ID match
      messageConversationId === currentConversationId ||
      messageConversationId === reverseConversationId ||
      // Participant-based matching (fallback if no conversationId)
      (!messageConversationId && (
        (isFromOtherUser && messageUserId === userId) || // Message from the other user in this chat
        (!isFromOtherUser && data.receiver === userId) || // My message to the other user in this chat
        (!isFromOtherUser && data.receiverId === userId) // Alternative receiver field
      ));
    
    console.log("📨 [CHAT] Message routing check:", {
      messageId: data.messageId || data.id || data._id,
      text: data.text?.substring(0, 30),
      sender: messageUserId,
      receiver: data.receiver || data.receiverId,
      messageConversationId,
      currentConversationId,
      reverseConversationId,
      belongsToCurrentConversation,
      isFromOtherUser,
      currentChatUserId: userId
    });
    
    // REJECT messages that don't belong to this conversation
    if (!belongsToCurrentConversation) {
      console.log("🚫 [CHAT] Message rejected - not for this conversation");
      return;
    }
    
    
    // Mark message as seen immediately if we're actively in this chat
    const seenValue = !isFromOtherUser ? true : (data.seen || false);
    
    // console.log("🔍 [CHAT] Seen calculation:", {
    //   isFromOtherUser,
    //   dataSeen: data.seen,
    //   calculation: `!${isFromOtherUser} ? true : (${data.seen} || false)`,
    //   result: seenValue
    // });
    
    const normalizedData = {
      ...data,
      id: data.messageId || data.id || data._id,
      _id: data.messageId || data.id || data._id,
      userId: data.sender || data.userId,
      sender: data.sender || data.userId,
      // Only mark as seen if it's our own message, not from other users
      seen: seenValue,
    };
    
    // console.log("📨 [CHAT] New message accepted:", {
    //   text: normalizedData.text?.substring(0, 50),
    //   sender: normalizedData.sender,
    //   userId: normalizedData.userId,
    //   messageId: normalizedData.id,
    //   conversationId,
    //   isFromOtherUser,
    //   markedAsSeen: normalizedData.seen
    // });
    
    // console.log("📨 [CHAT] Before adding message - current count:", hookRefs.current.messageState.messages.length);
    hookRefs.current.messageState.addMessage(normalizedData);
    // console.log("📨 [CHAT] After adding message - new count:", hookRefs.current.messageState.messages.length);
    
    // Invalidate queries to trigger UI updates for new messages
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["getUserConversations"] });
      queryClient.invalidateQueries({ queryKey: ["getUserConversations", "infinite"] });
    }, 100);
    
  }, [userDetails?._id, userId, conversationId]);

  const handleUserTyping = useCallback((data: { userId: string; conversationId?: string; receiverId?: string }) => {
    // console.log("⌨️ [CHAT] Raw typing event received:", {
    //   eventData: data,
    //   myUserId: userDetails?._id,
    //   currentChatPartnerId: userId,
    //   isMyOwnTyping: data.userId === userDetails?._id
    // });
    
    if (data.userId !== userDetails?._id) {
      // Only show typing if it's exactly from the current chat partner
      const isFromCurrentChatPartner = data.userId === userId;
      
      // Additional checks for conversation ID if available
      const currentConversationId = `${userDetails?._id}-${userId}`;
      const reverseConversationId = `${userId}-${userDetails?._id}`;
      
      const conversationIdMatches = data.conversationId && (
        data.conversationId === currentConversationId ||
        data.conversationId === reverseConversationId
      );
      
      // STRICT RULE: Show typing ONLY if:
      // 1. The typing user IS the current chat partner, AND
      // 2. Either no conversationId is provided OR the conversationId matches
      const shouldShowTyping = isFromCurrentChatPartner && 
        (!data.conversationId || conversationIdMatches);
      
      // console.log("⌨️ [CHAT] STRICT Typing event check:", {
      //   typingUserId: data.userId,
      //   currentChatPartnerId: userId,
      //   isFromCurrentChatPartner,
      //   conversationId: data.conversationId,
      //   currentConversationId,
      //   reverseConversationId,
      //   conversationIdMatches,
      //   shouldShowTyping,
      //   receiverId: data.receiverId
      // });
      
      if (shouldShowTyping) {
        console.log("✅ [CHAT] Typing indicator ACTIVATED - calling setOtherUserTyping(true)");
        hookRefs.current.typingIndicator.setOtherUserTyping(true);
      } else {
        console.log("🚫 [CHAT] Typing event REJECTED - strict filtering");
      }
    } else {
      console.log("🚫 [CHAT] Ignoring typing event - it's from myself");
    }
  }, [userDetails?._id, userId]);

  const handleUserStoppedTyping = useCallback((data: { userId: string; conversationId?: string; receiverId?: string }) => {
    // console.log("⌨️ [CHAT] Raw stop typing event received:", {
    //   eventData: data,
    //   myUserId: userDetails?._id,
    //   currentChatPartnerId: userId,
    //   isMyOwnStopTyping: data.userId === userDetails?._id
    // });
    
    if (data.userId !== userDetails?._id) {
      // Only process stop typing if it's exactly from the current chat partner
      const isFromCurrentChatPartner = data.userId === userId;
      
      // Additional checks for conversation ID if available
      const currentConversationId = `${userDetails?._id}-${userId}`;
      const reverseConversationId = `${userId}-${userDetails?._id}`;
      
      const conversationIdMatches = data.conversationId && (
        data.conversationId === currentConversationId ||
        data.conversationId === reverseConversationId
      );
      
      // STRICT RULE: Process stop typing ONLY if:
      // 1. The typing user IS the current chat partner, AND
      // 2. Either no conversationId is provided OR the conversationId matches
      const shouldProcessStopTyping = isFromCurrentChatPartner && 
        (!data.conversationId || conversationIdMatches);
      
      // console.log("⌨️ [CHAT] STRICT Stop typing event check:", {
      //   typingUserId: data.userId,
      //   currentChatPartnerId: userId,
      //   isFromCurrentChatPartner,
      //   conversationId: data.conversationId,
      //   currentConversationId,
      //   reverseConversationId,
      //   conversationIdMatches,
      //   shouldProcessStopTyping,
      //   receiverId: data.receiverId
      // });
      
      if (shouldProcessStopTyping) {
        console.log("✅ [CHAT] Stop typing indicator ACTIVATED - calling setOtherUserTyping(false)");
        hookRefs.current.typingIndicator.setOtherUserTyping(false);
      } else {
        console.log("🚫 [CHAT] Stop typing event REJECTED - strict filtering");
      }
    } else {
      console.log("🚫 [CHAT] Ignoring stop typing event - it's from myself");
    }
  }, [userDetails?._id, userId]);

  const handleMessagesMarkedAsRead = useCallback(() => {
    if (userDetails?._id) {
      hookRefs.current.messageState.markOwnMessagesAsSeen(userDetails._id);
    }
  }, [userDetails?._id]);

  const handleConnectionError = useCallback((error: string) => {
    const errorResult = handleChatError('CONNECTION_FAILED', error);
    hookRefs.current.messageState.setError(errorResult.message);
  }, []);

  const handleConnectionSuccess = useCallback(() => {
    hookRefs.current.messageState.clearError();
  }, []);

  const handleMessageDeleted = useCallback((data: { messageId: string; conversationId: string; userId: string }) => {
    // console.log("🗑️ [CHAT] Handling message deletion:", {
    //   messageId: data.messageId,
    //   conversationId: data.conversationId,
    //   fromUserId: data.userId,
    //   currentUserId: userDetails?._id
    // });
    
    // Update message state to mark message as deleted
    hookRefs.current.messageState.updateMessages(prevMessages => 
      prevMessages.map(msg => 
        (msg._id === data.messageId || msg.id === data.messageId) 
          ? { ...msg, text: "Message was deleted", isDeleted: true }
          : msg
      )
    );
  }, [userDetails?._id]);

  const connectionManager = useConnectionManager({
    token: token || '',
    userDetails,
    userId: userId || '',
    onConnect: () => {},
    onPreviousMessages: messageState.setPreviousMessages,
    onNewMessage: handleNewMessage,
    onOnlineUsers: onlineUsers.updateOnlineUsers,
    onUserTyping: handleUserTyping,
    onUserStoppedTyping: handleUserStoppedTyping,
    onMessagesMarkedAsRead: handleMessagesMarkedAsRead,
    onMessageDeleted: handleMessageDeleted,
    onConnectionError: handleConnectionError,
    onConnectionSuccess: handleConnectionSuccess,
  });

  const debouncedInvalidateQueries = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (messageState.messages.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["getUserConversations"] });
        queryClient.invalidateQueries({ queryKey: ["getUserConversations", "infinite"] });
      }
      debounceTimerRef.current = null;
    }, 2000);
  }, [queryClient, messageState.messages.length]);

  const handleSendChat = useCallback((messageText?: string, skipOptimisticMessage?: boolean, replyMessage?: any, onSent?: () => void, onError?: (error: any) => void) => {
    const textToSend = messageText || chatMessage;
    const hasText = textToSend.trim().length > 0;
    const hasMedia = stableUploadedImages.length > 0 || stableUploadedVideoUrls.length > 0 || !!uploadedAudioUrl || stableUploadedDocumentUrls.length > 0;

    console.log("💬 [CHAT] handleSendChat called with:", {
      textToSend,
      hasText,
      hasMedia,
      skipOptimisticMessage,
      replyMessage: replyMessage ? {
        id: replyMessage.id || replyMessage._id,
        text: replyMessage.text?.substring(0, 30),
        senderName: replyMessage.senderName
      } : null,
      imageCount: stableUploadedImages.length,
      videoCount: stableUploadedVideoUrls.length,
      hasAudio: !!uploadedAudioUrl,
      audioUrl: uploadedAudioUrl,
      documentCount: stableUploadedDocumentUrls.length,
      documentUrls: stableUploadedDocumentUrls
    });

    if (!userDetails?._id || !hasText && !hasMedia) {
      console.log("❌ [CHAT] Cannot send message - no user or content");
      return;
    }

    const tempMessage = createTempMessage(
      textToSend,
      userDetails._id,
      userId as string,
      stableUploadedImages,
      stableUploadedVideoUrls,
      uploadedAudioUrl,
      stableUploadedDocumentUrls,
      uploadedDocumentDetails,
      replyMessage
    );

    console.log("📝 [CHAT] Created temp message:", tempMessage);

    if (typingIndicator.isTyping) {
      connectionManager.socketService.stopTyping({
        conversationId: `${userDetails._id}-${userId}`,
        userId: userDetails._id,
        receiverId: userId as string,
      });
      typingIndicator.stopTyping();
    }

    connectionManager.socketService.sendMessage(tempMessage, () => {
      console.log("✅ [CHAT] Message send SUCCESS:", {
        messageId: tempMessage.id,
        text: tempMessage.text?.substring(0, 30),
        skipOptimisticMessage
      });
      
      // Request fresh messages to get the real server message
      setTimeout(() => {
        console.log("🔄 [CHAT] Requesting fresh messages to get real server message");
        connectionManager.socketService.requestPreviousMessages(userId as string);
      }, 100);
      
      // Invalidate conversation queries to get latest data
      queryClient.invalidateQueries({ queryKey: ["getUserConversations"] });
      queryClient.invalidateQueries({ queryKey: ["getUserConversations", "infinite"] });
      
      if (onSent) onSent();
    }, onError);
    
    console.log("🚀 [CHAT] Message sent via socket:", tempMessage);
    
    // Only add optimistic message if not being handled by optimistic message system
    if (!skipOptimisticMessage) {
      messageState.addOptimisticMessage(tempMessage);
      console.log("✅ [CHAT] Added optimistic message to state");
    } else {
      console.log("⏭️ [CHAT] Skipped adding optimistic message (handled by optimistic system)");
    }
    
    if (!messageText) {
      setChatMessage("");
    }
    
    setUploadedImageUrls([]);
    setUploadedVideoUrls([]);
    setUploadedAudioUrl("");
    if (setUploadedDocumentUrls) {
      setUploadedDocumentUrls([]);
    }
  }, [
    chatMessage, 
    userDetails?._id, 
    userId, 
    stableUploadedImages,
    stableUploadedVideoUrls,
    uploadedAudioUrl,
    stableUploadedDocumentUrls,
    uploadedDocumentDetails,
    setUploadedImageUrls,
    setUploadedVideoUrls,
    setUploadedAudioUrl,
    setUploadedDocumentUrls,
    debouncedInvalidateQueries
  ]);

  const handleTypingStart = useCallback(() => {
    // Always get the latest auth data from the hook refs to avoid stale closures
    const latestUserDetails = hookRefs.current.userDetails;
    const latestUserId = latestUserDetails?._id;
    
    // console.log("⌨️ [CHAT] handleTypingStart called:", {
    //   isCurrentlyTyping: typingIndicator.isTyping,
    //   hasUserDetails: !!latestUserId,
    //   userId: latestUserId,
    //   chatPartnerId: userId,
    //   rawUserDetails: latestUserDetails ? 'present' : 'missing',
    //   userDetailsKeys: latestUserDetails ? Object.keys(latestUserDetails) : [],
    //   userDetailsStructure: latestUserDetails ? {
    //     _id: latestUserDetails._id,
    //     id: latestUserDetails.id,
    //     username: latestUserDetails.username
    //   } : 'null'
    // });
    
    if (!typingIndicator.isTyping && latestUserId) {
      console.log("⌨️ [CHAT] Starting typing indicator and sending socket event");
      typingIndicator.startTyping();
      connectionManager.socketService.startTyping({
        conversationId: `${latestUserId}-${userId}`,
        userId: latestUserId,
        receiverId: userId as string,
      });
    } else {
      console.log("⌨️ [CHAT] Not starting typing - already typing or missing user details");
    }
  }, [typingIndicator, connectionManager, userId]);

  const handleTypingStop = useCallback(() => {
    // Always get the latest auth data from the hook refs to avoid stale closures
    const latestUserDetails = hookRefs.current.userDetails;
    const latestUserId = latestUserDetails?._id;
    
    // console.log("⌨️ [CHAT] handleTypingStop called:", {
    //   isCurrentlyTyping: typingIndicator.isTyping,
    //   hasUserDetails: !!latestUserId,
    //   userId: latestUserId,
    //   chatPartnerId: userId,
    //   rawUserDetails: latestUserDetails ? 'present' : 'missing'
    // });
    
    if (typingIndicator.isTyping && latestUserId) {
      console.log("⌨️ [CHAT] Stopping typing indicator and sending socket event");
      typingIndicator.stopTyping();
      connectionManager.socketService.stopTyping({
        conversationId: `${latestUserId}-${userId}`,
        userId: latestUserId,
        receiverId: userId as string,
      });
    } else {
      console.log("⌨️ [CHAT] Not stopping typing - not currently typing or missing user details");
    }
  }, [typingIndicator, connectionManager, userId]);

  const markMessagesAsRead = useCallback(() => {
    if (!userDetails?._id || !readReceipts.canMarkAsRead()) return;
    
    connectionManager.socketService.markMessagesAsRead({
      conversationId: `${userDetails._id}-${userId}`,
      userId: userDetails._id,
      receiverId: userId as string,
    });
  }, [connectionManager, readReceipts, userDetails?._id, userId]);

  const retryConnection = useCallback(() => {
    hookRefs.current.messageState.resetMessages();
    hookRefs.current.typingIndicator.resetTyping();
    connectionManager.retryConnection();
  }, [connectionManager]);

  const userOnlineStatus = onlineUsers.getUserOnlineStatus(userId as string);

  // Only show loading if auth isn't ready OR if we're still loading the initial messages
  const shouldShowLoading = !isAuthReady || (isAuthReady && !messageState.hasInitialLoad);

  return {
    usersOnline: onlineUsers.usersOnline,
    handleSendChat,
    flatListRef,
    userOnlineStatus,
    chatMessage,
    setChatMessage,
    messages: messageState.messages,
    loadingMessages: shouldShowLoading,
    messagesError: messageState.messagesError,
    retryConnection,
    isTyping: typingIndicator.isTyping,
    otherUserTyping: typingIndicator.otherUserTyping,
    handleTypingStart,
    handleTypingStop,
    markMessagesAsRead,
    updateMessages: messageState.updateMessages,
  };
};

export default useChat;