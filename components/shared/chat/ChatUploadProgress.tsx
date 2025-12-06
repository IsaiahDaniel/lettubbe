import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import CircularProgress from '@/components/ui/CircularProgress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChatUploadProgressProps {
  isUploading: boolean;
  uploadProgress?: number;
  uploadError?: boolean;
  onRetry?: () => void;
}

const ChatUploadProgress: React.FC<ChatUploadProgressProps> = ({
  isUploading,
  uploadProgress = 0,
  uploadError = false,
  onRetry
}) => {
  const { theme } = useCustomTheme();

  if (!isUploading && !uploadError) return null;

  const containerWidth = SCREEN_WIDTH * 0.75;
  const size = containerWidth - 16;

  return (
    <View style={styles.overlay}>
      <View style={styles.progressContainer}>
        {uploadError ? (
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: Colors.general.error }]}
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <CircularProgress 
            progress={uploadProgress}
            size={60}
            strokeWidth={3}
            progressColor={Colors.general.primary}
            backgroundColor={Colors[theme].cardBackground}
            showUploadIcon={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatUploadProgress;