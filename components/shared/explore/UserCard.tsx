import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import Avatar from "@/components/ui/Avatar";
import UserProfile from "@/components/ui/Modals/UserProfile";
import SubscribeButton from "@/components/shared/profile/SubscribeButton";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors, Images } from "@/constants";
import useGetPublicProfile from "@/hooks/profile/useGetPublicProfile";
import useSubscription from "@/hooks/profile/useSubscription";
import UserProfileBottomSheet from "@/components/ui/Modals/UserProfileBottomSheet";
import { useSearchStore } from "@/store/searchStore";

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

interface UserCardProps {
  user: User;
  onPress?: (user: User) => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;
const COVER_HEIGHT = 100;

const UserCard: React.FC<UserCardProps> = React.memo(({ user, onPress }) => {
  const { theme } = useCustomTheme();
  const { openProfileSheetUserId, openProfileSheet, closeProfileSheet } = useSearchStore();

  // Check if this user's profile sheet is visible
  const isProfileSheetVisible = openProfileSheetUserId === user._id;

  // Log when component mounts/unmounts
  React.useEffect(() => {
    console.log(`UserCard[${user._id}] mounted`);
    return () => {
      console.log(`UserCard[${user._id}] unmounting`);
    };
  }, [user._id]);

  const { data: profileData, isPending } = useGetPublicProfile(user._id);

  const {
    isSubscribed,
    subscriberCount,
    isLoading: subscriptionLoading,
    handleSubscribe,
    handleUnsubscribe,
  } = useSubscription({
    initialIsSubscribed: profileData?.isSubscribed || false,
    initialSubscriberCount: profileData?.subscriberCount || 0,
  });

  const handlePress = () => {
    if (onPress) {
      onPress(user);
    } else {
      console.log(`UserCard[${user._id}] opening profile sheet for user:`, user._id, user.username);
      openProfileSheet(user._id);
    }
  };

  const displayName = user.displayName || user.firstName || user.username;
  const coverPhotoUri = user.coverPhoto || profileData?.coverPhoto;
  const profilePictureUri = user.profilePicture || profileData?.profilePicture;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: Colors[theme].sheetBackground,
            borderColor: Colors[theme].borderColor,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <Image
            source={
              coverPhotoUri ? { uri: coverPhotoUri } : Images.defaultCoverPhoto
            }
            style={[
              styles.coverPhoto,
              { backgroundColor: Colors[theme].cardBackground },
            ]}
            resizeMode="cover"
          />
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar
            imageSource={profilePictureUri}
            size={80}
            uri={!!profilePictureUri}
            ringColor={Colors[theme].avatar}
            ringThickness={3}
            gapSize={2}
            showRing={true}
            alt={displayName}
          />
        </View>

        {/* Subscribe Button */}
        <SubscribeButton
          userId={user._id}
          initialIsSubscribed={isSubscribed}
          subscriberCount={subscriberCount}
          onSubscribe={handleSubscribe}
          onUnsubscribe={handleUnsubscribe}
          isLoading={subscriptionLoading || isPending}
          containerStyle={styles.subscribeButtonContainer}
        />
        {/* User Info */}
        <View style={styles.userInfo}>
          <View>
            <Typography
              weight="600"
              size={16}
              numberOfLines={1}
              style={styles.displayName}
            >
              {displayName}
            </Typography>

            <Typography
              size={14}
              color={Colors[theme].textLight}
              numberOfLines={1}
              style={styles.username}
            >
              @{user.username}
            </Typography>

            {/* Subscriber Count */}
            {!isPending && (
              <Typography
                size={12}
                color={Colors[theme].textLight}
                style={styles.subscriberCount}
              >
                {subscriberCount}{" "}
                {subscriberCount === 1 ? "subscriber" : "subscribers"}
              </Typography>
            )}
          </View>

          {/* Description */}
          {user.description && (
            <Typography
              size={14}
              textType="textBold"
              numberOfLines={2}
              style={styles.description}
            >
              {user.description}
            </Typography>
          )}
        </View>
      </TouchableOpacity>

      {/* UserProfileBottomSheet is now rendered at a higher level to prevent FlatList re-renders */}
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  coverContainer: {
    height: COVER_HEIGHT,
    width: "100%",
  },
  coverPhoto: {
    width: "100%",
    height: "100%",
  },
  avatarContainer: {
    position: "absolute",
    top: COVER_HEIGHT - 25,
    left: 8,
    zIndex: 1,
  },
  userInfo: {
    paddingHorizontal: 12,
    paddingTop: 24,
    justifyContent: "space-between",
  },
  displayName: {
    marginBottom: 0,
  },
  username: {
    marginBottom: 4,
  },
  subscriberCount: {
    marginBottom: 6,
    fontWeight: "500",
  },
  description: {
    lineHeight: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  subscribeButtonContainer: {
    width: 150,
    marginVertical: 0,
    marginRight: 8,
    marginTop: 6,
    alignSelf: "flex-end",
  },
});

export default UserCard;
