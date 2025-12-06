import { getUserConversationsPaginated, Conversation } from "@/services/chats.service";
import { GenericResponse } from "@/helpers/types/general.types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useCallback, useRef } from "react";
import { getSocket } from "@/helpers/utils/socket";
import useAuth from "../auth/useAuth";
import { ChatDomainService } from "@/services/chat.domain.service";
import { formatTimeAgo } from "@/helpers/utils/formatting";

const useGetUserConversationsInfinite = () => {
  const { token, userDetails } = useAuth();
  const queryClient = useQueryClient();
  const lastEndReachedTime = useRef(0);
  const lastInvalidationTime = useRef(0);
  const invalidationTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ["getUserConversations", "infinite"],
    queryFn: ({ pageParam = 1 }) => {
      // console.log("Fetching conversations page:", pageParam);
      return getUserConversationsPaginated({ pageParam });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: GenericResponse, allPages) => {
      // Simple - stop infinite loops
      if (!lastPage || !lastPage.success) {
        return undefined;
      }

      // Only rely on explicit hasNextPage from server
      const hasNextPage = lastPage.hasNextPage === true || lastPage.data?.hasNextPage === true;
      
      if (!hasNextPage) {
        return undefined;
      }

      return allPages.length + 1;
    },
    staleTime: 5 * 1000, // 5 seconds - much faster updates for real-time feel
    gcTime: 1 * 60 * 1000, // 1 minute - faster cleanup
    refetchOnWindowFocus: true, // Refetch when user comes back to app
    refetchOnMount: "always", // Always refetch to get latest data
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Process and cache conversations - do heavy lifting ONCE here
  const conversations = useMemo(() => {
    if (!data?.pages || !Array.isArray(data.pages) || !userDetails?._id) {
      // console.log('No valid pages data or user details available');
      return [];
    }
    
    // console.log('🔄 Processing conversations in cache layer');
    const startTime = performance.now();
    
    const allRawConversations: any[] = (data.pages as GenericResponse[]).reduce((acc: any[], page: GenericResponse) => {
      if (!page?.data) {
        console.warn('Page has no data:', page);
        return acc;
      }

      // Handle different response structures
      if (Array.isArray(page.data)) {
        console.log(`Adding ${page.data.length} conversations from page (direct array)`);
        return [...acc, ...page.data];
      } else if (page.data.data && Array.isArray(page.data.data)) {
        // console.log(`Adding ${page.data.data.length} conversations from page (nested data)`);
        return [...acc, ...page.data.data];
      } else {
        console.warn('Unexpected page data structure:', typeof page.data, page.data);
        return acc;
      }
    }, []);
    
    // Process all conversations once here instead of in components
    const processedConversations = allRawConversations.map(chat => {
      const otherUser = ChatDomainService.determineOtherUser(chat, userDetails._id);
      if (!otherUser) return null;

      const latestMessage = ChatDomainService.getLatestMessage(chat);
      const unreadCount = ChatDomainService.calculateUnreadCount(chat, userDetails._id);
      const isUnread = latestMessage ? ChatDomainService.isMessageUnread(latestMessage, userDetails._id) : false;

      return {
        // Original data
        ...chat,
        // Pre-processed data
        otherUser,
        displayName: ChatDomainService.getDisplayName(otherUser),
        avatarUrl: ChatDomainService.getAvatarUrl(otherUser),
        latestMessage,
        messageText: ChatDomainService.formatMessageForDisplay(latestMessage, userDetails._id),
        timestamp: chat.updatedAt ? formatTimeAgo(new Date(chat.updatedAt).getTime()) : '',
        unreadCount,
        isUnread,
        // Keep original for compatibility
        originalChat: chat,
      };
    }).filter(Boolean);
    
    // Sort by most recent (updatedAt timestamp)
    const sortedConversations = processedConversations.sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || 0).getTime();
      return dateB - dateA; // Most recent first
    });

    const endTime = performance.now();
    // console.log(`✅ Processed and sorted ${sortedConversations.length} conversations in cache layer in ${(endTime - startTime).toFixed(2)}ms`);
    
    return sortedConversations;
  }, [data?.pages, userDetails?._id]);

  // Error and success logging
  useEffect(() => {
    if (isError && error) {
      console.error('🚨 useGetUserConversationsInfinite: Query error:', error);
    }
  }, [isError, error]);

  // useEffect(() => {
  //   if (data?.pages?.length) {
  //     console.log('✅ useGetUserConversationsInfinite: Query success, pages:', data.pages.length);
  //   }
  // }, [data?.pages?.length]);

  // Optimized end reached handler with debouncing
  const handleEndReached = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastEndReachedTime.current;
    
    // Debounce end reached calls (minimum 1 second between calls)
    if (timeSinceLastCall < 1000) {
      return;
    }
    
    if (hasNextPage && !isFetchingNextPage) {
      // console.log("Loading more conversations - hasNext:", hasNextPage);
      lastEndReachedTime.current = now;
      fetchNextPage();
    } else {
      // console.log("Cannot load more - hasNext:", hasNextPage, "isFetching:", isFetchingNextPage);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Immediate invalidation for new messages with minimal debouncing
  const debouncedInvalidateQueries = useCallback(() => {
    const now = Date.now();
    const timeSinceLastInvalidation = now - lastInvalidationTime.current;
    
    // Reduced debouncing for new messages - allow more frequent updates
    if (timeSinceLastInvalidation < 500) {
      return;
    }

    // Clear any pending invalidation timeouts
    invalidationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    invalidationTimeouts.current.clear();

    // Immediate invalidation for better responsiveness
    // console.log("🔄 Performing immediate query invalidation for new message");
    lastInvalidationTime.current = Date.now();
    
    // Invalidate both queries immediately
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && 
               key[0] === "getUserConversations" && 
               (key.length === 1 || key[1] === "infinite");
      }
    });
  }, [queryClient]);

  // Optimized refetch with debouncing
  const debouncedRefetch = useCallback(() => {
    const now = Date.now();
    const timeSinceLastInvalidation = now - lastInvalidationTime.current;
    
    // Only refetch if enough time has passed since last invalidation
    if (timeSinceLastInvalidation >= 2000) {
      // console.log("🔄 Performing debounced refetch");
      refetch();
    }
  }, [refetch]);

  // Unified event handler that batches all conversation updates
  const handleConversationUpdate = useCallback((eventType: string) => {
    // console.log(`📨 Conversation update event: ${eventType}`);
    debouncedInvalidateQueries();
  }, [debouncedInvalidateQueries]);

  // Immediate handler for new messages to update conversation list
  const handleNewMessage = useCallback(() => {
    // console.log("📩 New message received - updating conversation list");
    
    // Clear domain service caches to ensure fresh data
    ChatDomainService.clearCaches();
    
    debouncedInvalidateQueries();
  }, [debouncedInvalidateQueries]);

  // Listen to essential socket events for conversation list updates
  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    if (!socket) return;

    // Listen for new messages to update conversation previews
    socket.on("newMessage", handleNewMessage);

    return () => {
      invalidationTimeouts.current.forEach(timeout => clearTimeout(timeout));
      invalidationTimeouts.current.clear();
      socket.off("newMessage", handleNewMessage);
    };
  }, [token, handleNewMessage, debouncedInvalidateQueries]);

  return {
    data: conversations,
    isPending,
    refetch,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    handleEndReached,
    fetchNextPage
  };
};

export default useGetUserConversationsInfinite;