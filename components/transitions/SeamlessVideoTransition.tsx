import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { useVideoTransition } from '@/contexts/VideoTransitionContext';
import { router } from 'expo-router';

interface SeamlessVideoTransitionProps {
  children: React.ReactNode;
  isFullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
}

const { width: INITIAL_SCREEN_WIDTH, height: INITIAL_SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_VIDEO_HEIGHT = INITIAL_SCREEN_WIDTH * (9 / 16);

const SeamlessVideoTransition: React.FC<SeamlessVideoTransitionProps> = ({
  children,
  isFullscreen,
  onFullscreenChange,
}) => {
  const { thumbnailPosition, isTransitioning, endTransition } = useVideoTransition();
  
  // Track current screen dimensions
  const [screenDimensions, setScreenDimensions] = useState({
    width: INITIAL_SCREEN_WIDTH,
    height: INITIAL_SCREEN_HEIGHT,
  });

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Gesture state
  const gestureTranslateY = useRef(new Animated.Value(0)).current;
  const gestureOpacity = useRef(new Animated.Value(1)).current;

  const [isVisible, setIsVisible] = useState(true);
  
  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  // Initial entrance animation from thumbnail position
  useEffect(() => {
    console.log('SeamlessVideoTransition: thumbnailPosition:', thumbnailPosition, 'isTransitioning:', isTransitioning);
    console.log('SeamlessVideoTransition: Full position data:', JSON.stringify(thumbnailPosition, null, 2));

    // Always animate in, either from thumbnail position or with a simple fade
    if (isTransitioning) {
      if (thumbnailPosition) {
        // Validate thumbnail position values
        const isValidPosition = thumbnailPosition.x !== null &&
          thumbnailPosition.y !== null &&
          thumbnailPosition.width > 0 &&
          thumbnailPosition.height > 0 &&
          !isNaN(thumbnailPosition.x) &&
          !isNaN(thumbnailPosition.y) &&
          !isNaN(thumbnailPosition.width) &&
          !isNaN(thumbnailPosition.height);

        if (!isValidPosition) {
          console.warn('Invalid thumbnail position, using default animation');
          // Use simple fade-in animation as fallback
          opacity.setValue(0);
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            endTransition();
          });
          return;
        }

        // Calculate initial position and scale with safe math
        const targetCenterX = screenDimensions.width / 2;
        const targetCenterY = isFullscreen ? screenDimensions.height / 2 : (screenDimensions.width * (9 / 16)) / 2;

        const thumbnailCenterX = thumbnailPosition.x + (thumbnailPosition.width / 2);
        const thumbnailCenterY = thumbnailPosition.y + (thumbnailPosition.height / 2);

        const initialScaleX = Math.max(0.1, Math.min(1, thumbnailPosition.width / screenDimensions.width));
        const initialScaleY = Math.max(0.1, Math.min(1, thumbnailPosition.height / (screenDimensions.width * (9 / 16))));
        const initialScale = Math.max(0.1, Math.min(initialScaleX, initialScaleY));

        const initialTranslateX = Math.max(-screenDimensions.width, Math.min(screenDimensions.width, thumbnailCenterX - targetCenterX));
        const initialTranslateY = Math.max(-screenDimensions.height, Math.min(screenDimensions.height, thumbnailCenterY - targetCenterY));

        // Validate calculated values
        if (isNaN(initialScale) || isNaN(initialTranslateX) || isNaN(initialTranslateY)) {
          console.warn('Invalid calculated animation values, using fallback');
          opacity.setValue(0);
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            endTransition();
          });
          return;
        }

        // Set initial values safely
        translateX.setValue(initialTranslateX);
        translateY.setValue(initialTranslateY);
        scale.setValue(initialScale);
        opacity.setValue(0.8);

        // Animate to final position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 30,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 30,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 30,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          endTransition();
        });
      } else {
        // No thumbnail position available, use simple fade-in
        console.log('SeamlessVideoTransition: No thumbnail position, using simple fade-in');
        opacity.setValue(0);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          endTransition();
        });
      }
    }
  }, [thumbnailPosition, isTransitioning, isFullscreen, endTransition]);

  // Handle swipe down gesture
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: gestureTranslateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    try {
      const { state, translationY, velocityY } = event.nativeEvent;

      // Validate gesture values
      if (isNaN(translationY) || isNaN(velocityY)) {
        console.warn('Invalid gesture values detected');
        return;
      }

      if (state === State.END) {
        const shouldDismiss = translationY > 100 || velocityY > 500;

        if (shouldDismiss) {
          if (isFullscreen) {
            // Exit fullscreen and navigate back in one gesture
            onFullscreenChange(false);
            // Small delay to allow fullscreen to exit, then navigate
            setTimeout(() => {
              animateOut();
            }, 100);
          } else {
            // Navigate back with transition
            animateOut();
          }
        } else {
          // Snap back to original position
          Animated.parallel([
            Animated.spring(gestureTranslateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 300,
              friction: 30,
            }),
            Animated.spring(gestureOpacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 300,
              friction: 30,
            }),
          ]).start();
        }
      } else if (state === State.ACTIVE) {
        // Update opacity based on translation with safety checks
        const safeTranslationY = Math.max(0, Math.min(500, translationY));
        const progress = Math.min(safeTranslationY / 100, 1); //  sensitive
        const newOpacity = Math.max(0.0, Math.min(1, 1 - progress * 0.9)); // Much more transparent

        if (!isNaN(newOpacity)) {
          gestureOpacity.setValue(newOpacity);
        }
      }
    } catch (error) {
      console.error('Error in gesture handler:', error);
    }
  };

  const animateOut = () => {
    // Validate thumbnail position
    const isValidPosition = thumbnailPosition &&
      thumbnailPosition.x !== null &&
      thumbnailPosition.y !== null &&
      thumbnailPosition.width > 0 &&
      thumbnailPosition.height > 0 &&
      !isNaN(thumbnailPosition.x) &&
      !isNaN(thumbnailPosition.y) &&
      !isNaN(thumbnailPosition.width) &&
      !isNaN(thumbnailPosition.height);

    if (!isValidPosition) {
      // Fallback animation if no valid thumbnail position
      Animated.parallel([
        Animated.timing(gestureTranslateY, {
          toValue: screenDimensions.height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(gestureOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.back();
      });
      return;
    }

    // Animate back to thumbnail position with safety checks
    const targetCenterX = screenDimensions.width / 2;
    const targetCenterY = (screenDimensions.width * (9 / 16)) / 2;

    const thumbnailCenterX = thumbnailPosition.x + (thumbnailPosition.width / 2);
    const thumbnailCenterY = thumbnailPosition.y + (thumbnailPosition.height / 2);

    const finalScaleX = Math.max(0.1, Math.min(1, thumbnailPosition.width / screenDimensions.width));
    const finalScaleY = Math.max(0.1, Math.min(1, thumbnailPosition.height / (screenDimensions.width * (9 / 16))));
    const finalScale = Math.max(0.1, Math.min(finalScaleX, finalScaleY));

    const finalTranslateX = Math.max(-screenDimensions.width, Math.min(screenDimensions.width, thumbnailCenterX - targetCenterX));
    const finalTranslateY = Math.max(-screenDimensions.height, Math.min(screenDimensions.height, thumbnailCenterY - targetCenterY));

    // Validate calculated values
    if (isNaN(finalScale) || isNaN(finalTranslateX) || isNaN(finalTranslateY)) {
      console.warn('Invalid exit animation values, using fallback');
      Animated.parallel([
        Animated.timing(gestureTranslateY, {
          toValue: screenDimensions.height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.back();
      });
      return;
    }

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: finalTranslateX,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }),
      Animated.spring(translateY, {
        toValue: finalTranslateY,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }),
      Animated.spring(scale, {
        toValue: finalScale,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Reset gesture values
      Animated.timing(gestureTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  if (!isVisible) return null;

  return (
    <View style={[
      StyleSheet.absoluteFill, 
      { 
        backgroundColor: isFullscreen ? '#000' : 'transparent',
        width: screenDimensions.width,
        height: screenDimensions.height,
      }
    ]}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetY={10}
        failOffsetX={[-50, 50]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              width: screenDimensions.width,
              height: screenDimensions.height,
              backgroundColor: isFullscreen ? '#000' : 'transparent',
              transform: [
                { translateX },
                { translateY },
                { scale },
                { translateY: gestureTranslateY },
              ],
              opacity: Animated.multiply(opacity, gestureOpacity),
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default SeamlessVideoTransition;