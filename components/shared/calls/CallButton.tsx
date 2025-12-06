import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';

interface CallButtonProps {
  Icon: React.FC<SvgProps>;
  onPress: () => void;
  color: string;
  backgroundColor: string;
  size?: number;
  containerStyle?: ViewStyle;
}

const CallButton: React.FC<CallButtonProps> = ({
  Icon,
  onPress,
  color,
  backgroundColor,
  size = 24,
  containerStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        containerStyle
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon width={size} height={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default CallButton;