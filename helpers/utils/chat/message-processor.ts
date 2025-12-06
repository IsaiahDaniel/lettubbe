import { ChatMessage, SocketMessage } from '@/helpers/types/chat/chat-message.types';

const extractUserId = (user: string | { _id: string } | any): string => {
  if (typeof user === 'object' && user !== null) {
    return user._id || user.id || '';
  }
  return user?.toString() || '';
};

const extractMessageId = (message: SocketMessage): string => {
  return (message.messageId || message.id || message._id)?.toString() || '';
};

const isValidMessage = (message: SocketMessage): boolean => {
  const text = message.text?.toString() || '';
  const userId = extractUserId(message.sender || message.userId);
  
  // Check if message has media content
  const hasImages = !!(message.images?.length || message.imageUrl);
  const hasVideos = !!(message.videos?.length || message.videoUrl);
  const hasAudio = !!message.audioUrl;
  const hasDocuments = !!(message.documentUrls?.length || message.documentUrl);
  const hasMediaContent = hasImages || hasVideos || hasAudio || hasDocuments;
  
  // Message is valid if it has userId AND (text OR media content)
  return Boolean(userId && (text || hasMediaContent));
};

const findDuplicateById = (messages: ChatMessage[], messageId: string): boolean => {
  if (!messageId) return false;
  
  return messages.some(msg => 
    msg.id === messageId || 
    msg._id === messageId || 
    msg.messageId === messageId
  );
};


const normalizeMessage = (message: SocketMessage): ChatMessage => {
  const messageId = extractMessageId(message);
  const userId = extractUserId(message.sender || message.userId);
  
  // Ensure we have a valid timestamp
  const messageTime = message.createdAt || message.time || new Date().toISOString();
  
  return {
    ...message,
    userId,
    id: messageId,
    time: messageTime,
    createdAt: messageTime,
    sender: userId,
    isOptimistic: false,
    isDeleted: message.isDeleted, // Explicitly preserve deletion status
    repliedTo: message.repliedTo || null, 
  } as ChatMessage;
};

const populateReplyObjects = (messages: ChatMessage[]): ChatMessage[] => {
  return messages.map((message) => {
    if (typeof message.repliedTo === "string" && message.repliedTo) {
      const replyId = message.repliedTo;
      const originalReplyMessage = messages.find(
        (msg) => msg._id === replyId || msg.id === replyId
      );

      if (originalReplyMessage) {
        console.log("🔗 [MESSAGE_PROCESSOR] Populated reply for message:", {
          messageId: message.id,
          replyToId: replyId,
          replyText: originalReplyMessage.text?.substring(0, 30)
        });
        return {
          ...message,
          repliedTo: originalReplyMessage,
        };
      }
    }
    return message;
  });
};

export const processNewMessage = (
  newMessage: SocketMessage, 
  currentMessages: ChatMessage[]
): ChatMessage[] => {
  try {
    // console.log("📨 [MESSAGE_PROCESSOR] Processing new message:", {
    //   text: newMessage.text?.substring(0, 30),
    //   messageId: extractMessageId(newMessage),
    //   sender: newMessage.sender,
    //   userId: newMessage.userId,
    //   currentMessageCount: currentMessages.length
    // });

    const msgData = newMessage || {};
    const prevMsgs = Array.isArray(currentMessages) ? currentMessages : [];
    
    const messageId = extractMessageId(msgData);
    const messageText = msgData.text?.toString() || '';
    const serverUserId = extractUserId(msgData.sender || msgData.userId);

    // Use proper validation that accounts for media content
    if (!isValidMessage(msgData)) {
      console.warn("❌ [MESSAGE_PROCESSOR] Invalid message data:", {
        hasText: !!messageText,
        hasUserId: !!serverUserId,
        hasImages: !!(msgData.images?.length || msgData.imageUrl),
        hasVideos: !!(msgData.videos?.length || msgData.videoUrl),
        hasAudio: !!msgData.audioUrl,
        hasDocuments: !!(msgData.documentUrls?.length || msgData.documentUrl),
        messageId: messageId
      });
      return prevMsgs;
    }

    // Check for duplicate by ID first
    if (messageId) {
      const messageExists = prevMsgs.some(msg => {
        const msgObj = msg || {};
        return msgObj?.id?.toString() === messageId || 
               msgObj?._id?.toString() === messageId || 
               msgObj?.messageId?.toString() === messageId;
      });
      if (messageExists) {
        console.log("🔄 [MESSAGE_PROCESSOR] Duplicate message ID found, skipping");
        return prevMsgs;
      }
    }

    // Find and replace temp messages with same content and sender (ORIGINAL LOGIC)
    const hasMatchingTempMessage = prevMsgs.some(msg => {
      const msgObj = msg || {};
      const msgText = msgObj?.text?.toString() || '';
      const msgUserId = (msgObj?.userId || msgObj?.sender)?.toString() || '';
      const msgId = msgObj?.id?.toString() || '';
      
      return msgText === messageText &&
             msgUserId === serverUserId &&
             msgId.startsWith('temp-');
    });

    if (hasMatchingTempMessage) {
      console.log("✅ [MESSAGE_PROCESSOR] Found matching temp message - replacing with real message");
      return prevMsgs.map(msg => {
        const msgObj = msg || {};
        const msgText = msgObj?.text?.toString() || '';
        const msgUserId = (msgObj?.userId || msgObj?.sender)?.toString() || '';
        const msgId = msgObj?.id?.toString() || '';
        
        const shouldReplace = msgText === messageText &&
                              msgUserId === serverUserId &&
                              msgId.startsWith('temp-');
        
        return shouldReplace ? {
          ...msgData,
          userId: serverUserId,
          id: messageId,
          sender: serverUserId,
          time: msgData?.createdAt?.toString() || new Date().toISOString(),
          createdAt: msgData?.createdAt?.toString() || new Date().toISOString(),
          isOptimistic: false,
          isDeleted: msgData?.isDeleted, // Preserve deletion status
          repliedTo: msgData?.repliedTo || null, // Preserve reply data
        } as ChatMessage : msgObj;
      });
    }

    // Check for optimistic messages (fallback for different ID patterns)
    const hasMatchingOptimisticMessage = prevMsgs.some(msg => {
      const msgObj = msg || {};
      const msgText = msgObj?.text?.toString() || '';
      const msgUserId = (msgObj?.userId || msgObj?.sender)?.toString() || '';
      const isOptimistic = msgObj?.isOptimistic === true;
      
      return msgText === messageText &&
             msgUserId === serverUserId &&
             isOptimistic;
    });

    if (hasMatchingOptimisticMessage) {
      console.log("✅ [MESSAGE_PROCESSOR] Found matching optimistic message - replacing with real message");
      const replacedMessages = prevMsgs.map(msg => {
        const msgObj = msg || {};
        const msgText = msgObj?.text?.toString() || '';
        const msgUserId = (msgObj?.userId || msgObj?.sender)?.toString() || '';
        const isOptimistic = msgObj?.isOptimistic === true;
        
        const shouldReplace = msgText === messageText &&
                              msgUserId === serverUserId &&
                              isOptimistic;
        
        return shouldReplace ? {
          ...msgData,
          userId: serverUserId,
          id: messageId,
          sender: serverUserId,
          time: msgData?.createdAt?.toString() || new Date().toISOString(),
          createdAt: msgData?.createdAt?.toString() || new Date().toISOString(),
          isOptimistic: false,
          isDeleted: msgData?.isDeleted, // Preserve deletion status
          repliedTo: msgData?.repliedTo || null, // Preserve reply data
        } as ChatMessage : msgObj;
      });
      
      // Populate reply objects after replacing temp messages
      return populateReplyObjects(replacedMessages);
    }

    // Add new message if no temp/optimistic message found
    const normalizedMessage = normalizeMessage(newMessage);
    console.log("➕ [MESSAGE_PROCESSOR] Adding new message (no temp message to replace)");
    
    const messagesWithNewMessage = [...prevMsgs, normalizedMessage];
    
    // Populate reply objects for messages that have repliedTo IDs
    return populateReplyObjects(messagesWithNewMessage);
  } catch (error) {
    console.error("❌ [MESSAGE_PROCESSOR] Error processing new message:", error);
    return currentMessages;
  }
};

export const normalizePreviousMessages = (messages: any[]): ChatMessage[] => {
  // console.log("📚 [MESSAGE_PROCESSOR] Processing previous messages from server:", messages.length, "messages");
  // console.log("📚 [MESSAGE_PROCESSOR] Raw messages data:", JSON.stringify(messages, null, 2));

  const normalizedMessages = messages.map(msg => {
    const normalized = {
      text: msg.text,
      userId: extractUserId(msg.userId),
      time: msg.createdAt,
      createdAt: msg.createdAt,
      seen: msg.seen || false,
      id: msg._id || msg.id,
      imageUrl: msg.imageUrl,
      videoUrl: msg.videoUrl,
      images: msg.images,
      videos: msg.videos,
      audioUrl: msg.audioUrl,
      documentUrls: msg.documentUrls,
      documentUrl: msg.documentUrl,
      documentDetails: msg.documentDetails,
      repliedTo: msg.repliedTo, // Preserve repliedTo field from server
      sender: extractUserId(msg.userId),
      isOptimistic: false,
      isDeleted: msg.isDeleted, // Preserve deletion status
    };

    // Log audio messages specifically
    // if (msg.audioUrl) {
    //   console.log("🎵 [MESSAGE_PROCESSOR] Found audio message:", {
    //     id: normalized.id,
    //     audioUrl: msg.audioUrl,
    //     text: msg.text
    //   });
    // }

    return normalized;
  });
  
  // Populate reply objects for messages that have repliedTo IDs
  return populateReplyObjects(normalizedMessages);
};

export const markMessagesAsSeen = (
  messages: ChatMessage[], 
  currentUserId: string
): ChatMessage[] => {
  return messages.map(msg => 
    msg.userId === currentUserId 
      ? { ...msg, seen: true }
      : msg
  );
};

export const createTempMessage = (
  text: string,
  senderId: string,
  receiverId: string,
  uploadedImages: string[],
  uploadedVideoUrls: string[],
  uploadedAudioUrl: string = "",
  uploadedDocumentUrls: string[] = [],
  uploadedDocumentDetails: Array<{url: string; name: string; size: number; type: string}> = [],
  replyMessage?: any
): ChatMessage => ({
  sender: senderId,
  receiver: receiverId,
  text,
  userId: senderId,
  id: `temp-${Date.now()}`,
  time: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  imageUrl: uploadedImages[0] || "",
  images: uploadedImages,
  videoUrl: uploadedVideoUrls[0] || "",
  videos: uploadedVideoUrls, // Add videos array support
  audioUrl: uploadedAudioUrl,
  documentUrl: uploadedDocumentUrls[0] || "",
  documentUrls: uploadedDocumentUrls,
  documentDetails: uploadedDocumentDetails,
  repliedTo: replyMessage ? (replyMessage._id || replyMessage.id || replyMessage) : null,
  isOptimistic: true,
});