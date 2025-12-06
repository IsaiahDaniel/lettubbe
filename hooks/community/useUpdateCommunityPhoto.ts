import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateCommunityPhoto } from '@/services/community.service';

export const useUpdateCommunityPhoto = () => {
  const mutation = useMutation({
    mutationFn: ({ communityId, photo }: { communityId: string; photo: string }) => {
      console.log('mutation.mutationFn called with communityId:', communityId);
      return updateCommunityPhoto(communityId, photo);
    },
    onSuccess: (data, variables) => {
      console.log('Community photo updated successfully:', data);
      
      // Validate that the server returned the correct community
      const expectedCommunityId = variables.communityId;
      const returnedCommunityId = data?.data?._id;
      
      if (returnedCommunityId && returnedCommunityId !== expectedCommunityId) {
        console.error('Expected community ID:', expectedCommunityId, 'server returned:', returnedCommunityId);
        console.error('Server updated wrong community:', {
          expected: expectedCommunityId,
          actual: returnedCommunityId,
          actualCommunityName: data?.data?.name
        });
      }
    },
    onError: (error) => {
      console.error('Error updating community photo:', error);
    },
  });

  const updatePhoto = useCallback(async (communityId: string, photoUri: string) => {
    console.log('useUpdateCommunityPhoto - updatePhoto called with:', { communityId, photoUri: !!photoUri });

    if (!communityId) {
      console.error('useUpdateCommunityPhoto - No communityId provided');
      throw new Error('Community ID is required');
    }

    if (!photoUri) {
      console.error('useUpdateCommunityPhoto - No photoUri provided');
      throw new Error('Photo is required');
    }

    console.log('useUpdateCommunityPhoto - About to call mutation with communityId:', communityId);
    
    return mutation.mutateAsync({
      communityId,
      photo: photoUri,
    });
  }, [mutation]);

  return {
    updatePhoto,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};