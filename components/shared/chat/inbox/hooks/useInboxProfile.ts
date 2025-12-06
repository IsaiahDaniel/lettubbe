import { useMemo } from "react";
import { InboxProfile } from "../types/InboxTypes";
import { truncateText } from "@/helpers/utils/util";

interface UseInboxProfileParams {
  preloadedProfileData: any;
  preloadedProfilePic: any;
  username: string;
  displayName: string;
  avatar: string;
  subscriberCount: string;
}

export const useInboxProfile = ({
  preloadedProfileData,
  preloadedProfilePic,
  username,
  displayName,
  avatar,
  subscriberCount
}: UseInboxProfileParams): InboxProfile => {
  return useMemo(() => {
    const preloadedData = preloadedProfileData || {};
    const profilePic = preloadedProfilePic || {};

    const getDisplayName = () => {
      if (preloadedData?.displayName) return preloadedData.displayName;
      if (preloadedData?.firstName && preloadedData?.lastName) {
        return `${preloadedData.firstName} ${preloadedData.lastName}`;
      }
      if (preloadedData?.firstName) return preloadedData.firstName;
      if (preloadedData?.username) return preloadedData.username;
      if (displayName) return displayName;
      if (username) return username;
      return "Unknown User";
    };

    const getAvatarUrl = () => {
      if (profilePic?.uri) return profilePic.uri;
      if (preloadedData?.profilePicture) return preloadedData.profilePicture;
      if (avatar) return avatar;
      return "";
    };

    return {
      username: preloadedData?.username?.toString() || username || "Unknown User",
      displayName: getDisplayName(),
      avatar: getAvatarUrl(),
      bio: preloadedData?.description ?
        truncateText(preloadedData.description.toString(), 30) : "",
      subscribers: preloadedData?.subscriberCount?.toString() || subscriberCount || "0",
    };
  }, [preloadedProfileData, preloadedProfilePic, username, displayName, avatar, subscriberCount]);
};