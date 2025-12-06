import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { onboardingStyles as styles } from "@/styles/onboardingStyles";
import { OnboardingScreenProps } from "@/helpers/types/onboarding/onboarding";
import { useCustomTheme } from "@/hooks/useCustomTheme";

const ScreenOne: React.FC<OnboardingScreenProps> = ({ getFontSize }) => {
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

      <View style={styles.screenContentContainer}>
        <View style={styles.textLine}>
          <Typography size={20} weight="600" textType="textBold">
            Seamlessly{" "}
          </Typography>
          <Typography textType="carter" size={24} color="#E0005A">
            Watch
          </Typography>
          <Typography size={24} weight="600" textType="textBold">
            ,{" "}
          </Typography>
          <Typography textType="carter" size={24} color="#7F06F8">
            Chat{" "}
          </Typography>
          <Typography size={20} weight="600" textType="textBold">
            and
          </Typography>
        </View>
        <View style={styles.textLine}>
          <Typography textType="carter" size={24} color="#F7AD00">
            Engage
          </Typography>
        </View>
      </View>
    </View>
  );
};

export default ScreenOne;