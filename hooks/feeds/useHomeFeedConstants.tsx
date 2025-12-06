import { memo, useCallback, useMemo } from "react";
import { View, StyleSheet, RefreshControl, ListRenderItem } from "react-native";

import VideoCard from "@/components/shared/home/VideoCard";
import NetworkError from "@/components/shared/NetworkError";
import VideoCardSkeleton from "@/components/shared/home/VideoCardSkeleton";
import UploadProgressCard from "@/components/shared/home/UploadProgressCard";
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";
import Typography from "@/components/ui/Typography/Typography";
import { Video } from "@/helpers/types/feed/types";
import { Colors } from "@/constants";
import React from "react";

// Memoized components for better performance
export const MemoizedVideoCard = memo(VideoCard);
export const MemoizedVideoCardSkeleton = memo(VideoCardSkeleton);
export const MemoizedUploadProgressCard = UploadProgressCard; // Removed memo s0 progress updates render
export const MemoizedNetworkError = memo(NetworkError);

const useHomeFeedConstants = (
  handleVideoPress: any, 
  handleDeleteSuccess: any, 
  isFetchingNextPage: boolean, 
  isLowMemory: boolean, 
  onRefresh: any, 
  refreshing: boolean, 
  isVideoPlaying?: (videoId: string) => boolean
) => {
  // console.log('🎨 [FEED_CONSTANTS] Hook called - isLowMemory:', isLowMemory, 'isFetchingNextPage:', isFetchingNextPage, 'refreshing:', refreshing);
  // Memoized styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginVertical: 16,
          marginHorizontal: 16,
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        headerRight: {
          flexDirection: "row",
          alignItems: "center",
          gap: 15,
          position: "relative",
        },
        iconButton: {
          padding: 2,
        },
        logoIcon: {
          width: 24,
          height: 24,
        },
        logoText: {
          height: 28,
          width: 86,
          resizeMode: "contain" as const,
        },
        notificationDot: {
          height: 8,
          width: 8,
          backgroundColor: "red",
          borderRadius: 100,
          position: "absolute",
          right: 0,
          top: -2,
          zIndex: 10,
        },
        skeletonContainer: {
          marginTop: 20,
          gap: 30,
        },
        errorContainer: {
          flex: 1,
        },
        loadingFooter: {
          paddingVertical: 20,
          alignItems: "center",
        },
      }),
    []
  );

  // Memory-aware video rendering
  const renderVideoItem: ListRenderItem<Video> = useCallback(
    ({ item, index }) => {
      // Use the same key format as keyExtractor to match autoplay system
      const videoKey = item.isPinned ? `pinned-${item._id}` : `regular-${item._id}`;
      const isPlaying = isVideoPlaying ? isVideoPlaying(videoKey) : false;
      
      // Reduce logging
      // if (index < 3) console.log('🎬 [FEED_CONSTANTS] renderVideoItem called - index:', index, 'videoKey:', videoKey, 'isPlaying:', isPlaying, 'isPinned:', item.isPinned);
      
      return (
        <MemoizedVideoCard
          video={item}
          onPress={() => handleVideoPress(item)}
          onDeleteSuccess={handleDeleteSuccess}
          skipInteractionSync={true}
          index={index}
          disableAutoPreview={isLowMemory} // Passed memory state to video cards
          isAutoPlaying={isPlaying} // Pass autoplay state
        />
      );
    },
    [handleVideoPress, handleDeleteSuccess, isLowMemory, isVideoPlaying]
  );

  const keyExtractor = useCallback(
    (item: Video, index: number) => {
      // Ensure unique keys for pinned vs regular posts
      const prefix = item.isPinned ? 'pinned-' : 'regular-';
      const key = `${prefix}${item._id}`;
      
      // Reduce logging - only log first 5 items and every 10th item to reduce spam
      // if (index < 5 || index % 10 === 0) {
      //   console.log('🔑 [FEED_CONSTANTS] keyExtractor called - index:', index, 'key:', key, 'isPinned:', item.isPinned);
      // }
      return key;
    },
    []
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return <ScrollBottomSpace />;

    return (
      <View style={styles.loadingFooter}>
        <Typography weight="400" textType="text">
          Breathe...
        </Typography>
      </View>
    );
  }, [isFetchingNextPage, styles.loadingFooter]);

  // Memoized refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[Colors.general.primary]}
        tintColor={Colors.general.primary}
      />
    ),
    [refreshing, onRefresh]
  );

  // Memoized skeleton components
  const skeletonComponents = useMemo(
    () => (
      <View style={styles.skeletonContainer}>
        <MemoizedVideoCardSkeleton />
        <MemoizedVideoCardSkeleton />
        <MemoizedVideoCardSkeleton />
        <MemoizedVideoCardSkeleton />
      </View>
    ),
    [styles.skeletonContainer]
  );

  // Static upload progress card - handles its own visibility
  const uploadProgressCard = (
    <MemoizedUploadProgressCard
      isVideo={true} // will determine type internally
    />
  );


  return {
    skeletonComponents,
    refreshControl,
    styles,
    renderVideoItem,
    keyExtractor,
    renderFooter,
    uploadProgressCard,
  };
};

export default useHomeFeedConstants;
