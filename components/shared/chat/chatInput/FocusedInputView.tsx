import React from 'react';
import { View } from 'react-native';
import InputField from './InputField';
import SendButton from './SendButton';
import InputActions from '../fileSharing/InputActions';

interface FocusedInputViewProps {
  inputRef: React.RefObject<any>;
  message: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  onSend: () => void;
  canSend: boolean;
  togglePicker: () => void;
  onVoiceRecordStart?: () => void;
  onVoiceRecordEnd?: () => void;
  isRecording?: boolean;
}

const FocusedInputView: React.FC<FocusedInputViewProps> = ({
  inputRef,
  message,
  onChangeText,
  onBlur,
  onSend,
  canSend,
  togglePicker,
  onVoiceRecordStart,
  onVoiceRecordEnd,
  isRecording = false,
}) => {
  return (
    <View style={{ paddingHorizontal: 8 }}>
      <InputField
        variant="focused"
        inputRef={inputRef}
        value={message}
        onChangeText={onChangeText}
        onBlur={onBlur}
        style={{ width: '100%' }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          paddingRight: 6,
        }}
      >
        <InputActions togglePicker={togglePicker} />
        
        <SendButton
          onSend={onSend}
          canSend={canSend}
          variant="focused"
          onVoiceRecordStart={onVoiceRecordStart}
          onVoiceRecordEnd={onVoiceRecordEnd}
          isRecording={isRecording}
        />
      </View>
    </View>
  );
};

export default FocusedInputView;