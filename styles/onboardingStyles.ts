import { StyleSheet, Platform, Dimensions } from "react-native";
import { INITIAL_LOGO_SIZE, FINAL_LOGO_SIZE, AUTH_LOGO_SIZE } from "../constants/onboarding";

const { width, height } = Dimensions.get("window");

export const onboardingStyles = StyleSheet.create({
  smallLogoContainer: {
    position: "absolute",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    top: height * 0.5 - INITIAL_LOGO_SIZE / 2,
    zIndex: 1,
  },
  largeLogoContainer: {
    position: "absolute",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    top: height * 0.5 - FINAL_LOGO_SIZE / 2,
    left: width * 0.5 - FINAL_LOGO_SIZE / 2,
    zIndex: -1,
  },
  textContainer: {
    position: "absolute",
    alignSelf: "center",
    top: height * 0.5 + INITIAL_LOGO_SIZE / 2 + 20,
  },
  welcomeTextContainer: {
    paddingHorizontal: 16,
  },
  para1: {
    marginTop: height * 0.28,
  },
  para2: {
    marginTop: height * 0.34,
  },
  AuthTextContainer: {
    paddingTop: height * 0.15,
    justifyContent: "center",
    alignItems: "center",
  },
  onboardingContent: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "transparent",
    width: "100%",
    height: "100%"
  },
  authContent: {
    alignItems: "center",
    height: "100%",
    width: "100%",
    paddingTop: height * 0.2,
  },
  authHeaderText: {
    textAlign: "center",
  },
  authSubtitle: {
    marginTop: 8,
    color: "#666",
    textAlign: "center",
  },
  authButtonContainer: {
    width: "100%",
    // height: "100%",
    // justifyContent: "flex-end",
    // paddingHorizontal: 16,
  },
  orText: {
    textAlign: "center",
    marginVertical: 8,
  },
  textLine: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  Sc2textLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    marginBottom: 4,
    textAlign: "right",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  goButton: {
    width: "100%",
    // marginBottom: 16,
  },
  signInButton: {
    marginTop: 14,
    alignSelf: "center",
  },
  onboardingScreensContainer: {
    // flex: 1,
    width: "100%",
    // height: "100%",
    marginHorizontal: 16,
  },
  screen: {
    width: Dimensions.get("window").width,
    height,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  screenContentContainer: {
    width: width,
    alignItems: "flex-start",
    marginBottom: 180,
    zIndex: 10,
  },
  screen2ContentContainer: {
    width: width,
    alignItems: "flex-start",
    marginBottom: 480,
    zIndex: 10,
  },
  skipButton: {
    position: "absolute",
    right: 35,
    zIndex: 10,
  },
  skipButtonText: {
    fontSize: 16,
    color: "#6E6E6E",
    fontWeight: "600",
  },
  getStartedButton: {
    bottom: height * -0.16,
    width: "92%",
    marginRight: 38,
  },
  paginationContainer: {
    bottom: height * 0.04,
    alignSelf: "center",
    marginRight: 32,
    flexDirection: "row",
    zIndex: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#000",
    marginHorizontal: 5,
    opacity: 0.3,
  },
  activeDot: {
    backgroundColor: "#00a8ff",
    opacity: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  authLogoContainer: {
    position: "absolute",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    top: height * 0.25,
    zIndex: 1,
  },
  authLogoCentered: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  authContentWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    paddingBottom: 50,
    zIndex: 2,
  },
  swipeIndicator: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backdropFilter: "blur(10px)",
  },
  swipeText: {
    marginRight: 6,
  },
  swipeArrow: {
    marginLeft: 2,
  },
});
