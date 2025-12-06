import { Alert, Platform } from "react-native";
import { PermissionStatus, useCameraPermissions } from "expo-image-picker";
import {
  useForegroundPermissions,
  PermissionStatus as PermissionStatusLocation,
} from "expo-location";
import { useState, useEffect } from "react";
import * as MediaLibrary from "expo-media-library";
import { Camera } from "expo-camera";

const usePermissions = () => {
  // Image Picker Camera permissions
  const [cameraPermissionStatus, requestCameraPermission] =
    useCameraPermissions();
  
  // Location permissions
  const [locationPermissionInformation, requestLocationPermission] =
    useForegroundPermissions();
  const [locationPermissionLoading, setLocationPermissionLoading] =
    useState<boolean>(true);
  
  // Media Library permissions
  const [hasVideoPermission, setHasVideoPermission] = useState(false);
  
  // Camera component permissions
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial permissions on mount
    checkVideoPermission();
    checkInitialCameraAndMicPermissions();
  }, []);

  // Check Camera and Microphone permissions on component mount
  const checkInitialCameraAndMicPermissions = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraStatus.status === 'granted');
    
    const microphoneStatus = await Camera.requestMicrophonePermissionsAsync();
    setHasMicrophonePermission(microphoneStatus.status === 'granted');
  };

  // Media Library Permissions
  const checkVideoPermission = async () => {
    const { status } = await MediaLibrary.getPermissionsAsync();
    setHasVideoPermission(status === "granted");
    return status === "granted";
  };

  const requestVideoPermission = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === "granted";
      setHasVideoPermission(granted);
      return granted;
    } catch (error) {
      console.error("Error requesting media library permission:", error);
      return false;
    }
  };

  // Image Picker Camera Permissions
  const verifyCameraPermission = async () => {
    if (cameraPermissionStatus?.status == PermissionStatus.UNDETERMINED) {
      const permissionResponse = await requestCameraPermission();
      return permissionResponse.granted;
    }

    if (cameraPermissionStatus?.status == PermissionStatus.DENIED) {
      Alert.alert(
        "Insufficient Permission",
        "You need to grant camera permissions to use this app"
      );
      return false;
    }

    return true;
  };

  // Location Permissions
  const verifyLocationPermission = async () => {
    if (
      locationPermissionInformation?.status ==
      PermissionStatusLocation.UNDETERMINED
    ) {
      const permissionResponse = await requestLocationPermission();
      return permissionResponse.granted;
    }

    if (
      locationPermissionInformation?.status == PermissionStatusLocation.DENIED
    ) {
      Alert.alert(
        "Insufficient Permission",
        "You need to grant Location permissions to use this app"
      );
      return false;
    }

    return true;
  };

  const grantLocationPermission = async () => {
    if (
      locationPermissionInformation?.status == PermissionStatusLocation.DENIED
    ) {
      const permissionResponse = await requestLocationPermission();
      return permissionResponse.granted;
    }
    return true;
  };

  // Camera Component Permissions
  const requestCameraComponentPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setHasCameraPermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to make video calls.',
          [{ text: 'OK' }]
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const { status } = await Camera.requestMicrophonePermissionsAsync();
      const granted = status === 'granted';
      setHasMicrophonePermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone permission to make calls.',
          [{ text: 'OK' }]
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  // Helper to check if we have camera permission
  const checkCameraComponentPermission = async (): Promise<boolean> => {
    if (hasCameraPermission === null) {
      const result = await requestCameraComponentPermission();
      return result;
    }
    return hasCameraPermission;
  };

  // Helper to check if we have microphone permission
  const checkMicrophonePermission = async (): Promise<boolean> => {
    if (hasMicrophonePermission === null) {
      const result = await requestMicrophonePermission();
      return result;
    }
    return hasMicrophonePermission;
  };

  return {
    // Image Picker Camera permissions
    verifyCameraPermission,

    // Location permissions
    verifyLocationPermission,
    grantLocationPermission,
    locationPermissionLoading,
    setLocationPermissionLoading,

    // Media Library permissions
    hasVideoPermission,
    requestVideoPermission,
    checkVideoPermission,

    // Camera Component permissions
    hasCameraPermission,
    hasMicrophonePermission,
    requestCameraPermission: requestCameraComponentPermission,
    requestMicrophonePermission,
    checkCameraPermission: checkCameraComponentPermission,
    checkMicrophonePermission,
  };
};

export default usePermissions;