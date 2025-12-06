import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  backgroundColor?: string;
  progressColor?: string;
  showUploadIcon?: boolean;
  iconColor?: string;
  immediate?: boolean; // If true, skip animation for real-time updates
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 60,
  strokeWidth = 4,
  progress,
  backgroundColor,
  progressColor,
  showUploadIcon = true,
  iconColor,
  immediate = false,
}) => {
  const { theme } = useCustomTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const previousProgress = useRef(0);
  
  // Use the progress prop directly
  const effectiveProgress = progress;
  
  useEffect(() => {
    // Only update if the value actually changed
    if (previousProgress.current !== effectiveProgress) {
      if (immediate) {
        // For immediate mode, update instantly
        animatedProgress.setValue(effectiveProgress);
        previousProgress.current = effectiveProgress;
      } else {
        // For general UI use, animate smoothly
        Animated.timing(animatedProgress, {
          toValue: effectiveProgress,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          previousProgress.current = effectiveProgress;
        });
      }
    }
  }, [effectiveProgress, animatedProgress, immediate]);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  
  const center = size / 2;
  
  const defaultBackgroundColor = backgroundColor || Colors[theme].sheetBackground;
  const defaultProgressColor = progressColor || Colors.general.primary;
  const defaultIconColor = iconColor || Colors[theme].textBold;

  // Create animated stroke dash offset
  const animatedStrokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={defaultBackgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated progress circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={defaultProgressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={animatedStrokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {showUploadIcon && (
        <View style={styles.iconContainer}>
          <Ionicons
            name="arrow-up"
            size={size * 0.35}
            color={defaultIconColor}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CircularProgress;