import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CallParticipant } from '@/helpers/types/chat/call';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';

interface CallInfoProps {
  remoteParticipant: CallParticipant;
  callStatusText: string | null;
  callStartTime: number;
}

const CallInfo = ({ remoteParticipant, callStatusText, callStartTime }: CallInfoProps) => {
  const { theme } = useCustomTheme();
  const [callDuration, setCallDuration] = useState('00:00');
  
  // Format call duration as mm:ss
  useEffect(() => {
    if (!callStartTime) {
      setCallDuration('00:00');
      return;
    }
    
    // Only start timer if we have a valid start time
    const intervalId = setInterval(() => {
      const now = Date.now();
      const diffInSeconds = Math.floor((now - callStartTime) / 1000);
      
      if (diffInSeconds < 0) {
        setCallDuration('00:00');
        return;
      }
      
      const minutes = Math.floor(diffInSeconds / 60);
      const seconds = diffInSeconds % 60;
      
      setCallDuration(
        `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`
      );
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [callStartTime]);
  
  return (
    <View style={styles.container}>
      {/* Display status text or call duration */}
      <Typography 
        style={styles.statusText} 
        color={callStatusText ? Colors[theme].textLight : "#000"}
      >
        {callStatusText || callDuration}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  }
});

export default CallInfo;