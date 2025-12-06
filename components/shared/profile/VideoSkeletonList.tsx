import React from "react";
import { View, StyleSheet } from "react-native";
import VideoCardSkeleton from "../home/VideoCardSkeleton";

interface VideoSkeletonListProps {
  count?: number;
}

const VideoSkeletonList: React.FC<VideoSkeletonListProps> = ({ count = 3 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <VideoCardSkeleton key={`video-skeleton-${index}`} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
});

export default VideoSkeletonList;