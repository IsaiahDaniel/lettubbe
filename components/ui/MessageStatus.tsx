import React from 'react';
import { View, StyleSheet } from 'react-native';
import Typography from './Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface MessageStatusProps {
  isSent: boolean;
  isRead: boolean;
  size?: number;
}

const MessageStatus: React.FC<MessageStatusProps> = ({
  isSent,
  isRead,
  size = 12,
}) => {
  const { theme } = useCustomTheme();
  
  if (!isSent) {
    // Message not sent yet (loading/pending)
    return (
      <View style={styles.container}>
        <Typography 
          size={size} 
          color={theme === 'dark' ? '#666' : '#999'}
        >
          sending
        </Typography>
      </View>
    );
  }

  if (isRead) {
    // Message read (blue)
    return (
      <View style={styles.container}>
        <Typography 
          size={size} 
          color="#007AFF"
        >
          seen
        </Typography>
      </View>
    );
  }

  // Message sent but not read (gray)
  return (
    <View style={styles.container}>
      <Typography 
        size={size} 
        color={theme === 'dark' ? '#666' : '#999'}
      >
        sent
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MessageStatus;