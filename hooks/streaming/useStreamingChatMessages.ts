import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { getSocket } from '@/helpers/utils/socket';
import { getStreamChatMessages } from '@/services/streaming.service';
import { 
  StreamingChatMessage, 
  UseStreamingChatMessagesProps, 
  UseStreamingChatMessagesReturn 
} from '@/helpers/types/streaming/streaming.types';
import useAuth from '@/hooks/auth/useAuth';

const MAX_MESSAGES = 50;

// Socket initialization function
const initializeSocketConnection = (token: string): Socket => {
  const socket = getSocket(token);
  
  if (!socket) {
    throw new Error('Failed to establish socket connection');
  }
  
  return socket;
};

export const useStreamingChatMessages = ({ 
  streamId, 
  enabled = true,
  onLikeAnimationTrigger
}: UseStreamingChatMessagesProps & { 
  onLikeAnimationTrigger?: () => void 
}): UseStreamingChatMessagesReturn => {
  const { userDetails, token } = useAuth();
  const [liveMessages, setLiveMessages] = useState<StreamingChatMessage[]>([]); // Messages from socket
  const [isConnected, setIsConnected] = useState(false);
  const [streamLikes, setStreamLikes] = useState<string[]>([]); // Array of user IDs who liked
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [streamCommentsCount, setStreamCommentsCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const hasJoinedRoom = useRef(false);
  const componentMounted = useRef(true);
  const initializingSocket = useRef(false);

  // Use React Query to fetch initial chat messages
  const { data: apiResponse, isLoading, error: queryError, refetch: refetchChatMessages } = useQuery({
    queryKey: ['streamChatMessages', streamId],
    queryFn: () => getStreamChatMessages({ streamId }),
    enabled: enabled && !!streamId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!enabled || !streamId || !token || initializingSocket.current) {
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    initializingSocket.current = true;
    setConnectionError(null);
    
    try {
      const socket = initializeSocketConnection(token);
      
      if (socket) {
        socketRef.current = socket;
        setupSocketListeners(socket);
        
        // Check if socket is already connected
        if (socket.connected) {
          setIsConnected(true);
          joinStreamRoom(socket);
        }
      }
    } catch (error: any) {
      console.error('❌ Error initializing socket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    } finally {
      initializingSocket.current = false;
    }
  }, [enabled, streamId, token]);

  // Extract API messages from response
  const apiMessages = useMemo(() => {
    if (!apiResponse?.data?.data || !Array.isArray(apiResponse.data.data)) {
      return [];
    }
    
    return apiResponse.data.data.map((msg: any) => ({
      ...msg,
      user: msg.userId || msg.user
    }));
  }, [apiResponse]);


  // Setup socket event listeners
  const setupSocketListeners = useCallback((socket: Socket) => {
    if (!socket || !componentMounted.current) return;

    // Connection events
    socket.on('connect', () => {
      if (!componentMounted.current) return;
      setIsConnected(true);
      hasJoinedRoom.current = false; // Reset join status
      joinStreamRoom(socket);
    });

    socket.on('disconnect', (reason) => {
      if (!componentMounted.current) return;
      setIsConnected(false);
      hasJoinedRoom.current = false;
    });

    socket.on('connect_error', (error) => {
      if (!componentMounted.current) return;
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
      hasJoinedRoom.current = false;
    });

    // Stream room events
    socket.on('stream:joined', () => {
      if (!componentMounted.current) return;
      hasJoinedRoom.current = true;
      // Request initial likes data
      socket.emit('stream:getLikes', { streamId });
    });

    // New message from other users
    socket.on('stream:messages', (message: StreamingChatMessage) => {
      if (!componentMounted.current) return;
      
      console.log('📥 [STREAM_CHAT] Received message from server:', {
        event: 'stream:messages',
        messageId: message._id,
        userId: message.userId,
        message: message.message,
        createdAt: message.createdAt,
        isOptimistic: message.isOptimistic,
        user: {
          _id: message.user?._id,
          username: message.user?.username,
          firstName: message.user?.firstName,
          lastName: message.user?.lastName
        },
        fullPayload: JSON.stringify(message, null, 2)
      });
      
      setLiveMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg._id === message._id)) {
          console.log('📥 [STREAM_CHAT] Duplicate message ignored:', message._id);
          return prev;
        }
        
        const newMessages = [...prev, message];
        console.log('📥 [STREAM_CHAT] Added new message, total count:', newMessages.length);
        // Keep only the most recent messages
        return newMessages.slice(-MAX_MESSAGES);
      });
      
      // Refetch chat messages to get full user details
      refetchChatMessages();
    });

    // Confirmed message (replace optimistic message)
    socket.on('stream:new', (confirmedMessage: StreamingChatMessage) => {
      if (!componentMounted.current) return;
      
      console.log('✅ [STREAM_CHAT] Message confirmed by server:', {
        event: 'stream:new',
        messageId: confirmedMessage._id,
        userId: confirmedMessage.userId,
        message: confirmedMessage.message,
        createdAt: confirmedMessage.createdAt,
        user: {
          _id: confirmedMessage.user?._id,
          username: confirmedMessage.user?.username,
          firstName: confirmedMessage.user?.firstName,
          lastName: confirmedMessage.user?.lastName
        },
        fullPayload: JSON.stringify(confirmedMessage, null, 2)
      });
      
      setLiveMessages(prev => {
        // Remove optimistic message and add confirmed one
        const withoutOptimistic = prev.filter(msg => 
          !(msg.isOptimistic && 
            msg.userId === confirmedMessage.userId && 
            msg.message === confirmedMessage.message)
        );
        
        console.log('✅ [STREAM_CHAT] Removed optimistic messages, remaining count:', withoutOptimistic.length);
        
        // Avoid duplicates
        if (withoutOptimistic.some(msg => msg._id === confirmedMessage._id)) {
          console.log('✅ [STREAM_CHAT] Confirmed message already exists, skipping');
          return withoutOptimistic;
        }
        
        const newMessages = [...withoutOptimistic, confirmedMessage];
        console.log('✅ [STREAM_CHAT] Added confirmed message, final count:', newMessages.length);
        return newMessages.slice(-MAX_MESSAGES);
      });
      
      // Refetch chat messages to get full user details
      refetchChatMessages();
    });

    // Stream likes events
    socket.on('stream:likes', (data: any) => {
      if (!componentMounted.current) return;
      
      const previousLikesCount = streamLikes.length;
      
      if (data.stream && Array.isArray(data.stream)) {
        setStreamLikes(data.stream);
        setUserHasLiked(userDetails?._id ? data.stream.includes(userDetails._id) : false);
        
        // Trigger animation if likes increased (someone liked the stream)
        if (data.stream.length > previousLikesCount) {
          // Call animation trigger callback if provided
          onLikeAnimationTrigger?.();
        }
      }
      
      if (typeof data.commentsCount === 'number') {
        setStreamCommentsCount(data.commentsCount);
      }
    });

    socket.on('stream:error', (error: any) => {
      if (!componentMounted.current) return;
      console.error('Stream error:', error);
    });

  }, [streamId, userDetails?._id]);

  // Join stream room
  const joinStreamRoom = useCallback((socket: Socket) => {
    if (!socket || hasJoinedRoom.current || !streamId) return;
    
    socket.emit('stream:join', { streamId });
  }, [streamId]);

  // Send like function
  const sendLike = useCallback(() => {
    if (!userDetails || !streamId) {
      return;
    }

    // Update UI optimistically
    const userId = userDetails._id;
    const currentlyLiked = streamLikes.includes(userId);
    
    if (currentlyLiked) {
      // Remove like optimistically
      setStreamLikes(prev => prev.filter(id => id !== userId));
      setUserHasLiked(false);
    } else {
      // Add like optimistically
      setStreamLikes(prev => [...prev, userId]);
      setUserHasLiked(true);
      
      // Trigger animation
      onLikeAnimationTrigger?.();
    }

    // Send like via socket only if connected
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stream:like', {
        streamId,
        userId: userDetails._id
      });
    } else {
      console.log('❤️ [STREAM_LIKE] Like queued (not connected):', { streamId, liked: !currentlyLiked });
    }
  }, [socketRef, isConnected, userDetails, streamId, streamLikes, onLikeAnimationTrigger]);

  // Send message function
  const sendMessage = useCallback((messageText: string) => {
    if (!userDetails || !streamId) {
      return;
    }

    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) return;

    // Create optimistic message
    const optimisticMessage: StreamingChatMessage = {
      _id: `optimistic-${Date.now()}-${Math.random()}`,
      streamId,
      userId: userDetails._id,
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      user: {
        _id: userDetails._id,
        username: userDetails.username || '',
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        profilePicture: userDetails.profilePicture
      }
    };

    // Add optimistic message immediately to live messages
    setLiveMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      return newMessages.slice(-MAX_MESSAGES);
    });

    // Send message via socket only if connected
    if (socketRef.current && isConnected) {
      const payload = {
        streamId,
        userId: userDetails._id,
        message: trimmedMessage
      };
      
      console.log('📤 [STREAM_CHAT] Sending message to server:', {
        event: 'stream:messages',
        payload,
        socketConnected: socketRef.current.connected,
        chatConnected: isConnected,
        streamId,
        userId: userDetails._id,
        messageLength: trimmedMessage.length
      });
      
      socketRef.current.emit('stream:messages', payload);
    } else {
      // If not connected, keep the optimistic message as a placeholder
      console.log('📤 [STREAM_CHAT] Message queued (not connected):', {
        message: trimmedMessage,
        socketExists: !!socketRef.current,
        socketConnected: socketRef.current?.connected,
        chatConnected: isConnected,
        streamId,
        userId: userDetails._id
      });
    }
  }, [socketRef, isConnected, userDetails, streamId]);


  // Merge API messages with live messages
  const mergedMessages = useMemo(() => {
    const allMessages = [...apiMessages, ...liveMessages];
    
    // Remove duplicates by _id
    const seen = new Set();
    const uniqueMessages = allMessages.filter(msg => {
      if (seen.has(msg._id)) return false;
      seen.add(msg._id);
      return true;
    });
    
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    return sortedMessages;
  }, [apiMessages, liveMessages]);

  // Retry connection
  const retryConnection = useCallback(() => {
    setIsConnected(false);
    hasJoinedRoom.current = false;
    initializingSocket.current = false;
    
    // Cleanup current socket
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }
    
    // Reinitialize after a short delay
    setTimeout(() => {
      if (componentMounted.current) {
        initializeSocket();
      }
    }, 1000);
  }, [initializeSocket]);

  // Initialize socket on mount and when dependencies change
  useEffect(() => {
    componentMounted.current = true;
    
    if (enabled && streamId && token) {
      // Initialize socket for live messages
      initializeSocket();
    }

    return () => {
      componentMounted.current = false;
      hasJoinedRoom.current = false;
      initializingSocket.current = false;
      
      // Leave stream room
      if (socketRef.current && streamId) {
        socketRef.current.emit('stream:leave', { streamId });
      }
      
      // Cleanup socket listeners (like desktop version)
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('stream:joined');
        socketRef.current.off('stream:messages');
        socketRef.current.off('stream:new');
        socketRef.current.off('stream:likes');
        socketRef.current.off('stream:error');
        socketRef.current = null;
      }
    };
  }, [enabled, streamId, token]);

  // Return all merged messages for display
  const displayMessages = useMemo(() => {
    return mergedMessages;
  }, [mergedMessages]);

  return {
    messages: displayMessages,
    isConnected,
    sendMessage,
    sendLike,
    streamLikes,
    userHasLiked,
    streamCommentsCount,
    connectionError: connectionError || queryError?.message || null,
    retryConnection,
    isLoading
  };
};

export default useStreamingChatMessages;