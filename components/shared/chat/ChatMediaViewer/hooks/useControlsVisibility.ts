import { useState, useRef, useEffect } from 'react';
import { withTiming } from 'react-native-reanimated';

export const useControlsVisibility = (controlsOpacity: any) => {
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout>();

  const resetHideControlsTimer = () => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    
    setShowControls(true);
    controlsOpacity.value = withTiming(1);
    
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
      controlsOpacity.value = withTiming(0);
    }, 3000);
  };

  const clearTimer = () => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return {
    showControls,
    resetHideControlsTimer,
    clearTimer,
  };
};