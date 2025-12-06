import { Video } from "@/helpers/types/feed/types";

export interface TopComment {
  _id: string;
  text: string;
  user: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  createdAt: string;
  likes: string[];
}

export interface VideoCardProps {
  video: Video;
  onPress?: () => void;
  onAvatarPress?: () => void;
  shouldLoadMetadata?: boolean;
  index?: number;
  onDeleteSuccess?: () => void | Promise<any>;
  isCurrentUserVideo?: boolean;
  userInfo?: {
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    username?: string;
  };
  disableAvatarPress?: boolean;
  galleryRefetch?: () => Promise<any>;
  skipInteractionSync?: boolean;
  topComment?: TopComment;
  disableAutoPreview?: boolean;
  isAutoPlaying?: boolean;
}