import { Animated, Dimensions } from "react-native";
import { AnimationValues } from "@/helpers/types/onboarding/onboarding";
import {
  CONTENT_FADE_DURATION,
  CONTENT_APPEAR_DURATION,
  AUTH_LOGO_SIZE,
  FINAL_LOGO_SIZE,
  SCALE_ROTATE_DURATION,
} from "@/constants/onboarding";

const { width, height } = Dimensions.get("window");

// Animate to login or signup state
export const animateToAuthState = (
  values: AnimationValues,
  callback: () => void
) => {
  Animated.parallel([
    Animated.timing(values.largeLogoScale, {
      toValue: AUTH_LOGO_SIZE / FINAL_LOGO_SIZE,
      duration: SCALE_ROTATE_DURATION,
      useNativeDriver: true,
    }),
    Animated.timing(values.largeLogoRotation, {
      toValue: 0,
      duration: SCALE_ROTATE_DURATION,
      useNativeDriver: true,
    }),
    Animated.timing(values.largeLogoTranslateX, {
      toValue: 0,
      duration: SCALE_ROTATE_DURATION,
      useNativeDriver: true,
    }),
    Animated.timing(values.largeLogoTranslateY, {
      toValue: height * -0.12,
      duration: SCALE_ROTATE_DURATION,
      useNativeDriver: true,
    }),
  ]).start();
};

// Fade out current content and fade in new content
export const transitionContent = (
  currentOpacity: Animated.Value,
  newOpacity: Animated.Value,
  beforeFadeIn: () => void,
  afterFadeIn: () => void
) => {
  Animated.timing(currentOpacity, {
    toValue: 0,
    duration: CONTENT_FADE_DURATION,
    useNativeDriver: true,
  }).start(({ finished }) => {
    if (finished) {
      beforeFadeIn();

      Animated.timing(newOpacity, {
        toValue: 1,
        duration: CONTENT_APPEAR_DURATION,
        useNativeDriver: true,
      }).start(() => {
        afterFadeIn();
      });
    }
  });
};

// Create interpolations for onboarding screen animations
export const createOnboardingInterpolations = (scrollX: Animated.Value) => {
  const rotationFromScroll = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: [10, 30, 86],
    extrapolate: "clamp",
  });

  const scaleFromScroll = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: [
      (FINAL_LOGO_SIZE * 1.5) / FINAL_LOGO_SIZE,
      2000 / FINAL_LOGO_SIZE,
      2147.57 / FINAL_LOGO_SIZE,
    ],
    extrapolate: "clamp",
  });

  const translateXFromScroll = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: [width * -0.3, width * -0.34, width * -0.2],
    extrapolate: "clamp",
  });

  const translateYFromScroll = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: [height * 0.01, height * 0.2, height * 0.2],
    extrapolate: "clamp",
  });

  return {
    rotationFromScroll,
    scaleFromScroll,
    translateXFromScroll,
    translateYFromScroll,
  };
};

// Create spin animation from rotation value
export const createSpinAnimation = (
  isOnboarding: boolean,
  rotationFromScroll: Animated.AnimatedInterpolation<string | number>,
  largeLogoRotation: Animated.Value
) => {
  if (isOnboarding) {
    return rotationFromScroll.interpolate({
      inputRange: [0, 360],
      outputRange: ["0deg", "360deg"],
    });
  } else {
    return largeLogoRotation.interpolate({
      inputRange: [-90, -45, 0, 30, 60, 90, 180], // Smaller range for subtle rotations
      outputRange: [
        "-90deg",
        "-45deg",
        "0deg",
        "30deg",
        "60deg",
        "90deg",
        "180deg",
      ],
    });
  }
};

// Get responsive font size based on screen width
export const getFontSize = (baseSize: number) => {
  const scaleFactor = Math.min(width / 375, 1.3); // Limit maximum scaling
  return Math.round(baseSize * scaleFactor);
};
