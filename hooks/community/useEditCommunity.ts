import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editCommunity } from '@/services/community.service';
import showToast from '@/helpers/utils/showToast';

interface EditCommunityData {
  name?: string;
  description?: string;
  type?: 'public' | 'private' | 'hidden';
  photoUrl?: string;
  categories?: string[];
}

export const useEditCommunity = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: EditCommunityData }) => {
      return editCommunity(communityId, data);
    },
    onSuccess: (data, variables) => {
      console.log('Community updated successfully:', data);
      showToast('success', 'Community updated successfully!');
      
      // Invalidate and refetch community data
      queryClient.invalidateQueries({
        queryKey: ['community', variables.communityId],
      });
      
      // Also invalidate joined communities list
      queryClient.invalidateQueries({
        queryKey: ['joinedCommunities'],
      });
    },
    onError: (error: any) => {
      console.error('Error updating community:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update community';
      showToast('error', errorMessage);
    },
  });

  const editCommunityData = useCallback(async (communityId: string, data: EditCommunityData) => {
    if (!communityId) {
      throw new Error('Community ID is required');
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error('At least one field must be provided to update');
    }

    return mutation.mutateAsync({
      communityId,
      data,
    });
  }, [mutation]);

  return {
    editCommunity: editCommunityData,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};