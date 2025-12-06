import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { router } from "expo-router";
import { Colors, Icons } from "@/constants";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import Typography from "@/components/ui/Typography/Typography";
import useExitApp from "@/hooks/useExitApp";
import AuthWithLogo from "@/components/shared/auth/AuthWithLogo";
import KingsChatWebView from "@/components/shared/auth/KingsChatWebView";
import useKingsChatAuth from "@/hooks/auth/useKingsChatAuth";

interface LoginContentProps {
  handleSignInClick?: () => void;
  handleLoginToSignup?: () => void;
  standalone?: boolean;
}

const { height } = Dimensions.get("window");

// Internal content component for reuse
const LoginContentInternal: React.FC<Omit<LoginContentProps, 'standalone'> & { isStandalone?: boolean }> = ({
  handleSignInClick,
  handleLoginToSignup,
  isStandalone = false
}) => {
  const {
    isWebViewVisible,
    isProcessing,
    openKingsChatAuth,
    closeKingsChatAuth,
    handleAuthSuccess,
    handleAuthError,
  } = useKingsChatAuth();

  const handleSignupPress = () => {
    if (handleLoginToSignup) {
      handleLoginToSignup();
    } else {
      // Standalone mode - navigate to standalone signup
      router.push("/(auth)/StandaloneSignupContent");
    }
  };

  return (
    <View style={[
      styles.authButtonContainer,
      isStandalone && styles.standaloneAuthTextContainer
    ]}>
      <View style={[
        styles.AuthTextContainer,
        isStandalone && styles.standaloneAuthTextContainer
      ]}>
        <View style={styles.textLine}>
          <Typography weight="500" size={16} lineHeight={36} textType="textBold">
            Welcome back to{" "}
          </Typography>
          <Typography textType="carter" size={18} lineHeight={36} color={Colors.general.primary}>
            LETTUBBE+
          </Typography>
        </View>

        <View style={[styles.textLine]}>
          <Typography weight="500" size={16} lineHeight={54} textType="textBold">
            Where{" "}
          </Typography>
          <Typography textType="carter" size={18} color="#E0005A">Videos </Typography>
          <Typography weight="500" size={16} lineHeight={40} textType="textBold">
            {" "}meet{" "}
          </Typography>
          <Typography textType="carter" size={18} color="#7F06F8">Conversations. </Typography>
        </View>
      </View>
      <View style={styles.bottomButtons}>
        <AppButton
          title="Continue with Email"
          handlePress={() => router.push("/Login")}
          icon={Icons.email}
        />
        {/* <AppButton
          title="Continue with KingsChat"
          variant="kingschat"
          handlePress={() => openKingsChatAuth('login')}
          icon={Icons.kingschat}
          disabled={isProcessing}
        /> */}
      </View>

      <TextButton
        title="Don't have an account? Sign Up"
        onPress={handleSignupPress}
        style={styles.signInButton}
        textStyle={{ fontWeight: "500" }}
      />

      <KingsChatWebView
        visible={isWebViewVisible}
        onClose={closeKingsChatAuth}
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
        mode="login"
      />
    </View>
  );
};

const LoginContent: React.FC<LoginContentProps> = ({
  handleSignInClick,
  handleLoginToSignup,
  standalone = false
}) => {
  useExitApp();

  if (standalone) {
    // Standalone mode with animated logo
    return (
      <AuthWithLogo>
        <LoginContentInternal
          handleSignInClick={handleSignInClick}
          handleLoginToSignup={handleLoginToSignup}
          isStandalone={true}
        />
      </AuthWithLogo>
    );
  }

  // Onboarding mode without wrapper (logo handled by onboarding)
  return (
    <LoginContentInternal
      handleSignInClick={handleSignInClick}
      handleLoginToSignup={handleLoginToSignup}
      isStandalone={false}
    />
  );
};

const styles = StyleSheet.create({
  AuthTextContainer: {
    paddingTop: height * 0.15,
    paddingBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  textLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  authButtonContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  orText: {
    textAlign: "center",
    marginVertical: 10,
  },
  signInButton: {
    marginTop: 14,
    alignSelf: "center",
  },
  standaloneAuthTextContainer: {
    paddingTop: 0,
  },
  bottomButtons: {
    gap: 12
  }
});

export default LoginContent;