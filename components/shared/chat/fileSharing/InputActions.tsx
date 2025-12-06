import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';

interface InputActionsProps {
  togglePicker: () => void;
}

const InputActions: React.FC<InputActionsProps> = ({ togglePicker }) => {
  const { theme } = useCustomTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', gap: 30 }}>
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
      </View>
    </View>
  );
};

export default InputActions;