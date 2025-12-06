import React, { memo, useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInteractionStore } from '@/hooks/interactions/useInteractionStore';

interface BookmarkButtonProps {
  postId: string;
  textColor: string;
  activeColor?: string;
  size?: number;
  galleryRefetch?: () => Promise<any>;
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});

export const BookmarkButton = memo(({
  postId,
  textColor,
  activeColor = '#0066ff',
  size = 24,
  galleryRefetch,
}: BookmarkButtonProps) => {
  const isBookmarked = useInteractionStore(state => state.isPostBookmarked(postId));
  const toggleBookmarkPost = useInteractionStore(state => state.toggleBookmarkPost);
  
  const handleBookmarkPress = useCallback(async () => {
    try {
      await toggleBookmarkPost(postId);
      
      // Refetch data if provided
      if (galleryRefetch) {
        await galleryRefetch();
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
    }
  }, [postId, toggleBookmarkPost, galleryRefetch]);
  
  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleBookmarkPress}
      testID="bookmark-button"
      activeOpacity={0.7}
    >
      <Ionicons 
        name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
        size={size} 
        color={isBookmarked ? activeColor : textColor} 
      />
    </TouchableOpacity>
  );
});