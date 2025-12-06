import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveCommunity } from '@/services/community.service';

export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (communityId: string) => leaveCommunity(communityId),
    onSuccess: (data) => {
      console.log('Successfully left community:', data);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['communities', 'joined'] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'all', 'infinite'] });
      // Invalidate search queries that might contain communities
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
    onError: (error) => {
      console.error('Error leaving community:', error);
    },
  });

  const leave = useCallback(async (communityId: string) => {
    if (!communityId) {
      throw new Error('Community ID is required');
    }

    return mutation.mutateAsync(communityId);
  }, [mutation]);

  return {
    leave,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};