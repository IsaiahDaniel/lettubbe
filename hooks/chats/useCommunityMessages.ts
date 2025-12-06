import { useState, useCallback } from "react";
import { CommunityMessage } from "@/helpers/types/chat/message.types";

export const useCommunityMessages = () => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);

  const addNewMessage = useCallback((newMessage: CommunityMessage) => {
    console.log("🏘️ [COMMUNITY_MESSAGES] addNewMessage called with:", {
      messageId: newMessage.id || newMessage._id,
      text: newMessage.text?.substring(0, 50),
      isDeleted: newMessage.isDeleted,
      userId: typeof newMessage.userId === "object" ? newMessage.userId?._id : newMessage.userId
    });
    
    setMessages((prevMessages) => {
      const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];

      // Check if message already exists to prevent duplicates
      const messageId = newMessage.id || newMessage._id;
      const messageText = newMessage.text;

      // Extract user ID from server message (could be object, string, or null)
      const serverUserId =
        newMessage.userId && typeof newMessage.userId === "object"
          ? newMessage.userId._id || newMessage.userId.id
          : newMessage.userId;

      // Check for duplicate by ID first
      if (messageId) {
        const messageExists = safeMessages.some(
          (msg) => msg.id === messageId || msg._id === messageId
        );
        if (messageExists) {
          console.log("📩 Message already exists by ID, skipping");
          return safeMessages;
        }
      }

      // Find and replace temp messages with same content and sender
      const hasMatchingTempMessage = safeMessages.some(
        (msg) =>
          msg.text?.trim() === messageText?.trim() &&
          (msg.userId === serverUserId || msg.sender === serverUserId) &&
          msg.id?.startsWith("temp-")
      );

      if (hasMatchingTempMessage) {
        console.log("🏘️ [COMMUNITY_MESSAGES] Replacing temp message with server message:", {
          serverMessageId: newMessage.id || newMessage._id,
          serverText: newMessage.text?.substring(0, 50),
          serverUserId,
          tempMessagesFound: safeMessages.filter(m => m.id?.startsWith("temp-") && m.text === messageText).length
        });
        return safeMessages.map((msg) => {
          const shouldReplace =
            msg.text?.trim() === messageText?.trim() &&
            (msg.userId === serverUserId || msg.sender === serverUserId) &&
            msg.id?.startsWith("temp-");

          if (shouldReplace) {
            if (
              typeof newMessage.repliedTo === "string" &&
              typeof msg.repliedTo === "object" &&
              msg.repliedTo
            ) {
              return {
                ...newMessage,
                repliedTo: msg.repliedTo, // Keep the full reply object from optimistic update
                isDeleted: newMessage.isDeleted, // Preserve deletion status
              };
            }
            return {
              ...newMessage,
              isDeleted: newMessage.isDeleted, // Preserve deletion status
            };
          }
          return msg;
        });
      }

      console.log("🏘️ [COMMUNITY_MESSAGES] Adding new message with isDeleted:", newMessage.isDeleted);

      // If the new message has a repliedTo ID, try to find and populate the full reply object
      if (typeof newMessage.repliedTo === "string" && newMessage.repliedTo) {
        const replyId = newMessage.repliedTo;
        const originalReplyMessage = safeMessages.find(
          (msg) => msg._id === replyId || msg.id === replyId
        );

        if (originalReplyMessage) {
          return [
            ...safeMessages,
            {
              ...newMessage,
              repliedTo: originalReplyMessage,
              isDeleted: newMessage.isDeleted, // Preserve deletion status
            },
          ];
        }
      }

      return [...safeMessages, newMessage];
    });
  }, []);

  const setPreviousMessages = useCallback((data: CommunityMessage[]) => {
    console.log("🏘️ [COMMUNITY_MESSAGES] setPreviousMessages called with:", {
      dataLength: data?.length,
      isArray: Array.isArray(data),
      firstMessage: data?.[0],
      messagesWithDeleted: data?.filter(msg => msg.isDeleted).length || 0,
      deletedMessages: data?.filter(msg => msg.isDeleted).map(msg => ({
        id: msg._id || msg.id,
        text: msg.text?.substring(0, 50),
        isDeleted: msg.isDeleted
      })) || []
    });

    setMessages((prevMessages) => {
      const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];

      if (!data || !Array.isArray(data)) {
        console.log("📩 Invalid data provided to setPreviousMessages");
        return safeMessages;
      }

      console.log("🏘️ [COMMUNITY_MESSAGES] Processing messages:", {
        previousCount: safeMessages.length,
        newCount: data.length,
        deletedInPrevious: safeMessages.filter(msg => msg.isDeleted).length,
        deletedInNew: data.filter(msg => msg.isDeleted).length,
      });

      // Combine and deduplicate messages
      const allMessages = [...safeMessages, ...data];
      const uniqueMessages = allMessages.filter((message, index, array) => {
        if (!message) return false;

        const messageId = message.id || message._id;
        if (!messageId) return true;

        const firstIndex = array.findIndex(
          (msg) => msg && (msg.id === messageId || msg._id === messageId)
        );
        return firstIndex === index;
      });

      // Populate reply objects for messages that have repliedTo IDs
      const messagesWithPopulatedReplies = uniqueMessages.map((message) => {
        if (typeof message.repliedTo === "string" && message.repliedTo) {
          const replyId = message.repliedTo;
          const originalReplyMessage = uniqueMessages.find(
            (msg) => msg._id === replyId || msg.id === replyId
          );

          if (originalReplyMessage) {
            return {
              ...message,
              repliedTo: originalReplyMessage,
              isDeleted: message.isDeleted, // Preserve deletion status
            };
          }
        }
        return {
          ...message,
          isDeleted: message.isDeleted, // Preserve deletion status
        };
      });

      console.log("🏘️ [COMMUNITY_MESSAGES] Final processed messages:", {
        finalCount: messagesWithPopulatedReplies.length,
        deletedCount: messagesWithPopulatedReplies.filter(m => m.isDeleted).length,
        firstFewMessages: messagesWithPopulatedReplies.slice(0, 3).map(m => ({
          id: m.id || m._id,
          text: m.text?.substring(0, 50),
          isDeleted: m.isDeleted,
        })),
        allDeletedMessages: messagesWithPopulatedReplies.filter(m => m.isDeleted).map(m => ({
          id: m.id || m._id,
          text: m.text?.substring(0, 50),
          isDeleted: m.isDeleted,
        })),
      });

      return messagesWithPopulatedReplies;
    });
  }, []);

  const markMessageAsDeleted = useCallback((messageId: string) => {
    console.log("🏘️ [COMMUNITY_MESSAGES] markMessageAsDeleted called for messageId:", messageId);
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) => {
        if (msg._id === messageId) {
          console.log("🏘️ [COMMUNITY_MESSAGES] Marking message as deleted:", {
            id: msg._id,
            originalText: msg.text?.substring(0, 50),
            wasAlreadyDeleted: msg.isDeleted
          });
          return { ...msg, text: "Message was deleted", isDeleted: true };
        }
        return msg;
      });
      
      console.log("🏘️ [COMMUNITY_MESSAGES] After marking as deleted:", {
        totalMessages: updatedMessages.length,
        deletedCount: updatedMessages.filter(m => m.isDeleted).length
      });
      
      return updatedMessages;
    });
  }, []);

  const addOptimisticMessage = useCallback((message: CommunityMessage) => {
    console.log("🏘️ [COMMUNITY_MESSAGES] addOptimisticMessage called with:", {
      messageId: message.id || message._id,
      text: message.text?.substring(0, 50),
      isTemp: message.id?.startsWith("temp-")
    });
    
    setMessages((prevMessages) => {
      const safeMessages = Array.isArray(prevMessages) ? prevMessages : [];
      return [...safeMessages, message];
    });
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<CommunityMessage>) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  return {
    messages,
    setMessages,
    addNewMessage,
    setPreviousMessages,
    markMessageAsDeleted,
    addOptimisticMessage,
    updateMessage,
  };
};