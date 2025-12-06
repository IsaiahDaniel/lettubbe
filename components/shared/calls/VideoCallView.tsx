import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import VideoRenderer from '@/components/shared/calls/VideoRenderer';

interface VideoCallViewProps {
  remoteParticipant: any;
  localParticipant: any;
  localVideoEnabled: boolean;
  showControls: boolean;
}

export default function VideoCallView({
  remoteParticipant,
  localParticipant,
  localVideoEnabled,
  showControls
}: VideoCallViewProps) {
  // Check if call is connected (remote participant has a stream)
  const isCallConnected = remoteParticipant?.stream !== undefined;
  
  return (
    <View style={styles.videoContainer}>
      {/* Show remote video if connected, otherwise show local video in full screen */}
      {isCallConnected ? (
        // Connected: Show remote video as main feed
        <VideoRenderer 
          participant={remoteParticipant} 
          style={styles.remoteVideo}
        />
      ) : (
        // Not connected: Show local video as main feed while waiting
        <VideoRenderer 
          participant={localParticipant}
          isLocalVideo={true}
          style={styles.remoteVideo}
        />
      )}
      
      {/* Always show local video in small container if connected and video is enabled */}
      {isCallConnected && localVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <VideoRenderer 
            participant={localParticipant}
            isLocalVideo={true}
            style={styles.localVideo}
          />
        </View>
      )}
      
      {/* Gradient overlay for better visibility of controls */}
      {showControls && (
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'white',
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  localVideo: {
    flex: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});