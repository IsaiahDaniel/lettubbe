import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import useVideoUploadStore from "@/store/videoUploadStore";
import RemixIcon from "react-native-remix-icon";
import Toast from 'react-native-toast-message'; 

interface UploadProgressBarProps {
  style?: any;
}

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ style }) => {
  const { theme } = useCustomTheme();
  const { uploadProgress, resetUpload, uploadMode } = useVideoUploadStore();
  const insets = useSafeAreaInsets();
  const [slideAnim] = React.useState(new Animated.Value(-100));

  // Show/hide animation based on upload status
  React.useEffect(() => {
    if (uploadProgress.status === "uploading") {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (uploadProgress.status === "success") {
      // success toast
      const mediaType = uploadMode === 'photo' ? 'photos' : 'video';
      Toast.show({
        type: 'success',
        text1: uploadProgress.isUpdateMode ? `Your ${mediaType} has been updated.` : `Your ${mediaType} has been uploaded.`,
        visibilityTime: 3000,
      });

      // Hide progress bar after a short delay
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 1000);

    } else if (uploadProgress.status === "error") {
      // error toast
      const mediaType = uploadMode === 'photo' ? 'photos' : 'video';
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: uploadProgress.message || `There was an error uploading your ${mediaType}`,
        visibilityTime: 4000,
      });

      // Hide progress bar on error
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [uploadProgress.status]);

  // Don't render if idle or error (after animation completes)
  if (uploadProgress.status === "idle") {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: Colors[theme].cardBackground,
          transform: [{ translateY: slideAnim }],
          top: insets.top, // Position relative to safe area
        },
        style,
      ]}
    >
      {uploadProgress.status === "uploading" && (
        <>
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Typography size={14} weight="600">
                {uploadProgress.isUpdateMode 
                  ? `Updating ${uploadMode === 'photo' ? 'photos' : 'video'}...` 
                  : `Uploading ${uploadMode === 'photo' ? 'photos' : 'video'}...`}
              </Typography>
              <Typography size={12} weight="400" textType="secondary">
                {uploadProgress.progress}% complete
              </Typography>
            </View>
          </View>

          <View style={[styles.progressBarContainer, {backgroundColor: Colors[theme].sheetBackground}]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${uploadProgress.progress}%`,
                  backgroundColor: Colors.general.primary,
                },
              ]}
            />
          </View>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
  },
  cancelButton: {
    padding: 4,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
});

export default UploadProgressBar;