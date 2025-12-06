import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Image,
  StyleSheet,
  ImageBackground,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScrollAwareScrollView from "@/components/ui/ScrollAwareScrollView";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Icons, Images } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import AppButton from "@/components/ui/AppButton";
import Gallary from "./Gallary";
import { router, useLocalSearchParams } from "expo-router";
import Wrapper from "@/components/utilities/Wrapper";
import useAuth from "@/hooks/auth/useAuth";
import useUser from "@/hooks/profile/useUser";
import { ExternalLink } from "@/components/ExternalLink";
import usePlaylist from "@/hooks/profile/usePlaylist";
import { useProfilePic } from "@/hooks/auth/useProfilePic";
import Avatar from "@/components/ui/Avatar";
import useGetUserUploads from "@/hooks/upload/useGetUserUploads";
import useGetUserPublicUploads from "@/hooks/upload/useGetUserPublicUploads";
import { ThemedView } from "@/components/ThemedView";
import { useAlert } from "@/components/ui/AlertProvider";
import { useNavigationVisibility } from "@/contexts/NavigationVisibilityContext";

const Profile = () => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  
  // const { coverPic, profilePic } = useProfilePic();
  const { showInfoOnly } = useAlert();
  const { hideNavigation, showNavigation } = useNavigationVisibility();

  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Lazy load all data after navigation completes
  const { profileData, refetchProfile } = useUser();
  const { 
    allPlaylists, 
    refetchPlaylist,
    fetchNextPage: fetchNextPlaylistsPage,
    hasNextPage: hasMorePlaylists,
    isFetchingNextPage: isLoadingMorePlaylists
  } = usePlaylist();
  const { 
    data, 
    refetch: refetchUploads, 
    isPending: isLoadingVideos,
    fetchNextPage: fetchNextVideosPage,
    hasNextPage: hasMoreVideos,
    isFetchingNextPage: isLoadingMoreVideos
  } = useGetUserUploads();
  const { userId } = useLocalSearchParams();
  const { data: userVideos, refetch: refetchPublicUploads } =
    useGetUserPublicUploads(userId as string);

  // Memoize computed values for better performance
  const fullName = useMemo(() => 
    `${profileData?.data?.firstName || ""} ${profileData?.data?.lastName || ""}`.trim(),
    [profileData?.data?.firstName, profileData?.data?.lastName]
  );
  
  // Use default images temporarily to test navigation
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

  // Load profile data immediately on mount (non-blocking)
  useEffect(() => {
    // Use setTimeout to ensure navigation completes first
    const timer = setTimeout(() => {
      refetchProfile();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load gallery data when profile is available (non-blocking)
  useEffect(() => {
    if (profileData?.data) {
      const timer = setTimeout(() => {
        refetchPlaylist();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [profileData?.data]);

  // Use ref to avoid dependency issues
  const lastFocusTimeRef = React.useRef(Date.now());
  
  // Temporarily disabled to test navigation blocking
  // useFocusEffect(
  //   useCallback(() => {
  //     const now = Date.now();
  //     const timeSinceLastFocus = now - lastFocusTimeRef.current;
      
  //     // Only refetch if it's been more than 30 seconds since last focus
  //     // Reduced frequency to improve navigation speed
  //     if (timeSinceLastFocus > 30000) {
  //       // Use background refetch to avoid blocking navigation
  //       setTimeout(() => {
  //         refetchProfile();
  //         refetchPlaylist();
  //       }, 100);
  //     }
      
  //     lastFocusTimeRef.current = now;
  //   }, [])
  // );


  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    try {
      // Refetch all data
      await Promise.all([
        refetchProfile(),
        refetchPlaylist(),
        refetchUploads(),
        userId ? refetchPublicUploads() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  // Show skeleton layout immediately, don't block navigation
  const isLoadingProfile = !profileData?.data;

  // Optimize ProfileHeader with proper memoization and skeleton loading
  const ProfileHeader = useMemo(() => () => (
    <>
      <View style={styles.header}>
        <View
          style={{
            backgroundColor:
              theme == "dark" ? Colors.dark.background : "#fff",
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          {isLoadingProfile ? (
            <View style={[styles.skeletonText, { width: 120, height: 24 }]} />
          ) : (
            <Typography weight="600" size={19} textType="carter">
              {profileData?.data?.firstName} {profileData?.data?.lastName}
            </Typography>
          )}
        </View>
        <View style={styles.headerIcons}>
          <Ionicons
            name="bookmark"
            size={24}
            color="#0066ff"
            onPress={() => router.push("/(profile)/SavedVideos")}
          />
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors[theme].textBold}
            onPress={() => router.push("/(profile)/Settings")}
          />
        </View>
      </View>

      {/* Cover Image Section */}
      <View style={styles.coverContainer}>
        {isLoadingProfile ? (
          <View style={[styles.skeletonImage, { height: COVER_HEIGHT }]} />
        ) : (
          <Image source={coverPicSource} style={styles.coverImage} />
        )}
        
        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          {isLoadingProfile ? (
            <View style={[styles.skeletonAvatar, { width: AVATAR_SIZE, height: AVATAR_SIZE }]} />
          ) : (
            <Avatar
              imageSource={profilePicSource}
              alt={fullName}
              size={AVATAR_SIZE}
              uri
              ringColor={Colors[theme].avatar}
              ringThickness={3}
              gapSize={2.5}
              showRing={true}
              expandable={true}
            />
          )}
        </View>
      </View>

      {/* User Details Section */}
      <View style={styles.userDetailsContainer}>
        <View style={styles.userInfoRow}>
          {/* Username Section */}
          <TouchableOpacity 
            style={styles.userInfoItem}
            onPress={() => {
              if (profileData?.data?.username) {
                showInfoOnly("Username", `@${profileData.data.username}`);
              }
            }}
            disabled={isLoadingProfile}
          >
            {isLoadingProfile ? (
              <View style={[styles.skeletonText, { width: 80, height: 16 }]} />
            ) : (
              <Typography 
                numberOfLines={1} 
                style={styles.truncatedText}
              >
                @{profileData?.data?.username}
              </Typography>
            )}
          </TouchableOpacity>

          {/* Dot Separator */}
          <View style={styles.dotSeparator} />

          {/* Subscribers Section */}
          <TouchableOpacity
            style={styles.userInfoItem}
            onPress={() => router.push("/(profile)/Subscribers")}
            disabled={isLoadingProfile}
          >
            {isLoadingProfile ? (
              <View style={[styles.skeletonText, { width: 60, height: 16 }]} />
            ) : (
              <Typography numberOfLines={1} style={styles.truncatedText}>
                {profileData?.data?.subscriberCount}{" "}
                {profileData?.data?.subscriberCount === 1 ? "Sub" : "Subs"}
              </Typography>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Edit Profile Button */}
        <View style={styles.editButtonContainer}>
          {isLoadingProfile ? (
            <View style={[styles.skeletonButton, { width: 120, height: 32 }]} />
          ) : (
            <AppButton
              variant="profile"
              title="Edit Profile"
              handlePress={() => router.push("/(profile)/EditProfile")}
              style={styles.editButton}
            />
          )}
        </View>
      </View>

      <View
        style={[
          styles.bioContainer,
          { backgroundColor: Colors[theme].cardBackground },
        ]}
      >
        {isLoadingProfile ? (
          <>
            <View style={[styles.skeletonText, { width: '90%', height: 16, marginBottom: 8 }]} />
            <View style={[styles.skeletonText, { width: '70%', height: 16 }]} />
          </>
        ) : (
          <>
            <Typography style={styles.bioText}>
              {profileData?.data?.description
                ? profileData?.data?.description
                : "No bio"}
            </Typography>
            <ExternalLink href={profileData?.data?.websiteLink || ""}>
              <Typography style={styles.externalLink}>
                {profileData?.data?.websiteLink}
              </Typography>
            </ExternalLink>
          </>
        )}
      </View>
    </>
  ), [theme, profileData, coverPicSource, profilePicSource, fullName, showInfoOnly, isLoadingProfile]);

  return (
    <Wrapper noPadding>
      <View style={styles.container}>
        <Gallary
          playlists={allPlaylists?.data?.data}
          type="private"
          vidoes={data?.data?.data}
          totalVideos={data?.data?.totalDocs}
          isLoadingVideos={isLoadingVideos}
          onLoadMoreVideos={fetchNextVideosPage}
          hasMoreVideos={hasMoreVideos}
          isLoadingMoreVideos={isLoadingMoreVideos}
          onLoadMorePlaylists={fetchNextPlaylistsPage}
          hasMorePlaylists={hasMorePlaylists}
          isLoadingMorePlaylists={isLoadingMorePlaylists}
          ListHeaderComponent={ProfileHeader}
          galleryRefetch={onRefresh}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
    </Wrapper>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = SCREEN_WIDTH / 3; // 3:1 aspect ratio
const AVATAR_SIZE = Math.round((SCREEN_WIDTH / 390) * 100); // 100px on 390px screen, proportional on others

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  coverContainer: {
    position: "relative",
    height: COVER_HEIGHT,
  },
  coverImage: {
    width: "100%",
    height: COVER_HEIGHT,
    resizeMode: "cover",
  },
  profilePictureContainer: {
    position: "absolute",
    bottom: -AVATAR_SIZE / 2, // Half avatar extends below cover
    left: 16,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  userDetailsContainer: { 
    paddingHorizontal: 16,
    paddingTop: 6, 
    paddingBottom: 16,
    marginLeft: AVATAR_SIZE + 16,
  },
  editButtonContainer: {
    marginTop: 6,
    alignItems: "flex-end",
  },
  editButton: {
    minWidth: 120,
  },
  bioContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 10,
  },
  bioText: {
    marginBottom: 10,
  },
  externalLink: {
    color: "#0390C1",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  userInfoItem: {
    alignItems: "center",
  },
  dotSeparator: {
    width: 6,
    height: 6,
    backgroundColor: "#6E6E6E",
    borderRadius: 3,
    marginHorizontal: 10,
  },
  truncatedText: {
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    marginTop: 10,
    opacity: 0.7,
  },
  skeletonText: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    opacity: 0.6,
  },
  skeletonImage: {
    backgroundColor: '#E0E0E0',
    width: '100%',
    opacity: 0.6,
  },
  skeletonAvatar: {
    backgroundColor: '#E0E0E0',
    borderRadius: 999,
    opacity: 0.6,
  },
  skeletonButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    opacity: 0.6,
  },
});

export default Profile;

{
  /* <View style={styles.header}>
        <View
          style={{
            backgroundColor: theme == "dark" ? Colors.dark.background : "#fff",
            paddingVertical: 5,
            borderRadius: 10,
          }}
        >
          <Typography weight="700" size={18} textType="textBold">
            {profileData?.data?.firstName} {profileData?.data?.lastName}
          </Typography>
        </View>
        <View style={styles.headerIcons}>
          <Ionicons
            name="bookmark"
            size={24}
            color={Colors.general.primary}
            onPress={() => router.push("/(profile)/SavedVideos")}
          />
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors[theme].textBold}
            onPress={() => router.push("/(profile)/Settings")}
          />
          <Ionicons
            name="share-outline"
            size={24}
            color={Colors[theme].textBold}
          />
        </View>
      </View> */
}

{
  /* <View
				style={{
					padding: 15,
					flexDirection: "row",
					marginTop: -50,
					gap: 16,
				}}>
				<View style={styles.profileImageContainer}>
					<Avatar 
						imageSource={profilePic}
						alt={fullName}
						size={100}
						ringColor={Colors[theme].cardBackground}
						ringThickness={3}
						gapSize={2}
						showRing={true}
					/>
				</View>

				<View style={{ paddingTop: 40, flex: 1, gap: 17 }}>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "space-between" }}>
						<View style={{ width: 6, height: 6, backgroundColor: "#6E6E6E", borderRadius: 3 }} />
						<Typography>
							{profileData?.data?.firstName} {profileData?.data?.lastName}
						</Typography>
						<View style={{ width: 6, height: 6, backgroundColor: "#6E6E6E", borderRadius: 3 }} />
						<Typography>94k subs</Typography>
						<View style={{ width: 6, height: 6, backgroundColor: "#6E6E6E", borderRadius: 3 }} />
					</View>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 10, height: 33 }}>
						<Image source={Icons.chart} style={{ width: 32, height: 32}} tintColor={Colors[theme].textBold} />
						<AppButton variant="profile" title="Edit profile" handlePress={() => router.push("/(profile)/EditProfile")} style={{ flex: 1 }} />
					</View>
				</View>
			</View> */
}

{
  /* <View style={{ paddingTop: 40, flex: 1, gap: 17 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                backgroundColor: "#6E6E6E",
                borderRadius: 3,
                marginLeft: 20
              }}
            />
            <Typography>
              {profileData?.data?.firstName} {profileData?.data?.lastName}
            </Typography>
            <View
              style={{
                width: 6,
                height: 6,
                backgroundColor: "#6E6E6E",
                borderRadius: 3,
                marginLeft: 20
              }}
            />
            <Typography>94k subs</Typography>
        
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              width: "80%",
              marginLeft: "auto",
            }}
          >
            <Image
              source={Icons.chart}
              style={{ width: 32, height: 32, borderRadius: 15 }}
              tintColor={Colors[theme].textBold}
            />

            <AppButton
              title="Edit Profile"
              handlePress={() => router.push("/(profile)/EditProfile")}
              style={{ flex: 1 }}
              height={35}
            />
          </View>
        </View> */
}
// </View>