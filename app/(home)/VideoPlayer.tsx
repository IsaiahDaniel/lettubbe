import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SafeAreaView from 'react-native-safe-area-view';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useVideoPlayerData } from '@/hooks/videoplayer/useVideoPlayerData';
import VideoPlayerView from '@/components/shared/videoplayer/VideoPlayerView';
import VideoInfo from '@/components/shared/videoplayer/VideoInfo';
import ChannelInfo from '@/components/shared/videoplayer/ChannelInfo';
import PlaylistHeader from '@/components/shared/videoplayer/PlaylistHeader';
import VideoInteractions from '@/components/shared/videoplayer/VideoInteractions';
import CommentPreview from '@/components/shared/videoplayer/CommentPreview';
import VideoBottomSheets from '@/components/shared/videoplayer/VideoBottomSheets';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import SeamlessVideoTransition from '@/components/transitions/SeamlessVideoTransition';
import UserProfileBottomSheet from '@/components/ui/Modals/UserProfileBottomSheet';

const VideoPlayer = () => {
  const { theme } = useCustomTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userProfileUserId, setUserProfileUserId] = useState<string | undefined>(undefined);
  const [shouldPauseVideo, setShouldPauseVideo] = useState(false);
  const params = useLocalSearchParams();
  
  const {
    selectedItem,
    profileData,
    comments,
    activeSheet,
    setActiveSheet,
    displayPlaysCount,
    likeCount,
    commentCount,
    displayIsSubscribed,
    displaySubscriberCount,
    showSubscribeButton,
    isSubscribing,
    isPlayingPlaylist,
    playlistData,
    currentPlaylist,
    currentVideoIndex,
    hasNextVideo,
    hasPreviousVideo,
    handleNextVideo,
    handlePreviousVideo,
    handleVideoEnd,
    handleSubscriptionPress,
    handlePlaylistVideoPress,
    trackPlay,
    videoPlayerRefetch,
    userDetails,
  } = useVideoPlayerData();

  // VideoPlayer now expects selectedItem to always be available
  if (!selectedItem) {
    return null; // This should not happen with the wrapper
  }

  // Handle auto-opening comments sheet when coming from notification
  useEffect(() => {
    if (params.showComments === "true" && selectedItem) {
      setActiveSheet("comments");
    }
  }, [params.showComments, selectedItem]);

  // Handle navigation focus/blur to pause/resume video
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - resume video
      setShouldPauseVideo(false);
      
      return () => {
        // Screen is unfocused - pause video
        setShouldPauseVideo(true);
      };
    }, [])
  );

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setShouldPauseVideo(true);
      } else if (nextAppState === 'active') {
        setShouldPauseVideo(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Debug logging for video player
  // useEffect(() => {
  //   console.log("=== VIDEO PLAYER LOADED ===");
  //   console.log("Selected item:", JSON.stringify(selectedItem, null, 2));
  //   console.log("Params:", JSON.stringify(params, null, 2));
  // }, [selectedItem, params]);

  if (!selectedItem) {
    return null;
  }

  const handleAvatarPress = (userId: string) => {
    // If it's the current user's video, navigate to profile tab instead of opening bottom sheet
    if (userId === userDetails?._id) {
      router.push("/(tabs)/profile");
    } else {
      setUserProfileUserId(userId);
    }
  };

  const handleFullscreenChange = (fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        hidden={isFullscreen}
        backgroundColor={Colors[theme].background}
        style={theme === 'dark' ? 'light' : 'dark'}
      />

      <SeamlessVideoTransition
        isFullscreen={isFullscreen}
        onFullscreenChange={handleFullscreenChange}
      >
        <SafeAreaView
          forceInset={{ 
            top: isFullscreen ? 'never' : 'always',
            bottom: isFullscreen ? 'never' : 'always'
          }}
          style={[
            styles.safeArea,
            isFullscreen && styles.fullscreenSafeArea,
            { 
              backgroundColor: isFullscreen ? '#000' : 'transparent',
            }
          ]}
        >
          <View
            style={[
              styles.container,
              isFullscreen && styles.fullscreenContainer,
              { backgroundColor: isFullscreen ? '#000' : Colors[theme].background },
            ]}
          >
            <VideoPlayerView
              videoUrl={selectedItem.videoUrl}
              isFullscreen={isFullscreen}
              onBack={() => {
                // For deep links, ensure we navigate to tabs instead of closing app
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
              isMainPlayer={true}
              onPlayTracked={trackPlay}
              onVideoEnd={handleVideoEnd}
              showPlaylistControls={true}
              onNextVideo={handleNextVideo}
              onPreviousVideo={handlePreviousVideo}
              shouldPause={shouldPauseVideo}
              hasNext={isPlayingPlaylist && currentPlaylist.length > 0 ? hasNextVideo() : false}
              hasPrevious={isPlayingPlaylist && currentPlaylist.length > 0 ? hasPreviousVideo() : false}
              onFullscreenChange={handleFullscreenChange}
              interactionProps={{
                postId: selectedItem._id,
                likeCount: likeCount,
                commentCount: commentCount,
                playsCount: displayPlaysCount,
                onCommentPress: () => setActiveSheet('comments'),
                onSharePress: () => setActiveSheet('share'),
                onPlayPress: () => setActiveSheet('plays'),
                galleryRefetch: videoPlayerRefetch,
              }}
            />

            {!isFullscreen && (
              <ScrollView style={styles.contentContainer}>
              {isPlayingPlaylist && (
                <PlaylistHeader
                  playlistData={playlistData}
                  currentIndex={currentVideoIndex}
                  totalVideos={currentPlaylist.length}
                  onPress={() => setActiveSheet('playlist')}
                />
              )}

              <ChannelInfo
                user={selectedItem.user}
                subscriberCount={displaySubscriberCount}
                isSubscribed={displayIsSubscribed}
                showSubscribeButton={showSubscribeButton}
                onAvatarPress={handleAvatarPress}
                onSubscribe={handleSubscriptionPress}
                isSubscribing={isSubscribing}
              />

              <VideoInfo
                description={selectedItem.description}
                createdAt={selectedItem.createdAt}
                mentions={selectedItem.mentions}
                onAvatarPress={handleAvatarPress}
              />

              <VideoInteractions
                postId={selectedItem._id}
                likeCount={likeCount}
                commentCount={commentCount}
                playsCount={displayPlaysCount}
                onCommentPress={() => setActiveSheet('comments')}
                onSharePress={() => setActiveSheet('share')}
                onPlayPress={() => setActiveSheet('plays')}
                galleryRefetch={videoPlayerRefetch}
              />

              <CommentPreview
                comments={comments}
                commentCount={commentCount}
                onPress={() => setActiveSheet('comments')}
                onAvatarPress={handleAvatarPress}
              />
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </SeamlessVideoTransition>

      <VideoBottomSheets
        activeSheet={activeSheet}
        onClose={() => setActiveSheet(null)}
        postId={selectedItem._id}
        playsCount={displayPlaysCount}
        playlistData={playlistData}
        currentPlaylist={currentPlaylist}
        currentVideoIndex={currentVideoIndex}
        onVideoSelect={handlePlaylistVideoPress}
        videoData={{
          _id: selectedItem._id,
          thumbnail: selectedItem.thumbnail,
          duration: selectedItem.duration,
          description: selectedItem.description,
          user: {
            _id: selectedItem.user?._id,
            username: selectedItem.user?.username,
            firstName: selectedItem.user?.firstName,
            lastName: selectedItem.user?.lastName,
            profilePicture: selectedItem.user?.profilePicture,
          },
        }}
      />

      {/* User Profile Bottom Sheet */}
      <UserProfileBottomSheet
        isVisible={!!userProfileUserId}
        onClose={() => setUserProfileUserId(undefined)}
        userId={userProfileUserId}
      />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'relative',
    flex: 1,
  },
  fullscreenSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    marginTop: 16,
  },
});

export default VideoPlayer;