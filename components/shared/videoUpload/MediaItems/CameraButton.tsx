import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Feather } from '@expo/vector-icons';

interface CameraButtonProps {
  uploadMode: "video" | "photo" | "document" | "audio";
  onPress: () => void;
}

export const CameraButton: React.FC<CameraButtonProps> = ({
  uploadMode,
  onPress,
}) => {
  const { theme } = useCustomTheme();

  return (
    <TouchableOpacity
      style={[
        styles.cameraButton,
        { backgroundColor: Colors[theme].cardBackground },
      ]}
      onPress={onPress}
    >
      <View style={styles.cameraButtonContent}>
        <TouchableOpacity>
          <Feather
            name={uploadMode === "video" || uploadMode === "audio" ? "video" : "camera"}
            size={40}
            color={Colors[theme].textBold}
          />
        </TouchableOpacity>
        <Typography size={14} weight="600" style={{ marginTop: 2 }}>
          Camera
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cameraButton: {
    flex: 0.975,
    aspectRatio: 0.49,
    margin: "0.45%",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cameraButtonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});