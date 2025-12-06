import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { VideoControlsProps } from '../types';
import { ProgressBar } from './ProgressBar';

const { width: SCREEN_WIDTH } = Dimensions.get('screen');

export const VideoControls: React.FC<VideoControlsProps> = ({
  visible,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onProgressPress,
}) => {
  if (!visible) return null;

  const handleProgressPress = (event: any) => {
    if (duration <= 0) return;
    
    const { locationX } = event.nativeEvent;
    const progressBarWidth = SCREEN_WIDTH - 160;
    const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const newTime = newProgress * duration;
    
    onSeek(newTime);
    onProgressPress(event);
  };

  return (
    <View style={styles.videoControls}>
      <TouchableOpacity
        style={styles.playPauseButton}
        onPress={onPlayPause}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
      
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        onPress={handleProgressPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  videoControls: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 3,
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});