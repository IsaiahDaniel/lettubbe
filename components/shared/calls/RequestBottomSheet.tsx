import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Typography from '@/components/ui/Typography/Typography';
import CustomBottomSheet from '@/components/ui/CustomBottomSheet';

interface RequestBottomSheetProps {
  type: 'incoming' | 'outgoing';
  isVisible: boolean;
  requestType: 'video' | 'audio' | null;
  participantName?: string;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function RequestBottomSheet({
  type,
  isVisible,
  requestType,
  participantName,
  onClose,
  onAccept,
  onReject
}: RequestBottomSheetProps) {
  if (type === 'outgoing') {
    return (
      <CustomBottomSheet
        isVisible={isVisible}
        onClose={onClose}
        sheetheight="auto"
        title={`Requesting ${requestType === 'video' ? 'Video' : 'Audio'}`}
        showClose={true}
        showCloseIcon={true}
      >
        <View style={styles.contentContainer}>
          <Typography 
            weight="400" 
            size={16} 
            textType="text" 
            style={styles.contentText}
          >
            Waiting for the other person to accept your {requestType} request...
          </Typography>
          
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={onClose}
          >
            <Typography 
              weight="600" 
              size={16} 
              color={Colors.general.error}
              textType="textBold"
            >
              Cancel
            </Typography>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>
    );
  }
  
  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onReject || onClose}
      sheetheight="auto"
      title={requestType === 'video' ? "Video Request" : "Audio Request"}
      showClose={true}
      showCloseIcon={true}
    >
      <View style={styles.contentContainer}>
        <Typography 
          weight="400" 
          size={16} 
          textType="text" 
          style={styles.contentText}
        >
          {requestType === 'video' 
            ? `${participantName} wants to switch to a video call`
            : `${participantName} wants to switch to an audio call`
          }
        </Typography>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.buttonContainer, styles.secondaryButton]}
            onPress={onReject}
          >
            <Typography 
              weight="600" 
              size={16} 
              color={Colors.general.error}
              textType="textBold"
            >
              Decline
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.buttonContainer, styles.primaryButton]}
            onPress={onAccept}
          >
            <Typography 
              weight="600" 
              size={16} 
              color={Colors.general.primary}
              textType="textBold"
            >
              Accept
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </CustomBottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  contentText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    flex: 1,
    marginRight: 8,
  }
});