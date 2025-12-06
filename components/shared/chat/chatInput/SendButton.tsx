import React from 'react';
import { TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants';

interface SendButtonProps {
  onSend: () => void;
  canSend: boolean;
  variant: 'dormant' | 'focused';
  onVoiceRecordStart?: () => void;
  onVoiceRecordEnd?: () => void;
  isRecording?: boolean;
  hasRecordedAudio?: boolean;
  onVoiceSend?: () => void;
}

const SendButton: React.FC<SendButtonProps> = ({
  onSend,
  canSend,
  variant,
  onVoiceRecordStart,
  onVoiceRecordEnd,
  isRecording = false,
  hasRecordedAudio = false,
  onVoiceSend,
}) => {
  const containerStyle = {
    dormant: {},
    focused: {
      marginBottom: 2,
    },
  };

  const showMicrophone = !canSend && !isRecording && !hasRecordedAudio && onVoiceRecordStart;
  const showSendVoice = hasRecordedAudio && onVoiceSend;
  const showStopRecording = isRecording && onVoiceRecordEnd;

  const handlePress = () => {
    if (canSend) {
      onSend();
    } else if (showStopRecording && onVoiceRecordEnd) {
      onVoiceRecordEnd();
    } else if (showSendVoice && onVoiceSend) {
      onVoiceSend();
    } else if (showMicrophone && onVoiceRecordStart) {
      onVoiceRecordStart();
    }
  };

  const getIconName = () => {
    if (canSend) return "send";
    if (showStopRecording) return "square"; // Stop icon for recording
    if (showSendVoice) return "send"; // Send icon for recorded audio
    return "mic";
  };

  const getButtonColor = () => {
    if (isRecording) return '#ff4444';
    if (hasRecordedAudio) return Colors.general.purple;
    return Colors.general.purple;
  };

  return (
    <TouchableOpacity
      style={[
        containerStyle[variant],
        {
          width: 36,
          height: 36,
          borderRadius: 18,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: getButtonColor(),
          opacity: 1,
          transform: [{ scale: isRecording ? 1.1 : 1 }],
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Feather 
        name={getIconName()} 
        size={20} 
        color="white" 
      />
    </TouchableOpacity>
  );
};

export default SendButton;