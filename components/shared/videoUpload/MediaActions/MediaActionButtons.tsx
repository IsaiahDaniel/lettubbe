import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { Feather } from '@expo/vector-icons';
import { formatFileSize } from '@/helpers/utils/media-utils';

interface MediaActionButtonsProps {
  uploadMode: "video" | "photo" | "document" | "audio";
  selectedCount: number;
  totalSize: number;
  maxSize: number;
  isChatUpload: boolean;
  isCommunityUpload: boolean;
  onSend?: () => void;
  onContinue?: () => void;
}

export const MediaActionButtons: React.FC<MediaActionButtonsProps> = ({
  uploadMode,
  selectedCount,
  totalSize,
  maxSize,
  isChatUpload,
  isCommunityUpload,
  onSend,
  onContinue,
}) => {
  if (selectedCount === 0) return null;

  // Show circular send button for audio files
  if (uploadMode === "audio" && (isCommunityUpload || isChatUpload)) {
    return (
      <View style={styles.audioSendButtonContainer}>
        <TouchableOpacity
          style={styles.audioSendButton}
          onPress={onSend}
          activeOpacity={0.8}
        >
          <Feather name="send" size={28} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  // Show regular continue/upload buttons for photos
  if (uploadMode === "photo") {
    const buttonText = isCommunityUpload || isChatUpload 
      ? `Upload (${selectedCount}/5)` 
      : `Continue (${selectedCount}/5)`;
    
    return (
      <View style={styles.continueButtonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={isCommunityUpload || isChatUpload ? onSend : onContinue}
        >
          <Typography size={16} weight="600" style={{ color: "#FFFFFF" }}>
            {buttonText}
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  continueButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  audioSendButtonContainer: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  audioSendButton: {
    width: 50,
    height: 50,
    paddingRight: 2,
    paddingTop: 2,
    borderRadius: 28,
    backgroundColor: Colors.general.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButton: {
    flex: 1,
    backgroundColor: Colors.general.primary,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});