import React from "react";
import { View, ViewStyle } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import { onboardingStyles as styles } from "@/styles/onboardingStyles";
import { OnboardingScreenProps } from "@/helpers/types/onboarding/onboarding";

const ScreenThree: React.FC<OnboardingScreenProps> = ({ handleGetStartedClick, getFontSize }) => {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContentContainer}>
        <View style={styles.textLine}>
          <Typography size={20} weight="600" textType="textBold">
            Your{" "}
          </Typography>
          <Typography textType="carter" size={24} color="#E0005A">
            Creative{" "}
          </Typography>
          <Typography size={20} weight="600" textType="textBold">
            space
          </Typography>
        </View>
        <View style={styles.textLine}>
          <Typography size={20} weight="600" textType="textBold">
            for{" "}
          </Typography>
          <Typography textType="carter" size={24} color="#7F06F8">
            Authentic{" "}
          </Typography>
        </View>
        <View style={styles.textLine}>
          <Typography textType="carter" size={24} color="#F7AD00">
            Expression
          </Typography>
        </View>

        <AppButton
          title="Get Started"
          style={styles.getStartedButton}
          handlePress={handleGetStartedClick}
        />
      </View>
    </View>
  );
};

export default ScreenThree;