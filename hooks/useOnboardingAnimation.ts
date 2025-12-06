import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions } from "react-native";
import {
  AnimationState,
  AnimationValues,
  ScrollEvent,
  AnimationStage,
} from "@/helpers/types/onboarding/onboarding";
import {
  TEXT_FADE_DURATION,
  LOGO_TRANSITION_DURATION,
  SCALE_ROTATE_DURATION,
  FINAL_LOGO_SIZE,
  CONTENT_FADE_DURATION,
  AUTH_LOGO_SIZE,
  CONTENT_APPEAR_DURATION,
} from "@/constants/onboarding";
import {
  animateToAuthState,
  transitionContent,
  createOnboardingInterpolations,
  createSpinAnimation,
} from "@/helpers/utils/animationHelpers";

const { width, height } = Dimensions.get("window");

export const useOnboardingAnimation = () => {
  // Animation state
  const [state, setState] = useState<AnimationState>({
    animationStage: "initial",
    onboardingPage: 0,
    showOnboardingContent: false,
    showLoginContent: false,
    showSignupContent: false,
    showOnboardingScreens: false,
    currentScale: 0.1,
    currentRotation: 0,
    currentTranslateX: 0,
    currentTranslateY: 0,
  });

  // Animation values
  const values: AnimationValues = {
    smallLogoOpacity: useRef(new Animated.Value(1)).current,
    largeLogoOpacity: useRef(new Animated.Value(0)).current,
    largeLogoScale: useRef(new Animated.Value(0.1)).current,
    largeLogoTranslateX: useRef(new Animated.Value(0)).current,
    largeLogoTranslateY: useRef(new Animated.Value(0)).current,
    largeLogoRotation: useRef(new Animated.Value(0)).current,
    textOpacity: useRef(new Animated.Value(1)).current,
    contentOpacity: useRef(new Animated.Value(0)).current,
    loginContentOpacity: useRef(new Animated.Value(0)).current,
    signupContentOpacity: useRef(new Animated.Value(0)).current,
    onboardingContentOpacity: useRef(new Animated.Value(0)).current,
    scrollX: useRef(new Animated.Value(0)).current,
  };

  const scrollViewRef = useRef<any>(null);

  // Handle hot reloads
  useEffect(() => {
    if (__DEV__) {
      resetAllStates();
    }
  }, []);

  // Reset all state variables
  const resetAllStates = () => {
    // Reset animation stage
    setState({
      animationStage: "initial",
      onboardingPage: 0,
      showOnboardingContent: false,
      showLoginContent: false,
      showSignupContent: false,
      showOnboardingScreens: false,
      currentScale: 0.1,
      currentRotation: 0,
      currentTranslateX: 0,
      currentTranslateY: 0,
    });

    // Reset animation values
    values.smallLogoOpacity.setValue(1);
    values.largeLogoOpacity.setValue(0);
    values.largeLogoScale.setValue(0.1);
    values.largeLogoTranslateX.setValue(0);
    values.largeLogoTranslateY.setValue(0);
    values.largeLogoRotation.setValue(0);
    values.textOpacity.setValue(1);
    values.contentOpacity.setValue(0);
    values.loginContentOpacity.setValue(0);
    values.signupContentOpacity.setValue(0);
    values.onboardingContentOpacity.setValue(0);
    values.scrollX.setValue(0);
  };

  // Initial welcome animation
  useEffect(() => {
    if (state.animationStage === "initial") {
      // Step 1: Fade out the text
      Animated.timing(values.textOpacity, {
        toValue: 0,
        duration: TEXT_FADE_DURATION,
        useNativeDriver: true,
      }).start();

      // Step 2: After text fades, start the logo transition
      setTimeout(() => {
        // Fade out small logo
        Animated.timing(values.smallLogoOpacity, {
          toValue: 0,
          duration: LOGO_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();

        // Fade in large logo
        Animated.timing(values.largeLogoOpacity, {
          toValue: 1,
          duration: LOGO_TRANSITION_DURATION,
          useNativeDriver: true,
        }).start();

        // Scale, rotate, and translate the large logo simultaneously
        Animated.parallel([
          Animated.timing(values.largeLogoScale, {
            toValue: 1,
            duration: SCALE_ROTATE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(values.largeLogoRotation, {
            toValue: 125,
            duration: SCALE_ROTATE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(values.largeLogoTranslateX, {
            toValue: width * -0.24,
            duration: SCALE_ROTATE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(values.largeLogoTranslateY, {
            toValue: height * -0.02,
            duration: SCALE_ROTATE_DURATION,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            // Save current values when animation completes
            setState((prev) => ({
              ...prev,
              currentScale: 1,
              currentRotation: 125,
              currentTranslateX: width * -0.24,
              currentTranslateY: height * -0.02,
              showOnboardingContent: true,
              animationStage: "expanded",
            }));

            Animated.timing(values.contentOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        });
      }, TEXT_FADE_DURATION);
    }
  }, [state.animationStage]);

  // Handle sign in button click
  const handleSignInClick = () => {
    if (state.animationStage === "expanded") {
      transitionContent(
        values.contentOpacity,
        values.loginContentOpacity,
        () => {
          setState((prev) => ({
            ...prev,
            showOnboardingContent: false,
            showLoginContent: true,
          }));

          animateToAuthState(values, () => {});
        },
        () => {
          setState((prev) => ({
            ...prev,
            animationStage: "login",
          }));
        }
      );
    }
  };

  // Handle "Go on" button click
  const handleGoOnClick = () => {
    transitionContent(
      values.contentOpacity,
      values.onboardingContentOpacity,
      () => {
        setState((prev) => ({
          ...prev,
          showOnboardingContent: false,
          showOnboardingScreens: true,
          onboardingPage: 0,
        }));

        // Animate to the desired positions for the first screen
        Animated.parallel([
          Animated.timing(values.largeLogoScale, {
            toValue: (FINAL_LOGO_SIZE * 1.5) / FINAL_LOGO_SIZE,
            duration: SCALE_ROTATE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(values.largeLogoRotation, {
            toValue: 10,
            duration: SCALE_ROTATE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(values.largeLogoTranslateX, {
            toValue: width * -0.3,
            duration: SCALE_ROTATE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(values.largeLogoTranslateY, {
            toValue: height * 0.01,
            duration: SCALE_ROTATE_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      },
      () => {
        setState((prev) => ({
          ...prev,
          currentScale: (FINAL_LOGO_SIZE * 1.2) / FINAL_LOGO_SIZE,
          currentRotation: 10,
          currentTranslateX: width * -0.4,
          currentTranslateY: height * -0.1,
          animationStage: "onboarding",
        }));
      }
    );
  };

  const handleGetStartedClick = () => {
    // Store current page for calculating rotation
    const currentPage = state.onboardingPage;
    const rotationValues = [10, 30, 86];
    const currentRotation = rotationValues[currentPage];

    // Fade out onboarding content
    Animated.timing(values.onboardingContentOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Update state after fade out
      setState((prev) => ({
        ...prev,
        showOnboardingScreens: false,
        showSignupContent: true,
        animationStage: "signup",
      }));

      // Ensure signup content starts invisible
      values.signupContentOpacity.setValue(0);

      // Animation in parallel
      Animated.parallel([
        // Scale animation
        Animated.timing(values.largeLogoScale, {
          toValue: AUTH_LOGO_SIZE / FINAL_LOGO_SIZE,
          duration: 600,
          useNativeDriver: true,
        }),

        // Rotation with proper easing
        Animated.timing(values.largeLogoRotation, {
          toValue: 0, // Go directly to 0 with smooth animation
          duration: 600,
          useNativeDriver: true,
        }),

        // Position animations
        Animated.timing(values.largeLogoTranslateX, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(values.largeLogoTranslateY, {
          toValue: height * -0.12,
          duration: 600,
          useNativeDriver: true,
        }),

        // Content fade in
        Animated.timing(values.signupContentOpacity, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };
  // Handle scroll to update page state
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: values.scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: ScrollEvent) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const page = Math.round(offsetX / width);

        if (page !== state.onboardingPage) {
          setState((prev) => ({ ...prev, onboardingPage: page }));
        }
      },
    }
  );

  // Skip intro handler
  const handleSkipIntro = () => {
    if (state.animationStage === "onboarding") {
      handleGetStartedClick();
    }
  };

  const handleLoginToSignup = () => {
    console.log('handleLoginToSignup called');
    console.log('Current state:', state);
    
    // Fade out login content
    Animated.timing(values.loginContentOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      console.log('Login content faded out, updating state');
      
      // Update state after fade out
      setState((prev) => ({
        ...prev,
        showLoginContent: false,
        showSignupContent: true,
        animationStage: "signup",
      }));

      // Fade in signup content
      Animated.timing(values.signupContentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        console.log('Signup content faded in');
      });
    });
  };

  const handleSignupToLogin = () => {
    // Fade out signup content
    Animated.timing(values.signupContentOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Update state after fade out
      setState((prev) => ({
        ...prev,
        showSignupContent: false,
        showLoginContent: true,
        animationStage: "login",
      }));

      // Fade in login content
      Animated.timing(values.loginContentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  // Create interpolations for onboarding screen animations
  const interpolations = createOnboardingInterpolations(values.scrollX);

  // Create spin animation
  const spin = createSpinAnimation(
    state.animationStage === "onboarding",
    interpolations.rotationFromScroll,
    values.largeLogoRotation
  );
  return {
    state,
    values,
    scrollViewRef,
    interpolations,
    spin,
    handleSignInClick,
    handleGoOnClick,
    handleGetStartedClick,
    handleScroll,
    handleSkipIntro,
    handleLoginToSignup,
    handleSignupToLogin,
  };
};
