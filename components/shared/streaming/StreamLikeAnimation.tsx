import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FloatingHeart {
  id: string;
  startX: number;
  endX: number;
  endY: number;
}

interface StreamLikeAnimationProps {
  trigger: number; // Increment this to trigger new animation
  containerStyle?: any;
  buttonPosition?: { x: number; y: number }; // Position of the like button
}

export const StreamLikeAnimation: React.FC<StreamLikeAnimationProps> = ({
  trigger,
  containerStyle,
  buttonPosition
}) => {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  const createHeart = (): FloatingHeart => {
    // Start from center of container (button position will be handled by container positioning)
    const startX = (Math.random() * 20 - 10); // Small random offset from center
    const endX = startX + (Math.random() * 200 - 100); // Random drift
    const endY = -screenHeight * 0.6; // Float up 60% of screen height

    return {
      id: `heart-${Date.now()}-${Math.random()}`,
      startX,
      endX,
      endY,
    };
  };

  const triggerLikeAnimation = () => {
    // Create multiple hearts with staggered timing
    const heartCount = 6 + Math.floor(Math.random() * 4); // 6-9 hearts
    
    for (let i = 0; i < heartCount; i++) {
      setTimeout(() => {
        const newHeart = createHeart();
        setHearts(prev => [...prev, newHeart]);
        
        // Remove heart after animation duration
        setTimeout(() => {
          setHearts(prev => prev.filter(h => h.id !== newHeart.id));
        }, 3000);
      }, i * 150); // Stagger by 150ms each
    }
  };

  // Trigger animation when trigger prop changes
  useEffect(() => {
    if (trigger > 0) {
      triggerLikeAnimation();
    }
  }, [trigger]);

  const containerStyles = [
    styles.container,
    buttonPosition && {
      position: 'absolute',
      left: buttonPosition.x - 50, 
      top: buttonPosition.y - 50,
      width: 100,
      height: 100,
    },
    containerStyle
  ];

  return (
    <View style={containerStyles} pointerEvents="none">
      {hearts.map((heart) => (
        <AnimatedHeart key={heart.id} heart={heart} />
      ))}
    </View>
  );
};

const AnimatedHeart: React.FC<{ heart: FloatingHeart }> = ({ heart }) => {
  const translateX = useSharedValue(heart.startX);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Start animation immediately
    scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    
    // Fade in quickly, then fade out gradually as it rises
    opacity.value = withSequence(
      withSpring(1, { damping: 6, stiffness: 300 }),
      withSpring(0, { damping: 8, stiffness: 30 }, (finished) => {
        // Callback when animation finishes
      })
    );
    
    // Float upward with smooth motion
    translateY.value = withSpring(heart.endY, {
      damping: 10,
      stiffness: 30,
    });
    
    // Random horizontal drift
    translateX.value = withSpring(heart.endX, {
      damping: 12,
      stiffness: 35
    });
    
    // Gentle rotation
    rotation.value = withSpring(
      (Math.random() - 0.5) * 40, // -20 to 20 degrees
      { damping: 8, stiffness: 30 }
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.heart, animatedStyle]}>
      <Ionicons name="heart" size={32} color="#FF4444" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  heart: {
    position: 'absolute',
  },
});

export default StreamLikeAnimation;