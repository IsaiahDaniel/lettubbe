export interface ChatMessage {
  repliedTo: any;
  id: string;
  text: string;
  userId: string;
  sender: string;
  receiver?: string;
  time: string;
  createdAt: string;
  seen?: boolean;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
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
  messageId?: string;
  _id?: string;
  isOptimistic?: boolean;
  isDeleted?: boolean;
}

export interface SocketMessage {
  time: string;
  messageId?: string;
  id?: string;
  _id?: string;
  sender: string | { _id: string };
  text: string;
  userId: string | { _id: string };
  createdAt: string;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
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
  seen?: boolean;
  isDeleted?: boolean;
  repliedTo?: any;
}

export interface ConversationDetails {
  conversationId: string;
  userId: string;
  receiverId: string;
}

export interface TypingState {
  isTyping: boolean;
  otherUserTyping: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatHookParams {
  uploadedImages: string[];
  setUploadedImageUrls: (urls: string[]) => void;
  uploadedVideoUrls: string[];
  setUploadedVideoUrls: (urls: string[]) => void;
  uploadedAudioUrl: string;
  setUploadedAudioUrl: (url: string) => void;
  conversationId?: string;
}

export interface OnlineUser {
  userId: string;
  status: 'online' | 'offline';
}