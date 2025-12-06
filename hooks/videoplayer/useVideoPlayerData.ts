import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useGetVideoItemStore } from '@/store/feedStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useInteractionStore } from '@/hooks/interactions/useInteractionStore';
import useAuth from '@/hooks/auth/useAuth';
import useGetPublicProfile from '@/hooks/profile/useGetPublicProfile';
import useGetComments from '@/hooks/feeds/useGetComments';
import useSinglePlaylist from '@/hooks/profile/useSinglePlaylist';
import useGetPlaylistVideos from '@/hooks/profile/useGetPlaylistVideos';
import useSubscription from '@/hooks/profile/useSubscription';
import { useVideoPlay } from '@/hooks/feeds/useVideoPlay';
import { useGlobalInteractions } from '@/hooks/interactions/useGlobalInteractions';

type SheetType = 'comments' | 'plays' | 'share' | 'playlist';

export const useVideoPlayerData = () => {
  const queryClient = useQueryClient();
  const { selectedItem, setSelectedItem } = useGetVideoItemStore();
  const { userDetails } = useAuth();
  const [activeSheet, setActiveSheet] = useState<SheetType | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Playlist store
  const {
    isPlayingPlaylist,
    hasNextVideo,
    hasPreviousVideo,
    nextVideo,
    previousVideo,
    clearPlaylist,
    playlistId,
    currentPlaylist,
    currentVideoIndex,
    setCurrentIndex,
  } = usePlaylistStore();

  // Always call all hooks - even if selectedItem is null
  // Debug logging for playlist ID in useVideoPlayerData
  const invalidIds = ['video', 'photo', 'community', 'streaming'];
  const isInvalidPlaylistId = playlistId && invalidIds.includes(playlistId);
  
  if (isInvalidPlaylistId) {
    console.error('🚨 VIDEO PLAYER DEBUG: Invalid playlistId detected in useVideoPlayerData!', {
      playlistId,
      selectedItemId: selectedItem?._id,
      stackTrace: new Error().stack
    });
  }
  
  console.log('🎵 VIDEO PLAYER DEBUG: useVideoPlayerData called with:', {
    playlistId,
    selectedItemId: selectedItem?._id,
    isPlayingPlaylist,
    isInvalid: isInvalidPlaylistId
  });

  // Get playlist data
  const { playlistData } = useSinglePlaylist(playlistId || '');
  const { playlistVideos } = useGetPlaylistVideos(playlistId || '');

  // Get comments - only when comments sheet is active
  const { data: comments, isPending: commentsLoading } = useGetComments(selectedItem?._id || '', {
    enabled: activeSheet === 'comments' && !!selectedItem?._id
  });
  
  console.log('🔍 Comments - postId:', selectedItem?._id);
  console.log('🔍 Comments - loading:', commentsLoading);
  console.log('🔍 Comments - data:', JSON.stringify(comments, null, 2));

  // Get profile data - use empty string if no selectedItem
  const {
    data: profileData,
    isPending: profileLoading,
    refetch: refetchProfile,
  } = useGetPublicProfile(selectedItem?.user?._id || '');

  // Video play tracking - use empty string if no selectedItem
  const { playsCount: localPlaysCount, trackPlay } = useVideoPlay({
    postId: selectedItem?._id || '',
    initialPlaysCount: selectedItem?.viewCount || 0,
    onPlayTracked: (newCount) => {
      if (selectedItem?._id) {
        const { updatePostPlaysCount } = useInteractionStore.getState();
        updatePostPlaysCount(selectedItem._id, newCount);
      }
    },
  });

  const { getPlaysCount, syncLikedPosts } = useInteractionStore();
  const displayPlaysCount = selectedItem?._id ? (getPlaysCount(selectedItem._id) || localPlaysCount) : 0;

  // User ID is now managed globally in _layout.tsx

  // Refetch function
  const videoPlayerRefetch = useCallback(async (): Promise<void> => {
    try {
      await queryClient.invalidateQueries({
        predicate: (query: any) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            (queryKey[0] === 'userFeeds' ||
              queryKey[0] === 'feeds' ||
              queryKey[0] === 'userUploads' ||
              queryKey[0] === 'posts' ||
              queryKey.includes('feed') ||
              queryKey.includes('post'))
          );
        },
      });
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error('VideoPlayer refetch error:', error);
    }
  }, [queryClient]);

  // Global interactions - use empty string if no selectedItem
  const { handleLikePost, isLiked } = useGlobalInteractions(selectedItem?._id || '', {
    galleryRefetch: videoPlayerRefetch,
    feedsQueryKey: ['userFeeds'],
  });

  // Subscription data
  const currentSubscriptionData = {
    isSubscribed: profileData?.isSubscribed ?? false,
    subscriberCount: profileData?.subscriberCount ?? 0,
  };

  const {
    isSubscribed: hookIsSubscribed,
    subscriberCount: hookSubscriberCount,
    isLoading: isSubscribing,
    handleSubscribe,
    handleUnsubscribe,
  } = useSubscription({
    initialIsSubscribed: currentSubscriptionData.isSubscribed,
    initialSubscriberCount: currentSubscriptionData.subscriberCount,
    onSubscriptionChange: (newIsSubscribed, newCount) => {
      refetchProfile();
    },
  });

  // Handle subscription
  const handleSubscriptionPress = useCallback(async () => {
    if (!selectedItem?.user?._id) return;

    try {
      if (hookIsSubscribed) {
        await handleUnsubscribe(selectedItem.user._id);
      } else {
        await handleSubscribe(selectedItem.user._id);
      }
    } catch (error) {
      console.error('Subscription action failed:', error);
    }
  }, [hookIsSubscribed, handleSubscribe, handleUnsubscribe, selectedItem?.user?._id]);

  // Handle playlist video press
  const handlePlaylistVideoPress = useCallback(
    (videoItem: any, videoIndex: number) => {
      setSelectedItem(videoItem);
      setCurrentIndex(videoIndex);
      setActiveSheet(null);
    },
    [setSelectedItem, setCurrentIndex]
  );

  // Handle next/previous video with safety checks
  const handleNextVideo = useCallback(() => {
    try {
      if (isPlayingPlaylist && currentPlaylist.length > 0 && hasNextVideo()) {
        const nextVideoItem = nextVideo();
        if (nextVideoItem && nextVideoItem._id) {
          console.log('Moving to next video:', nextVideoItem._id);
          setSelectedItem(nextVideoItem as any);
        }
      }
    } catch (error) {
      console.error('Error navigating to next video:', error);
    }
  }, [isPlayingPlaylist, currentPlaylist.length, hasNextVideo, nextVideo, setSelectedItem]);

  const handlePreviousVideo = useCallback(() => {
    try {
      if (isPlayingPlaylist && currentPlaylist.length > 0 && hasPreviousVideo()) {
        const prevVideoItem = previousVideo();
        if (prevVideoItem && prevVideoItem._id) {
          console.log('Moving to previous video:', prevVideoItem._id);
          setSelectedItem(prevVideoItem as any);
        }
      }
    } catch (error) {
      console.error('Error navigating to previous video:', error);
    }
  }, [isPlayingPlaylist, currentPlaylist.length, hasPreviousVideo, previousVideo, setSelectedItem]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    try {
      if (isPlayingPlaylist && currentPlaylist.length > 0 && hasNextVideo()) {
        setTimeout(() => {
          handleNextVideo();
        }, 1000);
      }
    } catch (error) {
      console.error('Error handling video end:', error);
    }
  }, [isPlayingPlaylist, currentPlaylist.length, hasNextVideo, handleNextVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPlayingPlaylist) {
        clearPlaylist();
      }
    };
  }, [isPlayingPlaylist, clearPlaylist]);

  // Calculate values with null safety
  const likeCount = selectedItem?.reactions?.likes?.length || 0;
  const commentCount = selectedItem?.commentCount || comments?.length || 0;
  const displayIsSubscribed = hookIsSubscribed;
  const displaySubscriberCount = hookSubscriberCount;
  const showSubscribeButton = selectedItem?.user?._id !== userDetails?._id;

  console.log('🔍 useVideoPlayerData - about to return comments:', JSON.stringify(comments, null, 2));
  console.log('🔍 useVideoPlayerData - commentCount:', commentCount);

  // Now return early AFTER all hooks have been called
  if (!selectedItem) {
    return {
      selectedItem: null,
      profileData: null,
      comments: [],
      activeSheet: null,
      setActiveSheet: () => {},
      displayPlaysCount: 0,
      likeCount: 0,
      commentCount: 0,
      displayIsSubscribed: false,
      displaySubscriberCount: 0,
      showSubscribeButton: false,
      isSubscribing: false,
      isPlayingPlaylist: false,
      playlistData: null,
      currentPlaylist: [],
      currentVideoIndex: 0,
      hasNextVideo: () => false,
      hasPreviousVideo: () => false,
      handleNextVideo: () => {},
      handlePreviousVideo: () => {},
      handleVideoEnd: () => {},
      handleSubscriptionPress: () => {},
      handlePlaylistVideoPress: () => {},
      trackPlay: () => {},
      videoPlayerRefetch: () => Promise.resolve(),
      handleLikePost: () => {},
      isLiked: false,
      userDetails: null,
    };
  }

  return {
    selectedItem,
    profileData,
    comments,
    isFullscreen,
    setIsFullscreen,
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
    handleSubscriptionPress,
    handlePlaylistVideoPress,
    handleNextVideo,
    handlePreviousVideo,
    handleVideoEnd,
    trackPlay,
    videoPlayerRefetch,
    handleLikePost,
    isLiked,
    userDetails,
  };
};