import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
import { Colors } from '@/constants';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onReply: () => void;
  isCurrentUser: boolean;
  onLongPress?: (event: any) => void;
  disabled?: boolean;
}

// Safety wrapper to prevent bridge errors
const SafeSwipeableMessage: React.FC<SwipeableMessageProps> = (props) => {
  try {
    return <SwipeableMessageComponent {...props} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    console.error('SwipeableMessage bridge error caught:', error);
    
    // Handle specific long press / bridge errors
    if (errorMessage.includes('measureInWindow') || 
        errorMessage.includes('Malformed calls') || 
        errorMessage.includes('HostFunction')) {
      console.warn('Long press measurement error, using fallback');
    }
    
    return (
      <View style={styles.fallbackContainer}>
        {props.children}
      </View>
    );
  }
};

const SwipeableMessageComponent: React.FC<SwipeableMessageProps> = ({
  children,
  onReply,
  isCurrentUser,
  onLongPress,
  disabled = false,
}) => {
  const { theme } = useCustomTheme();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const hasTriggeredReply = useSharedValue(false);
  const containerRef = useRef<View>(null);

  // Cleanup shared values on component unmount
  useEffect(() => {
    return () => {
      // Cancel any pending animations instead of setting values directly
      'worklet';
    };
  }, []);

  const SWIPE_THRESHOLD = 45;
  const MAX_TRANSLATE = 80;

  // Create functions that can be called from the UI thread
  const triggerHaptics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerReply = () => {
    onReply();
  };

  const triggerLongPress = (event: any) => {
    if (!onLongPress) return;
    
    if (containerRef.current) {
      try {
        // Add safety checks before measuring
        const container = containerRef.current;
        if (container && typeof container.measureInWindow === 'function') {
          let timeoutId: NodeJS.Timeout | null = null;
          let hasResponded = false;
          
          // Set a timeout for the measurement to prevent hanging
          timeoutId = setTimeout(() => {
            if (!hasResponded) {
              hasResponded = true;
              console.warn('SwipeableMessage measureInWindow timeout, using fallback');
              onLongPress(event);
            }
          }, 500); // 500ms timeout
          
          container.measureInWindow((x, y, width, height) => {
            if (hasResponded) return; // Ignore if already timed out
            hasResponded = true;
            
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            
            // Validate measurement values to prevent bridge errors
            const safeX = Number.isFinite(x) ? Math.max(0, x) : 0;
            const safeY = Number.isFinite(y) ? Math.max(0, y) : 0;
            const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 100;
            const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 50;
            
            const enhancedEvent = {
              ...event,
              messagePosition: { 
                x: safeX, 
                y: safeY, 
                width: safeWidth, 
                height: safeHeight 
              }
            };
            onLongPress(enhancedEvent);
          });
        } else {
          // Fallback without position measurement
          onLongPress(event);
        }
      } catch (error) {
        console.warn('SwipeableMessage measureInWindow error:', error);
        // Fallback without position measurement
        onLongPress(event);
      }
    } else {
      // Fallback without position measurement
      onLongPress(event);
    }
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart((event) => {
      if (disabled || !onLongPress) return;
      
      // Add safety check to prevent bridge errors
      try {
        console.log('🔍 SwipeableMessage long press detected');
        runOnJS(triggerLongPress)(event);
      } catch (error) {
        console.warn('SwipeableMessage long press gesture error:', error);
      }
    });

  // Very conservative pan gesture that only activates on clear horizontal swipes
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
      if (isCurrentUser && event.translationX < -40) {
        currentTranslate = Math.abs(event.translationX);
      } else if (!isCurrentUser && event.translationX > 40) {
        currentTranslate = event.translationX;
      }
      
      if (currentTranslate > 40) {
        const safeTranslateValue = Math.min(currentTranslate - 40, MAX_TRANSLATE);
        translateX.value = Number.isFinite(safeTranslateValue) ? safeTranslateValue : 0;
        
        const thresholdRange = Math.max(SWIPE_THRESHOLD - 40, 1);
        const interpolatedOpacity = interpolate(
          translateX.value,
          [0, thresholdRange],
          [0, 1],
          Extrapolate.CLAMP
        );
        opacity.value = Number.isFinite(interpolatedOpacity) ? interpolatedOpacity : 0;
        
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
    .activeOffsetX(isCurrentUser ? [-60, 60] : [-60, 60])
    .failOffsetY([-20, 20])
    .minDistance(50)
    .shouldCancelWhenOutside(true);

  // Use Simultaneous with proper pan gesture settings to avoid scroll conflicts
  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const messageAnimatedStyle = useAnimatedStyle(() => {
    const direction = isCurrentUser ? -1 : 1;
    const translateValue = translateX.value * direction;
    
    // Ensure value is finite and within safe bounds
    const safeTranslateValue = Number.isFinite(translateValue) ? 
      Math.max(-200, Math.min(200, translateValue)) : 0;
      
    return {
      transform: [
        {
          translateX: safeTranslateValue,
        },
      ],
    };
  });

  const replyIconAnimatedStyle = useAnimatedStyle(() => {
    const opacityValue = Number.isFinite(opacity.value) ? 
      Math.max(0, Math.min(1, opacity.value)) : 0;
      
    const scaleValue = interpolate(
      opacityValue,
      [0, 1],
      [0.3, 1],
      Extrapolate.CLAMP
    );
    
    const safeScaleValue = Number.isFinite(scaleValue) ? 
      Math.max(0.1, Math.min(3, scaleValue)) : 1;
      
    return {
      opacity: opacityValue,
      transform: [
        {
          scale: safeScaleValue,
        },
      ],
    };
  });

  return (
    <View ref={containerRef} style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.messageContainer, messageAnimatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
      
      {/* Reply Icon */}
      <Animated.View
        style={[
          styles.replyIconContainer,
          {
            [isCurrentUser ? 'right' : 'left']: 20,
          },
          replyIconAnimatedStyle,
        ]}
        pointerEvents="none"
      >
        <Ionicons
          name="arrow-undo"
          size={20}
          color={Colors[theme]?.text || '#000'}
          suppressHighlighting={true}
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
  fallbackContainer: {
    position: 'relative',
  },
});

export default SafeSwipeableMessage;