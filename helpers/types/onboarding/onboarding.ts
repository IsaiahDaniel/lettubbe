export type AnimationStage =
  | "initial"
  | "expanded"
  | "login"
  | "onboarding"
  | "signup"
  | "transitioning";

export interface OnboardingScreenProps {
  handleGetStartedClick: () => void;
  getFontSize: (baseSize: number) => number;
}

export interface AuthContentProps {
  onBackToWelcome?: () => void;
  getFontSize: (baseSize: number) => number;
}

export interface AnimationState {
  animationStage: AnimationStage;
  onboardingPage: number;
  showOnboardingContent: boolean;
  showLoginContent: boolean;
  showSignupContent: boolean;
  showOnboardingScreens: boolean;
  currentScale: number;
  currentRotation: number;
  currentTranslateX: number;
  currentTranslateY: number;
}

export interface AnimationValues {
  smallLogoOpacity: any;
  largeLogoOpacity: any;
  largeLogoScale: any;
  largeLogoTranslateX: any;
  largeLogoTranslateY: any;
  largeLogoRotation: any;
  textOpacity: any;
  contentOpacity: any;
  loginContentOpacity: any;
  signupContentOpacity: any;
  onboardingContentOpacity: any;
  scrollX: any;
}

export interface ScrollEvent {
  nativeEvent: {
    contentOffset: {
      x: number;
      y: number;
    };
  };
}
