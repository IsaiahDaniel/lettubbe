import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PhotoViewerSkeleton = () => {
  const insets = useSafeAreaInsets();
  const shimmerValue = useSharedValue(0);
  const { theme } = useCustomTheme();

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  // Handle status bar with useFocusEffect for proper restoration
  useFocusEffect(
    React.useCallback(() => {
      console.log('📸 PHOTO_SKELETON: Screen focused - status bar should be visible and light');
      
      return () => {
        console.log('📸 PHOTO_SKELETON: Screen unfocused - status bar should be restored');
      };
    }, [])
  );

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 1], [0.2, 0.4]);
    return { opacity };
  });

  const SkeletonBox = ({ width, height, style = {} }: { width: number | string; height: number; style?: any }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: Colors.light.cardBackground,
        },
        shimmerStyle,
        style,
      ]}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" hidden={false} />
      <GestureHandlerRootView style={styles.container}>
        
        {/* Black background */}
        <View style={styles.overlay} />

        {/* Header with user info */}
        <View style={[styles.userDetailsHeader, { paddingTop: insets.top + 10 }]}>
          {/* Close button */}
          <View style={styles.closeButton}>
            <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
          </View>
          
          <View style={styles.userInfoContainer}>
            <View style={styles.userDetailsRow}>
              {/* Avatar */}
              <SkeletonBox width={40} height={40} style={{ borderRadius: 20 }} />
              
              <View style={styles.userTextInfo}>
                {/* User name */}
                <SkeletonBox width={120} height={14} style={{ marginBottom: 4 }} />
                {/* Subscriber count */}
                <SkeletonBox width={80} height={12} />
              </View>
              
              {/* Subscribe button */}
              <SkeletonBox width={80} height={32} style={{ borderRadius: 16 }} />
            </View>
          </View>
        </View>

        {/* Main Photo Area */}
        <View style={styles.photoContainer}>
          <SkeletonBox 
            width={SCREEN_WIDTH} 
            height={SCREEN_WIDTH + 80}
          />
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  userDetailsHeader: {
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  userInfoContainer: {
    flex: 1,
  },
  userDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextInfo: {
    flex: 1,
    marginLeft: 12,
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PhotoViewerSkeleton;