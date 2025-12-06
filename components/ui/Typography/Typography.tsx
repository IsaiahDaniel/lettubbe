import { StyleProp, Text, TextStyle } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import {
  Roboto_100Thin,
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';

type TypographyProps = {
  children: any;
  weight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  color?: string;
  size?: number;
  align?: "center" | "justify" | "right" | "left";
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  textType?: "text" | "textBold" | "carter" | "secondary";
  lineHeight?: number;
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
  onTextLayout?: (event: any) => void;
};

const Typography = ({ children, color, weight = "400", size = 14, align, numberOfLines, style, textType = "text", lineHeight, ellipsizeMode, onTextLayout }: TypographyProps) => {
	// Access the current theme from Redux
	const { theme } = useCustomTheme();

  // Determine the text color based on the theme and provided color
  const themeColor = color ? color : 
    (textType === "text" || textType === "textBold" || textType === "secondary") 
      ? Colors[theme][textType] 
      : Colors[theme].text;

  // Function to get the font family
  const getFontFamily = (weight: TypographyProps["weight"], textType: TypographyProps["textType"]) => {
    // If textType is carter, always return Carter One
    if (textType === "carter") {
      return "CarterOne-Regular";
    }

    // Use Roboto with appropriate weight
    switch (weight) {
      case "100":
        return "Roboto_100Thin";
      case "200":
      case "300":
        return "Roboto_300Light";
      case "400":
      case "normal":
        return "Roboto_400Regular";
      case "500":
        return "Roboto_500Medium";
      case "600":
      case "700":
      case "bold":
        return "Roboto_700Bold";
      case "800":
      case "900":
        return "Roboto_900Black";
      default:
        return "Roboto_400Regular";
    }
  };

  return (
    <Text
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      onTextLayout={onTextLayout}
      style={[
        {
          color: themeColor,
          fontWeight: textType === "carter" ? "normal" : weight,
          fontSize: size,
          textAlign: align,
          fontFamily: getFontFamily(weight, textType),
          lineHeight: lineHeight,
        },
        style,
      ]}>
      {children}
    </Text>
  );
};

export default Typography;