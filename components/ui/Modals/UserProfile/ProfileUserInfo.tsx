import React from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import SubscribeButton from "@/components/shared/profile/SubscribeButton";
import { Colors } from "@/constants";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = Math.round((SCREEN_WIDTH / 390) * 100);

interface ProfileUserInfoProps {
  isLoadingProfile: boolean;
  profileData: any;
  userId: string | undefined;
  formattedSubscriberCount: string;
  subscriberCount: number;
  isSubscribed: boolean;
  isSubscribing: boolean;
  onUsernamePress: () => void;
  onSubscribe: (userId: string) => Promise<void>;
  onUnsubscribe: (userId: string) => Promise<void>;
  theme: string;
}

const ProfileUserInfo: React.FC<ProfileUserInfoProps> = ({
  isLoadingProfile,
  profileData,
  userId,
  formattedSubscriberCount,
  subscriberCount,
  isSubscribed,
  isSubscribing,
  onUsernamePress,
  onSubscribe,
  onUnsubscribe,
  theme,
}) => {
  return (
    <View style={styles.userDetailsContainer}>
      <View style={styles.userInfoRow}>
        <TouchableOpacity
          style={styles.userInfoItem}
          onPress={onUsernamePress}
          disabled={isLoadingProfile}
        >
          {isLoadingProfile ? (
            <View style={[styles.skeletonText, { width: 80, height: 16, backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />
          ) : (
            <Typography numberOfLines={1} style={styles.truncatedText}>
              @{profileData?.username}
            </Typography>
          )}
        </TouchableOpacity>

        <View style={styles.dotSeparator} />

        <TouchableOpacity style={styles.userInfoItem} disabled={isLoadingProfile}>
          {isLoadingProfile ? (
            <View style={[styles.skeletonText, { width: 60, height: 16, backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />
          ) : (
            <Typography numberOfLines={1} style={styles.truncatedText}>
              {formattedSubscriberCount} {subscriberCount === 1 ? "Sub" : "Subs"}
            </Typography>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.subscribeButtonContainer}>
        {isLoadingProfile ? (
          <View style={[styles.skeletonButton, { width: 120, height: 32, marginTop: 10, backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />
        ) : (
          <SubscribeButton
            userId={profileData?._id || profileData?.userId || (userId as string)}
            initialIsSubscribed={isSubscribed}
            subscriberCount={subscriberCount}
            onSubscribe={onSubscribe}
            onUnsubscribe={onUnsubscribe}
            isLoading={isSubscribing}
            containerStyle={{
              marginTop: 10,
              justifyContent: "flex-end",
              marginLeft: "auto",
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userDetailsContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    marginLeft: AVATAR_SIZE + 16,
  },
  subscribeButtonContainer: {
    marginTop: 0,
    alignItems: "flex-end",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfoItem: {
    alignItems: "center",
    flex: 0,
    maxWidth: SCREEN_WIDTH * 0.35, // Limit username to 35% of screen width
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
  skeletonText: {
    borderRadius: 4,
    opacity: 0.6,
  },
  skeletonButton: {
    borderRadius: 8,
    opacity: 0.6,
  },
});

export default ProfileUserInfo;