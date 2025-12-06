import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SafeAreaView from 'react-native-safe-area-view';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VideoPlayerSkeleton = () => {
  const { theme } = useCustomTheme();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerValue.value, [0, 1], [0.3, 0.7]);
    return { opacity };
  });

  const SkeletonBox = ({ width, height, style = {} }: { width: number | string; height: number; style?: any }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: Colors[theme].textLight,
          borderRadius: 8,
        },
        shimmerStyle,
        style,
      ]}
    />
  );

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={Colors[theme].background}
        style={theme === 'dark' ? 'light' : 'dark'}
      />
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: Colors[theme].background }]}
      >
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
          
          {/* Video Player Area Skeleton */}
          <View style={styles.videoPlayerContainer}>
            <SkeletonBox 
              width={SCREEN_WIDTH} 
              height={200} 
              style={{ borderRadius: 0 }}
            />
          </View>

          {/* Content Container */}
          <View style={styles.contentContainer}>
            
            {/* Channel Info Skeleton */}
            <View style={styles.channelInfoContainer}>
              <View style={styles.channelRow}>
                {/* Avatar */}
                <SkeletonBox width={48} height={48} style={{ borderRadius: 24 }} />
                
                <View style={styles.channelTextContainer}>
                  {/* Channel name */}
                  <SkeletonBox width={120} height={16} style={{ marginBottom: 4 }} />
                  {/* Subscriber count */}
                  <SkeletonBox width={80} height={12} />
                </View>
                
                {/* Subscribe button */}
                <SkeletonBox width={80} height={32} style={{ borderRadius: 16 }} />
              </View>
            </View>

            {/* Video Info Skeleton */}
            <View style={styles.videoInfoContainer}>
              {/* Description lines */}
              <SkeletonBox width="90%" height={14} style={{ marginBottom: 6 }} />
              <SkeletonBox width="75%" height={14} style={{ marginBottom: 6 }} />
              <SkeletonBox width="60%" height={14} style={{ marginBottom: 8 }} />
              {/* Date */}
              <SkeletonBox width={100} height={12} />
            </View>

            {/* Video Interactions Skeleton */}
            <View style={styles.interactionsContainer}>
              <View style={styles.interactionRow}>
                {/* Like button */}
                <View style={styles.interactionItem}>
                  <SkeletonBox width={24} height={24} style={{ borderRadius: 12, marginBottom: 4 }} />
                  <SkeletonBox width={30} height={12} />
                </View>
                
                {/* Comment button */}
                <View style={styles.interactionItem}>
                  <SkeletonBox width={24} height={24} style={{ borderRadius: 12, marginBottom: 4 }} />
                  <SkeletonBox width={25} height={12} />
                </View>
                
                {/* Share button */}
                <View style={styles.interactionItem}>
                  <SkeletonBox width={24} height={24} style={{ borderRadius: 12, marginBottom: 4 }} />
                  <SkeletonBox width={35} height={12} />
                </View>
                
                {/* Views */}
                <View style={styles.interactionItem}>
                  <SkeletonBox width={24} height={24} style={{ borderRadius: 12, marginBottom: 4 }} />
                  <SkeletonBox width={40} height={12} />
                </View>
              </View>
            </View>

            {/* Comment Preview Skeleton */}
            <View style={styles.commentPreviewContainer}>
              <View style={styles.commentHeader}>
                <SkeletonBox width={80} height={16} style={{ marginBottom: 8 }} />
              </View>
              
              {/* Comment items */}
              {[1, 2].map((index) => (
                <View key={index} style={styles.commentItem}>
                  <SkeletonBox width={32} height={32} style={{ borderRadius: 16 }} />
                  <View style={styles.commentContent}>
                    <SkeletonBox width={100} height={12} style={{ marginBottom: 4 }} />
                    <SkeletonBox width="85%" height={12} style={{ marginBottom: 2 }} />
                    <SkeletonBox width="60%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  channelInfoContainer: {
    marginBottom: 16,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  videoInfoContainer: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  interactionsContainer: {
    marginBottom: 16,
    paddingVertical: 12,
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  interactionItem: {
    alignItems: 'center',
  },
  commentPreviewContainer: {
    marginBottom: 16,
  },
  commentHeader: {
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default VideoPlayerSkeleton;