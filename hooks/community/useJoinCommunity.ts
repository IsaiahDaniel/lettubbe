import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinCommunity } from '@/services/community.service';
import { useCommunityStore } from '@/store/communityStore';

export const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  const { removePendingCommunity } = useCommunityStore();
  
  const mutation = useMutation({
    mutationFn: (communityId: string) => joinCommunity(communityId),
    onSuccess: (data, communityId) => {
      console.log('Successfully joined community:', data);
      // Remove from pending state when successfully joined
      removePendingCommunity(communityId);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['communities', 'joined'] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'all', 'infinite'] });
      // Invalidate search queries that might contain communities
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
    onError: (error) => {
      console.error('Error joining community:', error);
    },
  });

  const join = useCallback(async (communityId: string) => {
    if (!communityId) {
      throw new Error('Community ID is required');
    }

    return mutation.mutateAsync(communityId);
  }, [mutation]);

  return {
    join,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};