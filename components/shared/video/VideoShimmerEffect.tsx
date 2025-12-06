import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface VideoShimmerEffectProps {
  width: number;
  height: number;
  isVisible?: boolean;
}

export const VideoShimmerEffect = memo<VideoShimmerEffectProps>(({
  width,
  height,
  isVisible = true,
}) => {
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 1200 }), // Faster shimmer
        -1,
        false
      );
    } else {
      shimmerPosition.value = 0;
    }
  }, [isVisible]);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [0, 1],
      [-width, width],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: isVisible ? 1 : 0,
    };
  });

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { width, height }, containerStyle]}>
      {/* Base background */}
      <View style={[styles.background, { width, height }]} />
      
      {/* Animated shimmer overlay */}
      <Animated.View style={[styles.shimmer, { width, height }, shimmerStyle]} />
      
      {/* Loading dots indicator */}
      {/* <View style={styles.dotsContainer}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View> */}
    </Animated.View>
  );
});

VideoShimmerEffect.displayName = 'VideoShimmerEffect';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  shimmer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  dot1: {
    animationDelay: '0ms',
  },
  dot2: {
    animationDelay: '150ms',
  },
  dot3: {
    animationDelay: '300ms',
  },
});

export default VideoShimmerEffect;