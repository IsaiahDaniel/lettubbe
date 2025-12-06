import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import InputField from './InputField';
import SendButton from './SendButton';

interface DormantInputViewProps {
  inputRef: React.RefObject<any>;
  message: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSend: () => void;
  canSend: boolean;
  togglePicker: () => void;
  onVoiceRecordStart?: () => void;
  onVoiceRecordEnd?: () => void;
  isRecording?: boolean;
}

const DormantInputView: React.FC<DormantInputViewProps> = ({
  inputRef,
  message,
  onChangeText,
  onFocus,
  onBlur,
  onSend,
  canSend,
  togglePicker,
  onVoiceRecordStart,
  onVoiceRecordEnd,
  isRecording = false,
}) => {
  const { theme } = useCustomTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        gap: 8,
      }}
    >
      <TouchableOpacity
        style={{
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 20,
        }}
        onPress={togglePicker}
      >
        <Feather
          name="paperclip"
          size={24}
          color={Colors[theme].text}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          flex: 1,
          borderRadius: 12,
          paddingHorizontal: 15,
          height: 45,
          justifyContent: 'center',
          backgroundColor: Colors[theme].cardBackground,
        }}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={0.9}
      >
        <InputField
          variant="dormant"
          inputRef={inputRef}
          value={message}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </TouchableOpacity>

      <SendButton
        onSend={onSend}
        canSend={canSend}
        variant="dormant"
        onVoiceRecordStart={onVoiceRecordStart}
        onVoiceRecordEnd={onVoiceRecordEnd}
        isRecording={isRecording}
      />
    </View>
  );
};

export default DormantInputView;