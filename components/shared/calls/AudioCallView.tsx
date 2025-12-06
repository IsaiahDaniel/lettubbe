import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '@/components/ui/Avatar';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface AudioCallViewProps {
  remoteParticipant: any;
}

export default function AudioCallView({ remoteParticipant }: AudioCallViewProps) {
  const { theme } = useCustomTheme();
  
  const gradientColors = theme === 'dark' 
    ? ['#2a1e33', '#0a2c3d'] as const
    : ['#f0d6ff', '#b4e4ff'] as const;

  const avatarUrl = `https://randomuser.me/api/portraits/${remoteParticipant.contact.id === 'me' ? 'lego/1' : remoteParticipant.contact.id % 2 === 0 ? 'men' : 'women'}/${remoteParticipant.contact.id}.jpg`;
  
  return (
    <LinearGradient colors={gradientColors} style={styles.gradientBackground}>
      <View style={styles.avatarContainer}>
        <Avatar
          imageSource={avatarUrl}
          uri={!!remoteParticipant?.contact.avatar}
          alt={remoteParticipant?.contact.name || 'Unknown'}
          size={140}
          ringColor="white"
          ringThickness={3}
          showRing={true}
          style={styles.avatarStyle}
        />
      </View>
      <View style={styles.audioVisualization} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarStyle: {
    borderColor: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  audioVisualization: {
    height: 60,
    width: '100%',
    position: 'absolute',
    bottom: 200,
  },
});