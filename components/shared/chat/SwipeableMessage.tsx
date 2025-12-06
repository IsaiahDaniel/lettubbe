import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeToReply: () => void;
  isOwnMessage: boolean;
  disabled?: boolean;
  onLongPress?: (event: any) => void;
}

const SwipeableMessage: React.FC<SwipeableMessageProps> = ({
  children,
  onSwipeToReply,
  isOwnMessage,
  disabled = false,
  onLongPress,
}) => {
  const { theme } = useCustomTheme();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const hasTriggeredReply = useSharedValue(false);

  // Cleanup shared values on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Reset shared values to prevent memory leaks
      translateX.value = 0;
      opacity.value = 0;
      hasTriggeredReply.value = false;
    };
  }, [translateX, opacity, hasTriggeredReply]);

  const SWIPE_THRESHOLD = 45;
  const MAX_TRANSLATE = 80;

  // Create functions that can be called from the UI thread
  const triggerHaptics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerReply = () => {
    onSwipeToReply();
  };

  const triggerLongPress = (event: any) => {
    if (onLongPress) {
      onLongPress(event);
    }
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart((event) => {
      if (disabled) return;
      console.log('🔍 SwipeableMessage long press detected');
      runOnJS(triggerLongPress)(event);
    });


  // very conservative pan gesture that only activates on clear horizontal swipes
  const panGesture = Gesture.Pan()
    .enableTrackpadTwoFingerGesture(false)
    .onStart(() => {
      hasTriggeredReply.value = false;
    })
    .onUpdate((event) => {
      if (disabled) return;
      
      // Only activate on very clear horizontal swipes
      const horizontalDistance = Math.abs(event.translationX);
      const verticalDistance = Math.abs(event.translationY);
      
      // Must be at least 3x more horizontal movement than vertical AND at least 40px horizontal
      const isDefinitelyHorizontalSwipe = horizontalDistance > verticalDistance * 3 && horizontalDistance > 40;
      
      if (!isDefinitelyHorizontalSwipe) return;
      
      let currentTranslate = 0;
      
      // Only allow swipe in correct direction with higher threshold
      if (isOwnMessage && event.translationX < -40) {
        currentTranslate = Math.abs(event.translationX);
      } else if (!isOwnMessage && event.translationX > 40) {
        currentTranslate = event.translationX;
      }
      
      if (currentTranslate > 40) {
        translateX.value = Math.min(currentTranslate - 40, MAX_TRANSLATE);
        
        opacity.value = interpolate(
          translateX.value,
          [0, SWIPE_THRESHOLD - 40],
          [0, 1],
          Extrapolate.CLAMP
        );
        
        if (currentTranslate >= SWIPE_THRESHOLD && !hasTriggeredReply.value) {
          hasTriggeredReply.value = true;
          runOnJS(triggerHaptics)();
          runOnJS(triggerReply)();
        }
      }
    })
    .onEnd(() => {
      if (disabled) return;
      
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
      opacity.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
    })
    .activeOffsetX(isOwnMessage ? [-60, 60] : [-60, 60])
    .failOffsetY([-20, 20])
    .minDistance(50)
    .shouldCancelWhenOutside(true);

  // Use Simultaneous with proper pan gesture settings to avoid scroll conflicts
  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const messageAnimatedStyle = useAnimatedStyle(() => {
    const direction = isOwnMessage ? -1 : 1;
    return {
      transform: [
        {
          translateX: translateX.value * direction,
        },
      ],
    };
  });

  const replyIconAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {
          scale: interpolate(
            opacity.value,
            [0, 1],
            [0.3, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector 
        gesture={composedGesture}
      >
        <Animated.View style={[styles.messageContainer, messageAnimatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
      
      {/* Reply Icon */}
      <Animated.View
        style={[
          styles.replyIconContainer,
          {
            [isOwnMessage ? 'right' : 'left']: 20,
          },
          replyIconAnimatedStyle,
        ]}
        pointerEvents="none"
      >
        <Ionicons
          name="arrow-undo"
          size={20}
          color={Colors[theme].text}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  messageContainer: {
    zIndex: 1,
  },
  replyIconContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
});

export default SwipeableMessage;