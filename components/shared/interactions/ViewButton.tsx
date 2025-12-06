import React, { memo } from "react";
import { TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { Icons } from "@/constants";
import { formatNumber } from "@/helpers/utils/formatting";

interface ViewButtonProps {
  viewsCount: number | string;
  textColor: string;
  onPress?: () => void;
  disabled?: boolean;
  iconSize?: number;
  isPhotoPost?: boolean;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  icon: {
    width: 27,
    height: 27,
    tintColor: undefined, // Will be set dynamically
  },
});

export const ViewButton = memo(
  ({
    viewsCount,
    textColor,
    onPress,
    disabled = false,
    iconSize = 26,
    isPhotoPost = false,
  }: ViewButtonProps) => {
    // Convert to number for comparison
    const numericCount = typeof viewsCount === 'string' 
      ? parseInt(viewsCount, 10) || 0 
      : viewsCount || 0;
    
    // Don't render if count is 0
    if (numericCount === 0) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        disabled={disabled}
        testID="view-button"
      >
        <Image 
          source={isPhotoPost ? Icons.poll : Icons.playOutline} 
          style={[
            styles.icon, 
            { 
              width: iconSize, 
              height: iconSize, 
              tintColor: textColor 
            }
          ]} 
          resizeMode="contain"
        />
        <Typography weight="500" color={textColor} style={{marginTop: 1}}>
          {formatNumber(numericCount)}
        </Typography>
      </TouchableOpacity>
    );
  }
);