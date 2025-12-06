import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useGetUserIdState } from '@/store/UsersStore';
import { useToggleConversationFavorite, useToggleConversationArchive } from '@/hooks/chats/useToggleConversationStatus';
import { 
  isSearchResultChat, 
  createNewConversationId, 
  buildNavigationParams 
} from '@/helpers/utils/chat-utils';

export const useChatActions = () => {
  const router = useRouter();
  const { setUserId } = useGetUserIdState();
  
  // Chat actions hooks
  const toggleFavoriteMutation = useToggleConversationFavorite();
  const toggleArchiveMutation = useToggleConversationArchive();

  const handleChatPress = useCallback((
    chatId: string, 
    username: string, 
    displayName: string, 
    avatar: string, 
    subscriberCount: string, 
    userId: string
  ) => {
    // Check if this is a search result (fake conversation ID)
    if (isSearchResultChat(chatId)) {
      // For search results, navigate like new-message does
      setUserId(userId);
      router.push({
        pathname: '/(chat)/[Id]/Inbox',
        params: {
          Id: createNewConversationId(userId),
          username,
          displayName,
          userId,
          avatar: avatar || '',
          subscriberCount: subscriberCount || '0',
        },
      });
    } else {
      // For existing conversations, use original logic
      const params = buildNavigationParams(username, displayName, avatar, subscriberCount, userId);
      router.push(`/(chat)/${chatId}/Inbox?${params.toString()}` as any);
    }
  }, [router, setUserId]);

  const handleCallPress = useCallback(() => {
    router.push('/(calls)');
  }, [router]);

  const handleExplorePress = useCallback(() => {
    router.push('/(explore)/communities');
  }, [router]);

  const handleNewMessagePress = useCallback(() => {
    router.push('/(chat)/new-message');
  }, [router]);

  const handleToggleFavorite = useCallback((chatId: string) => {
    toggleFavoriteMutation.mutate(chatId);
  }, [toggleFavoriteMutation]);

  const handleToggleArchive = useCallback((chatId: string) => {
    toggleArchiveMutation.mutate(chatId);
  }, [toggleArchiveMutation]);

  const handleCommunityRefresh = useCallback(() => {
    // Placeholder for community refresh logic
  }, []);

  return {
    handleChatPress,
    handleCallPress,
    handleExplorePress,
    handleNewMessagePress,
    handleToggleFavorite,
    handleToggleArchive,
    handleCommunityRefresh,
  };
};