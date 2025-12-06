import React, { useRef } from "react";
import { Animated, Dimensions, View, ScrollView, SafeAreaView } from "react-native";
import { Colors, Images } from "@/constants";
import {
  INITIAL_LOGO_SIZE,
  FINAL_LOGO_SIZE,
} from "@/constants/onboarding";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import Typography from "@/components/ui/Typography/Typography";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingAnimation } from "@/hooks/useOnboardingAnimation";
import ScreenOne from "@/components/shared/onboarding/ScreenOne";
import ScreenTwo from "@/components/shared/onboarding/ScreenTwo";
import ScreenThree from "@/components/shared/onboarding/ScreenThree";
import LoginContent from "@/app/(auth)/LoginContent";
import SignupContent from "@/app/(auth)/SignupContent";
import { onboardingStyles as styles } from "@/styles/onboardingStyles";
import { getFontSize } from "@/helpers/utils/animationHelpers";
import { useCustomTheme } from "@/hooks/useCustomTheme";

const OnboardingScreens = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { theme } = useCustomTheme();
  
  
  const {
    state,
    values,
    scrollViewRef: hookScrollViewRef,
    interpolations,
    spin,
    handleSignInClick,
    handleGoOnClick,
    handleGetStartedClick,
    handleScroll,
    handleSkipIntro,
    handleLoginToSignup,
    handleSignupToLogin
  } = useOnboardingAnimation();

  const effectiveScrollViewRef = hookScrollViewRef || scrollViewRef;

  const {
    animationStage,
    onboardingPage,
    showOnboardingContent,
    showLoginContent,
    showSignupContent,
    showOnboardingScreens
  } = state;

  // Debug logging
  console.log('Onboarding state:', {
    animationStage,
    showLoginContent,
    showSignupContent,
    showOnboardingContent,
    showOnboardingScreens
  });

  const {
    smallLogoOpacity,
    largeLogoOpacity,
    largeLogoScale,
    largeLogoTranslateX,
    largeLogoTranslateY,
    textOpacity,
    contentOpacity,
    loginContentOpacity,
    signupContentOpacity,
    onboardingContentOpacity,
  } = values;

  const {
    scaleFromScroll,
    translateXFromScroll,
    translateYFromScroll
  } = interpolations;

  return (
    <SafeAreaView>
      
      {/* Small logo that fades out */}
      <Animated.View style={[
        styles.smallLogoContainer,
        { opacity: smallLogoOpacity }
      ]}>
        <Images.Logo width={INITIAL_LOGO_SIZE} height={INITIAL_LOGO_SIZE} />
      </Animated.View>
      
      {/* Large logo that starts at center and moves to final position */}
      <Animated.View style={[
        styles.largeLogoContainer,
        {
          opacity: largeLogoOpacity,
          transform: [
            { scale: animationStage === 'onboarding' ? scaleFromScroll : largeLogoScale },
            { translateX: animationStage === 'onboarding' ? translateXFromScroll : largeLogoTranslateX },
            { translateY: animationStage === 'onboarding' ? translateYFromScroll : largeLogoTranslateY },
            { rotate: spin }
          ],
          zIndex: -1
        }
      ]}>
        <Images.Logo width={FINAL_LOGO_SIZE} height={FINAL_LOGO_SIZE} />
      </Animated.View>

      <Animated.View style={[
        styles.textContainer, 
        { opacity: textOpacity }
      ]}>
        {/* <Typography size={20} weight="800" lineHeight={48} textType="carter">
          LETTUBBE+
        </Typography> */}
      </Animated.View>

      {/* Welcome Content */}
      {showOnboardingContent && (
        <Animated.View style={[
          styles.onboardingContent, 
          { opacity: contentOpacity }
        ]}>
          <View style={styles.welcomeTextContainer}>
            <View style={styles.para1}>
              <View style={styles.textLine}>
                <Typography size={20} weight="600" lineHeight={36} textType="textBold">
                  your{" "}
                </Typography>
                <Typography textType="carter" size={24} color="#F7AD00">
                  voiCe
                </Typography>
              </View>

              <View style={styles.textLine}>
                <Typography size={20} weight="600" lineHeight={36} textType="textBold">
                  your{" "}
                </Typography>
                <Typography textType="carter" size={24} color="#E0005A">
                  vibE
                </Typography>
              </View>

              <View style={styles.textLine}>
                <Typography size={20} weight="600" lineHeight={36} textType="textBold">
                  your{" "}
                </Typography>
                <Typography textType="carter" size={20} color="#7F06F8">
                  Space 
                </Typography>
                <Typography size={24} weight="600" lineHeight={36} textType="textBold">
                 {" "}-{" "}
                </Typography>
                <Typography textType="carter" size={24} color={Colors.general.primary}>
                  LETTUBBE+
                </Typography>
              </View>
            </View>

            <View style={styles.para2}>
              <View style={styles.textLine}>
                <Typography size={18} weight="600" lineHeight={40} textType="textBold">
                  Where{" "}
                </Typography>
                <Typography textType="carter" size={20} color="#E0005A">
                  Videos 
                </Typography>
                <Typography size={18} weight="600" lineHeight={40} textType="textBold">
                {" "}meet
                </Typography>
              </View>

              <View style={styles.textLine}>
                <Typography textType="carter" size={20} color="#7F06F8">
                  Conversations. 
                </Typography>
                <Typography size={18} weight="600" lineHeight={36} textType="textBold">
                  {" "}Ready to explore?
                </Typography>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <AppButton
              title="Go on..."
              style={styles.goButton}
              handlePress={handleGoOnClick}
            />

            <TextButton
              title="Sign in"
              onPress={handleSignInClick}
              style={styles.signInButton}
              textStyle={{ fontWeight: "500" }}
            />
          </View>
        </Animated.View>
      )}

      {/* Login Content */}
      {showLoginContent && (
        <Animated.View style={[
          styles.authContent, 
          { opacity: loginContentOpacity }
        ]}>          
          <LoginContent 
            handleSignInClick={handleSignInClick}
            handleLoginToSignup={handleLoginToSignup}
          />
        </Animated.View>
      )}

      {/* Onboarding Screens */}
      {showOnboardingScreens && (
        <Animated.View style={[
          styles.onboardingScreensContainer, 
          { opacity: onboardingContentOpacity }
        ]}>
          {/* Skip intro button */}
          {/* <TouchableOpacity 
            style={[
              styles.skipButton, 
              { top: insets.top + 20 }
            ]} 
            onPress={handleSkipIntro}
          >
            <Typography style={styles.skipButtonText}>Skip intro</Typography>
          </TouchableOpacity> */}

          <Animated.ScrollView
            ref={effectiveScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ width: Dimensions.get("window").width * 3 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="normal"
          >
            <ScreenOne getFontSize={getFontSize} handleGetStartedClick={handleGetStartedClick} />

            <ScreenTwo getFontSize={getFontSize} handleGetStartedClick={handleGetStartedClick} />

            <ScreenThree 
              getFontSize={getFontSize} 
              handleGetStartedClick={handleGetStartedClick} 
            />
          </Animated.ScrollView>

          {/* Pagination dots */}
          {onboardingPage !== 2 && (
            <View style={styles.paginationContainer}>
              <View style={[
                styles.paginationDot, 
                onboardingPage === 0 ? styles.activeDot : {}
              ]} />
              <View style={[
                styles.paginationDot, 
                onboardingPage === 1 ? styles.activeDot : {}
              ]} />
              <View style={[
                styles.paginationDot, 
                onboardingPage === 2 ? styles.activeDot : {}
              ]} />
            </View>
          )}
        </Animated.View>
      )}

      {/* Signup Content */}
      {showSignupContent && (
        <Animated.View style={[
          styles.authContent, 
          { opacity: signupContentOpacity }
        ]}>
          <SignupContent 
            handleSignInClick={handleSignInClick}
            handleSignupToLogin={handleSignupToLogin}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default OnboardingScreens;