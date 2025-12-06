import React from "react";
import { View, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";

interface VideoSearchEmptyStateProps {
  message: string;
}

const VideoSearchEmptyState: React.FC<VideoSearchEmptyStateProps> = ({ message }) => {
  return (
    <View style={styles.emptyState}>
      <Typography size={16} weight="500" style={{ textAlign: 'center' }}>
        {message}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
});

export default VideoSearchEmptyState;