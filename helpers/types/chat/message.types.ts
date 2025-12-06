export interface MessageUser {
  id: string;
  _id: string;
  username: string;
  profilePicture?: string;
}

export interface BaseMessage {
  _id?: string;
  id?: string;
  text: string;
  createdAt: string;
  userId: string | MessageUser | null;
  isDeleted?: boolean;
  repliedTo?: BaseMessage | string | null;
}

export interface MediaMessage extends BaseMessage {
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  localMedia?: MediaAsset[];
  isUploading?: boolean;
  uploadError?: boolean;
}

export interface MediaAsset {
  mimeType: any;
  type: any;
  size: number;
  name: string | undefined;
  uri: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  filename?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface CommunityMessage extends MediaMessage {
  documentDetails?: any[];
  documentUrl?: string;
  documentUrls?: string[];
  groupId?: string;
  sender?: string;
}

export interface CommunityMessageWithContext extends CommunityMessage {
  isCurrentUser: boolean; // Pre-calculated by MessageUIHelper to prevent UI flicker
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'community_invite' | 'deleted' | 'shared_photo' | 'shared_video' | 'stream';

export interface MessageRenderProps {
  item: CommunityMessage;
  index?: number;
  isOwnMessage: boolean;
  formattedTime: string;
  shouldShowTimestamp: boolean;
  onUserPress: (userId: string) => void;
  onMediaPress?: (mediaItems: MediaItem[], initialIndex: number, senderName: string, timestamp: string) => void;
  scrollToMessage?: (messageId: string) => void;
  highlightedMessageId?: string | null;
}

export interface MediaItem {
  uri: string;
  type: 'image' | 'video' | 'audio';
  caption?: string;
}

export interface DateSeparatorItem {
  type: 'dateSeparator';
  date: string;
  displayDate: string;
  id: string;
}

export interface CommunityMessageWithType extends CommunityMessage {
  type?: never; // This ensures CommunityMessage never has a type property
}

export type MessageListItem = CommunityMessageWithType | DateSeparatorItem;