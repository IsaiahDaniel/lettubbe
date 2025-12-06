import { VideoCardProps } from "@/helpers/types/feed/video.types";

// memo with stable comparison
export const arePropsEqual = (prev: VideoCardProps, next: VideoCardProps): boolean => {
  // Fast path: check video ID first
  if (prev.video._id !== next.video._id) return false;
  
  // Create comparison arrays for efficient checking
  const criticalComparisons = [
    prev.shouldLoadMetadata === next.shouldLoadMetadata,
    (prev.video.reactions?.likes?.length || 0) === (next.video.reactions?.likes?.length || 0),
    (prev.video.commentCount || 0) === (next.video.commentCount || 0),
    (prev.video.viewCount || 0) === (next.video.viewCount || 0),
    prev.isCurrentUserVideo === next.isCurrentUserVideo,
    prev.disableAvatarPress === next.disableAvatarPress,
    prev.skipInteractionSync === next.skipInteractionSync,
    prev.isAutoPlaying === next.isAutoPlaying, // Include autoplay state in comparison
  ];

  if (!criticalComparisons.every(Boolean)) return false;

  // Check userInfo efficiently
  if (prev.userInfo !== next.userInfo) {
    if (!prev.userInfo || !next.userInfo) return false;
    const userInfoComparisons = [
      prev.userInfo.firstName === next.userInfo.firstName,
      prev.userInfo.lastName === next.userInfo.lastName,
      prev.userInfo.profilePicture === next.userInfo.profilePicture,
      prev.userInfo.username === next.userInfo.username,
    ];
    if (!userInfoComparisons.every(Boolean)) return false;
  }

  // Check topComment efficiently
  if (prev.topComment !== next.topComment) {
    if (!prev.topComment || !next.topComment) return false;
    const topCommentComparisons = [
      prev.topComment._id === next.topComment._id,
      prev.topComment.text === next.topComment.text,
      prev.topComment.user.username === next.topComment.user.username,
    ];
    if (!topCommentComparisons.every(Boolean)) return false;
  }

  return true;
};