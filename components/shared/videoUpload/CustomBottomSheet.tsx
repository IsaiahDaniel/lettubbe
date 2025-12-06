import React, { useEffect, useState } from "react";
import { Dimensions, View, Modal, TouchableWithoutFeedback, StyleSheet, Platform, TouchableOpacity } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS, 
  withSpring,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import RemixIcon from "react-native-remix-icon";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";

import { MenuProvider } from 'react-native-popup-menu';
import Typography from "@/components/ui/Typography/Typography";

type CustomBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetheight?: any;
  title?: string | React.ReactNode;
  showClose?: boolean;
  showCloseIcon?: boolean;
  isBottomSpace?: boolean;
  hasDrafts?: boolean;
  onDraftsPress?: () => void;
  showDraftsIcon?: boolean;
};

const { height, width } = Dimensions.get("window");
const ANIMATION_DURATION = 250;
const CLOSE_THRESHOLD = height * 0.2; // If dragged down by 20% of screen height, close modal

const CustomBottomSheet = ({
  isVisible,
  onClose,
  children,
  sheetheight,
  title,
  showClose = true,
  showCloseIcon = true,
  isBottomSpace = true,
  hasDrafts = false,
  onDraftsPress,
  showDraftsIcon = false,
}: CustomBottomSheetProps) => {
  const { theme } = useCustomTheme();
  const translateY = useSharedValue(height); // Start off-screen
  const [modalVisible, setModalVisible] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false); // Track animation state
  
  // Initial height of the sheet
  const initialSheetHeight = typeof sheetheight === 'number' 
    ? sheetheight 
    : sheetheight === 'auto' ? undefined : height * 0.6;
  
  // Keep modal open until the closing animation completes
  useEffect(() => {
    if (isVisible) {
      setModalVisible(true); // Show modal immediately
      setIsAnimating(true); // Start animation
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION }, () => {
        runOnJS(setIsAnimating)(false); // Animation complete
      });
    } else {
      setIsAnimating(true); // Start animation
      translateY.value = withTiming(height, { duration: ANIMATION_DURATION }, () => {
        runOnJS(setModalVisible)(false); // Close modal only after animation
        runOnJS(setIsAnimating)(false); // Animation complete
      });
    }
  }, [isVisible]);

  // Modified backdrop press handler to prevent closing during animation
  const handleBackdropPress = () => {
    if (!isAnimating && showClose) {
      onClose();
    }
  };

  // Modified pan gesture to better work with child scroll views
  const panGesture = Gesture.Pan()
    .enabled(showClose && !isAnimating) // Disable during animation
    .onStart(() => {
      // Store starting position for more accurate gesture tracking
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow dragging down
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // If dragged down past threshold, close modal
      if (event.translationY > CLOSE_THRESHOLD) {
        setIsAnimating(true);
        translateY.value = withTiming(height, { duration: ANIMATION_DURATION }, () => {
          runOnJS(setModalVisible)(false);
          runOnJS(onClose)();
          runOnJS(setIsAnimating)(false);
        });
      } 
      // Otherwise, snap back to original position
      else {
        setIsAnimating(true);
        translateY.value = withSpring(0, {}, () => {
          runOnJS(setIsAnimating)(false);
        });
      }
    });
    
  // Track touch start for velocity calculations  
  const startY = useSharedValue(0);
  
  // Simultaneous handlers for the pan gesture and scroll view
  const composedGesture = Gesture.Simultaneous(panGesture);

  // Animated styles for bottom sheet
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value < 0 ? 0 : translateY.value }
      ],
      height: sheetheight ? sheetheight : 'auto',
      maxHeight: sheetheight === 'auto' ? '80%' : sheetheight || '80%',
    };
  });

  // Height for sheet content (calculated to offset header & handle)
  const contentHeight = typeof sheetheight === 'number' 
    ? sheetheight - 40
    : sheetheight === 'auto' ? undefined : height * 0.6 - 40;

  return (
    <Modal 
      visible={modalVisible} 
      transparent 
      animationType="none" 
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {/* Blurry Backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <BlurView intensity={Platform.OS === "ios" ? 20 : 50} tint="dark" style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop1} />
      </TouchableWithoutFeedback>

      {/* Wrap in GestureDetector */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.sheetContainer, 
            { backgroundColor: Colors[theme].sheetBackground },
            animatedStyle
          ]}>
          {showClose && <View style={styles.line} />}

          {showClose && showCloseIcon && (
            <View style={styles.headerContainer}>
              {/* Left actions */}
              <View style={styles.headerActions}>
                {/* Drafts icon - only show when enabled and has drafts */}
                {showDraftsIcon && hasDrafts && onDraftsPress && (
                  <TouchableOpacity 
                    onPress={!isAnimating ? onDraftsPress : undefined}
                    style={styles.headerActionButton}
                  >
                    <RemixIcon 
                      name="scissors-cut-line" 
                      size={24} 
                      color={Colors[theme].text} 
                    />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Title */}
              <View style={styles.titleContainer}>
                {typeof title === 'string' ? (
                  <Typography weight="700" size={16} lineHeight={24} textType="textBold">
                    {title}
                  </Typography>
                ) : (
                  title
                )}
              </View>
              
              {/* Right actions */}
              <View style={styles.headerActions}>
                {/* Close icon */}
                <TouchableOpacity onPress={!isAnimating ? onClose : undefined}>
                  <RemixIcon 
                    name="close-line" 
                    size={24} 
                    color={Colors[theme].text} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Content container with adjustable height */}
          <View style={[
            styles.contentContainer,
            { height: contentHeight }
          ]}>
            <MenuProvider skipInstanceCheck={true}>
              {children}
            </MenuProvider>
          </View>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop1: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 10,
    marginHorizontal: 16,
    // height: 36,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    padding: 4,
  },
  sheetContainer: {
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  line: {
    width: 75,
    height: 4,
    backgroundColor: "#8E9BAE",
    alignSelf: "center",
    marginVertical: 5,
    borderRadius: 2,
  },
});

export default CustomBottomSheet;