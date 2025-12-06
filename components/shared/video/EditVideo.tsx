import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Alert } from 'react-native';
import AppButton from '@/components/ui/AppButton';
import { EditVideoProps } from '@/helpers/types/edit-video.types';
import { useEditVideoForm } from '@/hooks/feeds/useEditVideoForm';
import { useTagSearch } from '@/hooks/feeds/useTagSearch';
import { useUpdatePost } from '@/hooks/feeds/useUpdatePost';
import { ThumbnailService } from '@/services/thumbnail.service';
import { MediaPreview } from './EditVideo/MediaPreview';
import { DescriptionInput } from './EditVideo/DescriptionInput';
import { TagInput } from './EditVideo/TagInput';
import { SettingsSection } from './EditVideo/SettingsSection';

const EditVideo: React.FC<EditVideoProps> = ({ video, onClose, onSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const { formData, updateField, validateForm, isPhotoPost } = useEditVideoForm(video);
  
  const tagSearch = useTagSearch(
    formData.tags,
    (tags) => updateField('tags', tags)
  );
  
  const updatePostMutation = useUpdatePost();

  const handleThumbnailPick = async () => {
    try {
      setIsUploading(true);
      const result = await ThumbnailService.pickThumbnail();
      
      if (result.success && result.uri) {
        updateField('thumbnail', result.uri);
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const validation = validateForm();
    
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors[0]);
      return;
    }

    updatePostMutation.mutate(
      {
        videoId: video._id,
        formData,
        isPhotoPost,
        originalThumbnail: video.thumbnail || '',
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <MediaPreview
          video={video}
          thumbnail={formData.thumbnail}
          isUploading={isUploading}
          onThumbnailPress={handleThumbnailPick}
        />

        <DescriptionInput
          description={formData.description}
          onDescriptionChange={(text) => updateField('description', text)}
          isPhotoPost={isPhotoPost}
        />

        <TagInput
          selectedTags={formData.tags}
          searchState={tagSearch.searchState}
          expandedCategories={tagSearch.expandedCategories}
          onSearchChange={tagSearch.handleSearchChange}
          onAddTag={tagSearch.addTag}
          onRemoveTag={tagSearch.removeTag}
          onToggleCategory={tagSearch.toggleCategory}
        />

        <SettingsSection
          allowComments={formData.allowComments}
          onAllowCommentsChange={(value) => updateField('allowComments', value)}
        />

        <AppButton
          title={updatePostMutation.isPending ? 'Updating...' : `Update ${isPhotoPost ? 'Photos' : 'Video'}`}
          handlePress={handleSubmit}
          disabled={updatePostMutation.isPending || isUploading}
          isLoading={updatePostMutation.isPending}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  submitButton: {
    marginTop: 16,
  },
});

export default EditVideo;
