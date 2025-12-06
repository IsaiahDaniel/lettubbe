import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markConversationAsRead } from '@/services/chats.service';

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => {
      console.log('🔄 [MARK_READ] Starting mutation for conversationId:', conversationId);
      return markConversationAsRead(conversationId);
    },
    onSuccess: async (data, conversationId) => {
      console.log('✅ [MARK_READ] Conversation marked as read:', conversationId);
      console.log('📄 [MARK_READ] Response data:', data);
      
      // Force immediate cache invalidation and refetch - bypass debouncing
      console.log('🔄 [MARK_READ] Invalidating queries...');
      await queryClient.invalidateQueries({ 
        queryKey: ['getUserConversations'],
        refetchType: 'all' // Force refetch even if query is inactive
      });
      
      // Force immediate refetch to ensure fresh data
      console.log('🔄 [MARK_READ] Refetching queries...');
      await queryClient.refetchQueries({ 
        queryKey: ['getUserConversations']
      });
      
      console.log('✅ [MARK_READ] Cache forcefully refreshed');
    },
    onError: (error) => {
      console.error('❌ Failed to mark conversation as read:', error);
    },
    retry: 0,
  });
};

export default useMarkConversationRead;