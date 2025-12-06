import React, { useCallback, useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Gallary from "@/components/shared/profile/Gallary";
import ProfileAboutPage from "@/components/shared/profile/ProfileAboutPage";
import CustomBottomSheet from "@/components/shared/videoUpload/CustomBottomSheet";
import ReportModal from "../../shared/home/report/ReportModal";
import { useUserProfileData } from "@/hooks/profile/useUserProfileData";
import { useUserProfileActions } from "@/hooks/profile/useUserProfileActions";
import { useProfileModalState } from "@/hooks/profile/useProfileModalState";
import { ProfileDataService } from "@/services/profile-data.service";
import ProfileCoverSection from "./UserProfile/ProfileCoverSection";
import ProfileUserInfo from "./UserProfile/ProfileUserInfo";
import ProfileBioSection from "./UserProfile/ProfileBioSection";
import ProfileActionButtons from "./UserProfile/ProfileActionButtons";

interface UserProfileBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  userId?: string;
}

const UserProfileBottomSheet = ({
  isVisible,
  onClose,
  userId,
}: UserProfileBottomSheetProps) => {
  // console.log('🏠 [PROFILE_MODAL] Rendering with:', {
  //   isVisible,
  //   userId,
  //   timestamp: Date.now(),
  //   time: new Date().toISOString()
  // });

  const { theme } = useCustomTheme();
  const [shouldRenderContent, setShouldRenderContent] = useState(isVisible);

  // Handle content visibility to prevent flash during close animation
  useEffect(() => {
    if (isVisible) {
      // Set content to render immediately when opening
      setShouldRenderContent(true);
    } else {
      // Immediately hide content when closing to prevent flash
      setShouldRenderContent(false);
    }
  }, [isVisible]);

  const profileData = useUserProfileData({ userId, isVisible: isVisible && shouldRenderContent });
  const modalState = useProfileModalState({ isVisible, onClose });
  const actions = useUserProfileActions({
    userId,
    profileData: shouldRenderContent ? profileData.profileData : null,
    onClose
  });

  // console.log('🏠 [PROFILE_MODAL] Hook states:', {
  //   isLoadingProfile: profileData.isLoadingProfile,
  //   enableGalleryLoading: profileData.enableGalleryLoading,
  //   hasProfileData: !!profileData.profileData,
  //   activeView: modalState.activeView
  // });

  const handleMenuOptionSelect = useCallback((option: string) => {
    modalState.handleMenuOptionSelect(
      option,
      actions.blocking.handleBlockUser,
      actions.blocking.handleUnblockUser
    );
  }, [modalState, actions.blocking]);

  const galleryData = shouldRenderContent ? ProfileDataService.buildGalleryData(
    profileData.userPlaylists,
    profileData.userVideos,
    profileData.userPhotos
  ) : {
    playlists: [],
    videos: [],
    photos: [],
    totalVideos: 0,
    totalPhotos: 0,
  };

  const ProfileHeader = useCallback(() => {
    // Don't render any profile components when closing to prevent fallback data
    if (!shouldRenderContent) {
      return <View style={{ flex: 1 }} />;
    }

    return (
      <>
        <ProfileCoverSection
          isLoadingProfile={profileData.isLoadingProfile}
          coverPic={profileData.coverPic}
          profilePic={profileData.profilePic}
          displayName={actions.computed.displayName}
          theme={theme}
          getMenuOptions={modalState.getMenuOptions}
          selectedFilter={modalState.selectedFilter}
          onMenuSelect={handleMenuOptionSelect}
          userId={userId}
        />
        <ProfileUserInfo
          isLoadingProfile={profileData.isLoadingProfile}
          profileData={profileData.profileData}
          userId={userId}
          formattedSubscriberCount={actions.subscription.formattedSubscriberCount}
          subscriberCount={actions.subscription.subscriberCount}
          isSubscribed={actions.subscription.isSubscribed}
          isSubscribing={actions.subscription.isSubscribing}
          onUsernamePress={actions.navigation.handleUsernamePress}
          onSubscribe={actions.subscription.handleSubscribe}
          onUnsubscribe={actions.subscription.handleUnsubscribe}
          theme={theme}
        />
        <ProfileBioSection
          isLoadingProfile={profileData.isLoadingProfile}
          profileData={profileData.profileData}
          theme={theme}
        />
        <ProfileActionButtons
          isLoadingProfile={profileData.isLoadingProfile}
          onChatPress={actions.navigation.handleChatPress}
          theme={theme}
        />
      </>
    );
  }, [shouldRenderContent, profileData, actions, modalState, handleMenuOptionSelect, theme, userId]);

  const renderProfileView = useCallback(() => {
    // Don't render anything when closing to prevent fallback data
    if (!shouldRenderContent) {
      return <View style={{ flex: 1 }} />;
    }

    return (
      <View style={styles.container}>
        {profileData.enableGalleryLoading ? (
          <Gallary
            playlists={galleryData.playlists}
            type="public"
            vidoes={galleryData.videos}
            photos={galleryData.photos}
            totalVideos={galleryData.totalVideos}
            totalPhotos={galleryData.totalPhotos}
            disableAvatarPress={true}
            customUserInfo={actions.computed.userInfo}
            userId={userId}
            galleryRefetch={profileData.onRefresh}
            isLoadingVideos={profileData.videosHookData.isPending}
            isLoadingPhotos={false}
            onLoadMoreVideos={profileData.videosHookData.fetchNextPage}
            hasMoreVideos={profileData.videosHookData.hasNextPage}
            isLoadingMoreVideos={profileData.videosHookData.isFetchingNextPage}
            onLoadMorePhotos={profileData.photosHookData.fetchNextPage}
            hasMorePhotos={profileData.photosHookData.hasNextPage}
            isLoadingMorePhotos={profileData.photosHookData.isFetchingNextPage}
            onLoadMorePlaylists={profileData.playlistsHookData.fetchNextPage}
            hasMorePlaylists={profileData.playlistsHookData.hasNextPage}
            isLoadingMorePlaylists={profileData.playlistsHookData.isFetchingNextPage}
            ListHeaderComponent={ProfileHeader}
            refreshing={profileData.refreshing}
            onRefresh={profileData.onRefresh}
          />
        ) : (
          // Show just the header while gallery is loading
          <ProfileHeader />
        )}
      </View>
    );
  }, [shouldRenderContent, profileData.enableGalleryLoading, galleryData, actions, userId, ProfileHeader]);

  const renderAboutView = useCallback(() => (
    <View style={styles.container}>
      <View style={styles.aboutHeader}>
        <TouchableOpacity
          onPress={modalState.handleBackToProfile}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={24} color={Colors[theme].text} />
          <Typography weight="500" size={14}>
            Back to Profile
          </Typography>
        </TouchableOpacity>
      </View>
      <ProfileAboutPage userData={actions.computed.userData} />
    </View>
  ), [actions.computed.userData, modalState.handleBackToProfile, theme]);

  // console.log('🏠 [PROFILE_MODAL] About to render CustomBottomSheet with isVisible:', isVisible);

  return (
    <>
      <CustomBottomSheet
        isVisible={isVisible}
        onClose={onClose}
        showClose={true}
        showCloseIcon={false}
        sheetheight={"95%"}
      >
        <View style={styles.container}>
          <View style={styles.contentWrapper}>
            {shouldRenderContent && isVisible ? (
              modalState.activeView === "profile" ? renderProfileView() : renderAboutView()
            ) : null}
          </View>
        </View>
      </CustomBottomSheet>

      {shouldRenderContent && modalState.isReportModalVisible && (
        <ReportModal
          isVisible={modalState.isReportModalVisible}
          onClose={modalState.handleCloseReportModal}
          userId={userId || ""}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    overflow: 'hidden',
    zIndex: 1,
    position: 'relative',
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

export default UserProfileBottomSheet;