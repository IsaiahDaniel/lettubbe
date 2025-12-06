import { Post } from "@/helpers/types/explore/explore";
import { VideoItem } from "@/store/feedStore";

export const formatPlays = (views: number): string => {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
};

export const formatDuration = (durationInSeconds: number): string => {
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const transformPostToVideoItem = (post: Post, currentUserId: string | undefined): VideoItem => {
  return {
    _id: post.id,
    description: post.description,
    thumbnail: post.thumbnail,
    videoUrl: post.videoUrl,
    duration: post.duration.toString(),
    user: {
      _id: post.user.id,
      username: post.user.username || "",
      firstName: post.user.firstName || "",
      lastName: post.user.lastName || "",
      profilePicture: post.user.avatar || "",
      subscribers: []
    },
    reactions: {
      likes: (() => {
        const likesCount = post.likes;
        const likesArray = [];

        if (post.isLiked && currentUserId) {
          likesArray.push(currentUserId);
          
          const remainingLikes = likesCount - 1;
          for (let i = 0; i < remainingLikes; i++) {
            likesArray.push(`like-${post.id}-${i}`);
          }
        } else {
          for (let i = 0; i < likesCount; i++) {
            likesArray.push(`like-${post.id}-${i}`);
          }
        }
        
        return likesArray;
      })()
    },
    comments: Array(post.comments).fill(null).map((_, i) => ({
      _id: `comment-${post.id}-${i}`,
      text: "",
      user: {
        _id: "", 
        firstName: "",
        lastName: "",
        profilePicture: ""
      },
      createdAt: post.createdAt
    })),
    viewCount: post.plays,
    commentCount: post.comments,
    createdAt: post.createdAt,
    isCommentsAllowed: true,
  };
};

// Utility functions for video data extraction and handling

/**
 * Extracts video data from a shared video message
 * @param text The message text containing the video link
 * @returns The extracted video data or null if not a video message
 */
export const extractVideoDataFromMessage = (text: string) => {
  const videoLinkPattern = /^lettubbe:\/\/video\/([^?]+)\?data=(.+)$/;
  const match = text.match(videoLinkPattern);

  if (match) {
    try {
      const videoId = match[1];
      const encodedData = match[2];
      const videoData = JSON.parse(decodeURIComponent(encodedData));
      return videoData;
    } catch (error) {
      console.warn('Error parsing video data from message:', error);
      return null;
    }
  }
  return null;
};

/**
 * Extracts community invite data from a shared community invite message
 * @param text The message text containing the community invite link
 * @returns The extracted invite data or null if not a community invite message
 */
export const extractCommunityInviteDataFromMessage = (text: string) => {
  // Pattern for deep links with encoded data: lettubbe://community/123?invite=true&data=encodedData
  const deepLinkPattern = /^lettubbe:\/\/community\/([^?]+)\?invite=true&data=(.+)$/;
  const deepLinkMatch = text.match(deepLinkPattern);

  if (deepLinkMatch) {
    try {
      const communityId = deepLinkMatch[1];
      const encodedData = deepLinkMatch[2];
      const inviteData = JSON.parse(decodeURIComponent(encodedData));
      return inviteData;
    } catch (error) {
      console.warn('Error parsing community invite data from deep link:', error);
      return null;
    }
  }

  // Pattern for HTTPS URLs: https://lettubbe.com/community/123?invite=true
  const httpsPattern = /^https:\/\/lettubbe\.com\/community\/([^?]+)\?invite=true(?:&.*)?$/;
  const httpsMatch = text.match(httpsPattern);

  if (httpsMatch) {
    try {
      const communityId = httpsMatch[1];
      
      // For HTTPS URLs, we need to return a minimal structure with the community ID
      // The CommunityInviteCard component will need to fetch additional data
      return {
        communityId,
        communityName: '', // Will be fetched by the component
        communityAvatar: '',
        memberCount: 0,
        description: '',
        invitedBy: {
          username: 'Someone',
          firstName: '',
          lastName: ''
        },
        isWebLink: true // Flag to indicate this came from a web URL
      };
    } catch (error) {
      console.warn('Error parsing community invite data from HTTPS URL:', error);
      return null;
    }
  }

  return null;
};