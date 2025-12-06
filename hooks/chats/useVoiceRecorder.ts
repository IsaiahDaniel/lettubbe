import { useState, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

// explicit module paths
type AudioRecording = import('expo-av/build/Audio/Recording').Recording;

interface VoiceRecorderState {
  isRecording: boolean;
  isLocked: boolean;
  duration: number;
  audioUri: string | null;
  waveformData: number[];
}

interface UseVoiceRecorderReturn {
  state: VoiceRecorderState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  lockRecording: () => void;
  sendVoiceNote: () => Promise<string | null>;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isLocked: false,
    duration: 0,
    audioUri: null,
    waveformData: [],
  });

  const recordingRef = useRef<AudioRecording | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioUriRef = useRef<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record voice messages.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
        waveformData: [],
      }));

      // Start duration timer and waveform generation
      durationTimerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: prev.duration + 0.1,
          // Generate simulated waveform data (later on this would come from audio analysis)
          waveformData: [
            ...prev.waveformData,
            Math.random() * 0.8 + 0.2, // Generate amplitude between 0.2 and 1.0
          ].slice(-100), // Keep only last 100 data points for performance
        }));
      }, 100);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    console.log('🎵 [VOICE_RECORDER] stopRecording called');
    if (!recordingRef.current) {
      console.log('🎵 [VOICE_RECORDER] No active recording to stop');
      return;
    }

    try {
      // Clear timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      console.log('🎵 [VOICE_RECORDER] Stopping and unloading recording');
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      console.log('🎵 [VOICE_RECORDER] Recording stopped, URI:', uri);
      
      // Store the URI in ref for immediate access
      currentAudioUriRef.current = uri;
      
      setState(prev => ({
        ...prev,
        isRecording: false,
        isLocked: false,
        audioUri: uri,
      }));

      recordingRef.current = null;
      console.log('🎵 [VOICE_RECORDER] State updated with audioUri');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, []);

  const cancelRecording = useCallback(() => {
    // Immediately update UI state for responsive feedback
    setState({
      isRecording: false,
      isLocked: false,
      duration: 0,
      audioUri: null,
      waveformData: [],
    });

    // Clear timer immediately
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Cleanup recording asynchronously to avoid blocking UI
    if (recordingRef.current) {
      const recording = recordingRef.current;
      recordingRef.current = null;
      
      // Non-blocking cleanup
      recording.stopAndUnloadAsync().catch((error) => {
        console.warn('Error during recording cleanup:', error);
      });
    }

    // Clear the current audio URI reference
    currentAudioUriRef.current = null;

    // Haptic feedback for cancel
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const lockRecording = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLocked: true,
    }));
    
    // Haptic feedback for lock
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const sendVoiceNote = useCallback(async () => {
    console.log('🎵 [VOICE_RECORDER] sendVoiceNote called, current state:', state);
    
    // Use the ref to get the current audio URI, which is more reliable than state
    const audioUri = currentAudioUriRef.current || state.audioUri;
    
    console.log('🎵 [VOICE_RECORDER] Audio URI to send:', audioUri);
    console.log('🎵 [VOICE_RECORDER] From ref:', currentAudioUriRef.current, 'From state:', state.audioUri);
    
    // Clear the ref and reset state
    currentAudioUriRef.current = null;
    setState({
      isRecording: false,
      isLocked: false,
      duration: 0,
      audioUri: null,
      waveformData: [],
    });

    console.log('🎵 [VOICE_RECORDER] State reset, returning audioUri:', audioUri);
    return audioUri;
  }, [state]);

  return {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
    lockRecording,
    sendVoiceNote,
  };
};