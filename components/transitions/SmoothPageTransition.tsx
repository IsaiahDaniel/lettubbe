import React, { useEffect } from 'react';
import { LayoutAnimation, UIManager, Platform } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface SmoothPageTransitionProps {
  children: React.ReactNode;
  duration?: number;
}

const SmoothPageTransition: React.FC<SmoothPageTransitionProps> = ({ 
  children, 
  duration = 400 
}) => {
  useEffect(() => {
    // Configure smooth layout animation
    const animationConfig = {
      duration,
      create: {
        type: LayoutAnimation.Types.easeOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
    };

    LayoutAnimation.configureNext(animationConfig);
  }, [duration]);

  return <>{children}</>;
};

export default SmoothPageTransition;