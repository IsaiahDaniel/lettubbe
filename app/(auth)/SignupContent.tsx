import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { router } from "expo-router";
import { Colors, Icons } from "@/constants";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import Typography from "@/components/ui/Typography/Typography";
import AuthWithLogo from "@/components/shared/auth/AuthWithLogo";
import KingsChatWebView from "@/components/shared/auth/KingsChatWebView";
import useKingsChatAuth from "@/hooks/auth/useKingsChatAuth";

interface SignupContentProps {
  handleSignInClick?: () => void;
  handleSignupToLogin?: () => void;
  standalone?: boolean;
}

const { height } = Dimensions.get("window");

// Internal content component for reuse
const SignupContentInternal: React.FC<Omit<SignupContentProps, 'standalone'>> = ({
  handleSignInClick,
  handleSignupToLogin
}) => {
  const {
    isWebViewVisible,
    isProcessing,
    openKingsChatAuth,
    closeKingsChatAuth,
    handleAuthSuccess,
    handleAuthError,
  } = useKingsChatAuth();

  const handleSigninPress = () => {
    if (handleSignupToLogin) {
      handleSignupToLogin();
    } else {
      // Standalone mode - navigate to login
      router.push("/(auth)/StandaloneLoginContent");
    }
  };

  return (
    <View style={styles.authButtonContainer}>
      <View style={styles.AuthTextContainer}>
        <View style={styles.textLine}>
          <Typography weight="500" size={16} lineHeight={36} textType="textBold">
            Welcome to{" "}
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
          handlePress={() => router.push("/(auth)/EmailSignup")}
          icon={Icons.email}
        />
        {/* <AppButton
          title="Continue with KingsChat"
          variant="kingschat"
          handlePress={() => openKingsChatAuth('signup')}
          icon={Icons.kingschat}
          disabled={isProcessing}
        /> */}
      </View>
      {/* <AppButton
        title="Continue with Phone number"
        handlePress={() => router.push("/(auth)/PhoneSignup")}
        icon={Icons.phone}
        style={{ marginTop: 10 }}
      /> */}

      <TextButton
        title="Already have an account? Sign in"
        onPress={handleSigninPress}
        style={styles.signInButton}
        textStyle={{ fontWeight: "500" }}
      />

      <KingsChatWebView
        visible={isWebViewVisible}
        onClose={closeKingsChatAuth}
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
        mode="signup"
      />
    </View >
  );
};

const SignupContent: React.FC<SignupContentProps> = ({
  handleSignInClick,
  handleSignupToLogin,
  standalone = false
}) => {
  if (standalone) {
    // Standalone mode with animated logo
    return (
      <AuthWithLogo>
        <SignupContentInternal
          handleSignInClick={handleSignInClick}
          handleSignupToLogin={handleSignupToLogin}
        />
      </AuthWithLogo>
    );
  }

  // Onboarding mode without wrapper (logo handled by onboarding)
  return (
    <SignupContentInternal
      handleSignInClick={handleSignInClick}
      handleSignupToLogin={handleSignupToLogin}
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
    marginVertical: 8,
  },
  signInButton: {
    marginTop: 14,
    alignSelf: "center",
  },
    bottomButtons: {
    gap: 12
  }
});

export default SignupContent;