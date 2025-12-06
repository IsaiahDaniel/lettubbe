import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

interface SharedElementTransitionProps {
  id: string;
  children: React.ReactNode;
  style?: any;
  onLayout?: (dimensions: { x: number; y: number; width: number; height: number }) => void;
}

const SharedElementTransition: React.FC<SharedElementTransitionProps> = ({
  id,
  children,
  style,
  onLayout
}) => {
  const viewRef = useRef<View>(null);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handleLayout = useCallback(() => {
    if (viewRef.current && onLayout) {
      viewRef.current.measureInWindow((x, y, width, height) => {
        onLayout({ x, y, width, height });
      });
    }
  }, [onLayout]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 50,
    }).start();
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 50,
    }).start();
  }, [scaleValue]);

  return (
    <Animated.View
      ref={viewRef}
      style={[
        styles.container, 
        style,
        {
          transform: [{ scale: scaleValue }],
        }
      ]}
      onLayout={handleLayout}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
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
  },
});

export default SharedElementTransition;