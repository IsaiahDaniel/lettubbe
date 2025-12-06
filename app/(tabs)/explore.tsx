import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, StatusBar, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import CategoryList from "@/components/shared/home/CategoryList";
import Wrapper from "@/components/utilities/Wrapper";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import SearchField from "@/components/ui/inputs/SearchField";
import { Post } from "@/helpers/types/explore/explore";
import { useExploreSearch } from "@/hooks/explore/useExploreSearch";
import useSearchCommunities from "@/hooks/useSearchCommunities";
import SearchResultsView from "@/components/shared/explore/SearchResultsView";
import { SearchFilterType } from "@/components/shared/explore/SearchFilterTabs";
import { useGetVideoItemStore, VideoItem } from "@/store/feedStore";
import { useGetUserIdState } from "@/store/UserStore";
import useAuth from "@/hooks/auth/useAuth";
import ExploreContent from "@/components/shared/explore/ExploreContent";
import { useInteractionStore } from "@/hooks/interactions/useInteractionStore";
import ExploreErrorBoundary from "@/components/shared/error/ExploreErrorBoundary";
import NetworkError from "@/components/shared/NetworkError";
import VideoCard from "@/components/shared/home/VideoCard";
import { useVideoAutoplay } from "@/hooks/feeds/useVideoAutoplay";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  description?: string;
}

const ExploreScreen: React.FC = () => {
  const { theme } = useCustomTheme();
  const params = useLocalSearchParams<{ search?: string }>();
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>("top");
  const { setSelectedItem } = useGetVideoItemStore();
  const { userId } = useGetUserIdState();
  const { userDetails } = useAuth();
  const currentUserId = userDetails?._id;
  const { syncLikedPosts, syncBookmarkedPosts } = useInteractionStore();
  

  // Autoplay for search results
  const {
    handleViewableItemsChanged: originalHandleViewableItemsChanged,
    viewabilityConfig,
    isVideoPlaying,
    currentPlayingId,
    cleanup: cleanupAutoplay,
  } = useVideoAutoplay();
  
  // Create stable reference for viewability callback
  const viewabilityCallbackRef = useRef((info: any) => {
    // console.log('🔍 EXPLORE: ===== VIEWABILITY CALLBACK TRIGGERED =====');
    // console.log('🔍 EXPLORE: Viewable items count:', info.viewableItems.length);
    // console.log('🔍 EXPLORE: Original handler exists:', !!originalHandleViewableItemsChanged);
    
    // info.viewableItems.forEach((item: any, index: number) => {
    //   console.log(`🔍 EXPLORE: Item ${index}:`, {
    //     key: item.key,
    //     id: item.item?.id,
    //     isViewable: item.isViewable,
    //     hasVideoUrl: !!item.item?.videoUrl
    //   });
    // });
    
    if (originalHandleViewableItemsChanged) {
      console.log('🔍 EXPLORE: Calling original handler...');
      originalHandleViewableItemsChanged(info);
    } else {
      console.log('🔍 EXPLORE: ❌ No original handler to call!');
    }
  });

  // Update ref when the original handler changes
  useEffect(() => {
    viewabilityCallbackRef.current = (info: any) => {
      console.log('🔍 EXPLORE: Viewability changed - items:', info.viewableItems.length);
      if (originalHandleViewableItemsChanged) {
        originalHandleViewableItemsChanged(info);
      }
    };
  }, [originalHandleViewableItemsChanged]);

  // Stable callback wrapper
  const handleViewableItemsChanged = useCallback((info: any) => {
    viewabilityCallbackRef.current(info);
  }, []);

  const {
    searchResults,
    userResults,
    communityResults,
    isSearching,
    isSearchMode,
    hasMoreSearchResults,
    category,
    searchTerm,
    error: searchError,
    handleSearch,
    loadMoreSearchResults,
    handleCategoryChange,
    exitSearchMode,
    refetchSearch,
    likePost: likeSearchPost,
    savePost: saveSearchPost,
  } = useExploreSearch({
    initialSearchTerm: params.search ? decodeURIComponent(params.search) : ''
  });

  

  // Handle hashtag search from navigation params
  useEffect(() => {
    if (params.search) {
      const searchQuery = decodeURIComponent(params.search);
      handleSearch(searchQuery);
      setSearchFocused(true);
    }
  }, [params.search, handleSearch]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (isSearchMode && searchTerm) {
      handleSearch(searchTerm).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [handleSearch, isSearchMode, searchTerm]);

  // Memoized function for transforming Post to VideoItem for navigation
  const transformPostToVideoItem = React.useCallback((post: Post): VideoItem => {
    // Create array with correct length to show accurate count
    const likesArray = new Array(post.likes).fill(null).map((_, i) => `like-${post.id}-${i}`);
    // If user liked it, replace first entry with their ID
    if (post.isLiked && currentUserId) {
      likesArray[0] = currentUserId;
    }

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
        likes: likesArray,
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
      isCommentsAllowed: post.isCommentsAllowed
    };
  }, [currentUserId]);

  // Custom renderer for hashtag search results
  const renderVideoCardItem = useCallback((post: Post, onPostPress: (post: Post) => void, isAutoPlaying: boolean = false) => {
    console.log('🎥 RENDER_VIDEO_CARD:', {
      postId: post.id,
      isAutoPlaying,
      currentPlayingId,
      shouldAutoPlay: post.id === currentPlayingId
    });
    // Transform Post to Video format for VideoCard
    const likesArray = new Array(post.likes).fill(null).map((_, i) => `like-${post.id}-${i}`);
    if (post.isLiked && currentUserId) {
      likesArray[0] = currentUserId;
    }

    const videoData = {
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
      images: post.images || [],
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

    return (
      <VideoCard
        video={videoData}
        onPress={() => onPostPress(post)}
        skipInteractionSync={false}
        isAutoPlaying={isAutoPlaying}
      />
    );
  }, [currentUserId]);

  const handlePostPress = React.useCallback((post: Post) => {
    const videoItem = transformPostToVideoItem(post);
    setSelectedItem(videoItem);
    router.push("/(home)/VideoPlayer");
  }, [transformPostToVideoItem, setSelectedItem]);

  // Handle search focus changes
  const handleSearchFocus = React.useCallback((isFocused: boolean) => {
    setSearchFocused(isFocused);

    // When blurring search field with empty search term, exit search mode
    if (!isFocused && !searchTerm) {
      exitSearchMode();
    }
  }, [searchTerm, exitSearchMode]);

  // Handle search submission
  const handleSearchSubmit = React.useCallback((text: string) => {
    // Clear URL search parameter to prevent it from overriding user input
    if (params.search) {
      router.replace('/(tabs)/explore');
    }
    handleSearch(text);
  }, [handleSearch, params.search, router]);

  // Handle back press from search
  const handleBackPress = React.useCallback(() => {
    // Clear URL search parameter when going back
    if (params.search) {
      router.replace('/(tabs)/explore');
    }
    exitSearchMode();
    setSearchFocused(false);
  }, [exitSearchMode, params.search, router]);

  // Handle filter change
  const handleFilterChange = React.useCallback((filter: SearchFilterType) => {
    setActiveFilter(filter);
  }, []);

  // Handle community press
  const handleCommunityPress = React.useCallback((community: any) => {
    router.push(`/(community)/${community._id}`);
  }, []);

  // Retry handler for error boundary
  const retryHandler = React.useCallback(() => {
    if (isSearchMode && searchTerm) {
      handleSearch(searchTerm);
    } else {
      onRefresh();
    }
  }, [isSearchMode, searchTerm, handleSearch, onRefresh]);

  // Sync interactions memo
  const syncInteractionsMemo = React.useMemo(() =>
    currentUserId ? { syncLikedPosts, syncBookmarkedPosts } : undefined,
    [currentUserId, syncLikedPosts, syncBookmarkedPosts]
  );

  return (
    <Wrapper noPadding>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />
      <View style={styles.header} />

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <SearchField
          placeholder="Explore Lettubbe+"
          onSearch={handleSearchSubmit}
          onFocusChange={handleSearchFocus}
          initialValue={searchTerm}
          onBackPress={handleBackPress}
        />
      </View>

      {/* Category filter */}
      {/* {!isSearchMode && (
        <View style={styles.filterContainer}>
          <CategoryList
            selectedCategory={category}
            onSelectCategory={handleCategoryChange}
          />
        </View>
      )} */}

      {/* Show either search results or explore content based on search mode */}
      <ExploreErrorBoundary onRetry={retryHandler}>
        {isSearchMode ? (
          <SearchResultsView
            searchTerm={searchTerm}
            searchResults={searchResults}
            userResults={userResults}
            communityResults={communityResults}
            isSearching={isSearching}
            refreshing={refreshing}
            hasMoreSearchResults={hasMoreSearchResults}
            error={searchError}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            onRefresh={onRefresh}
            onLoadMore={loadMoreSearchResults}
            onPostPress={handlePostPress}
            onCommunityPress={handleCommunityPress}
            onRetrySearch={refetchSearch}
            renderCustomItem={renderVideoCardItem}
            // Autoplay props
            handleViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            isVideoPlaying={isVideoPlaying}
            />
        ) : (
          <ExploreContent
            onPostPress={handlePostPress}
            syncInteractions={syncInteractionsMemo}
          />
        )}
      </ExploreErrorBoundary>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 12,
  },
  filterContainer: {
    flexDirection: "row",
    paddingVertical: 16,
  },
});

export default ExploreScreen;
