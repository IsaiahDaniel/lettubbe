import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { MediaCaptionProps } from '../types';

export const MediaCaption: React.FC<MediaCaptionProps> = ({
  visible,
  caption,
}) => {
  if (!visible || !caption) return null;

  return (
    <View style={styles.captionContainer}>
      <View style={styles.captionBubble}>
        <Typography size={14} color="white" style={styles.captionText}>
          {caption}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  captionContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  captionBubble: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '90%',
  },
  captionText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});