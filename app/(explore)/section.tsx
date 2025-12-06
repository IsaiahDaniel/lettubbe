import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import { Post, ExploreSection } from '@/helpers/types/explore/explore';
import { Video } from '@/helpers/types/feed/types';
import { useExploreSections, SectionType } from '@/hooks/explore/useExploreSections';
import VideoCard from '@/components/shared/home/VideoCard';
import { useGetVideoItemStore, VideoItem } from '@/store/feedStore';
import useAuth from '@/hooks/auth/useAuth';
import BackButton from '@/components/utilities/BackButton';
import Wrapper from '@/components/utilities/Wrapper';
import { useInteractionStore } from '@/hooks/interactions/useInteractionStore';
import ExploreErrorBoundary from '@/components/shared/error/ExploreErrorBoundary';
import NetworkError from '@/components/shared/NetworkError';
import { useVideoAutoplay } from '@/hooks/feeds/useVideoAutoplay';

type SectionTitles = {
  [key in ExploreSection]: string;
};

const sectionTitles: SectionTitles = {
  trending: 'Trending',
  popular: 'Popular',
  forYou: 'For You'
};

const ExploreSectionScreen = () => {
  const { theme } = useCustomTheme();
  const params = useLocalSearchParams<{ section: ExploreSection; category: string }>();
  const section = params.section as ExploreSection || 'trending';
  const category = params.category || 'All';
  const { setSelectedItem } = useGetVideoItemStore();
  const { userDetails } = useAuth();
  const currentUserId = userDetails?._id;
  
  const { posts, loading, error, refetch } = useExploreSections();

  // Autoplay functionality
  const {
    handleViewableItemsChanged,
    viewabilityConfig,
    isVideoPlaying,
    currentPlayingId,
    cleanup: cleanupAutoplay,
  } = useVideoAutoplay();

  // Get the posts for the selected section - memoized to prevent unnecessary re-renders
  const currentSectionPosts = React.useMemo((): Post[] => {
    switch (section) {
      case 'trending':
        return posts.trending || [];
      case 'popular':
        return posts.popular || [];
      case 'forYou':
        return posts.forYou || [];
      default:
        return [];
    }
  }, [section, posts.trending, posts.popular, posts.forYou]);

  // Get the posts for the selected section (kept for backward compatibility)
  const getPosts = (): Post[] => currentSectionPosts;

  // Get loading state for the current section
  const isLoading = (() => {
    switch (section) {
      case 'trending':
        return loading.trending;
      case 'popular':
        return loading.popular;
      case 'forYou':
        return loading.forYou;
      default:
        return false;
    }
  })();

  // Memoized function for transforming Post to VideoItem for navigation
  const transformPostToVideoItem = React.useCallback((post: Post): VideoItem => {
    return {
      _id: post.id,
      description: post.description,
      thumbnail: post.thumbnail,
      videoUrl: post.videoUrl,
      duration: post.duration.toString(),
      user: {
        _id: post.user.id,
        firstName: post.user.firstName || "",
        lastName: post.user.lastName || "",
        profilePicture: post.user.avatar && post.user.avatar.trim() !== "" ? post.user.avatar : "",
        subscribers: [],
        username: post.user.username || undefined,
      },
      reactions: {
        likes: post.isLiked && currentUserId ? [currentUserId] : [],
      },
      comments: Array(post.comments)
        .fill(null)
        .map((_, i) => ({
          _id: `comment-${post.id}-${i}`,
          text: "", // no comment text from search results
          user: {
            _id: "",
            firstName: "",
            lastName: "",
            profilePicture: "",
          },
          createdAt: post.createdAt,
        })),
      viewCount: post.plays,
      createdAt: post.createdAt,
      commentCount: post.comments,
      isCommentsAllowed: post.isCommentsAllowed,
    };
  }, [currentUserId]);

  const handlePostPress = React.useCallback((post: Post) => {
    const videoItem = transformPostToVideoItem(post);
    setSelectedItem(videoItem);
    router.push("/(home)/VideoPlayer");
  }, [transformPostToVideoItem, setSelectedItem]);

  const handleSharePost = (postId: string) => {
    // Implement share functionality here
    console.log('Share post', postId);
  };

  // Memoized transformation for sync data
  const syncData = React.useMemo(() => {
    if (!currentUserId || currentSectionPosts.length === 0) {
      return [];
    }

    return currentSectionPosts.map(post => {
      // Create array with correct length for sync
      const likesArray = new Array(post.likes).fill(null).map((_, i) => `like-${post.id}-${i}`);
      // If user liked it, replace first entry with their ID
      if (post.isLiked && currentUserId) {
        likesArray[0] = currentUserId;
      }

      return {
        _id: post.id,
        reactions: {
          likes: likesArray,
        },
        isBookmarked: post.isSaved,
      };
    });
  }, [currentUserId, currentSectionPosts]);

  // Memoized transformation function for converting Post to Video format
  const transformPostToVideo = React.useCallback((post: Post) => {
    const likesArray = new Array(post.likes).fill(null).map((_, i) => `like-${post.id}-${i}`);
    // If user liked it, replace first entry with their ID
    if (post.isLiked && currentUserId) {
      likesArray[0] = currentUserId;
    }

    return {
      _id: post.id,
      thumbnail: post.thumbnail,
      duration: post.duration.toString(),
      profilePic: post.user.avatar,
      username: post.user.username,
      createdAt: post.createdAt,
      comments: [],
      reactions: {
        likes: likesArray,
      },
      description: post.description,
      videoUrl: post.videoUrl,
      images: [],
      isCommentsAllowed: post.isCommentsAllowed,
      user: {
        _id: post.user.id,
        firstName: post.user.firstName,
        lastName: post.user.lastName,
        profilePicture: post.user.avatar,
        userId: post.user.id,
        username: post.user.username,
        subscribers: [],
      },
      commentCount: post.comments,
      viewCount: post.plays,
      isBookmarked: post.isSaved,
    };
  }, [currentUserId]);

  const renderItem = React.useCallback(({ item }: { item: Post }) => {
    // Use memoized transformation
    const videoData = transformPostToVideo(item);
    const isAutoPlaying = isVideoPlaying(item.id);

    return (
      <VideoCard 
        video={videoData}
        onPress={() => handlePostPress(item)}
        skipInteractionSync={false} // Enable interaction sync for accurate counts
        isAutoPlaying={isAutoPlaying}
      />
    );
  }, [transformPostToVideo, handlePostPress, isVideoPlaying, currentPlayingId]);

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color={Colors.general.blue} />
      </View>
    );
  };

  // Handle network errors
  const currentError = error(section);
  if (currentError) {
    return (
      <Wrapper noPadding>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton />
            <Typography 
              size={24} 
              weight="600" 
              textType="carter"
              style={styles.title}
            >
              {sectionTitles[section] || 'Explore'}
            </Typography>
          </View>
          <NetworkError
            error={currentError}
            refetch={() => refetch(section)}
          />
        </View>
      </Wrapper>
    );
  }

  return (
    <ExploreErrorBoundary onRetry={() => refetch(section)}>
      <Wrapper noPadding>
        <View style={styles.container}>
          <FlatList
            data={currentSectionPosts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onEndReached={undefined}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={() => (
              <View style={styles.header}>
                <BackButton />
                <Typography 
                  size={24} 
                  weight="600" 
                  textType="carter"
                  style={styles.title}
                >
                  {sectionTitles[section] || 'Explore'}
                </Typography>
              </View>
            )}
            ListFooterComponent={renderFooter}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            // Autoplay props
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        </View>
      </Wrapper>
    </ExploreErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    marginLeft: 16,
  },
  listContainer: {
    paddingBottom: 100,
  },
  footer: {
    paddingVertical: 20,
  },
});

export default ExploreSectionScreen;