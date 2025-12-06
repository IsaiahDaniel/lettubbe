import React, { useEffect, useState } from "react";
import {
  Dimensions,
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  ViewStyle,
  BackHandler
} from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS, 
  withSpring, 
  Easing 
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import RemixIcon from "react-native-remix-icon";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Typography from "./Typography/Typography";

type CustomBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetheight?: number | "auto";
  title?: string;
  showClose?: boolean;
  showCloseIcon?: boolean;
  isBottomSpace?: boolean;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = SCREEN_HEIGHT * 0.2; // 20% of screen height

const CustomBottomSheet = ({
  isVisible,
  onClose,
  children,
  sheetheight = "auto",
  title,
  showClose = true,
  showCloseIcon = true,
  isBottomSpace = true,
}: CustomBottomSheetProps) => {
  const { theme } = useCustomTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const [modalVisible, setModalVisible] = useState(false);

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      setModalVisible(true);
      // Small delay to ensure modal is rendered before animation
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: 250 });
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });
      }, 10);
    } else if (modalVisible) {
      // Close animation
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      }, () => {
        runOnJS(setModalVisible)(false);
      });
    }
  }, [isVisible]);

  // Handle Android back button
  useEffect(() => {
    if (!modalVisible || Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!showClose) {
        // Prevent back button from closing when showClose is false
        return true;
      }
      // Allow default behavior (close modal) when showClose is true
      handleClose();
      return true;
    });

    return () => backHandler.remove();
  }, [modalVisible, showClose]);

  // Handle modal close
  const handleClose = () => {
    if (!showClose) return; // Prevent close if showClose is false

    opacity.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    }, () => {
      runOnJS(setModalVisible)(false);
      runOnJS(onClose)();
    });
  };

  // Configure pan gesture
  const panGesture = Gesture.Pan()
    .enabled(showClose)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > CLOSE_THRESHOLD) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { 
          damping: 20,
          stiffness: 150
        });
      }
    });

  // Animations
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const sheetAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!modalVisible) {
    return null;
  }

  // the container style
  const containerStyle: ViewStyle = {
    height: sheetheight,
    backgroundColor: Colors[theme].sheetBackground,
    maxHeight: SCREEN_HEIGHT * 0.9,
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={showClose ? handleClose : undefined}
    >
      {/* Backdrop blur layer */}
      <Animated.View style={[styles.backdropContainer, backdropAnimatedStyle]}>
        <TouchableWithoutFeedback onPress={showClose ? handleClose : undefined}>
          <View style={styles.backdrop}>
            {Platform.OS === "ios" && (
              <BlurView
                intensity={30}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Bottom Sheet Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheetContainer,
            containerStyle,
            sheetAnimatedStyle,
          ]}
        >
          {/* Pull indicator */}
          {showClose && <View style={styles.pullIndicator} />}

          {/* Header */}
          {showClose && showCloseIcon && (
            <View style={styles.headerContainer}>
              <Typography
                weight="700"
                size={16}
                lineHeight={24}
                textType="textBold"
              >
                {title || ""}
              </Typography>
              <TouchableWithoutFeedback onPress={showClose ? handleClose : undefined}>
                <View style={styles.closeIconContainer}>
                  <RemixIcon
                    name="close-line"
                    size={24}
                    color={Colors[theme].text}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}

          {/* Content */}
          <View style={styles.contentContainer}>
            {children}
          </View>
          
          {/* Bottom padding space */}
          {isBottomSpace && <View style={styles.bottomSpace} />}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  pullIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#8E9BAE",
    alignSelf: "center",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeIconContainer: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  bottomSpace: {
    height: Platform.OS === "ios" ? 34 : 16,
  },
});

export default CustomBottomSheet;