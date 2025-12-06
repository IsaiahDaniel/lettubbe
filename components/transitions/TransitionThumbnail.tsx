import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useVideoTransition } from '@/contexts/VideoTransitionContext';

interface TransitionThumbnailProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}

const TransitionThumbnail: React.FC<TransitionThumbnailProps> = ({
  children,
  onPress,
  style,
}) => {
  const viewRef = useRef<View>(null);
  const { setThumbnailPosition, startTransition } = useVideoTransition();

  const handlePress = useCallback(() => {
    console.log('TransitionThumbnail: handlePress called');
    if (viewRef.current) {
      console.log('TransitionThumbnail: viewRef is available, measuring...');
      viewRef.current.measureInWindow((x, y, width, height) => {
        console.log('TransitionThumbnail: measureInWindow result:', { x, y, width, height });
        
        // Validate measurement values
        const isValidMeasurement = typeof x === 'number' && 
                                  typeof y === 'number' && 
                                  typeof width === 'number' && 
                                  typeof height === 'number' &&
                                  !isNaN(x) && 
                                  !isNaN(y) && 
                                  !isNaN(width) && 
                                  !isNaN(height) &&
                                  width > 0 && 
                                  height > 0;

        console.log('TransitionThumbnail: isValidMeasurement:', isValidMeasurement);

        if (isValidMeasurement) {
          console.log('TransitionThumbnail: Setting thumbnail position and starting transition');
          // Store the thumbnail position for transition
          setThumbnailPosition({ x, y, width, height });
          startTransition();
          
          // Immediate navigation - the SeamlessVideoTransition will handle the animation
          console.log('TransitionThumbnail: Calling onPress immediately after setting position');
          onPress();
        } else {
          console.warn('Invalid thumbnail measurement, using fallback navigation');
          // Fallback if measurement is invalid
          onPress();
        }
      });
    } else {
      // Fallback if ref is not available
      console.warn('Thumbnail ref not available, using fallback navigation');
      onPress();
    }
  }, [onPress, setThumbnailPosition, startTransition]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.95} style={style}>
      <View ref={viewRef} style={styles.container}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
});

export default TransitionThumbnail;