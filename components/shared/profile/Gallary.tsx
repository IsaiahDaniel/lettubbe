import { View, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useFocusEffect } from '@react-navigation/native';
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import ScrollAwareFlatList from "@/components/ui/ScrollAwareFlatList";
import AppMenu from "@/components/ui/AppMenu";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import PlaylistCard from "./PlaylistCard";
import { router } from "expo-router";
import VideoCard from "../home/VideoCard";
import VideoSkeletonList from "./VideoSkeletonList";
import { useGetVideoItemStore } from "@/store/feedStore";
import EmptyState from "@/components/shared/chat/EmptyState";
import useAuth from "@/hooks/auth/useAuth";
import useUser from "@/hooks/profile/useUser";
import { useProfilePic } from "@/hooks/auth/useProfilePic";
import useSelectPostFilter from "@/hooks/profile/useSelectPostFIlter";
import useGetUserPublicUploads from "@/hooks/upload/useGetUserPublicUploads";
import { useVideoAutoplay } from "@/hooks/feeds/useVideoAutoplay";

const emptyStates = {
  Videos: {
    title: "No Videos",
    subtitle: "",
    image: require("@/assets/images/Empty.png"),
  },
  Photos: {
    title: "No Photos",
    subtitle: "",
    image: require("@/assets/images/Empty.png"),
  },
  Playlist: {
    title: "No Playlists",
    subtitle: "",
    image: require("@/assets/images/Empty.png"),
  },
};

const filters = [
  { name: "Latest", value: "latest" },
  { name: "Oldest", value: "oldest" },
  { name: "Most Popular", value: "most_popular" },
];

interface GalleryProps {
  playlists: any;
  vidoes?: any;
  photos?: any;
  totalVideos?: number;
  totalPhotos?: number;
  type?: string;
  disableAvatarPress?: boolean;
  customUserInfo?: {
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    username?: string;
  } | null;
  userId?: string;
  galleryRefetch?: () => Promise<any>;
  isLoadingVideos?: boolean;
  isLoadingPhotos?: boolean;
  // Pagination props
  onLoadMoreVideos?: () => void;
  hasMoreVideos?: boolean;
  isLoadingMoreVideos?: boolean;
  onLoadMorePhotos?: () => void;
  hasMorePhotos?: boolean;
  isLoadingMorePhotos?: boolean;
  onLoadMorePlaylists?: () => void;
  hasMorePlaylists?: boolean;
  isLoadingMorePlaylists?: boolean;
  // Header component for FlatList
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  // Refresh control
  refreshing?: boolean;
  onRefresh?: () => void;
}

const Gallery: React.FC<GalleryProps> = React.memo(({
  playlists,
  vidoes,
  photos,
  totalVideos,
  totalPhotos,
  type = "private",
  disableAvatarPress = false,
  customUserInfo = null,
  userId,
  galleryRefetch,
  isLoadingVideos = false,
  isLoadingPhotos = false,
  // Pagination props
  onLoadMoreVideos,
  hasMoreVideos,
  isLoadingMoreVideos,
  onLoadMorePhotos,
  hasMorePhotos,
  isLoadingMorePhotos,
  onLoadMorePlaylists,
  hasMorePlaylists,
  isLoadingMorePlaylists,
  // Header component
  ListHeaderComponent,
  // Refresh control
  refreshing = false,
  onRefresh,
}) => {
  const { theme } = useCustomTheme();
  const [activeTab, setActiveTab] = useState("Videos");
  const [filter, setFilter] = useState("Latest");
  const { userDetails } = useAuth();
  const { profileData } = useUser();
  const { profilePic } = useProfilePic();
  const flatListRef = useRef<any>(null);

  const { setSelectedItem } = useGetVideoItemStore();
  useSelectPostFilter(filter, setFilter);

  // Autoplay system integration
  const {
    handleViewableItemsChanged,
    viewabilityConfig,
    isVideoPlaying,
    currentPlayingId,
    cleanup: cleanupAutoplay,
  } = useVideoAutoplay();

  // Cleanup autoplay on unmount
  useEffect(() => {
    return () => {
      cleanupAutoplay();
    };
  }, [cleanupAutoplay]);

  // Stop autoplay when screen loses focus
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - autoplay can resume naturally
      return () => {
        // Screen is losing focus - stop all autoplay immediately
        cleanupAutoplay();
      };
    }, [cleanupAutoplay])
  );


  // If no galleryRefetch is provided but we have a userId, create default ones
  const { refetch: refetchUserVideos } = useGetUserPublicUploads(
    userId || userDetails?._id, { type: "videos" }
  );
  const { refetch: refetchUserPhotos } = useGetUserPublicUploads(
    userId || userDetails?._id, { type: "photos" }
  );

  // Return a Promise from handleRefresh
  const handleRefresh = useCallback((): Promise<any> => {
    console.log("Refreshing gallery");
    // Use provided galleryRefetch if available, otherwise use default
    if (galleryRefetch) {
      return galleryRefetch();
    } else if (type === "public" && userId) {
      if (activeTab === "Videos") {
        return refetchUserVideos();
      } else if (activeTab === "Photos") {
        return refetchUserPhotos();
      }
    }
    // For private gallery with no provided refetch, return a resolved promise
    return Promise.resolve();
  }, [type, userId, refetchUserVideos, refetchUserPhotos, galleryRefetch, activeTab]);

  // Memoized user info to prevent recreating objects
  const memoizedUserInfo = useMemo(() => {
    if (customUserInfo) {
      return {
        ...customUserInfo,
        _id: userId,
      };
    }

    return {
      _id: type === "private" ? userDetails?._id : userId,
      firstName:
        type === "private"
          ? profileData?.data?.firstName || userDetails?.firstName
          : undefined,
      lastName:
        type === "private"
          ? profileData?.data?.lastName || userDetails?.lastName
          : undefined,
      profilePicture:
        type === "private"
          ? profilePic || ""
          : undefined,
      username:
        type === "private"
          ? profileData?.data?.username || userDetails?.username
          : undefined,
    };
  }, [customUserInfo, type, profileData, userDetails, profilePic, userId]);

  // video press handler
  const handleVideoPress = useCallback((item: any) => {
    console.log('Gallery handleVideoPress - Original item:', item);
    console.log('Gallery handleVideoPress - User info:', {
      customUserInfo,
      type,
      profileData: profileData?.data,
      userDetails
    });

    const enhancedItem = {
      ...item,
      user: customUserInfo
        ? {
          // When customUserInfo is provided (from public profile)
          _id: item.user?._id || userId,
          ...item.user,
          firstName: customUserInfo.firstName,
          lastName: customUserInfo.lastName,
          profilePicture: customUserInfo.profilePicture,
          username: customUserInfo.username,
        }
        : {
          // When using default user info (private profile or no custom info)
          _id: item.user?._id || (type === "private" ? userDetails?._id : item.user?._id),
          ...item.user,
          firstName:
            type === "private"
              ? profileData?.data?.firstName || userDetails?.firstName
              : item?.user?.firstName,
          lastName:
            type === "private"
              ? profileData?.data?.lastName || userDetails?.lastName
              : item?.user?.lastName,
          profilePicture:
            type === "private"
              ? profilePic || ""
              : item?.user?.profilePicture,
          username:
            type === "private"
              ? profileData?.data?.username || userDetails?.username
              : item?.user?.username,
        },
    };

    console.log('Gallery handleVideoPress - Enhanced item:', enhancedItem);
    console.log('Gallery handleVideoPress - Enhanced user:', enhancedItem.user);

    setSelectedItem(enhancedItem);
    router.push({
      pathname: "/(home)/VideoPlayer",
      params: {
        item: enhancedItem as any,
      },
    });
  }, [customUserInfo, type, profileData, userDetails, profilePic, setSelectedItem, userId]);

  // Avatar press handler
  const handleAvatarPress = useCallback((item: any) => {
    if (disableAvatarPress) return undefined;

    // if (type === "public") {
    //   return () => {
    //     router.push({
    //       pathname: "/(profile)/UserProfile",
    //       params: {
    //         userId: item?.user?._id as any,
    //       },
    //     });
    //   };
    // }
    return undefined;
  }, [disableAvatarPress, type]);

  // Optimized video card renderer
  const renderVideoCard = useCallback(({ item, index }: { item: any; index: number }) => {
    const isAutoPlaying = isVideoPlaying(item._id);
    
    return (
      <VideoCard
        key={item._id}
        video={item}
        index={index}
        onPress={() => handleVideoPress(item)}
        onAvatarPress={handleAvatarPress(item)}
        disableAvatarPress={disableAvatarPress}
        isCurrentUserVideo={type === "private" || item?.user?._id === userDetails?._id}
        onDeleteSuccess={handleRefresh}
        userInfo={memoizedUserInfo}
        galleryRefetch={handleRefresh}
        isAutoPlaying={isAutoPlaying}
        skipInteractionSync={false}
      />
    );
  }, [
    handleVideoPress,
    handleAvatarPress,
    disableAvatarPress,
    type,
    userDetails?._id,
    handleRefresh,
    memoizedUserInfo,
    isVideoPlaying
  ]);

  // Playlist card renderer
  const renderPlaylistCard = useCallback(({ item }: { item: any }) => (
    <View style={styles.playlistItemContainer}>
      <PlaylistCard key={item.id} item={item} isPlaylist={true} />
    </View>
  ), []);

  // No-op viewable items handler for playlists (to maintain consistent props)
  const noOpViewableItemsHandler = useCallback(() => {}, []);

  // Tab change handler
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    
    // Stop autoplay when switching away from videos/photos
    if (tab !== 'Videos' && tab !== 'Photos') {
      cleanupAutoplay();
    }
    
    // Scroll to top when changing tabs
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [cleanupAutoplay]);

  // Memoized empty component
  const VideoEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <EmptyState
        title={emptyStates.Videos.title}
        subtitle={emptyStates.Videos.subtitle}
        image={emptyStates.Videos.image}
      />
    </View>
  ), []);

  const PhotoEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <EmptyState
        title={emptyStates.Photos.title}
        subtitle={emptyStates.Photos.subtitle}
        image={emptyStates.Photos.image}
      />
    </View>
  ), []);

  const PlaylistEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <EmptyState
        title={emptyStates.Playlist.title}
        subtitle={emptyStates.Playlist.subtitle}
        image={emptyStates.Playlist.image}
      />
    </View>
  ), []);

  // Use separate data arrays for videos and photos
  const videosOnly = useMemo(() => {
    return vidoes && Array.isArray(vidoes) ? vidoes : [];
  }, [vidoes]);
  
  const photosOnly = useMemo(() => {
    return photos && Array.isArray(photos) ? photos : [];
  }, [photos]);

  // Stable counts to prevent re-renders
  const videoCount = useMemo(() => {
    return totalVideos || videosOnly?.length || 0;
  }, [totalVideos, videosOnly?.length]);
  
  const photoCount = useMemo(() => {
    return totalPhotos || photosOnly?.length || 0;
  }, [totalPhotos, photosOnly?.length]);

  // Combined header component that includes tabs, filter, and any additional header content
  const CombinedHeaderComponent = useMemo(() => () => (
    <View>
      {ListHeaderComponent && (
        typeof ListHeaderComponent === 'function' ? (
          <ListHeaderComponent />
        ) : (
          ListHeaderComponent
        )
      )}
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Videos" && {
              borderBottomWidth: 2,
              borderBottomColor: Colors[theme].textBold,
            },
          ]}
          onPress={() => handleTabChange("Videos")}
        >
          <Typography
            style={[
              activeTab === "Videos" && {
                color: Colors[theme].textBold,
                fontWeight: 700,
              },
            ]}
          >
            Videos {videoCount > 0 && `(${videoCount})`}
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Photos" && {
              borderBottomWidth: 2,
              borderBottomColor: Colors[theme].textBold,
            },
          ]}
          onPress={() => handleTabChange("Photos")}
        >
          <Typography
            style={[
              activeTab === "Photos" && {
                color: Colors[theme].textBold,
                fontWeight: 700,
              },
            ]}
          >
            Photos {photoCount > 0 && `(${photoCount})`}
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "Playlists" && {
              borderBottomWidth: 2,
              borderBottomColor: Colors[theme].textBold,
            },
          ]}
          onPress={() => handleTabChange("Playlists")}
        >
          <Typography
            style={[
              activeTab === "Playlists" && {
                color: Colors[theme].textBold,
                fontWeight: 700,
              },
            ]}
          >
            Playlists
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Content Header */}
      <View style={styles.contentHeader}>
        <View style={styles.headerActions}>
          {activeTab === "Playlists" && type === "private" && (
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color={Colors[theme].textBold}
              onPress={() => router.push("/(profile)/CreatePlaylist")}
            />
          )}
          {/* <AppMenu
            width={"50%"}
            trigger={(isOpen) => (
              <View style={styles.filterButton}>
                <Typography weight="500">{filter}</Typography>
                <MaterialIcons
                  name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={20}
                  color={Colors[theme].textBold}
                />
              </View>
            )}
            options={filters}
            selectedOption={filter}
            onSelect={(option) => setFilter(option)}
          /> */}
        </View>
      </View>
    </View>
  ), [ListHeaderComponent, activeTab, theme, videoCount, handleTabChange, type, filter]);

  // Memoize rendering conditions to prevent recalculation
  const videoRenderingState = useMemo(() => {
    const hasVideosData = videosOnly && Array.isArray(videosOnly);
    const shouldShowSkeleton = isLoadingVideos || (!hasVideosData && !isLoadingVideos);
    return { hasVideosData, shouldShowSkeleton };
  }, [videosOnly, isLoadingVideos]);
  
  const photoRenderingState = useMemo(() => {
    const hasPhotosData = photosOnly && Array.isArray(photosOnly);
    const shouldShowSkeleton = isLoadingPhotos || (!hasPhotosData && !isLoadingPhotos);
    return { hasPhotosData, shouldShowSkeleton };
  }, [photosOnly, isLoadingPhotos]);

  if (activeTab === "Videos") {
    const { shouldShowSkeleton } = videoRenderingState;

    return (
      <View style={styles.container}>
        {shouldShowSkeleton ? (
          <>
            <CombinedHeaderComponent />
            <VideoSkeletonList count={3} />
          </>
        ) : (
          <ScrollAwareFlatList
            ref={flatListRef}
            data={videosOnly}
            renderItem={renderVideoCard}
            keyExtractor={(item) => item._id}
            scrollEnabled={true}
            onEndReached={onLoadMoreVideos}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={CombinedHeaderComponent}
            ListFooterComponent={
              <>
                {isLoadingMoreVideos && (
                  <View style={{ paddingVertical: 20 }}>
                    <VideoSkeletonList count={2} />
                  </View>
                )}
                <ScrollBottomSpace />
              </>
            }
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.general.primary]} // Android
                  tintColor={Colors.general.primary} // iOS
                />
              ) : undefined
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={VideoEmptyComponent}
            removeClippedSubviews={true} // Performance optimization
            maxToRenderPerBatch={3} // Render fewer items at a time
            windowSize={5} // Keep fewer items in memory
            initialNumToRender={2} // Initially render only 2 items
            updateCellsBatchingPeriod={100} // Batch updates for better performance
            // Autoplay viewability detection
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            // performance props
            getItemLayout={undefined} // Let FlatList handle layout for video cards
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
          />
        )}
      </View>
    );
  } else if (activeTab === "Photos") {
    const { shouldShowSkeleton } = photoRenderingState;

    return (
      <View style={styles.container}>
        {shouldShowSkeleton ? (
          <>
            <CombinedHeaderComponent />
            <VideoSkeletonList count={3} />
          </>
        ) : (
          <ScrollAwareFlatList
            ref={flatListRef}
            data={photosOnly}
            renderItem={renderVideoCard}
            keyExtractor={(item) => item._id}
            scrollEnabled={true}
            onEndReached={onLoadMorePhotos}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={CombinedHeaderComponent}
            ListFooterComponent={
              <>
                {isLoadingMorePhotos && (
                  <View style={{ paddingVertical: 20 }}>
                    <VideoSkeletonList count={2} />
                  </View>
                )}
                <ScrollBottomSpace />
              </>
            }
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.general.primary]} // Android
                  tintColor={Colors.general.primary} // iOS
                />
              ) : undefined
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={PhotoEmptyComponent}
            removeClippedSubviews={true} // Performance optimization
            maxToRenderPerBatch={3} // Render fewer items at a time
            windowSize={5} // Keep fewer items in memory
            initialNumToRender={2} // Initially render only 2 items
            updateCellsBatchingPeriod={100} // Batch updates for better performance
            // Autoplay viewability detection
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            // performance props
            getItemLayout={undefined} // Let FlatList handle layout for video cards
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
          />
        )}
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <ScrollAwareFlatList
          ref={flatListRef}
          data={playlists}
          renderItem={renderPlaylistCard}
          style={styles.playlistList}
          contentContainerStyle={styles.playlistContent}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={CombinedHeaderComponent}
          ListEmptyComponent={PlaylistEmptyComponent}
          onEndReached={onLoadMorePlaylists}
          onEndReachedThreshold={0.1}
          // had to keep consistent props with video/photo FlatList to avoid warning
          onViewableItemsChanged={noOpViewableItemsHandler}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.general.primary]} // Android
                tintColor={Colors.general.primary} // iOS
              />
            ) : undefined
          }
          ListFooterComponent={
            <>
              {isLoadingMorePlaylists && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Typography>Loading more playlists...</Typography>
                </View>
              )}
              <ScrollBottomSpace />
            </>
          }
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={3}
          updateCellsBatchingPeriod={100}
        />
      </View>
    );
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    marginHorizontal: 16,
  },
  tab: {
    paddingTop: 20,
    paddingBottom: 6,
    flex: 1,
    alignItems: "center",
  },
  contentHeader: {
    marginTop: 10,
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 6,
  },
  filterButton: {
    // borderRadius: 12,
    // borderWidth: 1,
    // borderColor: "#F2F2F7",
    // width: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  listContainer: {
    flex: 1,
  },
  playlistList: {
  },
  playlistContent: {
    gap: 12,
  },
  playlistItemContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Gallery;