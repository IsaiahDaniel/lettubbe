import { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";

export interface Video {
  isCommentsAllowed: boolean | undefined;
  commentCount: number;
  viewCount: number;
  _id: string;
  thumbnail: string;
  duration: string;
  profilePic: string;
  username: string;
  createdAt: string;
  comments: any[];
  reactions: any;
  description: string;
  videoUrl: string;
  images: string[];
  mentions?: Array<{
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  } | null>;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
    userId: string;
    username: string;
    subscribers: any;
    subscription?: {
      level: 'gold' | 'platinum';
      isVerified: boolean;
    };
  } | null;
  isBookmarked: boolean;
  isPinned?: boolean;
  thumbnailDimensions?: {
    width: number;
    height: number;
  };
}

export interface UserInfo {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  username?: string;
  subscription?: {
    level: 'gold' | 'platinum';
    isVerified: boolean;
  };
}

export type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export type SheetType = "comments" | "plays" | "share";

export interface ActionButtonProps {
  icon: IoniconsName;
  color: string;
  count: number;
  onPress: () => void;
  testID?: string;
}

export interface VideoCardThumbnailProps {
  video: Video;
  userInfo: UserInfo;
  duration: number | string | any;
  shouldLoadMetadata: boolean;
  onDurationChange: (duration: number) => void;
  onAvatarPress?: () => void;
  isAutoPlaying?: boolean;
  enablePreview?: boolean;
  videoDimensions?: { width: number; height: number } | null;
  onAutoplayProgressUpdate?: (currentTime: number, duration: number) => void;
  onAutoplayStart?: () => void;
  onAutoplayStop?: () => void;
}

export interface VideoCardInteractionBarProps {
  likeIcon: any;
  likeColor: string;
  likeCount: number;
  textColor: string;
  commentCount: number;
  onLikePress: () => void;
  onCommentPress: () => void;
  onPlayPress: () => void;
  onBookmarkPress: () => void;
  onSharePress: () => void;
  bookmarkIcon: any;
  bookmarkColor: string;
  isBookmarked: boolean | undefined;
  isCommentsAllowed?: boolean;
}

export interface VideoCardMetaInfoProps {
  description: string;
  formattedTime: string;
  mentions?: Array<{
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  } | null>;
}

export interface VideoCardCommentBoxProps {
  commentCount: number;
  onPress: () => void;
  backgroundColor: string;
}

export interface VideoCardBottomSheetsProps {
  activeSheet: SheetType | null;
  onClose: () => void;
  postId: string;
  textColor: string;
}

export interface LazyVideoMetadataProps {
  videoUrl: string;
  onDurationChange: (duration: number) => void;
}

export interface VideoThumbnailProps {
  thumbnailUrl: string;
  displayDuration: string;
  userInfo: UserInfo;
  onAvatarPress?: () => void;
}
