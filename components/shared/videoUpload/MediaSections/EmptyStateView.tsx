import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import RemixIcon from 'react-native-remix-icon';

interface EmptyStateViewProps {
  uploadMode: "video" | "photo" | "document" | "audio";
  selectedAlbumTitle?: string;
  showCameraButton?: boolean;
  onCameraPress?: () => void;
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  uploadMode,
  selectedAlbumTitle = "this album",
  showCameraButton = true,
  onCameraPress,
}) => {
  const { theme } = useCustomTheme();

  const getMediaTypeName = () => {
    switch (uploadMode) {
      case "video":
        return "videos";
      case "audio":
        return "audio files";
      case "photo":
      case "document":
      default:
        return "photos";
    }
  };

  return (
    <View style={styles.emptyState}>
      <RemixIcon name="inbox-line" size={48} color={Colors[theme].text} />
      <Typography
        size={16}
        weight="500"
        textType="text"
        style={{ marginTop: 8 }}
      >
        No {getMediaTypeName()} found in {selectedAlbumTitle}
      </Typography>
      {showCameraButton && onCameraPress && (
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={onCameraPress}
        >
          <RemixIcon name="camera-line" size={24} color="#FFFFFF" />
          <Typography
            size={16}
            weight="600"
            style={{ color: "#FFFFFF", marginLeft: 8 }}
          >
            Open Camera
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.general.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 16,
  },
});