import { Colors } from '@/constants';
import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface VideoProgressBarProps {
  progress: number; // 0 to 1
  bufferProgress: number; // 0 to 1
  duration: number; // Total duration in seconds
  width: number;
  isVisible?: boolean;
}

export const VideoProgressBar = memo<VideoProgressBarProps>(({
  progress,
  bufferProgress,
  duration,
  width,
  isVisible = true,
}) => {
  // Debug logging
  // useEffect(() => {
  //   console.log('📊 PROGRESS_BAR: Props update:', {
  //     progress: progress.toFixed(3),
  //     bufferProgress: bufferProgress.toFixed(3),
  //     duration: duration.toFixed(1),
  //     width,
  //     isVisible
  //   });
  // }, [progress, bufferProgress, duration, width, isVisible]);

  const progressValue = useSharedValue(0);
  const bufferValue = useSharedValue(0);
  const opacityValue = useSharedValue(isVisible ? 1 : 0);

  // Update progress values with smooth animations
  useEffect(() => {
    progressValue.value = withSpring(progress, {
      damping: 25,
      stiffness: 120,
    });
  }, [progress]);

  useEffect(() => {
    bufferValue.value = withSpring(bufferProgress, {
      damping: 18,
      stiffness: 90,
    });
  }, [bufferProgress]);

  useEffect(() => {
    opacityValue.value = withSpring(isVisible ? 1 : 0, {
      damping: 20,
      stiffness: 100,
    });
  }, [isVisible]);

  // Animated styles for progress bar
  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(
        progressValue.value,
        [0, 1],
        [0, width],
        Extrapolate.CLAMP
      ),
    };
  });

  // Animated styles for buffer bar
  const bufferBarStyle = useAnimatedStyle(() => {
    return {
      width: interpolate(
        bufferValue.value,
        [0, 1],
        [0, width],
        Extrapolate.CLAMP
      ),
    };
  });

  // Animated styles for container
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityValue.value,
    };
  });

  return (
    <Animated.View style={[styles.container, { width }, containerStyle]}>
      {/* Buffer progress */}
      <Animated.View style={[styles.bufferBar, bufferBarStyle]} />
      
      {/* Playback progress*/}
      <Animated.View style={[styles.progressBar, progressBarStyle]} />
    </Animated.View>
  );
});

VideoProgressBar.displayName = 'VideoProgressBar';

const styles = StyleSheet.create({
  container: {
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 20,
    borderRadius: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 3,
  },
  bufferBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 1.5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.general.primary,
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 1.5,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 4,
  },
});

export default VideoProgressBar;