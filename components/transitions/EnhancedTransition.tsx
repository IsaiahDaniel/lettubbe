import React, { useRef, useCallback } from 'react';
import { 
  View, 
  Animated, 
  StyleSheet, 
  Dimensions, 
  LayoutAnimation,
  UIManager,
  Platform 
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface EnhancedTransitionProps {
  id: string;
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

const EnhancedTransition: React.FC<EnhancedTransitionProps> = ({
  id,
  children,
  style,
  onPress
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 50,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleValue, opacityValue]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 50,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleValue, opacityValue]);

  const handlePress = useCallback(() => {
    // Trigger layout animation for navigation
    LayoutAnimation.configureNext({
      duration: 400,
      create: {
        type: LayoutAnimation.Types.easeOut,
        property: LayoutAnimation.Properties.opacity,
        springDamping: 0.8,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.8,
        property: LayoutAnimation.Properties.scaleXY,
      },
    });

    // Call the onPress handler
    onPress?.();
  }, [onPress]);

  return (
    <Animated.View
      style={[
        styles.container, 
        style,
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        }
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={(event) => {
        handlePressOut();
        handlePress();
      }}
      onTouchCancel={handlePressOut}
    >
      {children}
    </Animated.View>
  );
};

const screenWidth = Dimensions.get('window').width;
const thumbnailHeight = screenWidth * (9 / 16);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: thumbnailHeight,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default EnhancedTransition;