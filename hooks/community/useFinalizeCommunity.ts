import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { finalizeCommunity } from '@/services/community.service';

export const useFinalizeCommunity = () => {
  const mutation = useMutation({
    mutationFn: ({ communityId, type }: { communityId: string; type: 'public' | 'private' | 'hidden' }) => 
      finalizeCommunity(communityId, type),
    onSuccess: (data) => {
      console.log('Community finalized successfully:', data);
    },
    onError: (error) => {
      console.error('Error finalizing community:', error);
    },
  });

  const finalize = useCallback(async (communityId: string, type: 'public' | 'private' | 'hidden') => {
    if (!communityId) {
      throw new Error('Community ID is required');
    }

    if (!type || !['public', 'private', 'hidden'].includes(type)) {
      throw new Error('Valid community type is required (public, private, or hidden)');
    }

    return mutation.mutateAsync({
      communityId,
      type,
    });
  }, [mutation]);

  return {
    finalize,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};