import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleConversationFavorite, toggleConversationArchive } from '@/services/chats.service';
import showToast from '@/helpers/utils/showToast';

export const useToggleConversationFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => toggleConversationFavorite(conversationId),
    onSuccess: (data, conversationId) => {
      // Invalidate and refetch conversations to get updated status
      queryClient.invalidateQueries({
        queryKey: ['userConversations']
      });
      queryClient.invalidateQueries({
        queryKey: ['userConversationsInfinite']
      });
      
      showToast(
        'success',
        data.data?.isFavourite ? 'Added to favorites' : 'Removed from favorites'
      );
    },
    onError: (error: any) => {
      console.error('Error toggling conversation favorite:', error);
      showToast(
        'error',
        'Please try again',
        'Failed to update favorite status'
      );
    },
  });
};

export const useToggleConversationArchive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => toggleConversationArchive(conversationId),
    onSuccess: (data, conversationId) => {
      // Invalidate and refetch conversations to get updated status
      queryClient.invalidateQueries({
        queryKey: ['userConversations']
      });
      queryClient.invalidateQueries({
        queryKey: ['userConversationsInfinite']
      });
      
      showToast(
        'success',
        data.data?.isArchived ? 'Conversation archived' : 'Conversation unarchived'
      );
    },
    onError: (error: any) => {
      console.error('Error toggling conversation archive:', error);
      showToast(
        'error',
        'Please try again',
        'Failed to update archive status'
      );
    },
  });
};