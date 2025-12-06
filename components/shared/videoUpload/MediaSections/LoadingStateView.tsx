import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';

interface LoadingStateViewProps {
  uploadMode: "video" | "photo" | "document" | "audio";
}

export const LoadingStateView: React.FC<LoadingStateViewProps> = ({
  uploadMode,
}) => {
  const getLoadingText = () => {
    switch (uploadMode) {
      case "video":
        return "Loading videos...";
      case "audio":
        return "Loading audio files...";
      case "photo":
      case "document":
      default:
        return "Loading photos...";
    }
  };

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.general.primary} />
      <Typography size={14} weight="500" style={{ marginTop: 8 }}>
        {getLoadingText()}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
});