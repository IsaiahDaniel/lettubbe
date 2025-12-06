import React, { useEffect, useRef } from "react";
import { View, Animated, SafeAreaView } from "react-native";
import { Images, Colors } from "@/constants";
import { AUTH_LOGO_SIZE } from "@/constants/onboarding";
import { onboardingStyles as styles } from "@/styles/onboardingStyles";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface AuthWithLogoProps {
  children: React.ReactNode;
}

const AuthWithLogo: React.FC<AuthWithLogoProps> = ({ children }) => {
  const { theme } = useCustomTheme();
  
  // Animation values for the logo
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      {/* Animated Logo */}
      <Animated.View
        style={[
          styles.authLogoCentered,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { translateY: logoTranslateY },
            ],
          },
        ]}
      >
        <Images.Logo width={AUTH_LOGO_SIZE} height={AUTH_LOGO_SIZE} />
      </Animated.View>

      {/* Auth Content */}
      <View style={styles.authContentWrapper}>
        {children}
      </View>
    </SafeAreaView>
  );
};

export default AuthWithLogo;