import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, ViewStyle, Image, ImageSourcePropType } from "react-native";
import { Colors } from "@/constants/Colors";
import Typography from "./Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface BtnProps {
  title: string;
  handlePress?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "compact" | "profile" | "kingschat";
  style?: ViewStyle;
  height?: number;
  icon?: ImageSourcePropType;
}

const AppButton = ({ title, handlePress, disabled, isLoading, variant = "primary", style, height = 50, icon }: BtnProps) => {
  const { theme } = useCustomTheme();
  let backgroundColor: string;
  let textColor: string;

  switch (variant) {
    case "primary":
      backgroundColor = disabled ? "#A5E5C6" : Colors.general.primary;
      textColor = disabled ? Colors.light.background : Colors.light.background;
      break;
    case "kingschat":
      backgroundColor = disabled ? "#A5E5C6" : Colors.general.blue;
      textColor = disabled ? Colors.light.background : Colors.light.background;
      break;
    case "secondary":
      backgroundColor = Colors[theme].cardBackground;
      textColor = theme === 'light' ? '#000000' : '#FFFFFF';
      break;
    case "danger":
      backgroundColor = disabled ? "#A5E5C6" : "#F97066";
      textColor = disabled ? Colors.light.background : Colors.light.background;
      break;
    case "compact":
      backgroundColor = disabled ? "#8105FC80" : Colors.general.primary;
      textColor = disabled ? Colors.light.background : Colors.light.background;
      break;
    case "profile":
      backgroundColor = disabled ? "#8105FC80" : Colors.general.primary;
      textColor = disabled ? Colors.light.background : Colors.light.background;
      break;
    default:
      backgroundColor = Colors.general.primary;
      textColor = Colors.light.background;
  }

  // Create base styles
  const baseStyles = {
    ...styles.buttonBackground,
    backgroundColor,
  };
  
  // Create final styles by merging with variant-specific styles
  let buttonStyles;
  if (variant === "compact") {
    buttonStyles = { ...baseStyles, ...styles.compactButton, height: 27, borderRadius: 12 };
  } else if (variant === "profile") {
    buttonStyles = { ...baseStyles, height: 32, borderRadius: 12 };
  } else {
    buttonStyles = { ...baseStyles, height };
  }
  return (
    <TouchableOpacity 
      onPress={handlePress} 
      disabled={disabled} 
      activeOpacity={0.6} 
      style={[buttonStyles, style]}
    >
      {icon && <Image source={icon} resizeMode="contain" style={{ width: 18, height: 18 }} />}
      {isLoading ? (
        <ActivityIndicator color={Colors.light.background} />
      ) : (
        <Typography size={14} weight="500" color={textColor}>
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBackground: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    width: "100%",
    marginHorizontal: "auto",
  },
  compactButton: {
    paddingHorizontal: 16,
    width: "auto",
  }
});

export default AppButton;