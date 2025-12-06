import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageSquare, Phone, UserPlus, Video } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';
import CustomBottomSheet from '@/components/ui/CustomBottomSheet';

interface CallOptionsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSendMessage: () => void;
  onSwitchToVideo: () => void;
  onSwitchToAudio: () => void;
  onAddParticipant: () => void;
  isVideoCall: boolean;
  isCallConnected: boolean;
}

export default function CallOptionsSheet({
  isVisible,
  onClose,
  onSendMessage,
  onSwitchToVideo,
  onSwitchToAudio,
  onAddParticipant,
  isVideoCall,
  isCallConnected
}: CallOptionsSheetProps) {
  const { theme } = useCustomTheme();
  
  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      sheetheight="auto"
      title="Call Options"
      showClose={true}
      showCloseIcon={true}
    >
      <View style={styles.menuContainer}>
        {/* Send Message Option */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={onSendMessage}
        >
          <View style={styles.menuIconContainer}>
            <MessageSquare size={24} color={Colors.general.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Typography weight="500" size={16} textType="textBold">
              Send a message
            </Typography>
            <Typography weight="400" size={14} color={Colors[theme].textLight}>
              End call and start messaging
            </Typography>
          </View>
        </TouchableOpacity>
        
        {/* Switch to Video Option (only for audio calls) */}
        {!isVideoCall && isCallConnected && (
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onSwitchToVideo}
          >
            <View style={styles.menuIconContainer}>
              <Video size={24} color={Colors.general.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Typography weight="500" size={16} textType="textBold">
                Switch to video call
              </Typography>
              <Typography weight="400" size={14} color={Colors[theme].textLight}>
                Request to enable video
              </Typography>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Switch to Audio Option (only for video calls) */}
        {isVideoCall && isCallConnected && (
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onSwitchToAudio}
          >
            <View style={styles.menuIconContainer}>
              <Phone size={24} color={Colors.general.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Typography weight="500" size={16} textType="textBold">
                Switch to audio call
              </Typography>
              <Typography weight="400" size={14} color={Colors[theme].textLight}>
                Disable video and continue with audio
              </Typography>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Add Participant Option */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={onAddParticipant}
        >
          <View style={styles.menuIconContainer}>
            <UserPlus size={24} color={Colors.general.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Typography weight="500" size={16} textType="textBold">
              Add participants
            </Typography>
            <Typography weight="400" size={14} color={Colors[theme].textLight}>
              Invite others to this call
            </Typography>
          </View>
        </TouchableOpacity>
      </View>
    </CustomBottomSheet>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  menuTextContainer: {
    flex: 1,
  },
});