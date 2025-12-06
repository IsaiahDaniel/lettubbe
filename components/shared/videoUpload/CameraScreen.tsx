import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import Typography from '@/components/ui/Typography/Typography';
import { Feather } from '@expo/vector-icons';
import useVideoUploadStore from '@/store/videoUploadStore';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

const CameraScreen = () => {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<any> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  const { 
    setSelectedVideo, 
    navigateToEditor,
    setVideoDetails
  } = useVideoUploadStore();

  useEffect(() => {
    // Request permissions when component mounts
    if (!permission?.granted) {
      requestPermission();
    }
    
    if (!mediaLibraryPermission?.granted) {
      requestMediaLibraryPermission();
    }
    
    if (!audioPermission?.granted) {
      requestAudioPermission();
    }
    
    // Clean up recording timer when component unmounts
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, []);

  // Format duration to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle between front and back camera
  const toggleCameraType = () => {
    // Don't allow camera switching while recording
    if (isRecording) {
      Alert.alert('Cannot switch camera', 'Please stop recording before switching cameras.');
      return;
    }
    
    setCameraReady(false);
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
    
    // Give camera time to switch
    setTimeout(() => {
      setCameraReady(true);
    }, 500);
  };

  // Toggle flash mode
  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off': return 'on';
        case 'on': return 'auto';
        default: return 'off';
      }
    });
  };

  // Handle camera ready
  const onCameraReady = () => {
    setCameraReady(true);
  };

  // Start recording video
  const startRecording = async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert('Camera not ready', 'Please wait for camera to initialize.');
      return;
    }
    
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
      
      // Start recording and store the promise
      recordingPromiseRef.current = cameraRef.current.recordAsync({
        maxDuration: 300, // 5 minutes max
      });
      
      // Wait for recording to complete
      const recordingResult = await recordingPromiseRef.current;
      
      // Clear the promise reference
      recordingPromiseRef.current = null;
      
      // Handle the completed recording
      await handleRecordingComplete(recordingResult);
      
    } catch (error) {
      console.error('Error starting video recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      
      // Clean up on error
      setIsRecording(false);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      setRecordingDuration(0);
      recordingPromiseRef.current = null;
    }
  };

  // Handle completed recording
  const handleRecordingComplete = async (recordingResult: any) => {
    try {
      setLoading(true);
      
      if (recordingResult && recordingResult.uri) {
        // Save to media library if permission granted
        if (mediaLibraryPermission?.granted) {
          await MediaLibrary.saveToLibraryAsync(recordingResult.uri);
        }
        
        // Pass video to store
        setSelectedVideo({
          uri: recordingResult.uri,
          duration: recordingDuration,
          type: 'video/mp4',
        });
        
        // Set video details with thumbnail
        setVideoDetails({
          thumbnailUri: recordingResult.uri
        });
        
        // the CameraPage component handles the navigation
        navigateToEditor();
      }
    } catch (error) {
      console.error('Error handling recording completion:', error);
      Alert.alert('Error', 'Failed to process recorded video');
    } finally {
      setLoading(false);
    }
  };

  // Stop recording video
  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      // Clear duration timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      // Stop recording - cause recordAsync to resolve
      cameraRef.current.stopRecording();
      setIsRecording(false);
      
    } catch (error) {
      console.error('Error stopping video recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      
      // Force cleanup on error
      setIsRecording(false);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      setRecordingDuration(0);
      recordingPromiseRef.current = null;
    }
  };

  // Handle back button press
  const handleBack = () => {
    if (isRecording) {
      // If recording, stop it first
      stopRecording();
      return;
    }
    router.back();
  };

  // If permissions are not granted yet
  if (!permission?.granted || !mediaLibraryPermission?.granted || !audioPermission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <Typography size={16} weight="500" textType="text">
          We need camera, audio, and media library permissions to record videos.
        </Typography>
        <TouchableOpacity 
          style={[styles.permissionButton, { backgroundColor: Colors.general.primary }]} 
          onPress={() => {
            requestPermission();
            requestMediaLibraryPermission();
            requestAudioPermission();
          }}
        >
          <Typography size={16} weight="600" style={{ color: '#FFFFFF' }}>
            Grant Permissions
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
        mode="video"
        active={true}
        mirror={cameraType === 'front'}
        onCameraReady={onCameraReady}
      >
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity onPress={handleBack} style={styles.controlButton}>
            <Feather name="chevron-left" size={24} color="white" />
          </TouchableOpacity>
          
          {/* <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
            <Feather 
              name={
                flashMode === 'off' ? 'zap-off' : 
                flashMode === 'on' ? 'zap' : 'zap'
              } 
              size={24} 
              color="white" 
            />
            {flashMode === 'auto' && (
              <Typography size={10} weight="600" style={{ color: 'white' }}>AUTO</Typography>
            )}
          </TouchableOpacity> */}
        </View>

        {/* Recording timer */}
        {isRecording && (
          <View style={styles.timerContainer}>
            <View style={styles.recordingIndicator} />
            <Typography size={16} weight="600" style={{ color: 'white', marginLeft: 8 }}>
              {formatDuration(recordingDuration)}
            </Typography>
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={[
              styles.flipButton, 
              (!cameraReady || isRecording) && styles.disabledButton
            ]} 
            onPress={toggleCameraType}
            disabled={!cameraReady || isRecording}
          >
            <Feather name="refresh-cw" size={24} color="white" />
          </TouchableOpacity>
          
          {loading ? (
            <View style={styles.recordButton}>
              <ActivityIndicator size="large" color="white" />
            </View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton,
                !cameraReady && styles.disabledButton
              ]} 
              onPress={isRecording ? stopRecording : startRecording}
              disabled={!cameraReady}
            >
              {isRecording && <View style={styles.recordingButtonInner} />}
            </TouchableOpacity>
          )}
          
          <View style={styles.rightPlaceholder} />
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    marginTop: 16
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 8,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 48 : 16,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPlaceholder: {
    width: 50,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.general.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordingButton: {
    backgroundColor: 'red',
    borderColor: 'white',
  },
  recordingButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  }
});

export default CameraScreen;