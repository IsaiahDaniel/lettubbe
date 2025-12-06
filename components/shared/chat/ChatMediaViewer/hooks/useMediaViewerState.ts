import { useState, useEffect } from 'react';
import { StatusBar, BackHandler } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { AnimationValues } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('screen');

export const useMediaViewerState = (visible: boolean, initialIndex: number, onClose: () => void) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const animationValues: AnimationValues = {
    translateY: useSharedValue(0),
    scale: useSharedValue(1),
    opacity: useSharedValue(1),
    controlsOpacity: useSharedValue(1),
    scrollX: useSharedValue(0),
    backgroundOpacity: useSharedValue(1),
  };

  const initializeState = () => {
    setCurrentIndex(initialIndex);
    const initialScrollX = -initialIndex * SCREEN_WIDTH;
    animationValues.scrollX.value = initialScrollX;
    animationValues.translateY.value = 0;
    animationValues.scale.value = 1;
    animationValues.opacity.value = 1;
    animationValues.backgroundOpacity.value = 1;
  };

  useEffect(() => {
    if (visible) {
      initializeState();
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
  }, [visible, initialIndex]);

  useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });

      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  return {
    currentIndex,
    setCurrentIndex,
    animationValues,
  };
};