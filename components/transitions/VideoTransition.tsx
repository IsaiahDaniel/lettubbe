import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

interface VideoTransitionProps {
  isVisible: boolean;
  onTransitionComplete?: () => void;
  startPosition?: { x: number; y: number; width: number; height: number };
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VideoTransition: React.FC<VideoTransitionProps> = ({
  isVisible,
  onTransitionComplete,
  startPosition,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.1)).current;
  const positionXAnim = useRef(new Animated.Value(startPosition?.x || 0)).current;
  const positionYAnim = useRef(new Animated.Value(startPosition?.y || 0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Animate from thumbnail position to fullscreen
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(positionXAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(positionYAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onTransitionComplete?.();
      });
    } else {
      // Animate back to thumbnail position
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(positionXAnim, {
          toValue: startPosition?.x || 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(positionYAnim, {
          toValue: startPosition?.y || 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onTransitionComplete?.();
      });
    }
  }, [isVisible, startPosition]);

  const animatedStyle = {
    transform: [
      { translateX: positionXAnim },
      { translateY: positionYAnim },
      { scale: scaleAnim },
    ],
    opacity: opacityAnim,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoTransition;