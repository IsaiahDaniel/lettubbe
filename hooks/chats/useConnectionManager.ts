import { useEffect, useRef, useCallback } from 'react';
import { createChatSocketService } from '@/services/chat-socket.service';
import { ConversationDetails } from '@/helpers/types/chat/chat-message.types';
import { useNetworkInfo } from '@/hooks/useNetworkInfo';

interface ConnectionManagerParams {
  token: string;
  userDetails: { _id: string } | null;
  userId: string;
  onConnect: () => void;
  onPreviousMessages: (messages: any[], isRefetch?: boolean) => void;
  onNewMessage: (message: any) => void;
  onOnlineUsers: (users: string[]) => void;
  onUserTyping: (data: { userId: string }) => void;
  onUserStoppedTyping: (data: { userId: string }) => void;
  onMessagesMarkedAsRead: (data: any) => void;
  onMessageDeleted?: (data: { messageId: string; conversationId: string; userId: string }) => void;
  onConnectionError: (error: string) => void;
  onConnectionSuccess: () => void;
}

export const useConnectionManager = (params: ConnectionManagerParams) => {
  const { isConnected } = useNetworkInfo();
  const socketServiceRef = useRef(createChatSocketService());
  const hasInitializedRef = useRef<string | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store handlers in refs to prevent recreating them
  const handlersRef = useRef(params);
  handlersRef.current = params;

  const {
    token,
    userDetails,
    userId,
  } = params;

  const handleConnect = useCallback(() => {
    if (!userDetails?._id || !userId) {
      handlersRef.current.onConnectionError("Unable to connect to chat server");
      return;
    }

    const conversationDetails: ConversationDetails = {
      conversationId: `${userDetails._id}-${userId}`,
      userId: userDetails._id,
      receiverId: userId,
    };

    socketServiceRef.current.joinChat(conversationDetails);
    socketServiceRef.current.requestPreviousMessages(userId);
  }, [userDetails?._id, userId]);

  const handlePreviousMessages = useCallback((conversations: any[]) => {
    const isRefetch = socketServiceRef.current.isRefetching || false;
    console.log("🔄 [CONNECTION_MANAGER] handlePreviousMessages called with isRefetch:", isRefetch);
    
    // Clear the refetch flag
    if (socketServiceRef.current.isRefetching) {
      socketServiceRef.current.isRefetching = false;
    }
    
    handlersRef.current.onPreviousMessages(conversations, isRefetch);
    handlersRef.current.onConnectionSuccess();
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  const refetchMessages = useCallback(() => {
    if (!userDetails?._id || !userId) return;
    console.log("🔄 [CONNECTION_MANAGER] Refetching messages for conversation");
    
    // Set a flag to indicate the next previousMessages event is from a refetch
    socketServiceRef.current.isRefetching = true;
    socketServiceRef.current.requestPreviousMessages(userId);
  }, [userDetails?._id, userId]);

  const retryConnection = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Clean up current connection
    socketServiceRef.current.disconnect();
    hasInitializedRef.current = null;
    
    // Clear any error state
    if (userDetails?._id && userId) {
      handlersRef.current.onConnectionSuccess();
    }
  }, [userDetails?._id, userId]);

  useEffect(() => {
    // Don't show network error if we don't have auth data yet
    if (!isConnected && token && userDetails?._id) {
      handlersRef.current.onConnectionError("No internet connection. Please check your network settings.");
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      return;
    }

    // Wait for all required auth data to be available
    if (!token || !userId || !userDetails?._id || !isConnected) {
      return;
    }

    const conversationKey = `${token}-${userId}`;
    
    // Force reconnection if network just came back online
    const shouldForceReconnect = isConnected && hasInitializedRef.current === conversationKey && !socketServiceRef.current.isConnected();
    
    if (hasInitializedRef.current === conversationKey && !shouldForceReconnect) {
      return;
    }

    // Clean up previous connection if exists
    if (hasInitializedRef.current) {
      socketServiceRef.current.disconnect();
    }
    
    hasInitializedRef.current = conversationKey;

    const socket = socketServiceRef.current.connect(token, conversationKey);
    
    if (!socket) {
      handlersRef.current.onConnectionError("Unable to connect to chat server");
      return;
    }

    socketServiceRef.current.attachEventHandlers({
      onConnect: handleConnect,
      onOnlineUsers: handlersRef.current.onOnlineUsers,
      onPreviousMessages: handlePreviousMessages,
      onNewMessage: handlersRef.current.onNewMessage,
      onUserTyping: handlersRef.current.onUserTyping,
      onUserStoppedTyping: handlersRef.current.onUserStoppedTyping,
      onMessagesMarkedAsRead: handlersRef.current.onMessagesMarkedAsRead,
      onMessageDeleted: handlersRef.current.onMessageDeleted,
      onDisconnect: () => {},
    });

    if (socketServiceRef.current.isConnected()) {
      handleConnect();
    }

    if (isConnected) {
      connectionTimeoutRef.current = setTimeout(() => {
        handlersRef.current.onConnectionError("Connection timeout. Unable to reach chat server.");
      }, 15000);
    }

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      // Don't disconnect on cleanup unless component is truly unmounting
      // The effect dependency will handle reconnection when needed
    };
  }, [
    token,
    userId,
    userDetails?._id,
    isConnected,
  ]);

  // Handle network state changes for automatic reconnection
  useEffect(() => {
    let networkRetryTimeout: NodeJS.Timeout;
    
    if (isConnected && token && userDetails?._id && userId) {
      // Network just came back - retry connection after a short delay
      networkRetryTimeout = setTimeout(() => {
        if (!socketServiceRef.current.isConnected()) {
          retryConnection();
        }
      }, 2000);
    }
    
    return () => {
      if (networkRetryTimeout) {
        clearTimeout(networkRetryTimeout);
      }
    };
  }, [isConnected, token, userDetails?._id, userId, retryConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketServiceRef.current.disconnect();
      hasInitializedRef.current = null;
    };
  }, []);

  return {
    socketService: socketServiceRef.current,
    retryConnection,
    refetchMessages,
  };
};