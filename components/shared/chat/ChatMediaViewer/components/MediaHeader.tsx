import React from 'react';
import { View, TouchableOpacity, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { MediaHeaderProps } from '../types';

export const MediaHeader: React.FC<MediaHeaderProps> = ({
  visible,
  senderName,
  timestamp,
  currentIndex,
  totalItems,
  onClose,
  onDownload,
  isDownloading = false,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        {senderName && (
          <Typography size={16} weight="600" color="white">
            {senderName}
          </Typography>
        )}
        {timestamp && (
          <Typography size={12} color="rgba(255,255,255,0.8)">
            {timestamp}
          </Typography>
        )}
      </View>

      {onDownload && (
        <TouchableOpacity 
          onPress={onDownload} 
          style={[styles.actionButton, isDownloading && styles.disabledButton]}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="download" size={20} color="white" />
          )}
        </TouchableOpacity>
      )}
      
      {totalItems > 1 && (
        <View style={styles.counter}>
          <Typography size={14} color="white">
            {currentIndex + 1} / {totalItems}
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});