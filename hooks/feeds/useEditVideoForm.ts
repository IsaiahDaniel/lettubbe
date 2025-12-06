import { useState } from 'react';
import { EditVideoFormData, VideoToEdit, ValidationResult } from '@/helpers/types/edit-video.types';
import { parseAndCleanTags } from '@/helpers/utils/tag-utils';

// Manage form state for video editing

export const useEditVideoForm = (video: VideoToEdit) => {
  const [formData, setFormData] = useState<EditVideoFormData>({
    description: video.description || '',
    tags: parseAndCleanTags(video.tags),
    isPublic: video.isPublic !== false,
    allowComments: video.allowComments !== false,
    thumbnail: video.thumbnail || '',
  });

  const updateField = <K extends keyof EditVideoFormData>(
    field: K,
    value: EditVideoFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): ValidationResult => {
    const errors: string[] = [];
    const isPhotoPost = !!(video.images && video.images.length > 0);
    const mediaType = isPhotoPost ? "photos" : "video";

    if (!formData.description.trim()) {
      errors.push(`Please provide a description for your ${mediaType}`);
    }

    if (formData.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const resetForm = () => {
    setFormData({
      description: video.description || '',
      tags: parseAndCleanTags(video.tags),
      isPublic: video.isPublic !== false,
      allowComments: video.allowComments !== false,
      thumbnail: video.thumbnail || '',
    });
  };

  return {
    formData,
    updateField,
    validateForm,
    resetForm,
    isPhotoPost: !!(video.images && video.images.length > 0),
  };
};