import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import useGetPublicProfile from '@/hooks/profile/useGetPublicProfile';
import useSubscription from '@/hooks/profile/useSubscription';
import { formatNumber } from '@/helpers/utils/formatting';
import AppMenu from '@/components/ui/AppMenu';
import UserProfileBottomSheet from '@/components/ui/Modals/UserProfileBottomSheet';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { useEffect } from 'react';
import ReportModal from '@/components/shared/home/report/ReportModal';
import Wrapper from '@/components/utilities/Wrapper';

interface ProfileScreenProps {
  //add props if needed
}

type TabType = 'media' | 'links' | 'stickers';

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const username = params.username as string;
  const displayNameParam = params.displayName as string;
  const subscriberCountParam = params.subscriberCount as string;
  const avatarParam = params.avatar as string;
  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [selectedMenuOption, setSelectedMenuOption] = useState("");
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const { theme } = useCustomTheme();


  // Get live profile data from API (this will start fetching immediately)
  const {
    data: profileData,
    isPending,
    userVideos,
    vidosIsPending,
    profilePic,
    coverPic
  } = useGetPublicProfile(userId);

  // Get subscription data
  const {
    subscriberCount,
  } = useSubscription({
    initialIsSubscribed: profileData?.isSubscribed ?? false,
    initialSubscriberCount: profileData?.subscriberCount ?? 0,
  });


  // Fallback profile data with URL params as immediate fallback
  const profile = {
    username: profileData?.username || username || 'Unknown User',
    firstName: profileData?.firstName || '',
    lastName: profileData?.lastName || '',
    displayName: profileData?.displayName || displayNameParam || `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim() || profileData?.username || username || 'Unknown User',
    avatar: profilePic?.uri || profileData?.profilePicture || avatarParam || 'https://randomuser.me/api/portraits/lego/1.jpg',
    bio: profileData?.description || "",
    subscribers: subscriberCount || profileData?.subscriberCount || parseInt(subscriberCountParam || '0') || 0,
    videosCount: userVideos?.length || 0
  };

  const handleBack = () => {
    router.back();
  };

  const handleMenuOptionSelect = (option: string) => {
    setSelectedMenuOption(option);

    if (option === "View full profile") {
      setIsBottomSheetVisible(true);
    } else if (option === "Report") {
      setIsReportModalVisible(true);
    }
    // Add other menu options here as needed
  };

  const menuOptions = [
    { name: "View full profile" },
    // { name: "Share profile" },
    // { name: "Report" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'media':
        if (vidosIsPending) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.general.primary} />
            </View>
          );
        }

        if (!userVideos || userVideos.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={48} color={Colors[theme].textLight} />
              <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
                No videos uploaded yet
              </Typography>
              <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
                Videos shared by this user will appear here
              </Typography>
            </View>
          );
        }

        // Group videos into rows of 3
        const videoRows = [];
        for (let i = 0; i < userVideos.length; i += 3) {
          videoRows.push(userVideos.slice(i, i + 3));
        }

        return (
          <View style={styles.mediaGrid}>
            {videoRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.mediaRow}>
                {row.map((video: { _id: any; thumbnail: any; duration: any; }, index: any) => (
                  <TouchableOpacity key={video._id || index} style={styles.mediaImageContainer}>
                    <Image
                      source={{ uri: video.thumbnail || '' }}
                      style={styles.mediaImage}
                    />
                    <View style={styles.videoDuration}>
                      <Typography color="#fff" size={10} weight="500">
                        {video.duration || '0:00'}
                      </Typography>
                    </View>
                  </TouchableOpacity>
                ))}
                {/* Fill remaining slots with empty views to maintain grid structure */}
                {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, emptyIndex) => (
                  <View key={`empty-${emptyIndex}`} style={styles.mediaImageContainer} />
                ))}
              </View>
            ))}
          </View>
        );
      case 'links':
        // TODO: Implement links functionality when API is available
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="link-outline" size={48} color={Colors[theme].textLight} />
            <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
              No shared links yet
            </Typography>
            <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
              Shared links will appear here
            </Typography>
          </View>
        );
      case 'stickers':
        // TODO: Implement stickers functionality when API is available
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="happy-outline" size={48} color={Colors[theme].textLight} />
            <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
              No stickers shared yet
            </Typography>
            <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
              Shared stickers and GIFs will appear here
            </Typography>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Wrapper >
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />

      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors[theme].icon} />
          </TouchableOpacity>

          <Menu>
            <MenuTrigger>
              <View style={[styles.moreButton, { backgroundColor: Colors[theme].background }]}>
                <Ionicons name="ellipsis-vertical" size={24} color={Colors[theme].icon} />
              </View>
            </MenuTrigger>

            <MenuOptions
              customStyles={{
                optionsContainer: {
                  borderRadius: 8,
                  padding: 10,
                  backgroundColor: Colors[theme].cardBackground,
                  width: 180,
                  zIndex: 9999,
                  elevation: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                },
              }}
            >
              {menuOptions.map((option) => (
                <MenuOption
                  key={option.name}
                  onSelect={() => handleMenuOptionSelect(option.name)}
                >
                  <View style={styles.menuOption}>
                    <Typography
                      weight="500"
                      size={13}
                      lineHeight={24}
                      textType="textBold"
                    >
                      {option.name}
                    </Typography>
                  </View>
                </MenuOption>
              ))}
            </MenuOptions>
          </Menu>
        </View>

        {isPending && !avatarParam ? (
          <View style={styles.fullPageLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.general.primary} />
            <Typography color={Colors[theme].textLight} style={{ marginTop: 16 }}>
              Loading profile...
            </Typography>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.avatarWrapper}>
              <Avatar
                imageSource={profilePic || { uri: profile.avatar }}
                alt={profile.username}
                size={100}
                ringColor={Colors[theme].avatar}
                ringThickness={3}
                showRing={true}
                uri
              />
            </View>

            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: Colors[theme].cardBackground }]}>
              {/* Profile Info */}
              <Typography
                textType="textBold"
                size={24}
                weight="600"
                align="center"
                style={styles.usernameStyle}
              >
                {profile.displayName}
              </Typography>

              <Typography
                color={Colors[theme].textLight}
                size={14}
                align="center"
                style={styles.subscribersStyle}
              >
                @{profile.username} • {profile.subscribers > 0 ? formatNumber(profile.subscribers) : '0'} subscriber{profile.subscribers !== 1 ? 's' : ''}
              </Typography>

              <Typography
                color={Colors[theme].text}
                size={14}
                align="center"
                style={styles.bioStyle}
                lineHeight={20}
              >
                {profile.bio}
              </Typography>
            </View>

            {/* Tabs */}
            {/* <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'media' && styles.activeTab]}
                onPress={() => setActiveTab('media')}
              >
                <Typography
                  color={activeTab === 'media' ? '#fff' : Colors[theme].text}
                  weight={activeTab === 'media' ? '500' : '400'}
                >
                  Media
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'links' && styles.activeTab]}
                onPress={() => setActiveTab('links')}
              >
                <Typography
                  color={activeTab === 'links' ? '#fff' : Colors[theme].text}
                  weight={activeTab === 'links' ? '500' : '400'}
                >
                  Links
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'stickers' && styles.activeTab]}
                onPress={() => setActiveTab('stickers')}
              >
                <Typography
                  color={activeTab === 'stickers' ? '#fff' : Colors[theme].text}
                  weight={activeTab === 'stickers' ? '500' : '400'}
                >
                  Stickers
                </Typography>
              </TouchableOpacity>
            </View> */}

            {/* Tab Content */}
            {renderTabContent()}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* User Profile Bottom Sheet */}
      <UserProfileBottomSheet
        isVisible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        userId={userId}
      />

      {/* Report Modal */}
      <ReportModal
        isVisible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        userId={userId}
      />
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
  },
  backButton: {
    padding: 4,
  },
  moreButton: {
    padding: 4,
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    paddingTop: 20,
    zIndex: 2,
  },
  profileCard: {
    borderRadius: 20,
    paddingTop: 50,
    paddingHorizontal: 20,
    marginTop: -40,
    overflow: 'hidden',
  },
  usernameStyle: {
    marginBottom: 4,
  },
  usernameHandleStyle: {
    marginBottom: 8,
  },
  subscribersStyle: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  fullPageLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  mediaImageContainer: {
    width: '32.8%',
    position: 'relative',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bioStyle: {
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 36,
    marginBottom: 16,
  },
  tab: {
    justifyContent: 'center',
    height: 27,
    paddingHorizontal: 10.13,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: Colors.general.primary,
  },
  mediaGrid: {
    width: '100%',
    paddingHorizontal: 2
  },
  mediaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  mediaImage: {
    width: '32.8%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  linksList: {
    width: '100%',
    paddingHorizontal: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  stickersGrid: {
    width: '100%',
    paddingHorizontal: 2,
  },
  menuOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    width: "100%",
  },
});

export default ProfileScreen;