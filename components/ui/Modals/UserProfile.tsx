import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Images } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import AppButton from "@/components/ui/AppButton";
import Avatar from "@/components/ui/Avatar";
// import CustomBottomSheet from "./BottomSheet";
import CustomBottomSheet from "@/components/shared/videoUpload/CustomBottomSheet";
import { router } from "expo-router";
import SubscribeButton from "@/components/shared/profile/SubscribeButton";
import VideoCard from "@/components/shared/home/VideoCard";
import PlaylistCard from "@/components/shared/profile/PlaylistCard";
import Gallary from "@/components/shared/profile/Gallary";

// Lazy-loaded hooks
import useGetPublicProfile from "@/hooks/profile/useGetPublicProfile";
import useGetUserProfileFeeds from "@/hooks/feeds/useGetUserProfileFeeds";
import useGetUserPublicPlaylists from "@/hooks/profile/useGetUserPublicPlaylists";
import useSubscription from "@/hooks/profile/useSubscription";

interface UserProfileProps {
  isVisible: boolean;
  onClose: () => void;
  userId?: string;
}

const UserProfile = memo(({
  isVisible,
  onClose,
  userId,
}: UserProfileProps) => {
  const { theme } = useCustomTheme();

  const [enableDataLoading, setEnableDataLoading] = useState(false);
  const [showRealData, setShowRealData] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Only call hooks when enabled to prevent blocking navigation
  const profileQuery = useGetPublicProfile(userId || "", {
    enabled: enableDataLoading && !!userId,
  });

  const uploadsQuery = useGetUserProfileFeeds(userId || "", {
    enabled: enableDataLoading && !!userId,
  });

  const playlistsQuery = useGetUserPublicPlaylists(userId || "", {
    enabled: enableDataLoading && !!userId,
  });

  const {
    isSubscribed,
    subscriberCount,
    isLoading: subscriptionLoading,
    handleSubscribe,
    handleUnsubscribe,
  } = useSubscription({
    initialIsSubscribed: profileQuery.data?.isSubscribed || false,
    initialSubscriberCount: profileQuery.data?.subscriberCount || 0,
  });

  // Progressive loading sequence
  useEffect(() => {
    if (isVisible && userId) {
      // Start data loading after bottom sheet animation completes
      const timer = setTimeout(() => {
        setEnableDataLoading(true);

        // Show data once profile loads
        setTimeout(() => {
          if (profileQuery.data) {
            setShowRealData(true);
          }
        }, 200);
      }, 300); // Delay to ensure sheet opens instantly

      return () => clearTimeout(timer);
    } else {
      // Reset when sheet closes
      setEnableDataLoading(false);
      setShowRealData(false);
      setHasScrolled(false);
    }
  }, [isVisible, userId]);

  // Watch for profile data and show content
  useEffect(() => {
    if (enableDataLoading && profileQuery.data && !profileQuery.isPending) {
      setShowRealData(true);
    }
  }, [enableDataLoading, profileQuery.data, profileQuery.isPending]);


  const profileData = enableDataLoading ? profileQuery.data : null;
  const uploadsData = enableDataLoading ? { data: { data: uploadsQuery.feeds, totalDocs: uploadsQuery.feeds?.length || 0 } } : null;
  const { fetchNextPage: fetchMoreVideos, hasNextPage: hasMoreVideos, isFetchingNextPage: isLoadingMoreVideos, handleEndReached } = uploadsQuery;
  const playlistsData = enableDataLoading ? playlistsQuery.data : null;
  const { fetchNextPage: fetchMorePlaylists, hasNextPage: hasMorePlaylists, isFetchingNextPage: isLoadingMorePlaylists } = playlistsQuery;

  // Debug logging
  console.log('UserProfile Debug:', {
    enableDataLoading,
    showRealData,
    userId,
    feedsLength: uploadsQuery.feeds?.length || 0,
    isPending: uploadsQuery.isPending,
    hasMoreVideos,
    isLoadingMoreVideos,
    firstVideoUser: uploadsQuery.feeds?.[0]?.user,
    profileData: profileData ? 'loaded' : 'null'
  });

  // Skeleton component
  const SkeletonBox = useCallback(({ width, height, style }: {
    width: number | string;
    height: number;
    style?: any;
  }) => (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: theme === 'dark' ? '#444' : '#E0E0E0',
          borderRadius: 4,
          opacity: 0.6,
        },
        style
      ]}
    />
  ), [theme]);

  const handleMessagePress = useCallback(() => {
    if (userId) {
      onClose();
      router.push(`/(chat)/${userId}/Inbox`);
    }
  }, [userId, onClose]);

  // Memoized video press handler
  const handleVideoPress = useCallback(() => {
    onClose();
    // Navigate to video player or handle video press as needed
  }, [onClose]);

  // Handle loading more videos when scrolling to bottom
  const handleLoadMoreVideos = useCallback(() => {
    if (hasMoreVideos && !isLoadingMoreVideos && enableDataLoading) {
      handleEndReached(); // Use the HomeScreen's optimized end reached handler
    }
  }, [hasMoreVideos, isLoadingMoreVideos, handleEndReached, enableDataLoading]);

  // Handle loading more playlists
  const handleLoadMorePlaylists = useCallback(() => {
    if (hasMorePlaylists && !isLoadingMorePlaylists && enableDataLoading) {
      fetchMorePlaylists();
    }
  }, [hasMorePlaylists, isLoadingMorePlaylists, fetchMorePlaylists, enableDataLoading]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    },
    []
  );

  // User info object to pass to VideoCard - memoized
  const userInfo = useMemo(
    () => ({
      firstName: profileData?.firstName || profileData?.displayName || "",
      lastName: profileData?.lastName || "",
      profilePicture: profileData?.profilePicture || "",
      username: profileData?.username || "",
    }),
    [profileData]
  );

  // Skeleton header component
  const SkeletonHeader = useCallback(() => (
    <View>
      <View style={styles.coverContainer}>
        {/* Cover Image Skeleton */}
        <SkeletonBox width="100%" height={COVER_HEIGHT} />

        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <View style={styles.header}>
            <View
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                padding: 10,
                borderRadius: 10,
                width: "auto",
              }}
            >
              <SkeletonBox width={120} height={24} style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }} />
            </View>
            <View style={styles.headerIcons}>
              <View
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </View>
            </View>
          </View>
        </View>

        {/* Avatar Skeleton */}
        <View style={styles.avatarOverlay}>
          <View style={styles.profileImageContainer}>
            <SkeletonBox
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              style={{ borderRadius: AVATAR_SIZE / 2 }}
            />
          </View>
        </View>
      </View>

      {/* User Details Skeleton */}
      <View style={styles.userDetailsOverlay}>
        <View style={styles.userDetailsContent}>
          <View style={styles.userInfoRow}>
            <TouchableOpacity style={styles.userInfoItem} disabled>
              <SkeletonBox width={80} height={16} />
            </TouchableOpacity>
            <View style={styles.dotSeparator} />
            <TouchableOpacity style={styles.userInfoItem} disabled>
              <SkeletonBox width={60} height={16} />
            </TouchableOpacity>
          </View>
          <SkeletonBox
            width={120}
            height={32}
            style={{
              borderRadius: 6,
              marginTop: 10,
              marginLeft: "auto",
            }}
          />
        </View>
      </View>

      {/* Bio Skeleton */}
      <View style={[styles.bioContainer, { backgroundColor: Colors[theme].cardBackground }]}>
        <SkeletonBox width="90%" height={16} />
        <View style={{ height: 8 }} />
        <SkeletonBox width="70%" height={16} />
      </View>

      {/* Message Button Skeleton */}
      <View style={{ marginHorizontal: 15, marginTop: 20 }}>
        <SkeletonBox width={107} height={32} style={{ borderRadius: 6 }} />
      </View>

      {/* Gallery Skeleton */}
      <View style={styles.contentContainer}>
        {/* Tabs Skeleton */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, { borderBottomWidth: 2, borderBottomColor: Colors[theme].textBold }]} disabled>
            <SkeletonBox width={80} height={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} disabled>
            <SkeletonBox width={70} height={20} />
          </TouchableOpacity>
        </View>

        {/* Content Header Skeleton */}
        <View style={styles.contentHeader}>
          <View style={styles.headerActions}>
            <View style={styles.filterButton}>
              <SkeletonBox width={60} height={16} />
              <SkeletonBox width={20} height={20} style={{ marginLeft: 8 }} />
            </View>
          </View>
        </View>

        {/* Video Content Skeleton */}
        {Array.from({ length: 2 }).map((_, index) => (
          <View key={index} style={styles.videoSkeleton}>
            <SkeletonBox width="100%" height={200} style={{ borderRadius: 8, marginBottom: 16 }} />
          </View>
        ))}
      </View>

      {/* Loading Message */}
      {/* <View style={styles.messageContainer}>
        <Typography style={[styles.successText, { color: Colors[theme].text }]}>
            Bottom sheet opens  
        </Typography>
        <Typography style={[styles.infoText, { color: Colors[theme].text, opacity: 0.7 }]}>
          Loading profile data...
        </Typography>
        {enableDataLoading && (
          <ActivityIndicator 
            size="small" 
            color={Colors[theme].text} 
            style={{ marginTop: 10 }} 
          />
        )}
      </View> */}
    </View>
  ), [theme, enableDataLoading, SkeletonBox]);

  const ProfileHeader = useCallback(() => {
    if (!showRealData || !profileData) {
      return <SkeletonHeader />;
    }

    // Show   data
    const fullName = `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim();
    const profilePicSource = profileData.profilePicture
      ? { uri: profileData.profilePicture }
      : Images.avatar;
    const coverPicSource = profileData.coverPhoto
      ? { uri: profileData.coverPhoto }
      : Images.defaultCoverPhoto;

    return (
      <View>
        <View style={styles.coverContainer}>
          {/* Cover Image */}
          <Image source={coverPicSource} style={styles.coverImage} />

          {/* Header Overlay */}
          <View style={styles.headerOverlay}>
            <View style={styles.header}>
              <View
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  padding: 10,
                  borderRadius: 10,
                  width: "auto",
                }}
              >
                <Typography
                  weight="600"
                  size={19}
                  textType="carter"
                  style={{ color: "#fff" }}
                >
                  {fullName || "User Profile"}
                </Typography>
              </View>
              <View style={styles.headerIcons}>
                <View
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    padding: 8,
                    borderRadius: 12,
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </View>
              </View>
            </View>
          </View>

          {/* Avatar */}
          <View style={styles.avatarOverlay}>
            <View style={styles.profileImageContainer}>
              <Avatar
                imageSource={profilePicSource}
                size={AVATAR_SIZE}
                uri={!!profileData.profilePicture}
                ringColor={Colors[theme].avatar}
                ringThickness={3}
                gapSize={2}
                showRing={true}
                expandable={true}
                alt={fullName}
              />
            </View>
          </View>
        </View>

        {/* User Details */}
        <View style={styles.userDetailsOverlay}>
          <View style={styles.userDetailsContent}>
            <View style={styles.userInfoRow}>
              <TouchableOpacity style={styles.userInfoItem}>
                <Typography size={14} color={Colors[theme].textLight}>
                  @{profileData.username}
                </Typography>
              </TouchableOpacity>

              <View style={styles.dotSeparator} />

              <TouchableOpacity style={styles.userInfoItem}>
                <Typography size={14} color={Colors[theme].textLight}>
                  {subscriberCount} {subscriberCount === 1 ? "Sub" : "Subs"}
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Subscribe Button */}
            <SubscribeButton
              userId={userId || ""}
              initialIsSubscribed={isSubscribed}
              subscriberCount={subscriberCount}
              onSubscribe={handleSubscribe}
              onUnsubscribe={handleUnsubscribe}
              isLoading={subscriptionLoading}
              containerStyle={{ marginTop: 10, marginLeft: "auto" }}
            />
          </View>
        </View>

        {/* Bio */}
        <View style={[styles.bioContainer, { backgroundColor: Colors[theme].cardBackground }]}>
          <Typography style={styles.bioText}>
            {profileData.description || "No bio"}
          </Typography>
        </View>

        {/* Message Button */}
        <View style={{ marginHorizontal: 15, marginTop: 20, alignSelf: "flex-start" }}>
          <AppButton
            variant="profile"
            title="Message"
            handlePress={handleMessagePress}
            style={{ width: 107 }}
          />
        </View>

      </View>
    );
  }, [theme, showRealData, profileData, subscriberCount, isSubscribed, subscriptionLoading, userId, enableDataLoading, SkeletonHeader, handleMessagePress]);

  // Gallery component - render independently of profile header data
  const GalleryComponent = useCallback(() => {
    if (!enableDataLoading) {
      return null; // Don't render until data loading is enabled
    }

    return (
      <View style={styles.contentContainer}>
        {/* Debug: Show gallery data state */}
        {__DEV__ && (
          <View style={{ padding: 10, backgroundColor: 'rgba(0,255,0,0.1)', margin: 10 }}>
            <Typography>Gallery Debug Info:</Typography>
            <Typography>• enableDataLoading: {enableDataLoading ? 'Yes' : 'No'}</Typography>
            <Typography>• showRealData: {showRealData ? 'Yes' : 'No'}</Typography>
            <Typography>• uploadsQuery.feeds: {uploadsQuery.feeds?.length || 0} videos</Typography>
            <Typography>• uploadsQuery.isPending: {uploadsQuery.isPending ? 'Yes' : 'No'}</Typography>
            <Typography>• isLoadingVideos prop: {(uploadsQuery.isPending && (!uploadsQuery.feeds || uploadsQuery.feeds.length === 0)) ? 'Yes' : 'No'}</Typography>
          </View>
        )}

        <Gallary
          vidoes={uploadsQuery.feeds?.map((video: { user: any; }) => ({
            ...video,
            user: {
              _id: video.user || userId,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              profilePicture: userInfo.profilePicture,
              username: userInfo.username,
            }
          })) || []}
          playlists={playlistsData?.data?.data || []}
          totalVideos={uploadsQuery.feeds?.length || 0}
          type="public"
          disableAvatarPress={true}
          customUserInfo={userInfo}
          userId={userId}
          galleryRefetch={uploadsQuery.refetch}
          enableVideoPreview={true}
          previewDelay={3000}
          isLoadingVideos={uploadsQuery.isPending && (!uploadsQuery.feeds || uploadsQuery.feeds.length === 0)}
          // HomeScreen-style pagination
          onLoadMoreVideos={uploadsQuery.handleEndReached}
          hasMoreVideos={hasMoreVideos}
          isLoadingMoreVideos={isLoadingMoreVideos}
          onLoadMorePlaylists={handleLoadMorePlaylists}
          hasMorePlaylists={hasMorePlaylists}
          isLoadingMorePlaylists={isLoadingMorePlaylists}
          // Refresh control
          refreshing={uploadsQuery.refreshing}
          onRefresh={uploadsQuery.onRefresh}
        />
      </View>
    );
  }, [enableDataLoading, uploadsQuery, playlistsData, userInfo, userId, hasMoreVideos, isLoadingMoreVideos, handleLoadMorePlaylists, hasMorePlaylists, isLoadingMorePlaylists]);

  // Ref to control bottom sheet
  const bottomSheetRef = useRef<any>(null);

  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      showClose={true}
      showCloseIcon={false}
      sheetheight={"95%"}
    // ref={bottomSheetRef}
    // isVisible={isVisible}
    // onClose={onClose}
    // showClose={true}
    // showCloseIcon={false}
    // snapPoints={["70%", "95%"]}
    // index={0}
    // enableContentPanningGesture={true}
    // onScroll={handleScroll}
    // scrollEventThrottle={100}
    // useView={true}  
    >
      <View style={styles.container}>
        <ProfileHeader />
        <GalleryComponent />
      </View>
    </CustomBottomSheet>
  );
});

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = SCREEN_WIDTH / 3; // 3:1 aspect ratio
const AVATAR_SIZE = Math.round((SCREEN_WIDTH / 390) * 100); // 100px on 390px screen, proportional on others

// Calculate avatar positioning: 30% overlap with cover, 70% below
const AVATAR_OVERLAP_PERCENTAGE = 0.3;
const AVATAR_OVERLAP_HEIGHT = AVATAR_SIZE * AVATAR_OVERLAP_PERCENTAGE;
const AVATAR_BELOW_HEIGHT = AVATAR_SIZE * (1 - AVATAR_OVERLAP_PERCENTAGE);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  coverContainer: {
    position: "relative",
    height: COVER_HEIGHT + AVATAR_BELOW_HEIGHT, // Cover height + avatar extension below
  },
  coverImage: {
    width: "100%",
    height: COVER_HEIGHT,
    resizeMode: "cover",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  avatarOverlay: {
    position: "absolute",
    top: COVER_HEIGHT - AVATAR_OVERLAP_HEIGHT,
    left: 15,
  },
  userDetailsOverlay: {
    position: "absolute",
    top: COVER_HEIGHT - 1, // closer to cover photo
    left: AVATAR_SIZE + 30, // Start after avatar + spacing
    right: 15,
    height: AVATAR_BELOW_HEIGHT + 10,
    justifyContent: "flex-start",
    paddingTop: 5,
  },
  userDetailsContent: {
    paddingVertical: 5,
  },
  profileImageContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
  },
  bioContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  bioText: {
    marginBottom: 8,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  userInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  dotSeparator: {
    width: 6,
    height: 6,
    backgroundColor: "#6E6E6E",
    borderRadius: 3,
    marginHorizontal: 10,
  },
  contentContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  tabContent: {
    flex: 1,
  },
  playlistItemContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  playlistSkeleton: {
    marginBottom: 16,
  },
  videoSkeleton: {
    marginBottom: 16,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "400",
  },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.general.primary,
    backgroundColor: "transparent",
  },
  messageContainer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  successText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  // Gallery skeleton styles 
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
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});

export default UserProfile;