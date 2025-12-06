import React, { useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Wrapper from "@/components/utilities/Wrapper";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import SearchField from "@/components/ui/inputs/SearchField";
import { Post } from "@/helpers/types/explore/explore";
import { useExploreSearch } from "@/hooks/explore/useExploreSearch";
import SearchResultsView from "@/components/shared/explore/SearchResultsView";
import { useGetVideoItemStore } from "@/store/feedStore";
import { useGetUserIdState } from "@/store/UserStore"; 
import useAuth from "@/hooks/auth/useAuth";

import AddPlaylistHeader from "@/components/shared/profile/playlist/AddPlaylistHeader";
import VideoSearchEmptyState from "@/components/shared/profile/playlist/VideoSearchEmptyState";
import PlaylistVideoItem from "@/components/shared/profile/playlist/PlaylistVideoItem";
import { useVideoPlaylistActions } from "@/hooks/profile/useVideoPlaylistActions";
import { transformPostToVideoItem } from "@/helpers/utils/videoUtils";

const AddPlaylistVideo: React.FC = () => {
  const { theme } = useCustomTheme();
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { setSelectedItem } = useGetVideoItemStore();
  const { userDetails } = useAuth();
  const currentUserId = userDetails?._id;
  const params = useLocalSearchParams();
  const playlistId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const { addedPosts, isPending, pendingPostId, addPostToPlaylist, isPostAddedToPlaylist } = 
    useVideoPlaylistActions({
      onSuccess: (postId, playlistId) => {
        // success feedback
        console.log(`Successfully added video to playlist`);
      },
      onError: (error, postId, playlistId) => {
        console.error(`Failed to add video to playlist:`, error);
      }
    });

  const {
    searchResults,
    isSearching,
    isSearchMode,
    hasMoreSearchResults,
    searchTerm,
    handleSearch,
    loadMoreSearchResults,
    exitSearchMode,
    likePost: likeSearchPost,
    savePost: saveSearchPost
  } = useExploreSearch({});

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (isSearchMode && searchTerm) {
      handleSearch(searchTerm).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [handleSearch, isSearchMode, searchTerm]);

  const handleAddToPlaylist = (post: Post) => {
    // Pass both postId and playlistId
    addPostToPlaylist(post.id, playlistId);
  };

  const handlePostPress = (post: Post) => {
    const videoItem = transformPostToVideoItem(post, currentUserId);
    setSelectedItem(videoItem);
    router.push("/(home)/VideoPlayer");
  };

  // Handle search focus changes
  const handleSearchFocus = (isFocused: boolean) => {
    setSearchFocused(isFocused);
    
    // When blurring search field with empty search term, exit search mode
    if (!isFocused && !searchTerm) {
      exitSearchMode();
    }
  };

  // Handle search submission
  const handleSearchSubmit = (text: string) => {
    handleSearch(text);
  };

  // Handle back press from search
  const handleBackPress = () => {
    exitSearchMode();
    setSearchFocused(false);
  };

  // Generate custom render item for SearchResultsView
  const renderSearchResultWithAddButton = (
    item: Post,
    onPostPress: (post: Post) => void,
  ): React.ReactElement => {
    // Check if the post is added to the specific playlist
    const isAdded = isPostAddedToPlaylist(item.id, playlistId);
    const isLoading = isPending && pendingPostId === item.id;
    
    return (
      <PlaylistVideoItem
        item={item}
        onPostPress={onPostPress}
        onAddToPlaylist={handleAddToPlaylist}
        isAdded={isAdded}
        isLoading={isLoading}
      />
    );
  };

  return (
    <Wrapper>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      
      <AddPlaylistHeader title="Add to Playlist" />
      
      <SearchField
        placeholder="Search videos to add"
        onSearch={handleSearchSubmit}
        onFocusChange={handleSearchFocus}
        initialValue={searchTerm}
        onBackPress={handleBackPress}
      />

      {!isSearchMode && !searchResults.length ? (
        <VideoSearchEmptyState message="Search for videos to add to your playlist" />
      ) : (
        <SearchResultsView
          searchTerm={searchTerm}
          searchResults={searchResults}
          isSearching={isSearching}
          refreshing={refreshing}
          hasMoreSearchResults={hasMoreSearchResults}
          onRefresh={onRefresh}
          onLoadMore={loadMoreSearchResults}
          onPostPress={handlePostPress}
          onLikePost={likeSearchPost}
          onSavePost={saveSearchPost}
          renderCustomItem={renderSearchResultWithAddButton}
        />
      )}
    </Wrapper>
  );
};

export default AddPlaylistVideo;