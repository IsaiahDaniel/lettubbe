import React from "react";
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import Avatar from "@/components/ui/Avatar";
import AppMenu from "@/components/ui/AppMenu";
import VerificationBadge from "@/components/ui/VerificationBadge";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import useUserVerificationBadge from "@/hooks/profile/useUserVerificationBadge";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = SCREEN_WIDTH / 3;
const AVATAR_SIZE = Math.round((SCREEN_WIDTH / 390) * 100);

interface ProfileCoverSectionProps {
  isLoadingProfile: boolean;
  coverPic: any;
  profilePic: any;
  displayName: string;
  theme: string;
  getMenuOptions: () => { name: string }[];
  selectedFilter: string;
  onMenuSelect: (option: string) => void;
  userId?: string;
}

const ProfileCoverSection: React.FC<ProfileCoverSectionProps> = ({
  isLoadingProfile,
  coverPic,
  profilePic,
  displayName,
  getMenuOptions,
  selectedFilter,
  onMenuSelect,
  userId,
}) => {
  const { theme } = useCustomTheme();
  const { data: verificationData } = useUserVerificationBadge(userId);
  return (
    <View style={styles.coverContainer}>
      {isLoadingProfile ? (
        <View style={[styles.skeletonImage, { height: COVER_HEIGHT, backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />
      ) : (
        <Image source={coverPic} style={styles.coverImage} />
      )}

      <View style={styles.headerOverlay}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {isLoadingProfile ? (
              <View style={[styles.skeletonText, { width: 120, height: 24, backgroundColor: "rgba(255, 255, 255, 0.3)" }]} />
            ) : (
              <View style={styles.titleWithBadge}>
                <Typography weight="600" size={20} textType="carter" color="#fff" numberOfLines={1}>
                  {displayName}
                </Typography>
                {verificationData?.data?.isVerified && (
                  <VerificationBadge 
                    level={verificationData.data.level} 
                    size={20} 
                    style={styles.verificationBadge}
                  />
                )}
              </View>
            )}
          </View>
          <View style={styles.headerIcons}>
            <AppMenu
              width={"50%"}
              trigger={(isOpen) => (
                <View style={styles.menuButton}>
                  <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </View>
              )}
              options={getMenuOptions()}
              selectedOption={selectedFilter}
              onSelect={onMenuSelect}
            />
          </View>
        </View>
      </View>

      <View style={styles.profilePictureContainer}>
        {isLoadingProfile ? (
          <View style={[styles.skeletonAvatar, { width: AVATAR_SIZE, height: AVATAR_SIZE, backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />
        ) : (
          <Avatar
            imageSource={profilePic}
            size={AVATAR_SIZE}
            uri
            ringColor={Colors[theme].avatar}
            ringThickness={3}
            gapSize={2}
            showRing={true}
            alt={displayName}
            expandable={true}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  coverContainer: {
    position: "relative",
    height: COVER_HEIGHT,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  titleContainer: {
    backgroundColor: "rgba(0, 8, 61, 0.7)",
    padding: 10,
    borderRadius: 10,
    width: "auto",
    maxWidth: SCREEN_WIDTH * 0.80, // Limit display name to 80% of screen width
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verificationBadge: {
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  menuButton: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 8,
    borderRadius: 12,
  },
  profilePictureContainer: {
    position: "absolute",
    bottom: Math.max(-AVATAR_SIZE / 1.5),
    left: 16,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  skeletonImage: {
    width: '100%',
    opacity: 0.6,
  },
  skeletonText: {
    borderRadius: 4,
    opacity: 0.6,
  },
  skeletonAvatar: {
    borderRadius: 999,
    opacity: 0.6,
  },
});

export default ProfileCoverSection;