import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import Avatar from "@/components/ui/Avatar";
import SubscribeButton from "@/components/shared/profile/SubscribeButton";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors, Images } from "@/constants";
import useGetPublicProfile from "@/hooks/profile/useGetPublicProfile";
import useSubscription from "@/hooks/profile/useSubscription";
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

interface UserListVerticalProps {
  users: User[];
  onUserPress?: (user: User) => void;
}

interface UserListItemProps {
  user: User;
  onPress?: (user: User) => void;
}

const UserListItem: React.FC<UserListItemProps> = React.memo(({ user, onPress }) => {
  const { theme } = useCustomTheme();
  const { openProfileSheet } = useSearchStore();
  
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
      openProfileSheet(user._id);
    }
  };

  const displayName = user.displayName || user.firstName || user.username;
  const profilePictureUri = user.profilePicture || profileData?.profilePicture;

  return (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        { 
          // backgroundColor: Colors[theme].sheetBackground,
          borderBottomColor: Colors[theme].borderColor,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <Avatar
        imageSource={profilePictureUri}
        size={50}
        uri={!!profilePictureUri}
        ringColor={Colors[theme].avatar}
        ringThickness={2}
        gapSize={1}
        showRing={true}
        alt={displayName}
      />

      {/* User Info */}
      <View style={styles.userInfo}>
        <Typography
          textType="textBold"
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

        {/* Description */}
        {user.description && (
          <Typography
            size={13}
            color={Colors[theme].textLight}
            numberOfLines={2}
            style={styles.description}
          >
            {user.description}
          </Typography>
        )}

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
    </TouchableOpacity>
  );
});

const UserListVertical: React.FC<UserListVerticalProps> = ({
  users,
  onUserPress,
}) => {
  if (!users || users.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {users.map((user) => (
        <UserListItem
          key={user._id}
          user={user}
          onPress={onUserPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  displayName: {
    marginBottom: 2,
  },
  username: {
    marginBottom: 4,
  },
  description: {
    lineHeight: 16,
    marginBottom: 4,
  },
  subscriberCount: {
    fontWeight: "500",
  },
  subscribeButtonContainer: {
    width: 150,
    marginVertical: 0,
  },
});

export default UserListVertical;