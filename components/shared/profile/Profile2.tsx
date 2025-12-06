import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Images } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { router, useLocalSearchParams } from "expo-router";
import Wrapper from "@/components/utilities/Wrapper";
import AppButton from "@/components/ui/AppButton";
import Avatar from "@/components/ui/Avatar";
import Gallary from "./Gallary";
import { ExternalLink } from "@/components/ExternalLink";
import { useAlert } from "@/components/ui/AlertProvider";
import { useNavigationVisibility } from "@/contexts/NavigationVisibilityContext";

// Lazy-loaded hooks - only imported after navigation
import useUser from "@/hooks/profile/useUser";
import usePlaylist from "@/hooks/profile/usePlaylist";
import useGetUserUploads from "@/hooks/upload/useGetUserUploads";
import useGetUserPublicUploads from "@/hooks/upload/useGetUserPublicUploads";
import useAuth from "@/hooks/auth/useAuth";
import useVerificationBadge from "@/hooks/profile/useVerificationBadge";
import VerificationBadge from "@/components/ui/VerificationBadge";
import { useUpgradeAccountModal } from "@/hooks/profile/useUpgradeAccountModal";
import UpgradeAccountModal from "@/components/ui/Modals/UpgradeAccountModal";

const Profile2 = () => {
  const { theme } = useCustomTheme();
  const { showInfoOnly } = useAlert();
  const { hideNavigation, showNavigation } = useNavigationVisibility();

  const [refreshing, setRefreshing] = useState(false);
  const [enableDataLoading, setEnableDataLoading] = useState(false);
  const [showRealData, setShowRealData] = useState(false);

  // Only call hooks when enabled to prevent blocking navigation
  const userHook = useUser();
  const playlistHook = usePlaylist();
  const videosHook = useGetUserUploads("videos");
  const photosHook = useGetUserUploads("photos");
  const { userId } = useLocalSearchParams();
  const publicUploadsHook = useGetUserPublicUploads(userId as string);
  const authHook = useAuth();
  const verificationHook = useVerificationBadge();
  
  // Upgrade modal hook
  const { showModal: showUpgradeModal, triggerModalCheck, closeModal } = useUpgradeAccountModal();

  // Extract data only when loading is enabled
  const profileData = enableDataLoading ? userHook.profileData : null;
  const allPlaylists = enableDataLoading ? playlistHook.allPlaylists : null;
  const videosData = enableDataLoading ? videosHook.data : null;
  const photosData = enableDataLoading ? photosHook.data : null;
  const userVideos = enableDataLoading ? publicUploadsHook.data : null;
  const userDetails = enableDataLoading ? authHook.userDetails : null;
  const verificationData = enableDataLoading ? verificationHook.data : null;

  // Hook functions
  const { refetchProfile } = userHook;
  const {
    refetchPlaylist,
    fetchNextPage: fetchNextPlaylistsPage,
    hasNextPage: hasMorePlaylists,
    isFetchingNextPage: isLoadingMorePlaylists
  } = playlistHook;
  const {
    refetch: refetchVideos,
    isPending: isLoadingVideos,
    fetchNextPage: fetchNextVideosPage,
    hasNextPage: hasMoreVideos,
    isFetchingNextPage: isLoadingMoreVideos
  } = videosHook;
  const {
    refetch: refetchPhotos,
    isPending: isLoadingPhotos,
    fetchNextPage: fetchNextPhotosPage,
    hasNextPage: hasMorePhotos,
    isFetchingNextPage: isLoadingMorePhotos
  } = photosHook;
  const { refetch: refetchPublicUploads } = publicUploadsHook;
  const { refetch: refetchVerification } = verificationHook;

  // Progressive loading sequence
  useEffect(() => {
    // Start data loading after navigation completes
    const timer = setTimeout(() => {
      setEnableDataLoading(true);

      // Load profile data first
      setTimeout(() => {
        Promise.all([
          refetchProfile(),
          refetchVerification(),
        ]).then(() => {
          setShowRealData(true);
          // Load gallery data after profile is shown
          setTimeout(() => {
            refetchPlaylist();
          }, 200);
          
          // Trigger upgrade modal check when profile loads
          setTimeout(() => {
            triggerModalCheck();
          }, 1000);
        });
      }, 100);
    }, 200); // Delay to ensure navigation completes

    return () => clearTimeout(timer);
  }, []);

  // Computed values
  const fullName = useMemo(() =>
    `${profileData?.data?.firstName || ""} ${profileData?.data?.lastName || ""}`.trim(),
    [profileData?.data?.firstName, profileData?.data?.lastName]
  );

  const profilePicSource = useMemo(() =>
    profileData?.data?.profilePicture
      ? { uri: profileData.data.profilePicture }
      : Images.avatar,
    [profileData?.data?.profilePicture]
  );

  const coverPicSource = useMemo(() =>
    profileData?.data?.coverPhoto
      ? { uri: profileData.data.coverPhoto }
      : Images.defaultCoverPhoto,
    [profileData?.data?.coverPhoto]
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    if (!enableDataLoading) return;

    setRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchPlaylist(),
        refetchVideos(),
        refetchPhotos(),
        refetchVerification(),
        userId ? refetchPublicUploads() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [enableDataLoading, userId]);

  // Skeleton component
  const SkeletonBox = ({ width, height, style }: {
    width: number | string;
    height: number;
    style?: any;
  }) => (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0',
          borderRadius: 4,
          opacity: 0.6,
        },
        style
      ]}
    />
  );

  // Loading states
  const isLoadingProfile = !profileData?.data && enableDataLoading;
  const shouldShowSkeleton = !showRealData;

  return (
    <Wrapper noPadding>
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        {shouldShowSkeleton ? (
          // Show skeleton immediately for instant navigation
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.headerTitle, { backgroundColor: Colors[theme].cardBackground }]}>
                <SkeletonBox width={120} height={24} />
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity onPress={() => router.push("/(profile)/SavedVideos")}>
                  <Ionicons name="bookmark" size={24} color="#0066ff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/(profile)/Settings")} style={{ position: 'relative' }}>
                  <Ionicons name="settings-outline" size={24} color={Colors[theme].textBold} />
                  {/* Red notification dot - only show for non-verified users */}
                  {verificationData?.data?.isVerified !== true && (
                    <View style={styles.notificationDot} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Cover Image Skeleton */}
            <View style={styles.coverContainer}>
              <SkeletonBox width="100%" height={120} style={{ borderRadius: 12 }} />

              {/* Profile Picture Skeleton */}
              <View style={styles.avatarContainer}>
                <SkeletonBox width={80} height={80} style={{ borderRadius: 40 }} />
              </View>
            </View>

            {/* User Info Skeleton */}
            <View style={styles.userInfo}>
              <View style={styles.userDetails}>
                <SkeletonBox width={100} height={16} />
                <View style={{ height: 8 }} />
                <SkeletonBox width={80} height={16} />
              </View>

              <View style={styles.editButtonContainer}>
                <SkeletonBox width={100} height={32} style={{ borderRadius: 6 }} />
              </View>
            </View>

            {/* Bio Skeleton */}
            <View style={[styles.bioContainer, { backgroundColor: Colors[theme].cardBackground }]}>
              <SkeletonBox width="90%" height={16} />
              <View style={{ height: 8 }} />
              <SkeletonBox width="70%" height={16} />
            </View>

            {/* Gallery Skeleton - Match exact Gallery component structure */}
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
          </ScrollView>
        ) : (
          <Gallary
            playlists={allPlaylists?.data?.data}
            type="private"
            vidoes={videosData?.data?.data}
            photos={photosData?.data?.data}
            totalVideos={videosData?.data?.totalDocs}
            totalPhotos={photosData?.data?.totalDocs}
            isLoadingVideos={isLoadingVideos}
            isLoadingPhotos={isLoadingPhotos}
            onLoadMoreVideos={enableDataLoading ? fetchNextVideosPage : undefined}
            hasMoreVideos={enableDataLoading ? hasMoreVideos : false}
            isLoadingMoreVideos={enableDataLoading ? isLoadingMoreVideos : false}
            onLoadMorePhotos={enableDataLoading ? fetchNextPhotosPage : undefined}
            hasMorePhotos={enableDataLoading ? hasMorePhotos : false}
            isLoadingMorePhotos={enableDataLoading ? isLoadingMorePhotos : false}
            onLoadMorePlaylists={enableDataLoading ? fetchNextPlaylistsPage : undefined}
            hasMorePlaylists={enableDataLoading ? hasMorePlaylists : false}
            isLoadingMorePlaylists={enableDataLoading ? isLoadingMorePlaylists : false}
            ListHeaderComponent={() => (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitle}>
                    <View style={styles.headerTitleWithBadge}>
                      <Typography weight="600" size={19} textType="carter">
                        {profileData?.data?.firstName} {profileData?.data?.lastName}
                      </Typography>
                      {verificationData?.data?.isVerified && (
                        <VerificationBadge 
                          level={verificationData.data.level} 
                          size={20} 
                          style={styles.verificationBadge}
                        />
                      )}
                    </View>
                  </View>
                  <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => router.push("/(profile)/SavedVideos")}>
                      <Ionicons name="bookmark" size={24} color="#0066ff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/(profile)/Settings")} style={{ position: 'relative' }}>
                      <Ionicons name="settings-outline" size={24} color={Colors[theme].textBold} />
                      {/* Red notification dot - only show for non-verified users */}
                      {verificationData?.data?.isVerified !== true && (
                        <View style={styles.notificationDot} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Cover Image */}
                <View style={styles.coverContainer}>
                  <Image source={coverPicSource} style={styles.coverImage} />

                  {/* Profile Picture */}
                  <View style={styles.avatarContainer}>
                    <Avatar
                      imageSource={profilePicSource}
                      size={120}
                      uri
                      ringColor={Colors[theme].avatar}
                      ringThickness={3}
                      gapSize={2}
                      showRing={true}
                      expandable={true}
                      alt={fullName}
                    />
                  </View>
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                  <View style={styles.userDetails}>
                    <TouchableOpacity
                      onPress={() => {
                        if (profileData?.data?.username) {
                          showInfoOnly("Username", `@${profileData.data.username}`);
                        }
                      }}
                    >
                      <Typography>@{profileData?.data?.username}</Typography>
                    </TouchableOpacity>
                    <View style={styles.dotSeparator} />
                    <TouchableOpacity onPress={() => router.push("/(profile)/Subscribers")}>
                      <Typography>
                        {profileData?.data?.subscriberCount} {profileData?.data?.subscriberCount === 1 ? "Sub" : "Subs"}
                      </Typography>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.editButtonContainer}>
                    <AppButton
                      variant="profile"
                      title="Edit Profile"
                      handlePress={() => router.push("/(profile)/EditProfile")}
                      style={styles.editButton}
                    />
                  </View>
                </View>

                {/* Bio */}
                <View style={[styles.bioContainer, { backgroundColor: Colors[theme].cardBackground }]}>
                  <Typography style={styles.bioText}>
                    {profileData?.data?.description || "No bio"}
                  </Typography>
                  {profileData?.data?.websiteLink && (
                    <ExternalLink href={profileData?.data?.websiteLink}>
                      <Typography style={styles.externalLink}>
                        {profileData?.data?.websiteLink}
                      </Typography>
                    </ExternalLink>
                  )}
                </View>
              </>
            )}
            galleryRefetch={onRefresh}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}

        {/* Upgrade Account Modal */}
        <UpgradeAccountModal
          visible={showUpgradeModal}
          onClose={closeModal}
        />
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  headerTitle: {
    // paddingHorizontal: 12,
  },
  headerTitleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  verificationBadge: {
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  coverContainer: {
    position: "relative",
    height: 150,
    marginTop: 16,
  },
  coverImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  avatarContainer: {
    position: "absolute",
    bottom: -80,
    left: 16,
    width: 120,
    height: 120,
  },
  userInfo: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 100, // Space for avatar
    gap: 4,
  },
  dotSeparator: {
    width: 6,
    height: 6,
    backgroundColor: "#6E6E6E",
    borderRadius: 3,
    marginHorizontal: 10,
  },
  editButtonContainer: {
    alignItems: "flex-end",
  },
  editButton: {
    minWidth: 100,
  },
  bioContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  bioText: {
    marginBottom: 8,
  },
  externalLink: {
    color: "#0390C1",
  },
  contentContainer: {
    marginTop: 20,
    marginBottom: 20,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  videoSkeleton: {
    marginBottom: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#FF4444',
    borderRadius: 4,
  },
});

export default Profile2;