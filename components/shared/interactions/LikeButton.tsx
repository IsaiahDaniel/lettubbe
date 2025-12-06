import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import Typography from '@/components/ui/Typography/Typography';
import { useInteractionStore } from '@/hooks/interactions/useInteractionStore';
import { formatNumber } from '@/helpers/utils/formatting';

interface LikeButtonProps {
  postId: string;
  likeCount: number;
  textColor: string;
  activeColor?: string;
  size?: number;
  showCount?: boolean;
  galleryRefetch?: () => Promise<any>;
}

// Animated TouchableOpacity
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heartContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingHeart: {
    position: 'absolute',
    zIndex: 10,
  },
});

export const LikeButton = memo(({
  postId,
  likeCount: initialLikeCount,
  textColor,
  activeColor = '#ff0066',
  size = 26,
  showCount = true,
  galleryRefetch,
}: LikeButtonProps) => {
  // Track state from the store
  const isLiked = useInteractionStore(state => state.isPostLiked(postId));
  const toggleLikePost = useInteractionStore(state => state.toggleLikePost);

  // Local state to handle optimistic updates
  const [localLikeCount, setLocalLikeCount] = useState(initialLikeCount);

  // Animation values
  const heartScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const floatingHeart1Opacity = useSharedValue(0);
  const floatingHeart1TranslateY = useSharedValue(0);
  const floatingHeart1Scale = useSharedValue(0.8);
  const floatingHeart2Opacity = useSharedValue(0);
  const floatingHeart2TranslateY = useSharedValue(0);
  const floatingHeart2Scale = useSharedValue(0.6);

  // Update local state when props change
  useEffect(() => {
    setLocalLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  // Animation functions
  const triggerLikeAnimation = useCallback(() => {
    // Button scale animation
    buttonScale.value = withSequence(
      withSpring(0.8, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // Heart scale animation
    heartScale.value = withSequence(
      withSpring(0.8, { damping: 15, stiffness: 300 }),
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 150 })
    );

    // Only show floating hearts when liking (not unliking)
    if (!isLiked) {
      // Reset floating hearts
      floatingHeart1Opacity.value = 0;
      floatingHeart1TranslateY.value = 0;
      floatingHeart1Scale.value = 0.8;
      floatingHeart2Opacity.value = 0;
      floatingHeart2TranslateY.value = 0;
      floatingHeart2Scale.value = 0.6;

      // Animate floating hearts
      setTimeout(() => {
        // First floating heart
        floatingHeart1Opacity.value = withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 800 })
        );
        floatingHeart1TranslateY.value = withTiming(-30, { duration: 1000 });
        floatingHeart1Scale.value = withTiming(1, { duration: 500 });

        // Second floating heart (slight delay)
        setTimeout(() => {
          floatingHeart2Opacity.value = withSequence(
            withTiming(0.8, { duration: 200 }),
            withTiming(0, { duration: 800 })
          );
          floatingHeart2TranslateY.value = withTiming(-25, { duration: 1000 });
          floatingHeart2Scale.value = withTiming(1, { duration: 500 });
        }, 100);
      }, 100);
    }
  }, [isLiked, buttonScale, heartScale, floatingHeart1Opacity, floatingHeart1TranslateY, floatingHeart1Scale, floatingHeart2Opacity, floatingHeart2TranslateY, floatingHeart2Scale]);

  const handleLikePress = useCallback(async () => {
    try {
      // Debug log to check ID mismatch
      // console.log('LikeButton postId:', postId, 'isLiked:', isLiked);
      
      // Trigger animations immediately for responsiveness
      triggerLikeAnimation();
      
      // Update local state optimistically
      setLocalLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
      
      // Make API call via the store
      await toggleLikePost(postId, initialLikeCount);
      
      // Refetch data if provided
      if (galleryRefetch) {
        await galleryRefetch();
      }
    } catch (error) {
      // Revert on error
      setLocalLikeCount(initialLikeCount);
      console.error("Error liking post:", error);
    }
  }, [postId, isLiked, initialLikeCount, toggleLikePost, galleryRefetch, triggerLikeAnimation]);

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const floatingHeart1Style = useAnimatedStyle(() => ({
    opacity: floatingHeart1Opacity.value,
    transform: [
      { translateY: floatingHeart1TranslateY.value },
      { scale: floatingHeart1Scale.value },
      { translateX: -8 },
    ],
  }));

  const floatingHeart2Style = useAnimatedStyle(() => ({
    opacity: floatingHeart2Opacity.value,
    transform: [
      { translateY: floatingHeart2TranslateY.value },
      { scale: floatingHeart2Scale.value },
      { translateX: 8 },
    ],
  }));
  
  return (
    <AnimatedTouchableOpacity 
      style={[styles.button, buttonAnimatedStyle]} 
      onPress={handleLikePress}
      testID="like-button"
      activeOpacity={0.9}
    >
      <View style={styles.heartContainer}>
        {/* Main heart icon */}
        <Animated.View style={heartAnimatedStyle}>
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={size} 
            color={isLiked ? activeColor : textColor} 
          />
        </Animated.View>

        {/* Floating hearts */}
        <Animated.View style={[styles.floatingHeart, floatingHeart1Style]}>
          <Ionicons 
            name="heart" 
            size={size * 0.7} 
            color={activeColor} 
          />
        </Animated.View>
        
        <Animated.View style={[styles.floatingHeart, floatingHeart2Style]}>
          <Ionicons 
            name="heart" 
            size={size * 0.5} 
            color={activeColor} 
          />
        </Animated.View>
      </View>

      {showCount && localLikeCount > 0 && (
        <Typography
          weight="500"
          color={isLiked ? activeColor : textColor}
          textType="text"
        >
          {formatNumber(localLikeCount)}
        </Typography>
      )}
    </AnimatedTouchableOpacity>
  );
});