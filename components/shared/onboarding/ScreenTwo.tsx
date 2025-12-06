import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { onboardingStyles as styles } from "@/styles/onboardingStyles";
import { OnboardingScreenProps } from "@/helpers/types/onboarding/onboarding";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";

const ScreenTwo: React.FC<OnboardingScreenProps> = ({ getFontSize }) => {
  const { theme } = useCustomTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateSwipe = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -20,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTimeout(animateSwipe, 1500);
      });
    };

    animateSwipe();
  }, [translateX, opacity]);

  return (
    <View style={styles.screen}>
      {/* Swipe indicator */}
      <Animated.View 
        style={[
          styles.swipeIndicator,
          {
            transform: [{ translateX }],
            opacity,
          }
        ]}
      >
        <Typography size={14} weight="500" color={theme === 'dark' ? '#fff' : '#666'} style={styles.swipeText}>
          Swipe left
        </Typography>
        <Ionicons 
          name="arrow-forward" 
          size={20} 
          color={theme === 'dark' ? '#fff' : '#666'} 
          style={styles.swipeArrow}
        />
      </Animated.View>

      <View style={styles.screen2ContentContainer}>
        <View style={styles.textLine}>
          <Typography size={20} weight="600" textType="textBold">
            Build{" "}
          </Typography>
          <Typography textType="carter" size={24} color={Colors.general.primary}>
            Communities{" "}
          </Typography>
        </View>
        <View style={styles.textLine}>
          <Typography size={20} weight="600" textType="textBold">
            and{" "}
          </Typography>
          <Typography textType="carter" size={24} color="#F7AD00">
            Connect{" "}
          </Typography>
          <Typography size={20} weight="600" textType="textBold">
            with
          </Typography>
        </View>
        <View style={styles.textLine}>
          <Typography textType="carter" size={24} color="#E0005A">
            Friends
          </Typography>
        </View>
      </View>
    </View>
  );
};

export default ScreenTwo;