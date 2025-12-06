import { useMemo, useCallback, useState, useEffect } from 'react';
import { useGetUserIdState } from '@/store/UsersStore';
import useAuth from '@/hooks/auth/useAuth';
import useGetUserConversationsInfinite from '@/hooks/chats/useGetUserConversationsInfinite';
import type { ChatFilterTab } from '@/constants/chat.constants';
import { 
  filterConversationsByTab, 
  calculateUnreadCount,
  getOtherUserFromConversation,
  hasUnreadMessages,
  createUserDisplayName,
  buildNavigationParams,
  isSearchResultChat,
  createNewConversationId
} from '@/helpers/utils/chat-utils';

interface ConversationDataResult {
  conversations: any[];
  unreadCount: number;
  isLoading: boolean;
  refetch: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onEndReached?: () => void;
}

export const useConversationData = (
  activeTab: ChatFilterTab,
  searchTerm: string
): ConversationDataResult => {
  const { userDetails } = useAuth();
  const [cachedConversations, setCachedConversations] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Use the infinite conversations hook for pagination
  const { 
    data: conversations, 
    refetch, 
    isPending,
    hasNextPage,
    isFetchingNextPage,
    handleEndReached
  } = useGetUserConversationsInfinite();

  // Update cached conversations when new data arrives
  useEffect(() => {
    if (conversations && Array.isArray(conversations) && conversations.length > 0) {
      // console.log('🔄 useConversationData: Updating cached conversations', conversations.length);
      setCachedConversations(conversations);
      setIsInitialLoad(false);
    }
  }, [conversations]);

  // Use cached conversations for immediate display while loading
  const displayConversations = useMemo(() => {
    const conversationList = conversations || cachedConversations;
    return Array.isArray(conversationList) ? conversationList : [];
  }, [conversations, cachedConversations]);
  
  // Simple filtering - no heavy processing since data is already processed
  const filteredConversations = useMemo(() => {
    // console.log('🔄 useConversationData: Filtering pre-processed conversations', displayConversations.length, 'for tab:', activeTab);
    const start = performance.now();
    
    if (!Array.isArray(displayConversations) || !userDetails?._id) {
      return [];
    }
    
    // Simple filtering on pre-processed data
    let filtered;
    switch (activeTab) {
      case 'Unread':
        filtered = displayConversations.filter(conv => conv.isUnread);
        break;
      case 'Favorites':
        filtered = displayConversations.filter(conv => conv.isFavourite);
        break;
      case 'Archived':
        filtered = displayConversations.filter(conv => conv.isArchived);
        break;
      case 'All':
      default:
        filtered = displayConversations.filter(conv => !conv.isArchived);
        break;
    }
    
    const end = performance.now();
    console.log('✅ useConversationData: Filtering took', (end - start).toFixed(2), 'ms, result:', filtered.length);
    
    return filtered;
  }, [displayConversations, activeTab, userDetails?._id]);

  // Calculate unread conversations count from pre-processed data
  const unreadCount = useMemo(() => {
    if (!userDetails?._id) return 0;
    
    // Simple count since unread status is already calculated
    return displayConversations.filter(conv => conv.isUnread).length;
  }, [displayConversations, userDetails?._id]);

  // Optimized loading state - show skeleton only on true initial load
  const isLoading = useMemo(() => {
    // If we have cached conversations, don't show loading
    if (cachedConversations.length > 0) {
      return false;
    }
    return isInitialLoad && isPending && displayConversations.length === 0;
  }, [isInitialLoad, isPending, displayConversations.length, cachedConversations.length]);

  return {
    conversations: filteredConversations,
    unreadCount,
    isLoading,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    onEndReached: handleEndReached,
  };
};