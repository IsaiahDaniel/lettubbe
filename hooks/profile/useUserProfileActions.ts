import { useCallback, useMemo } from "react";
import { router } from "expo-router";
import { useBlockChannel } from "./useBlockChannel";
import useSubscription from "./useSubscription";
import { useGetUserIdState } from "@/store/UsersStore";
import { useAlert } from "@/components/ui/AlertProvider";
import { formatNumber } from "@/helpers/utils/formatting";

interface UseUserProfileActionsProps {
  userId: string | undefined;
  profileData: any;
  onClose: () => void;
}

export const useUserProfileActions = ({ userId, profileData, onClose }: UseUserProfileActionsProps) => {
  const { showInfoOnly } = useAlert();
  const { setUserId: setChatUserId } = useGetUserIdState();

  const {
    isSubscribed,
    subscriberCount,
    isLoading: isSubscribing,
    handleSubscribe,
    handleUnsubscribe,
  } = useSubscription({
    initialIsSubscribed: profileData?.isSubscribed ?? false,
    initialSubscriberCount: profileData?.subscriberCount ?? 0,
  });

  const {
    blockChannel,
    unblockChannel,
    isLoading: isBlockActionLoading,
  } = useBlockChannel({
    userId: userId,
    onBlockSuccess: () => {
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onUnblockSuccess: () => {
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: (error) => {
      console.error("Failed to block/unblock channel:", error);
    },
  });

  const handleChatPress = useCallback(() => {
    if (profileData && userId) {
      setChatUserId(userId);
      
      const chatParams = {
        pathname: '/(chat)/[Id]/Inbox' as const,
        params: {
          Id: `new-${userId}`,
          username: profileData?.username || '',
          displayName: profileData?.displayName || profileData?.firstName || '',
          userId: userId,
          avatar: profileData?.profilePicture || '',
          subscriberCount: profileData?.subscriberCount?.toString() || '0',
        },
      };
      router.push(chatParams);
      onClose();
    }
  }, [profileData, userId, onClose, setChatUserId]);

  const handleUsernamePress = useCallback(() => {
    if (profileData?.username) {
      showInfoOnly("Username", `@${profileData?.username}`);
    }
  }, [profileData?.username, showInfoOnly]);

  const handleBlockUser = useCallback(() => {
    if (userId && profileData) {
      blockChannel(
        userId,
        profileData?.displayName || profileData?.firstName || profileData?.username || ""
      );
    }
  }, [blockChannel, userId, profileData]);

  const handleUnblockUser = useCallback(() => {
    if (userId && profileData) {
      unblockChannel(
        userId,
        profileData?.displayName || profileData?.firstName || profileData?.username || ""
      );
    }
  }, [unblockChannel, userId, profileData]);

  const displayName = useMemo(() =>
    profileData?.displayName ||
    `${profileData?.firstName || ""} ${profileData?.lastName || ""}`.trim(),
    [profileData?.displayName, profileData?.firstName, profileData?.lastName]
  );

  const formattedSubscriberCount = useMemo(() =>
    formatNumber(subscriberCount),
    [subscriberCount]
  );

  const userInfo = useMemo(
    () => ({
      firstName: profileData?.firstName || profileData?.displayName || "",
      lastName: profileData?.lastName || "",
      profilePicture: profileData?.profilePicture || "",
      username: profileData?.username || "",
    }),
    [profileData]
  );

  const userData = useMemo(
    () => ({
      _id: profileData?._id || userId,
      firstName: profileData?.firstName || "",
      lastName: profileData?.lastName || "",
      displayName: displayName,
      username: profileData?.username || "",
      websiteLink: profileData?.websiteLink || "",
      description: profileData?.description || "",
      createdAt: profileData?.createdAt,
      location: profileData?.location || "",
      email: profileData?.email,
      socialLinks: profileData?.socialLinks || [],
      totalViews: profileData?.totalViews || 0,
      joinDate: profileData?.joinDate || profileData?.createdAt,
    }),
    [profileData, userId, displayName]
  );

  return {
    subscription: {
      isSubscribed,
      subscriberCount,
      isSubscribing,
      handleSubscribe,
      handleUnsubscribe,
      formattedSubscriberCount,
    },
    blocking: {
      isBlockActionLoading,
      handleBlockUser,
      handleUnblockUser,
    },
    navigation: {
      handleChatPress,
      handleUsernamePress,
    },
    computed: {
      displayName,
      userInfo,
      userData,
    },
  };
};