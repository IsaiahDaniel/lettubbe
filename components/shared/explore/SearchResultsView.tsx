import React from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  ListRenderItem,
} from "react-native";
import ScrollAwareFlatList from "@/components/ui/ScrollAwareFlatList";
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";
import { Post } from "@/helpers/types/explore/explore";
import ExploreCard from "@/components/shared/explore/ExploreCard";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import EmptySearch from "./EmptySearch";
import UserListHorizontal from "./UserListHorizontal";
import CommunityListHorizontal from "./CommunityListHorizontal";
import UserListVertical from "./UserListVertical";
import CommunityListVertical from "./CommunityListVertical";
import SearchFilterTabs, { SearchFilterType } from "./SearchFilterTabs";
import NetworkError from "@/components/shared/NetworkError";
import UserProfileBottomSheet from "@/components/ui/Modals/UserProfileBottomSheet";
import { useSearchStore } from "@/store/searchStore";
import Wrapper from "@/components/utilities/Wrapper";

// Static viewability config to prevent FlatList warnings
const STATIC_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 30,
  minimumViewTime: 50,
  waitForInteraction: false,
};

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  description?: string;
  coverPhoto?: string;
}

interface Community {
  _id: string;
  name: string;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  description?: string;
  topics?: string[];
  categories?: string[];
  type: "public" | "private";
  date: string;
  isSetupComplete: boolean;
  members: string[];
  approvals?: string[];
  subAdmins?: string[];
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  coverPhoto?: string;
  isJoined?: boolean;
}

interface SearchResultsViewProps {
  searchTerm: string;
  searchResults: Post[];
  userResults?: User[];
  communityResults?: Community[];
  isSearching: boolean;
  refreshing: boolean;
  hasMoreSearchResults: boolean;
  error?: string | null;
  activeFilter?: SearchFilterType;
  onFilterChange?: (filter: SearchFilterType) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  onPostPress: (post: Post) => void;
  onUserPress?: (user: User) => void;
  onCommunityPress?: (community: Community) => void;
  onLikePost?: (postId: string) => Promise<void>;
  onSavePost?: (postId: string) => Promise<void>;
  onRetrySearch?: () => void;
  renderCustomItem?: (item: Post, onPostPress: (post: Post) => void, isAutoPlaying?: boolean) => React.ReactElement;
  // Autoplay props
  handleViewableItemsChanged?: (info: { viewableItems: any[] }) => void;
  viewabilityConfig?: any;
  isVideoPlaying?: (videoId: string) => boolean;
}

const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  searchTerm,
  searchResults,
  userResults = [],
  communityResults = [],
  isSearching,
  refreshing,
  hasMoreSearchResults,
  error,
  activeFilter = "top",
  onFilterChange,
  onRefresh,
  onLoadMore,
  onPostPress,
  onUserPress,
  onCommunityPress,
  onLikePost,
  onSavePost,
  onRetrySearch,
  renderCustomItem,
  // Autoplay props
  handleViewableItemsChanged,
  viewabilityConfig,
  isVideoPlaying,
}) => {
  const { theme } = useCustomTheme();
  const { openProfileSheetUserId, closeProfileSheet } = useSearchStore();
  

  // console.log("search results", JSON.stringify(searchResults, null, 2));
  // console.log("user results", JSON.stringify(userResults, null, 2));

  // Render footer with loading indicator when loading more
  const renderFooter = () => {
    if (!hasMoreSearchResults) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator color={Colors.general.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    // Show error state if there's an error
    if (error) {
      return (
        <NetworkError
          error={error}
          refetch={onRetrySearch || (() => {})}
        />
      );
    }

    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Typography textType="textBold" style={styles.loadingText}>
            Searching...
          </Typography>
        </View>
      );
    }

    // Show empty state for specific active filters
    if (searchTerm) {
      if (activeFilter === "channels" && !userResults.length) {
        return (
          <EmptySearch
            searchTerm={searchTerm}
            message="No channels found. Try different keywords."
          />
        );
      }

      if (activeFilter === "communities" && !communityResults.length) {
        return (
          <EmptySearch
            searchTerm={searchTerm}
            message="No communities found. Try different keywords."
          />
        );
      }

      if ((activeFilter === "posts" || activeFilter === "latest") && !searchResults.length) {
        return (
          <EmptySearch
            searchTerm={searchTerm}
            message="No posts found. Try different keywords."
          />
        );
      }

      // For "top" filter, show empty state only when all categories are empty
      if (activeFilter === "top" && !searchResults.length && !userResults.length && !communityResults.length) {
        return (
          <EmptySearch
            searchTerm={searchTerm}
            message="No results found. Try different keywords or filters."
          />
        );
      }
    }

    return null;
  };

  // Render an item based on active filter
  const renderItem: ListRenderItem<any> = ({ item }) => {
    // Handle different item types based on active filter
    if (activeFilter === "channels") {
      // Don't render individual items for channels - use vertical list in header
      return null;
    }
    
    if (activeFilter === "communities") {
      // Don't render individual items for communities - use vertical list in header
      return null;
    }
    
    // For posts (default)
    if (renderCustomItem) {
      const isAutoPlaying = isVideoPlaying ? isVideoPlaying(item.id) : false;
      return renderCustomItem(item, onPostPress, isAutoPlaying);
    }
    
    return (
      <ExploreCard
        item={item}
        onPress={() => onPostPress(item)}
      />
    );
  };

  // Render header with filter tabs and content based on active filter
  const renderHeader = () => {
    const hasUsers = userResults && userResults.length > 0;
    const hasCommunities = communityResults && communityResults.length > 0;
    const hasPosts = searchResults && searchResults.length > 0;
    
    if (!searchTerm || (!hasUsers && !hasCommunities && !hasPosts)) {
      return null;
    }

    const resultCounts = {
      channels: userResults.length,
      communities: communityResults.length,
      posts: searchResults.length,
    };

    return (
      <View style={styles.headerContainer}>
        {/* Search Filter Tabs */}
        {onFilterChange && (
          <SearchFilterTabs
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            resultCounts={resultCounts}
          />
        )}

        {/* Content based on active filter */}
        {activeFilter === "top" && hasUsers && (
          <UserListHorizontal
            users={userResults}
            title="Channels"
            onUserPress={onUserPress}
            showTitle={true}
          />
        )}

        {activeFilter === "top" && hasCommunities && (
          <CommunityListHorizontal
            communities={communityResults}
            title="Communities"
            onCommunityPress={onCommunityPress}
            showTitle={true}
          />
        )}

        {/* Vertical lists for specific tabs */}
        {activeFilter === "channels" && hasUsers && (
          <UserListVertical
            users={userResults}
            onUserPress={onUserPress}
          />
        )}

        {activeFilter === "communities" && hasCommunities && (
          <CommunityListVertical
            communities={communityResults}
            onCommunityPress={onCommunityPress}
          />
        )}

        {/* Posts Section Header */}
        {/* {(activeFilter === "top" || activeFilter === "posts" || activeFilter === "latest") && hasPosts && (
          <View style={styles.postsHeader}>
            <Typography textType="textBold" size={16}>
              {activeFilter === "top" ? "Posts" : 
               activeFilter === "latest" ? "Latest Posts" : 
               `Results for "${searchTerm}"`}
            </Typography>
            <Typography
              color={Colors[theme].textLight}
              size={14}
              style={styles.count}
            >
              {searchResults.length}{" "}
              {searchResults.length === 1 ? "post" : "posts"} found
            </Typography>
          </View>
        )} */}

        {/* Overall Results Summary for "top" filter */}
        {/* {activeFilter === "top" && (hasUsers || hasCommunities || hasPosts) && (
          <View style={styles.summaryHeader}>
            <Typography
              color={Colors[theme].textLight}
              size={14}
              style={styles.summaryText}
            >
              Results for "{searchTerm}": {userResults.length} channels, {communityResults.length} communities, {searchResults.length} posts
            </Typography>
          </View>
        )} */}
      </View>
    );
  };

  // Filter data based on active filter
  const getFilteredData = () => {
    switch (activeFilter) {
      case "channels":
        return userResults; // Return users for channels filter
      case "communities":
        return communityResults; // Return communities for communities filter
      case "posts":
      case "latest":
      case "top":
      default:
        return searchResults;
    }
  };

  const filteredData = getFilteredData();
  
  // For channels and communities tabs, don't render items in FlatList (they're in header)
  const listData = (activeFilter === "channels" || activeFilter === "communities") ? [] : filteredData;

  return (
    <View style={styles.container}>
      <ScrollAwareFlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          <View>
            {renderFooter()}
            <ScrollBottomSpace />
          </View>
        }
        onEndReached={hasMoreSearchResults ? onLoadMore : null}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        // Autoplay props - using static config to prevent FlatList errors
        onViewableItemsChanged={handleViewableItemsChanged ? (info) => {
          console.log('🔍 SCROLLAWARE_FLATLIST: onViewableItemsChanged called with', info.viewableItems.length, 'items');
          handleViewableItemsChanged(info);
        } : undefined}
        viewabilityConfig={STATIC_VIEWABILITY_CONFIG}
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
      
      {/* UserProfileBottomSheet - rendered outside FlatList to prevent re-renders */}
      {openProfileSheetUserId && (
        <UserProfileBottomSheet
          key={`profile-sheet-${openProfileSheetUserId}`}
          isVisible={!!openProfileSheetUserId}
          onClose={closeProfileSheet}
          userId={openProfileSheetUserId}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
  },
  headerContainer: {
    paddingBottom: 8,
    marginHorizontal: 16
  },
  summaryHeader: {
    // paddingHorizontal: 16,
    paddingBottom: 8,
  },
  summaryText: {
    // textAlign: "center",
    fontStyle: "italic",
  },
  postsHeader: {
    // paddingHorizontal: 16,
    paddingVertical: 8,
  },
  count: {
    marginTop: 4,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default React.memo(SearchResultsView);