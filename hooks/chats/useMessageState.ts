import { useState, useCallback } from 'react';
import { ChatMessage } from '@/helpers/types/chat/chat-message.types';
import { 
  processNewMessage, 
  normalizePreviousMessages, 
  markMessagesAsSeen 
} from '@/helpers/utils/chat/message-processor';

export const useMessageState = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const addMessage = useCallback((newMessage: any) => {
    console.log("📝 [MESSAGE_STATE] addMessage called with:", {
      messageId: newMessage.id || newMessage._id,
      text: newMessage.text?.substring(0, 30),
      sender: newMessage.sender || newMessage.userId
    });
    
    setMessages(prev => {
      console.log("📝 [MESSAGE_STATE] Current state before processing:", prev.length);
      const result = processNewMessage(newMessage, prev);
      console.log("📝 [MESSAGE_STATE] New state after processing:", result.length);
      return result;
    });
  }, []);

  const setPreviousMessages = useCallback((conversations: any[], isRefetch: boolean = false) => {
    try {
      console.log("📚 [MESSAGE_STATE] Processing previous messages, checking for temp message matches", {
        isRefetch,
        conversationCount: conversations.length
      });
      const normalizedMessages = normalizePreviousMessages(conversations);
      
      // Process each message to match with any existing temp messages
      setMessages(prevMessages => {
        // console.log("📚 [MESSAGE_STATE] Before processing - optimistic messages:", {
        //   total: prevMessages.length,
        //   optimistic: prevMessages.filter(msg => msg.isOptimistic || msg.id?.toString().startsWith('temp-')).map(msg => ({
        //     id: msg.id,
        //     text: msg.text?.substring(0, 30),
        //     isOptimistic: msg.isOptimistic
        //   }))
        // });
        
        // If this is a refetch (after sending), replace all messages with fresh server data
        if (isRefetch) {
          console.log("🔄 [MESSAGE_STATE] Refetch mode - replacing all messages with fresh server data");
          return normalizedMessages;
        }
        
        let updatedMessages = [...prevMessages];
        
        normalizedMessages.forEach(newMsg => {
          updatedMessages = processNewMessage(newMsg, updatedMessages);
        });
        
        // Remove any remaining optimistic messages since we just got fresh data from server
        const finalMessages = updatedMessages.filter(msg => {
          const isOptimisticTemp = msg.isOptimistic || msg.id?.toString().startsWith('temp-');
          if (isOptimisticTemp) {
            console.log("🧹 [MESSAGE_STATE] Removing stale optimistic message:", {
              id: msg.id,
              text: msg.text?.substring(0, 30)
            });
            return false;
          }
          return true;
        });
        
        console.log("📚 [MESSAGE_STATE] After processing previous messages:", {
          previousCount: prevMessages.length,
          processedCount: updatedMessages.length,
          finalCount: finalMessages.length,
          removedOptimistic: updatedMessages.length - finalMessages.length,
          isRefetch
        });
        
        return finalMessages;
      });
      
      setLoadingMessages(false);
      setMessagesError(null);
      setHasInitialLoad(true);
    } catch (error) {
      setLoadingMessages(false);
      setMessagesError("Failed to load messages");
      setHasInitialLoad(true);
    }
  }, []);

  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const markOwnMessagesAsSeen = useCallback((currentUserId: string) => {
    setMessages(prev => markMessagesAsSeen(prev, currentUserId));
  }, []);

  const resetMessages = useCallback(() => {
    setMessages([]);
    setLoadingMessages(true);
    setMessagesError(null);
    setHasInitialLoad(false);
  }, []);

  const startLoading = useCallback(() => {
    setLoadingMessages(true);
    setMessagesError(null);
  }, []);

  const setError = useCallback((error: string) => {
    setLoadingMessages(false);
    setMessagesError(error);
  }, []);

  const clearError = useCallback(() => {
    setMessagesError(null);
  }, []);

  const updateMessages = useCallback((updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
    setMessages(updater);
  }, []);

  return {
    messages,
    loadingMessages,
    messagesError,
    hasInitialLoad,
    addMessage,
    setPreviousMessages,
    addOptimisticMessage,
    markOwnMessagesAsSeen,
    resetMessages,
    startLoading,
    setError,
    clearError,
    updateMessages,
  };
};