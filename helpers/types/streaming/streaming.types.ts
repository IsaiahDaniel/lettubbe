export interface StreamCard {
  id: string;
  title: string;
  streamer: string;
  viewers: string;
  category: string;
  description: string;
  thumbnail: string;
  isLive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  coverPhoto: string;
  views: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PopularStreamer {
  name(arg0: string, name: any): unknown;
  userId: string;
  totalStreams: number;
  totalViews: number;
  isLive: boolean;
  lastActive: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profilePicture?: string;
  };
}

export interface ICreateStream {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  time: string;
}

export interface CategoryStream {
  _id: string;
  name: string;
  coverPhoto: string;
  user: {
    username: string;
    firstName: string;
    lastName: string
  };
  description: string;
  views: number;
}

export interface Stream {
  _id: string;
  title: string;
  coverPhoto: string;
  user: {
    streamsDone: string;
    isAllowed: boolean;
    user: {
      username: string;
      firstName: string;
      lastName: string;
      profilePicture: string;
      isAllowed: boolean;
    },
  },
  description: string;
  isLive: boolean;
  views: number;
  _views?: number; // Streaming-specific view count field
}

export interface CategoryCardProps {
  category: CategoryStream;
}

export interface PopularCategoriesProps {
  categories: CategoryStream[];
}

export interface Streamer {
  _id: string;
  isLive: boolean;
  lastActive: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
    username: boolean;
    email: string;
  };
}

export interface PopularStreamersProps {
  streamers: Streamer[];
}

export interface StreamerCardProps {
  streamer: Streamer;
}

export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface UpcomingStream {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  time: string;
  coverPhoto?: string;
  category?: string;
  isScheduled?: boolean;
  isLive: boolean;
  streamLink?: string;
  createdBy?: string;
  user: {
    _id: string;
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
      profilePicture?: string;
    };
    isAllowed: boolean;
    streamsDone: number;
    verificationLevel: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    streamKey?: string;
  };
  reactions?: {
    likes: any[];
    dislikes: any[];
    shares: number;
  };
  isAllowed?: boolean;
  views: number;
  _views?: number; // Streaming-specific view count field
  createdAt: string;
  updatedAt: string;
  __v: number;
  streamKey?: string;
  id?: string;
}

export interface UpcomingStreamCardProps {
  stream: UpcomingStream;
  onPress: (stream: UpcomingStream) => void;
}

export interface UpcomingStreamsSectionProps {
  streams: UpcomingStream[];
  onStreamPress: (stream: UpcomingStream) => void;
  onViewAllPress: () => void;
  onRefresh?: () => void;
}

// Streaming Chat Types
export interface StreamingChatUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profilePicture?: string;
}

export interface StreamingChatMessage {
  _id: string;
  streamId: string;
  userId: string | StreamingChatUser;
  message: string;
  createdAt: string;
  isOptimistic?: boolean; // For temporary messages while sending
  user?: StreamingChatUser; // User info when populated
}

export interface StreamingChatResponse {
  data: StreamingChatMessage[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    total: number;
  };
}

export interface LiveChatMessagesOverlayProps {
  messages: StreamingChatMessage[];
  maxVisibleMessages?: number;
  animationDuration?: number;
  messageFadeTimeout?: number;
}

export interface UseStreamingChatMessagesProps {
  streamId: string;
  enabled?: boolean;
}

export interface UseStreamingChatMessagesReturn {
  messages: StreamingChatMessage[];
  isConnected: boolean;
  sendMessage: (message: string) => void;
  sendLike: () => void;
  streamLikes: string[];
  userHasLiked: boolean;
  streamCommentsCount: number;
  connectionError: string | null;
  retryConnection: () => void;
  isLoading: boolean;
}

export interface LiveStream {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  time: string;
  coverPhoto: string;
  category: string;
  isLive: boolean;
  isAllowed: boolean;
  views: number;
  _views?: number; // Streaming-specific view count field
  user: string;
  reactions: {
    likes: string[];
    dislikes: string[];
    shares: number;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
  streamKey?: string;
  streamLink?: string;
}
