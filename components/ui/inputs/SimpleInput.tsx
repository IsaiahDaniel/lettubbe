import React, { useState } from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface SimpleInputProps extends TextInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  style?: any;
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  placeholder = "",
  value = "",
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useCustomTheme();

  const borderColor = theme === "dark" ? "#1B2537" : "#E2E8F0";

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isFocused ? Colors.general.primary : borderColor,
          backgroundColor: Colors[theme].inputBackground,
          minHeight: multiline ? 100 : 49,
        },
        style,
      ]}
    >
      <TextInput
        style={[
          styles.textInput,
          {
            color: Colors[theme].textBold,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={Colors[theme].textLight}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },
});

export default SimpleInput;