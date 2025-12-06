import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Typography from '@/components/ui/Typography/Typography';

import { MediaItem } from '../types';
import { useMediaViewerState } from '../hooks/useMediaViewerState';
import { useControlsVisibility } from '../hooks/useControlsVisibility';
import { useMediaGestures } from '../hooks/useMediaGestures';
import { useSingleVideoPlayer } from '../hooks/useSingleVideoPlayer';
import { useMediaDownload } from '@/hooks/useMediaDownload';
import { MediaHeader } from './MediaHeader';
import { MediaIndicators } from './MediaIndicators';
import { MediaCaption } from './MediaCaption';
import { SwipeInstructions } from './SwipeInstructions';
import { VideoControls } from './VideoControls';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface MediaViewerBaseProps {
  visible: boolean;
  mediaItems: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
  senderName?: string;
  timestamp?: string;
  renderMedia: (item: MediaItem, index: number, currentIndex: number, props: any) => React.ReactNode;
  onCleanup?: () => void;
}

export const MediaViewerBase: React.FC<MediaViewerBaseProps> = ({
  visible,
  mediaItems,
  initialIndex = 0,
  onClose,
  senderName,
  timestamp,
  renderMedia,
  onCleanup,
}) => {
  const { currentIndex, setCurrentIndex, animationValues } = useMediaViewerState(
    visible,
    initialIndex,
    onClose
  );

  const { showControls, resetHideControlsTimer, clearTimer } = useControlsVisibility(
    animationValues.controlsOpacity
  );

  const {
    videoPlayer,
    isPlaying,
    duration,
    currentTime,
    isBuffering,
    handlePlayPause,
    handleSeek,
    cleanup,
    isCurrentVideo,
  } = useSingleVideoPlayer(mediaItems, currentIndex);

  const { isDownloading, saveImage, saveVideo } = useMediaDownload();


  const { combinedGesture } = useMediaGestures({
    mediaItems,
    currentIndex,
    animationValues,
    onClose,
    onIndexChange: setCurrentIndex,
    onControlsShow: resetHideControlsTimer,
  });

  const handleMediaPress = useCallback(() => {
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  const handleProgressPress = useCallback((event: any) => {
    if (!duration || duration <= 0) return;
    resetHideControlsTimer();
    const { locationX } = event.nativeEvent;
    const progressBarWidth = SCREEN_WIDTH - 160;
    const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const newTime = newProgress * duration;
    handleSeek(newTime);
  }, [duration, resetHideControlsTimer, handleSeek]);

  const handleClose = useCallback(() => {
    clearTimer();
    cleanup();
    onCleanup?.();
    onClose();
  }, [clearTimer, cleanup, onCleanup, onClose]);

  const handleDownload = useCallback(() => {
    const currentItem = mediaItems[currentIndex];
    if (!currentItem) return;

    resetHideControlsTimer();
    
    if (currentItem.type === 'image') {
      saveImage(currentItem.uri);
    } else if (currentItem.type === 'video') {
      saveVideo(currentItem.uri);
    }
  }, [mediaItems, currentIndex, saveImage, saveVideo, resetHideControlsTimer]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: animationValues.translateY.value },
      { scale: animationValues.scale.value },
    ],
    opacity: animationValues.opacity.value,
  }));

  const scrollAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animationValues.scrollX.value }],
  }));

  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animationValues.controlsOpacity.value,
  }));

  useEffect(() => {
    if (!visible) {
      cleanup();
      onCleanup?.();
    }
  }, [visible, cleanup, onCleanup]);

  const mediaProps = useMemo(() => ({
    onMediaPress: handleMediaPress,
    showControls,
    controlsAnimatedStyle,
    onControlsShow: resetHideControlsTimer,
    onClose: handleClose,
    videoPlayer,
    isCurrentVideo,
    isBuffering,
  }), [
    handleMediaPress,
    showControls,
    controlsAnimatedStyle,
    resetHideControlsTimer,
    handleClose,
    videoPlayer,
    isCurrentVideo,
    isBuffering,
  ]);

  if (!visible) return null;

  if (!mediaItems || mediaItems.length === 0) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.emptyState}>
          <Typography size={16} color="white">No media to display</Typography>
        </View>
      </GestureHandlerRootView>
    );
  }

  const currentItem = mediaItems[currentIndex];

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar hidden />
      
      <Animated.View style={[styles.overlay, { opacity: animationValues.opacity }]} />
      
      <Animated.View style={[styles.header, controlsAnimatedStyle]}>
        <MediaHeader
          visible={showControls}
          senderName={senderName}
          timestamp={timestamp}
          currentIndex={currentIndex}
          totalItems={mediaItems.length}
          onClose={handleClose}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />
      </Animated.View>

      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.mediaContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.mediaScrollContainer, scrollAnimatedStyle]}>
            {mediaItems.map((item, index) => (
              <View key={index} style={styles.mediaSlide}>
                {renderMedia(item, index, currentIndex, mediaProps)}
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <Animated.View style={controlsAnimatedStyle}>
        <MediaCaption
          visible={showControls}
          caption={currentItem?.caption}
        />
      </Animated.View>

      <Animated.View style={controlsAnimatedStyle}>
        <MediaIndicators
          visible={showControls}
          currentIndex={currentIndex}
          totalItems={mediaItems.length}
        />
      </Animated.View>

      {isCurrentVideo && (
        <Animated.View style={controlsAnimatedStyle}>
          <VideoControls
            visible={showControls}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onProgressPress={handleProgressPress}
          />
        </Animated.View>
      )}

      <Animated.View style={controlsAnimatedStyle}>
        <SwipeInstructions
          visible={showControls}
          hasMultipleItems={mediaItems.length > 1}
        />
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  mediaScrollContainer: {
    flexDirection: 'row',
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH * 100,
  },
  mediaSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
});