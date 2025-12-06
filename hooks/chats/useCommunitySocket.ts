import { useEffect, useState, useRef, useCallback } from "react";
import { getSocket } from "@/helpers/utils/socket";
import useAuth from "../auth/useAuth";
import { CommunityMessage } from "@/helpers/types/chat/message.types";
import { useNetworkInfo } from "@/hooks/useNetworkInfo";

interface UseCommunitySocketProps {
  communityId: string;
  isUserMember: boolean;
  isPublic: boolean;
  onNewMessage: (message: CommunityMessage) => void;
  onPreviousMessages: (messages: CommunityMessage[]) => void;
  onMessageDeleted: (messageId: string) => void;
  onUserTyping: (data: { userId: string; username: string }) => void;
  onUserStoppedTyping: (data: { userId: string }) => void;
  enabled?: boolean;
}

export const useCommunitySocket = ({
  communityId,
  isUserMember,
  isPublic,
  onNewMessage,
  onPreviousMessages,
  onMessageDeleted,
  onUserTyping,
  onUserStoppedTyping,
  enabled = true,
}: UseCommunitySocketProps) => {
  const { token, userDetails: user } = useAuth();
  const [socket, setSocket] = useState<any>(null);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const { isConnected } = useNetworkInfo();

  // Use refs to store callbacks to avoid dependency changes
  const callbacksRef = useRef({
    onNewMessage,
    onPreviousMessages,
    onMessageDeleted,
    onUserTyping,
    onUserStoppedTyping,
  });
  
  const messagesLoadedRef = useRef<boolean>(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when callbacks change
  callbacksRef.current = {
    onNewMessage,
    onPreviousMessages,
    onMessageDeleted,
    onUserTyping,
    onUserStoppedTyping,
  };

  useEffect(() => {
    console.log("🔍 useCommunitySocket useEffect conditions:", {
      token: !!token,
      enabled,
      communityId,
      isPublic,
      isUserMember,
    });

    if (!token || !enabled || !communityId) {
      console.log("🚫 Socket not connecting - missing requirements");
      setLoadingMessages(false);
      return;
    }
    
    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Only connect and fetch messages if community is public or user is a member
    if (!isPublic && !isUserMember) {
      console.log("🚫 Socket not connecting - user not member and community not public");
      setLoadingMessages(false);
      return;
    }

    // Reset loading to true when we can connect
    setLoadingMessages(true);
    setMessagesError(null);
    messagesLoadedRef.current = false;

    console.log("🔌 useCommunitySocket: Attempting to connect for community:", communityId);
    console.log("🔌 Connection params:", { isPublic, isUserMember, token: token.substring(0, 20) + "..." });
    const socketConnection = getSocket(token);
    if (!socketConnection) {
      console.log("❌ useCommunitySocket: Failed to get socket connection");
      setLoadingMessages(false);
      return;
    }

    console.log("🔌 useCommunitySocket: Got socket connection, setting up listeners");
    console.log("🔍 Socket state:", { 
      connected: socketConnection.connected,
      disconnected: socketConnection.disconnected,
      id: socketConnection.id 
    });
    setSocket(socketConnection);

    // Set a timeout to stop loading after 10 seconds
    const loadingTimeout = setTimeout(() => {
      console.log("⏰ Loading timeout reached, stopping skeleton loader");
      setLoadingMessages(false);
    }, 10000);
    
    // Set a network-aware timeout for connection issues
    if (isConnected) {
      connectionTimeoutRef.current = setTimeout(() => {
        if (!messagesLoadedRef.current && isConnected) {
          setLoadingMessages(false);
          setMessagesError("Connection timeout. Unable to reach community server.");
        }
      }, 15000);
    }

    // Handle connection - both immediate and future connections
    const handleConnection = () => {
      console.log("✅ Connected to WebSocket:", socketConnection.id);
      console.log("emitting join community event");
      socketConnection.emit("joinCommunity", communityId);
      socketConnection.emit("getPreviousGroupMessages", { communityId });
    };

    socketConnection.on("connect", handleConnection);
    
    // If already connected, emit events immediately
    if (socketConnection.connected) {
      console.log("🔌 Socket already connected, emitting events immediately");
      handleConnection();
    }

    socketConnection.on("newGroupMessage", (newMessage: CommunityMessage) => {
      console.log("📩 New chat received Group Message:", newMessage);
      callbacksRef.current.onNewMessage(newMessage);
    });

    socketConnection.on("previousGroupMessages", (data: CommunityMessage[]) => {
      console.log(
        "📩 Received previousGroupMessages:",
        data ? `${data.length} messages` : "no data"
      );
      clearTimeout(loadingTimeout);
      
      // Clear connection timeout since messages loaded successfully
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      callbacksRef.current.onPreviousMessages(data || []);
      setLoadingMessages(false);
      setMessagesError(null);
      messagesLoadedRef.current = true;
    });

    // Community typing indicators
    socketConnection.on("communityUserTyping", (data: { userId: string; username: string; communityId: string }) => {
      if (data.userId !== user._id && data.communityId === communityId) {
        callbacksRef.current.onUserTyping({ userId: data.userId, username: data.username });
      }
    });

    socketConnection.on("communityUserStoppedTyping", (data: { userId: string; communityId: string }) => {
      if (data.userId !== user._id && data.communityId === communityId) {
        callbacksRef.current.onUserStoppedTyping({ userId: data.userId });
      }
    });

    socketConnection.on("connect_error", (error: any) => {
      console.log("❌ Socket connection error:", error);
      clearTimeout(loadingTimeout);
      setLoadingMessages(false);
    });

    socketConnection.on("messageDeleted", (deletedMessageId: string) => {
      callbacksRef.current.onMessageDeleted(deletedMessageId);
    });

    socketConnection.on("deleteGroupMessage", ({ messageId }: { messageId: string }) => {
      console.log("🗑️ WebSocket received deleteGroupMessage event for messageId:", messageId);
      callbacksRef.current.onMessageDeleted(messageId);
    });

    socketConnection.on("disconnect", (error: any) => {
      console.log("❌ Disconnected from WebSocket", error);
    });

    return () => {
      clearTimeout(loadingTimeout);
      
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      socketConnection.disconnect();
    };
  }, [token, communityId, isUserMember, isPublic, user._id, enabled, isConnected]);

  const retryConnection = useCallback(() => {
    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Reset states
    setLoadingMessages(true);
    setMessagesError(null);
    messagesLoadedRef.current = false;
  }, []);

  // Handle network state changes
  useEffect(() => {
    if (!isConnected) {
      // Network is offline
      setLoadingMessages(false);
      setMessagesError("No internet connection. Please check your network settings.");
      
      // Clear any pending timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    } else if (isConnected && messagesError === "No internet connection. Please check your network settings.") {
      // Network came back online and we had a network error
      // Auto-retry the connection
      retryConnection();
    }
  }, [isConnected, messagesError, retryConnection]);

  const emitTyping = () => {
    if (socket) {
      socket.emit("communityTyping", {
        communityId: communityId,
        userId: user._id,
        username: user.username,
      });
    }
  };

  const emitStoppedTyping = () => {
    if (socket) {
      socket.emit("communityStopTyping", {
        communityId: communityId,
        userId: user._id,
        username: user.username,
      });
    }
  };

  const sendMessage = (message: any) => {
    if (socket) {
      socket.emit("GroupChat", message);
    }
  };

  return {
    socket,
    loadingMessages,
    messagesError,
    retryConnection,
    emitTyping,
    emitStoppedTyping,
    sendMessage,
  };
};