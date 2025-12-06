import React from 'react';
import { View, StyleSheet } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import { Images } from '@/constants';

interface ChatAvatarProps {
  avatarUrl: string;
  isOnline: boolean;
  size?: number;
}

const ChatAvatar = ({ avatarUrl, isOnline, size = 50 }: ChatAvatarProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Avatar
        imageSource={avatarUrl ? { uri: avatarUrl } : Images.avatar}
        size={size}
        uri={!!avatarUrl}
        showRing={true}
        gapSize={1.9}
      />
      {isOnline && <View style={styles.onlineIndicator} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C851',
    position: 'absolute',
    top: 2,
    right: 2,
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default ChatAvatar;