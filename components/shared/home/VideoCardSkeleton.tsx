import React from "react";
import { View, StyleSheet, useColorScheme, StyleProp, ViewStyle, Dimensions } from "react-native";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";

interface SkeletonBoxProps {
  style: StyleProp<ViewStyle>;
}

const VideoCardSkeleton: React.FC = () => {
  const isDark = useColorScheme() === "dark";
  
  // Base colors for light/dark mode
  const backgroundColor = isDark ? "#1A1F2B" : "#E1E9EE";
  const highlightColor = isDark ? "#3e3e3e" : "#F2F8FC";
  
  const SkeletonBox = ({ style }: SkeletonBoxProps) => (
    <MotiView
      style={[style, { backgroundColor }]}
      from={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{
        loop: true,
        type: 'timing',
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      }}
    />
  );

  return (
    <View style={styles.videoContainer}>
      <SkeletonBox style={styles.thumbnail} />
      <View style={styles.authorRow}>
        <SkeletonBox style={styles.avatar} />
        <SkeletonBox style={styles.username} />
      </View>
    </View>
  );
};

// Calculate 16:9 aspect ratio height based on screen width
const screenWidth = Dimensions.get('window').width;
const thumbnailHeight = screenWidth * (9 / 16);

const styles = StyleSheet.create({
  videoContainer: {
    marginTop: 10,
  },
  thumbnail: {
    width: "100%",
    height: thumbnailHeight,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  username: {
    width: 100,
    height: 12,
    borderRadius: 4,
    marginLeft: 10,
  },  
});

export default VideoCardSkeleton;