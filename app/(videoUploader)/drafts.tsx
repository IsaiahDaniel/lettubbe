import React, {useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import useVideoUploadStore, { MediaDraft } from '@/store/videoUploadStore';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import RemixIcon from 'react-native-remix-icon';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import CustomAlert from '@/components/ui/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';


const DraftsPage = () => {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const { alertConfig, isVisible, showConfirm, hideAlert } = useCustomAlert();
  
  const { 
    drafts,
    fetchDrafts,
    setSelectedVideo,
    setSelectedPhotos,
    setUploadMode,
    openFullScreenEditor,
    deleteDraft,
    setCurrentDraftId,
  } = useVideoUploadStore();

  useEffect(() => {
    // Fetch drafts when the page loads
    fetchDrafts();
  }, []);


  const handleDraftSelection = (draft: MediaDraft) => {
    console.log('Draft selected:', draft);
    
    // Reset upload state first
    useVideoUploadStore.getState().resetUpload();
    
    // Set the current draft ID so we can remove it after successful upload
    setCurrentDraftId(draft.id);
    
    // Set the upload mode
    setUploadMode(draft.type);
    
    if (draft.type === 'video') {
      // Handle video draft
      setSelectedVideo({
        uri: draft.uri as string,
        duration: draft.duration,
      });
      
      // Restore saved video details if available
      if (draft.videoDetails) {
        const { setVideoDetails } = useVideoUploadStore.getState();
        setVideoDetails(draft.videoDetails);
        console.log('📝 Restored video details from draft:', {
          description: draft.videoDetails.description,
          tags: draft.videoDetails.tags.length
        });
      }
      
      // Open editor mode and navigate to video editor
      openFullScreenEditor();
      router.push('/(videoUploader)/videoEditor');
    } else if (draft.type === 'photo') {
      // Handle photo draft
      const photoUris = Array.isArray(draft.uri) ? draft.uri : [draft.uri];
      const photos = photoUris.map((uri, index) => ({
        uri,
        filename: `photo_${index}.jpg`,
        width: 0, // These will be loaded when needed
        height: 0,
        fileSize: 0,
        type: 'image/jpeg' as const,
      }));
      
      setSelectedPhotos(photos);
      
      // Restore saved post details if available
      if (draft.postDetails) {
        const { setPostDetails } = useVideoUploadStore.getState();
        setPostDetails(draft.postDetails);
        console.log('📝 Restored post details from draft:', {
          description: draft.postDetails.description,
          tags: draft.postDetails.tags?.length || 0
        });
      }
      
      // Navigate to photo details page
      router.push('/(videoUploader)/photoDetails');
    }
  };

  const renderDraftItem = ({ item }: { item: MediaDraft }) => (
    <TouchableOpacity 
      style={styles.draftItem}
      onPress={() => handleDraftSelection(item)}
    >
      <Image 
        source={{ uri: item.thumbnailUri }} 
        style={styles.thumbnail} 
      />
      <View style={styles.draftInfo}>
        <Typography size={14} weight="600">
          {item.type === 'video' ? 'Video Draft' : 'Photo Draft'}
        </Typography>
        <Typography size={12} weight="400" textType="secondary">
          {new Date(item.createdAt).toLocaleDateString()}  •  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {/* {item.type === 'video' && item.duration && ` • ${Math.floor(item.duration)}s`} */}
          {item.type === 'photo' && Array.isArray(item.uri) && ` • ${item.uri.length} photo${item.uri.length > 1 ? 's' : ''}`}
        </Typography>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleDraftSelection(item)}>
          <RemixIcon 
            name="edit-line" 
            size={20} 
            color={Colors.general.primary} 
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDraft(item.id)}>
          <RemixIcon 
            name="delete-bin-line" 
            size={20} 
            color={Colors.general.error} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <RemixIcon 
        name="scissors-cut-line" 
        size={64} 
        color={Colors[theme].secondary} 
      />
      <Typography size={18} weight="600" style={{ marginTop: 16 }}>
        No Drafts Found
      </Typography>
      <Typography size={14} weight="400" textType="secondary" style={{ marginTop: 8 }}>
        Start creating a new video to save drafts for later
      </Typography>
      <TouchableOpacity 
        style={[styles.newVideoButton, { backgroundColor: Colors.general.primary }]}
        onPress={() => router.back()}
      >
        <Typography size={16} weight="600" style={{ color: '#FFFFFF' }}>
          Create New Video
        </Typography>
      </TouchableOpacity>
    </View>
  );

  const handleDeleteDraft = (draftId: string) => {
    showConfirm(
      "Delete Draft",
      "Are you sure you want to delete this draft?",
      async () => {
        await deleteDraft(draftId);
      },
      undefined,
      "Delete",
      "Cancel",
      "danger"
    );
  };

  return (
    <Wrapper>      
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        {drafts.length > 0 ? (
          <TouchableOpacity>
            <View style={styles.header}>
              <BackButton />
              <Typography size={20} weight="600" >Drafts</Typography>
            </View>            
            <FlatList
            data={drafts}
            renderItem={renderDraftItem}
            keyExtractor={(item) => item.id}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.draftsList}
          />
          </TouchableOpacity>
          
        ) : renderEmptyState()}
      </View>
      
      <CustomAlert
        visible={isVisible}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        primaryButton={alertConfig?.primaryButton}
        secondaryButton={alertConfig?.secondaryButton}
        onClose={hideAlert}
      />
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    width: '100%',
  },
  draftsList: {
    paddingVertical: 16,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  draftInfo: {
    marginLeft: 12,
    flex: 1,
    gap: 6
  },
  editButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  newVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 24,
  },
});

export default DraftsPage;