export interface DomainUser {
  readonly id: string;
  readonly username: string;
  readonly displayName?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly profilePicture?: string;
  readonly avatar?: string;
  readonly image?: string;
  readonly subscriberCount?: number;
}

export interface DomainMessage {
  readonly id: string;
  readonly text: string;
  readonly userId: string;
  readonly seen: boolean;
  readonly createdAt: Date;
}

export interface DomainChatPreview {
  readonly id: string;
  readonly sender: DomainUser;
  readonly receiver: DomainUser;
  readonly messages: readonly DomainMessage[];
  readonly updatedAt: Date;
  readonly isFavourite: boolean;
  readonly isArchived: boolean;
}

export interface ProcessedChatData {
  readonly id: string;
  readonly otherUser: DomainUser;
  readonly displayName: string;
  readonly avatarUrl: string;
  readonly latestMessage: DomainMessage | null;
  readonly messageText: string;
  readonly timestamp: string;
  readonly unreadCount: number;
  readonly isUnread: boolean;
  readonly isOnline: boolean;
  readonly isFavourite: boolean;
  readonly isArchived: boolean;
}

export type TabType = "All" | "Unread" | "Favorites" | "Archived";

export interface ChatListState {
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly error: string | null;
}

export interface ChatContextMenuState {
  readonly visible: boolean;
  readonly chat: DomainChatPreview | null;
  readonly position: { readonly x: number; readonly y: number };
}