import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { MediaItem } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface VideoViewerProps {
  item: MediaItem;
  index: number;
  currentIndex: number;
  onMediaPress: () => void;
  videoPlayer: any;
  isCurrentVideo: boolean;
  isBuffering?: boolean;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({
  item,
  index,
  currentIndex,
  onMediaPress,
  videoPlayer,
  isCurrentVideo,
  isBuffering = false,
}) => {
  const isCurrentItem = index === currentIndex;

  // Only render video player for current item
  if (!isCurrentItem) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={onMediaPress}
        style={styles.container}
      >
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {videoPlayer && !isBuffering ? (
          <VideoView
            player={videoPlayer}
            style={styles.videoMedia}
            contentFit="contain"
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            nativeControls={false}
            startsPictureInPictureAutomatically={false}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Typography 
              size={14} 
              color="rgba(255,255,255,0.8)" 
              style={styles.loadingText}
            >
              Loading video...
            </Typography>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.touchOverlay}
          activeOpacity={1}
          onPress={onMediaPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 2,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 0,
    borderTopWidth: 15,
    borderBottomWidth: 15,
    borderLeftColor: '#000',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 5,
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
});