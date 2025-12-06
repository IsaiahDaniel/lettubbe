import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateCommunityTopics } from '@/services/community.service';

export const useUpdateCommunityTopics = () => {
  const mutation = useMutation({
    mutationFn: ({ communityId, topics }: { communityId: string; topics: string[] }) => 
      updateCommunityTopics(communityId, topics),
    onSuccess: (data) => {
      console.log('Community categories updated successfully:', data);
    },
    onError: (error) => {
      console.error('Error updating community categories:', error);
    },
  });

  const updateCategories = useCallback(async (communityId: string, topics: string[]) => {
    if (!communityId) {
      throw new Error('Community ID is required');
    }

    if (!topics || topics.length === 0) {
      throw new Error('At least one category must be selected');
    }

    if (topics.length > 7) {
      throw new Error('Maximum of 7 categories can be selected');
    }

    return mutation.mutateAsync({
      communityId,
      topics,
    });
  }, [mutation]);

  return {
    updateCategories,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};