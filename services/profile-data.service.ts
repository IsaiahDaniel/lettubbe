export class ProfileDataService {
  static formatSubscriberCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    }
    return count.toString();
  }

  static buildDisplayName(profileData: any): string {
    return profileData?.displayName ||
      `${profileData?.firstName || ""} ${profileData?.lastName || ""}`.trim();
  }

  static buildUserInfo(profileData: any) {
    return {
      firstName: profileData?.firstName || profileData?.displayName || "",
      lastName: profileData?.lastName || "",
      profilePicture: profileData?.profilePicture || "",
      username: profileData?.username || "",
    };
  }

  static buildUserData(profileData: any, userId: string | undefined, displayName: string) {
    return {
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
    };
  }

  static buildChatParams(profileData: any, userId: string) {
    return {
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
  }

  static buildGalleryData(userPlaylists: any, userVideos: any, userPhotos: any) {
    return {
      playlists: userPlaylists?.data?.data || [],
      videos: userVideos?.data?.data,
      photos: userPhotos?.data?.data,
      totalVideos: userVideos?.data?.totalDocs,
      totalPhotos: userPhotos?.data?.totalDocs,
    };
  }
}