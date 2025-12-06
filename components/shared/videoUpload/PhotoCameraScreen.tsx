import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  StatusBar,
  Image
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import Typography from '@/components/ui/Typography/Typography';
import { Feather } from '@expo/vector-icons';
import useVideoUploadStore from '@/store/videoUploadStore';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

const PhotoCameraScreen = () => {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<any>(null);
  
  const { 
    setSelectedPhotos,
    hideGallery,
    closeUploadModal 
  } = useVideoUploadStore();

  useEffect(() => {
    // Request permissions when component mounts
    if (!permission?.granted) {
      requestPermission();
    }
    
    if (!mediaLibraryPermission?.granted) {
      requestMediaLibraryPermission();
    }
  }, [permission, mediaLibraryPermission]);

  // Handle camera ready
  const onCameraReady = () => {
    setCameraReady(true);
  };

  // Take a photo
  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert('Camera not ready', 'Please wait for camera to initialize.');
      return;
    }

    try {
      setLoading(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        exif: false,
      });

      if (photo) {
        // Set captured photo for preview
        setCapturedPhoto(photo.uri);
        
        // Save photo to media library
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        
        // Store photo data for later use
        const data = {
          uri: asset.uri,
          fileName: asset.filename || `photo_${Date.now()}.jpg`,
          width: photo.width,
          height: photo.height,
          type: 'image/jpeg',
        };
        setPhotoData(data);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  // Confirm photo and proceed to upload flow
  const confirmPhoto = () => {
    if (photoData) {
      // Add to selected photos
      setSelectedPhotos([photoData]);
      
      // Navigate to photo details screen
      router.push("/(videoUploader)/photoDetails");
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoData(null);
  };

  // Toggle camera type (front/back)
  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  // Toggle flash mode
  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
          return 'off';
        default:
          return 'off';
      }
    });
  };

  // Close camera and go back
  const closeCamera = () => {
    router.back();
  };

  // Check if we have required permissions
  if (!permission?.granted || !mediaLibraryPermission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <Typography size={16} weight="500" textType="text">
          We need camera and media library permissions to take photos.
        </Typography>
        <TouchableOpacity 
          style={[styles.permissionButton, { backgroundColor: Colors.general.primary }]} 
          onPress={() => {
            requestPermission();
            requestMediaLibraryPermission();
          }}
        >
          <Typography size={16} weight="600" style={{ color: '#FFFFFF' }}>
            Grant Permissions
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  // Show photo preview if photo is captured
  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Photo Preview */}
        <Image
          source={{ uri: capturedPhoto }}
          style={styles.previewImage}
          resizeMode="contain"
        />

        {/* Preview Controls */}
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={retakePhoto}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.previewButton, styles.confirmButton]}
            onPress={confirmPhoto}
          >
            <Feather name="check" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show camera interface
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
        mode="picture"
        active={true}
        mirror={cameraType === 'front'}
        onCameraReady={onCameraReady}
      />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={closeCamera}
        >
          <Feather name="x" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* <TouchableOpacity
          style={styles.topButton}
          onPress={toggleFlash}
        >
          <Feather 
            name={flashMode === 'off' ? 'zap-off' : flashMode === 'on' ? 'zap' : 'zap'} 
            size={24} 
            color={flashMode === 'off' ? '#FFFFFF80' : '#FFFFFF'} 
          />
        </TouchableOpacity> */}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Camera flip button */}
        <TouchableOpacity
          style={styles.sideButton}
          onPress={toggleCameraType}
        >
          <Feather name="rotate-cw" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Capture button */}
        <TouchableOpacity
          style={[styles.captureButton, loading && styles.captureButtonDisabled]}
          onPress={takePhoto}
          disabled={loading || !cameraReady}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        {/* Spacer */}
        <View style={styles.sideButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  previewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  confirmButton: {
    backgroundColor: Colors.general.primary,
  },
});

export default PhotoCameraScreen;