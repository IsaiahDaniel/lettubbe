import React from 'react';
import { View, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import Badge from '@/components/ui/Badge';
import { Colors } from '@/constants/Colors';

interface ChatHeaderProps {
  displayName: string;
  timestamp: string;
  unreadCount: number;
  theme: 'light' | 'dark';
}

const ChatHeader = ({ displayName, timestamp, unreadCount, theme }: ChatHeaderProps) => {
  return (
    <View style={styles.header}>
      <Typography weight="500" size={14}>
        {displayName}
      </Typography>
      <View style={styles.rightContent}>
        <Typography size={12} color={Colors[theme].textLight}>
          {timestamp}
        </Typography>
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Badge count={unreadCount} size="small" position="relative" />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  rightContent: {
    alignItems: 'center',
    gap: 2,
  },
  badgeContainer: {
    // position: 'absolute',
    // top: 20,
    // right: 0,
  },
});

export default ChatHeader;