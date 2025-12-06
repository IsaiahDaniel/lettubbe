import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";

const ExploreCardSkeleton: React.FC = () => {
  const { theme } = useCustomTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createShimmerAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
    };

    const animation = createShimmerAnimation();
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const shimmerStyle = {
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  const SkeletonBox: React.FC<{ width: number | string; height: number; style?: any }> = ({ width, height, style }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: Colors[theme].textLight,
          borderRadius: 4,
        },
        shimmerStyle,
        style,
      ]}
    />
  );

  return (
    <View>
      <View style={styles.container}>
        {/* Thumbnail Skeleton */}
        <View style={styles.thumbnail}>
          <SkeletonBox width={140} height={94} style={styles.thumbnailSkeleton} />
          {/* Duration Badge Skeleton */}
          {/* <View style={styles.durationBadge}>
            <SkeletonBox width={30} height={12} />
          </View> */}
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <View style={styles.infoContainer}>
            {/* Username Skeleton */}
            <SkeletonBox width="70%" height={16} style={styles.usernameSkeleton} />
            
            {/* Description Skeleton - 2 lines */}
            <SkeletonBox width="100%" height={14} style={styles.descriptionLine1} />
            <SkeletonBox width="80%" height={14} style={styles.descriptionLine2} />

            {/* Stats Container Skeleton */}
            <View style={styles.statsContainer}>
              <SkeletonBox width={40} height={14} />
              <SkeletonBox width={30} height={14} />
              <SkeletonBox width={35} height={14} />
              <SkeletonBox width={50} height={14} />
            </View>
          </View>
        </View>
      </View>
      
      {/* Separator Line */}
      <View style={[styles.separator, { backgroundColor: Colors[theme].cardBackground }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    paddingVertical: 12,
  },
  thumbnail: {
    width: 140,
    height: 94,
    position: "relative",
  },
  thumbnailSkeleton: {
    borderRadius: 12,
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    paddingLeft: 12,
  },
  infoContainer: {
    flex: 1,
  },
  usernameSkeleton: {
    marginTop: 4,
    marginBottom: 8,
  },
  descriptionLine1: {
    marginBottom: 4,
  },
  descriptionLine2: {
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
});

export default ExploreCardSkeleton;