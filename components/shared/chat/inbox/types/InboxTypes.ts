export interface InboxMessage {
  audioUrl?: string;
  _id: string | undefined;
  sender: any;
  id?: string;
  text: string;
  userId: string | { _id?: string; id?: string; username?: string; [key: string]: any };
  time?: string;
  createdAt?: string;
  seen?: boolean;
  isCurrentUser?: boolean;
  images?: string[];
  videos?: string[];
  videoUrl?: string;
  documentUrl?: string;
  documentUrls?: string[];
  documentDetails?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  mediaUrls?: {
    images?: string[];
    videos?: string[];
    audioUrl?: string;
    documentUrl?: string;
    documentUrls?: string[];
    documentDetails?: Array<{
      url: string;
      name: string;
      size: number;
      type: string;
    }>;
  };
  repliedTo?: (InboxMessage & { senderName?: string }) | string | null;
  senderName?: string;
  // Additional user fields that might be present
  firstName?: string;
  lastName?: string;
  username?: string;
  displayName?: string;
  isOptimistic?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadError?: boolean;
  isSent?: boolean;
  isDeleted?: boolean;
  retryFn?: () => void;
}

export interface InboxProfile {
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  subscribers: string;
}

export interface InboxProps {
  chatId: string;
  username: string;
  displayName: string;
  userId: string;
  subscriberCount: string;
  avatar: string;
  shareVideoData?: string;
}

export interface MessageRenderProps {
  message: InboxMessage;
  index: number;
  currentUserId: string;
  profile: InboxProfile;
  userDetails: any;
  otherUser: any;
  theme: string;
  onMediaPress: (mediaItems: Array<{ uri: string, type: 'image' | 'video', caption?: string }>, initialIndex?: number) => void;
  onReply?: (message: InboxMessage) => void;
  onLongPress?: (event: any, message: InboxMessage) => void;
  longPressedMessageId?: string | null;
  scrollToMessage?: (messageId: string) => void;
  highlightedMessageId?: string | null;
}