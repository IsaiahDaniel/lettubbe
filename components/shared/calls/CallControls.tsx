import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Mic, MicOff, Volume2, VolumeOff, RotateCcw, MoreHorizontal, Phone, Video, VideoOff } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import CallButton from '@/components/shared/calls/CallButton';
import useCallStore from '@/store/callsStore';

interface CallControlsProps {
  isVideoCall: boolean;
  onEndCall: () => void;
  onMorePress: () => void;
}

export default function CallControls({ 
  isVideoCall, 
  onEndCall, 
  onMorePress 
}: CallControlsProps) {
  const { theme } = useCustomTheme();
  const colors = Colors[theme];
  
  const { 
    isSpeakerOn, 
    localAudioEnabled,
    localVideoEnabled,
    toggleMute, 
    toggleSpeaker, 
    toggleVideo,
    switchCamera,
  } = useCallStore();
  
  return (
    <View style={styles.bottomSection}>
      <View style={styles.controlsRow}>
        <CallButton
          Icon={localAudioEnabled ? Mic : MicOff}
          onPress={toggleMute}
          color={localAudioEnabled ? "black" : Colors.general.error}
          backgroundColor={localAudioEnabled ? "#fff" : "#fff"}
          size={24}
        />
        
        <CallButton
          Icon={isSpeakerOn ? Volume2 : VolumeOff}
          onPress={toggleSpeaker}
          color={isSpeakerOn ? "black" : Colors.general.error}
          backgroundColor="#fff"
          size={24}
        />

        {isVideoCall && (
          <CallButton
            Icon={localVideoEnabled ? Video : VideoOff}
            onPress={toggleVideo}
            color={localVideoEnabled ? "black" : Colors.general.error}
            backgroundColor="#fff"
            size={24}
          />
        )}
        
        {/* End call button */}
        <View style={styles.endCallContainer}>
          <CallButton
            Icon={Phone}
            onPress={onEndCall}
            color="white"
            backgroundColor="#ff3b5c"
            size={24}
            containerStyle={styles.endCallButton}
          />
        </View>
        
        {isVideoCall && (
          <CallButton
            Icon={RotateCcw}
            onPress={switchCamera}
            color={Colors[theme].textBold}
            backgroundColor="#fff"
            size={24}
          />
        )}
        
        <CallButton
          Icon={MoreHorizontal}
          onPress={onMorePress}
          color="black"
          backgroundColor="#fff"
          size={24}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 30,
  },
  endCallContainer: {
    alignItems: 'center',
  },
  endCallButton: {
    transform: [{ rotate: '135deg' }],
  },
});