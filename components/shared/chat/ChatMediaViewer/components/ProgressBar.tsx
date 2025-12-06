import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { formatTime, calculateProgress } from '../utils/timeUtils';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onPress: (event: any) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onPress,
}) => {
  const progress = calculateProgress(currentTime, duration);

  return (
    <View style={styles.progressContainer}>
      <Typography size={12} color="white" style={styles.timeText}>
        {formatTime(currentTime)}
      </Typography>
      
      <TouchableOpacity
        style={styles.progressBar}
        activeOpacity={1}
        onPress={onPress}
      >
        <View style={styles.progressTrack} />
        <View 
          style={[styles.progressFill, { width: `${progress}%` }]} 
        />
        <View
          style={[styles.progressHandle, { left: `${progress}%` }]}
        />
      </TouchableOpacity>
      
      <Typography size={12} color="white" style={styles.timeText}>
        {formatTime(duration)}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    minWidth: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 5,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: -8,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});