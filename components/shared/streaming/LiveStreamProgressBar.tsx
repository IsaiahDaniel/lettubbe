import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';

interface LiveStreamProgressBarProps {
  currentTime: number;
  duration: number;
  isLive?: boolean;
  onSeek?: (time: number) => void;
  onSeekStart?: () => void;
  onSeekComplete?: (time: number) => void;
  onJumpToLive?: () => void;
  style?: any;
}

export const LiveStreamProgressBar: React.FC<LiveStreamProgressBarProps> = ({
  currentTime,
  duration,
  isLive = true,
  onSeek,
  onSeekStart,
  onSeekComplete,
  onJumpToLive,
  style
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(currentTime);

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekTime(currentTime);
    onSeekStart?.();
  };

  const handleSeek = (value: number) => {
    setSeekTime(value);
    onSeek?.(value);
  };

  const handleSeekComplete = (value: number) => {
    setIsSeeking(false);
    onSeekComplete?.(value);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayTime = isSeeking ? seekTime : currentTime;
  const isAtLiveEdge = duration > 0 && currentTime >= duration - 5; // Within 5 seconds of live
  const showLiveIndicator = isLive && isAtLiveEdge && !isSeeking;

  return (
    <View style={[styles.container, style]}>
      {/* Time and Live Indicator */}
      <View style={styles.timeSection}>
        {showLiveIndicator ? (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Typography size={12} color="white" weight="600">
              LIVE
            </Typography>
          </View>
        ) : (
          <Typography size={12} color="rgba(255,255,255,0.8)">
            {formatTime(displayTime)} {duration > 0 && `/ ${formatTime(duration)}`}
          </Typography>
        )}

        {/* Jump to Live Button - Show when not at live edge */}
        {isLive && !isAtLiveEdge && (
          <TouchableOpacity
            style={styles.jumpToLiveButton}
            onPress={onJumpToLive}
          >
            <Ionicons name="radio" size={12} color="white" />
            <Typography size={11} color="white" weight="600">
              LIVE
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      {/* <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground} />
        <View
          style={[
            styles.progressBarFill,
            {
              width: duration > 0 ? `${(displayTime / duration) * 100}%` : '0%',
            },
          ]}
        />
        <Slider
          style={styles.progressSlider}
          value={displayTime}
          minimumValue={0}
          maximumValue={duration || 1}
          onValueChange={handleSeek}
          onSlidingStart={handleSeekStart}
          onSlidingComplete={handleSeekComplete}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor={Colors.general.primary}
          disabled={duration === 0}
        />
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 3,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
  jumpToLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  progressBarContainer: {
    height: 20,
    position: 'relative',
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  progressBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 0,
    borderRadius: 1.5,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: Colors.general.primary,
    position: 'absolute',
    left: 0,
    bottom: 8,
    borderRadius: 1.5,
  },
  progressSlider: {
    position: 'absolute',
    left: -9,
    right: -9,
    bottom: 0,
    height: 20,
  },
});

export default LiveStreamProgressBar;