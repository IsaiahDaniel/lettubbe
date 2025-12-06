import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

const { width: screenWidth } = Dimensions.get('window');

interface VoiceRecordingOverlayProps {
  isVisible: boolean;
  isRecording: boolean;
  duration: number;
  onCancel: () => void;
  onSend: () => void;
  waveformData?: number[];
  isSending?: boolean;
}

const VoiceRecordingOverlay: React.FC<VoiceRecordingOverlayProps> = ({
  isVisible,
  isRecording,
  duration,
  onCancel,
  onSend,
  waveformData = [],
  isSending = false,
}) => {
  const { theme } = useCustomTheme();
  const [recordingPulseAnim] = useState(new Animated.Value(1));
  const [sendPulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    }
  }, [isRecording, recordingPulseAnim]);

  // Pulse animation for send button when not recording
  useEffect(() => {
    if (!isRecording && isVisible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(sendPulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(sendPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    }
  }, [isRecording, isVisible, sendPulseAnim]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Memoized waveform generation for better performance
  const waveformBars = useMemo(() => {
    const numberOfBars = 30; // Fixed smaller number for performance
    
    return Array.from({ length: numberOfBars }, (_, index) => {
      // Use waveform data if available, otherwise use static heights
      const amplitude = waveformData[index % waveformData.length] || (0.3 + Math.sin(index * 0.5) * 0.4);
      const height = 6 + (amplitude * 30);
      
      return (
        <View
          key={index}
          style={[
            styles.waveformBar,
            {
              height,
              backgroundColor: isRecording ? '#ff4444' : 'rgba(255, 255, 255, 0.4)',
            },
          ]}
        />
      );
    });
  }, [waveformData, isRecording]);

  if (!isVisible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
      {/* waveform background */}
      <View style={styles.waveformContainer}>
        {waveformBars}
      </View>
      
      {/* Controls overlay */}
      <View style={styles.controlsContainer}>
        {isRecording ? (
          /* Recording State */
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.recordingInfo}>
              <Animated.View
                style={[
                  styles.recordingDot,
                  {
                    transform: [{ scale: recordingPulseAnim }],
                  },
                ]}
              />
              <Text style={styles.recordingText}>
                {formatDuration(duration)}
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale: sendPulseAnim }] }}>
              <TouchableOpacity
                style={[styles.sendButtonRecording, isSending && styles.sendingButton]}
                onPress={onSend}
                activeOpacity={0.7}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          /* Recorded State - Ready to Send */
          <View style={styles.recordedControls}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.recordedText}>
              {formatDuration(duration)}
            </Text>
            
            <Animated.View style={{ transform: [{ scale: sendPulseAnim }] }}>
              <TouchableOpacity
                style={[styles.sendButton, isSending && styles.sendingButton]}
                onPress={onSend}
                activeOpacity={0.7}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 10,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 4,
  },
  controlsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 20,
    justifyContent: 'space-between',
  },
  recordedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 20,
    justifyContent: 'space-between',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4444',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    fontFamily: 'monospace',
  },
  recordedText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    fontFamily: 'monospace',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.general.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonRecording: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.general.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendingButton: {
    opacity: 0.7,
  },
});

export default VoiceRecordingOverlay;