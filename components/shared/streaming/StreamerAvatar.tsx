import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import Typography from '@/components/ui/Typography/Typography';
import { Images } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';

interface StreamerAvatarProps {
  name: string;
  avatar: string;
  lastStreamDate: string;
  isLive: boolean;
  onPress?: () => void;
}

const StreamerAvatar = ({ 
  name, 
  avatar, 
  lastStreamDate, 
  isLive, 
  onPress 
}: StreamerAvatarProps) => {
  const { theme } = useCustomTheme();

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar
          imageSource={avatar ? { uri: avatar } : Images.avatar}
          size={100}
          uri={!!avatar}
          showRing={true}
          gapSize={3.7}
        />
        {isLive && <View style={styles.liveIndicator} />}
      </View>
      <View style={styles.textContainer}>
        <Typography
          size={12}
          weight="600"
          color={Colors[theme].textBold}
          numberOfLines={1}
          style={styles.streamerName}
        >
          {name}
        </Typography>
        <Typography
          size={10}
          weight="400"
          color={Colors[theme].textLight}
          numberOfLines={1}
          style={styles.lastStreamDate}
        >
          {lastStreamDate}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    marginHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  liveIndicator: {
    position: 'absolute',
    top: 2,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 100,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: 'white',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  streamerName: {
    marginBottom: 2,
    textAlign: 'center',
  },
  lastStreamDate: {
    textAlign: 'center',
  },
});

export default StreamerAvatar;