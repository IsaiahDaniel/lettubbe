import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createCommunity } from '@/services/community.service';
import { handleError } from '@/helpers/utils/handleError';
import { useRouter } from 'expo-router';

export const useCreateCommunity = () => {
  const router = useRouter();
  const [communityId, setCommunityId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createCommunity,
    onSuccess: (data) => {
      console.log('Community created successfully:', data);
      // if (data.success && data.data?._id) {
      //   setCommunityId(data.data._id);
      // }
      router.push({
        pathname: '/(community)/create-step2',
        params: {
          communityId: data?.data?._id,
          name: data?.data?.name.trim(),
          description: data?.data?.description.trim()
        }
      });
    },
    onError: (error) => {
      console.error('Error creating community:', error);
      handleError(error);
    },
  });

  const createCommunityWithData = useCallback(async (name: string, description: string) => {
    // Clear any previous community ID to prevent conflicts
    setCommunityId(null);
    console.log('useCreateCommunity - Cleared previous communityId, creating new community');

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedDescription) {
      throw new Error('Name and description are required');
    }

    if (trimmedName.length > 50) {
      throw new Error('Community name must be 50 characters or less');
    }

    if (trimmedDescription.length > 300) {
      throw new Error('Community description must be 300 characters or less');
    }

    try {
      return await mutation.mutateAsync({
        name: trimmedName,
        description: trimmedDescription,
      });
    } catch (error: any) {
      // Handle duplicate community name error
      if (error.status === 400 && error.data?.error === "Duplicate field value entered") {
        throw new Error(`A community named "${trimmedName}" already exists. Please choose a different name.`);
      }

      // Handle other API errors
      if (error.data?.error) {
        throw new Error(error.data.error);
      }

      // Re-throw the original error if we can't handle it
      throw error;
    }
  }, [mutation]);

  return {
    createCommunity: createCommunityWithData,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    communityId,
    reset: mutation.reset,
  };
};