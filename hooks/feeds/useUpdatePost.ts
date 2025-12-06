import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import axios from 'axios';
import { baseURL } from '@/config/axiosInstance';
import { getData } from '@/helpers/utils/storage';
import { EditVideoFormData, VideoToEdit } from '@/helpers/types/edit-video.types';
import { getValidTagsForSubmission } from '@/helpers/utils/tag-utils';
import useVideoUploadStore from '@/store/videoUploadStore';

interface UpdatePostVariables {
  videoId: string;
  formData: EditVideoFormData;
  isPhotoPost: boolean;
  originalThumbnail: string;
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  const { setUploading, setUploadProgress, setUploadError, setUploadMode } = useVideoUploadStore();

  return useMutation({
    mutationFn: async ({ videoId, formData, isPhotoPost, originalThumbnail }: UpdatePostVariables) => {
      const token = await getData('token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Set upload mode for progress tracking
      setUploadMode(isPhotoPost ? 'photo' : 'video');
      setUploading(true);

      const apiFormData = new FormData();

      // Add form data fields
      if (formData.description.trim()) {
        apiFormData.append('description', formData.description.trim());
      }

      apiFormData.append('visibility', formData.isPublic ? 'public' : 'private');
      apiFormData.append('isCommentsAllowed', String(formData.allowComments));

      const validTags = getValidTagsForSubmission(formData.tags);
      apiFormData.append('tags', JSON.stringify(validTags));

      // Add thumbnail if it's a video and thumbnail changed
      if (!isPhotoPost && formData.thumbnail && formData.thumbnail !== originalThumbnail) {
        const thumbParts = formData.thumbnail.split('/');
        const thumbFileName = thumbParts[thumbParts.length - 1];

        apiFormData.append('thumbnailImage', {
          uri: Platform.OS === 'ios' 
            ? formData.thumbnail.replace('file://', '') 
            : formData.thumbnail,
          name: thumbFileName,
          type: 'image/jpeg',
        } as any);
      }

      const response = await axios.patch(
        `${baseURL}/feeds/upload/${videoId}`,
        apiFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000,
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        }
      );

      return response.data;
    },
    onSuccess: async () => {
      // Comprehensive cache invalidation
      await Promise.all([
        queryClient.removeQueries({ queryKey: ['userFeeds'], exact: false }),
        queryClient.removeQueries({ queryKey: ['feeds'] }),
        queryClient.removeQueries({ queryKey: ['userPublicUploads'] }),
        queryClient.removeQueries({ queryKey: ['userUploads'] }),
      ]);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userFeeds'], exact: false, refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['feeds'], exact: false, refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['userPublicUploads'], exact: false, refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['userUploads'], exact: false, refetchType: 'all' }),
      ]);

      // Clear upload state
      setUploading(false);
      setUploadProgress(100);
    },
    onError: (error: any) => {
      let errorMessage = 'Something went wrong while updating. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadError(errorMessage);
      setUploading(false);
    },
  });
};