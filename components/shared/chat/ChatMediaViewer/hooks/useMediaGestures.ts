import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, withTiming, withSpring, interpolate, Extrapolate, useSharedValue } from 'react-native-reanimated';
import { MediaItem, AnimationValues } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface UseMediaGesturesProps {
  mediaItems: MediaItem[];
  currentIndex: number;
  animationValues: AnimationValues;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onControlsShow: () => void;
}

export const useMediaGestures = ({
  mediaItems,
  currentIndex,
  animationValues,
  onClose,
  onIndexChange,
  onControlsShow,
}: UseMediaGesturesProps) => {
  
  // Track pinch state to prevent dismissal during zoom
  const isPinching = useSharedValue(false);
  const isZoomed = useSharedValue(false);
  const baseScale = useSharedValue(1);
  
  const handleDismiss = (translationY: number) => {
    'worklet';
    const targetY = translationY > 0 ? SCREEN_HEIGHT : -SCREEN_HEIGHT;
    animationValues.translateY.value = withTiming(targetY, { duration: 300 });
    animationValues.opacity.value = withTiming(0, { duration: 300 });
    animationValues.scale.value = withTiming(0.7, { duration: 300 });
    animationValues.backgroundOpacity.value = withTiming(0, { duration: 300 });
    runOnJS(onClose)();
  };

  const handleVerticalSwipe = (translationY: number) => {
    'worklet';
    // Prevent dismissal if currently pinching or zoomed in
    if (isPinching.value || isZoomed.value) {
      return;
    }
    
    animationValues.translateY.value = translationY;
    const progress = Math.abs(translationY) / SCREEN_HEIGHT;
    
    animationValues.scale.value = interpolate(
      progress,
      [0, 0.5],
      [1, 0.8],
      Extrapolate.CLAMP
    );
    
    animationValues.opacity.value = interpolate(
      progress,
      [0, 0.5],
      [1, 0.5],
      Extrapolate.CLAMP
    );
    
    // Animate background opacity to fade out as user drags
    animationValues.backgroundOpacity.value = interpolate(
      progress,
      [0, 0.3],
      [1, 0],
      Extrapolate.CLAMP
    );
  };

  const handleHorizontalSwipe = (translationX: number) => {
    'worklet';
    if (mediaItems.length <= 1) return;
    
    const basePosition = -currentIndex * SCREEN_WIDTH;
    const newPosition = basePosition + translationX;
    
    const maxScroll = -(mediaItems.length - 1) * SCREEN_WIDTH;
    const minScroll = 0;
    
    if (newPosition > minScroll) {
      const overflow = newPosition - minScroll;
      animationValues.scrollX.value = minScroll + overflow * 0.3;
    } else if (newPosition < maxScroll) {
      const overflow = maxScroll - newPosition;
      animationValues.scrollX.value = maxScroll - overflow * 0.3;
    } else {
      animationValues.scrollX.value = newPosition;
    }
  };

  const handleNavigationEnd = (translationX: number) => {
    'worklet';
    if (mediaItems.length <= 1) return;
    
    const threshold = SCREEN_WIDTH * 0.25;
    let targetIndex = currentIndex;
    
    if (translationX > threshold && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (translationX < -threshold && currentIndex < mediaItems.length - 1) {
      targetIndex = currentIndex + 1;
    }
    
    targetIndex = Math.max(0, Math.min(mediaItems.length - 1, targetIndex));
    
    const targetScrollX = -targetIndex * SCREEN_WIDTH;
    animationValues.scrollX.value = withSpring(targetScrollX, {
      damping: 18,
      stiffness: 120,
    });
    
    if (targetIndex !== currentIndex) {
      runOnJS(onIndexChange)(targetIndex);
    }
  };

  const resetToCenter = () => {
    'worklet';
    animationValues.translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
    animationValues.scale.value = withSpring(baseScale.value, {
      damping: 20,
      stiffness: 300,
    });
    animationValues.opacity.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
    });
    animationValues.backgroundOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
    });
  };

  const isVerticalSwipe = (velocityX: number, velocityY: number) => {
    'worklet';
    return Math.abs(velocityY) > Math.abs(velocityX);
  };

  const shouldDismiss = (translationY: number, velocityY: number) => {
    'worklet';
    const distanceThreshold = Math.abs(translationY) > SCREEN_HEIGHT * 0.25;
    const velocityThreshold = Math.abs(velocityY) > 1000; // Quick flick
    return distanceThreshold || velocityThreshold;
  };

  const panGesture = Gesture.Pan()
    .minDistance(20)
    .maxPointers(1) // Only allow single finger pan to avoid conflict with pinch
    .onStart(() => {
      runOnJS(onControlsShow)();
    })
    .onUpdate((event) => {
      if (Math.abs(event.translationX) < 20 && Math.abs(event.translationY) < 20) {
        return;
      }
      
      // Only handle vertical swipes if not pinching or zoomed
      if (isVerticalSwipe(event.velocityX, event.velocityY)) {
        if (!isPinching.value && !isZoomed.value) {
          handleVerticalSwipe(event.translationY);
        }
      } else {
        // Only handle horizontal swipes if not zoomed (allow when pinching ends)
        if (!isZoomed.value) {
          handleHorizontalSwipe(event.translationX);
        }
      }
    })
    .onEnd((event) => {
      if (isVerticalSwipe(event.velocityX, event.velocityY)) {
        // Only allow dismissal if not pinching or zoomed
        if (!isPinching.value && !isZoomed.value && shouldDismiss(event.translationY, event.velocityY)) {
          handleDismiss(event.translationY);
        } else {
          resetToCenter();
        }
      } else {
        // Only handle navigation if not zoomed
        if (!isZoomed.value) {
          handleNavigationEnd(event.translationX);
        } else {
          // Reset position if zoomed and trying to swipe horizontally
          resetToCenter();
        }
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      isPinching.value = true;
      baseScale.value = animationValues.scale.value;
      runOnJS(onControlsShow)();
    })
    .onUpdate((event) => {
      // more conservative bounds to prevent gesture handler from fighting us
      const newScale = Math.max(0.1, Math.min(baseScale.value * event.scale, 10));
      animationValues.scale.value = newScale;
      // Track if we're zoomed beyond normal scale
      isZoomed.value = newScale > 1.1;
    })
    .onEnd(() => {
      isPinching.value = false;
      
      // Update base scale to current scale for next pinch
      baseScale.value = animationValues.scale.value;
      
      // Just update zoom state, no auto-correction
      isZoomed.value = animationValues.scale.value > 1.1;
    });

  // Double tap to zoom in/out
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(onControlsShow)();
      
      if (animationValues.scale.value > 1.1) {
        // Zoom out to normal
        animationValues.scale.value = withSpring(1, {}, (finished) => {
          if (finished) {
            baseScale.value = 1;
            isZoomed.value = false;
          }
        });
      } else {
        // Zoom in to 2x
        animationValues.scale.value = withSpring(2, {}, (finished) => {
          if (finished) {
            baseScale.value = 2;
            isZoomed.value = true;
          }
        });
      }
    });

  const combinedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );

  return {
    panGesture,
    pinchGesture,
    doubleTapGesture,
    combinedGesture,
  };
};