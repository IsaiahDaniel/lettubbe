import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';

interface InputFieldProps extends TextInputProps {
  variant: 'dormant' | 'focused';
  inputRef?: React.RefObject<TextInput>;
}

const InputField: React.FC<InputFieldProps> = ({
  variant,
  inputRef,
  style,
  ...props
}) => {
  const { theme } = useCustomTheme();

  const baseStyle = {
    fontSize: 16,
    color: Colors[theme].textBold,
  };

  const variantStyle = {
    dormant: {
      ...baseStyle,
    },
    focused: {
      ...baseStyle,
      minHeight: 40,
      maxHeight: 100,
    },
  };

  return (
    <TextInput
      ref={inputRef}
      style={[variantStyle[variant], style]}
      placeholder={variant === 'dormant' ? 'Type a message' : 'Message'}
      placeholderTextColor={Colors[theme].textLight}
      multiline={variant === 'focused'}
      autoFocus={variant === 'focused'}
      {...props}
    />
  );
};

export default InputField;