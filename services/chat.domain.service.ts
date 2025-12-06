import { ChatPreview, Message, User as ChatUser } from "@/helpers/types/chat/chat.types";

export interface User {
  _id: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  avatar?: string;
  image?: string;
  subscriberCount?: number;
}


export class ChatDomainService {
  private static readonly VIDEO_LINK_PATTERN = /^lettubbe:\/\/video\/([^?]+)$/;
  private static readonly PHOTO_LINK_PATTERN = /^lettubbe:\/\/photo\/([^?]+)$/;
  private static readonly STREAM_LINK_PATTERN = /^lettubbe:\/\/streaming\/([^?]+)$/;
  private static readonly INVITE_LINK_PATTERN = /^(lettubbe:\/\/community\/([^?]+)\?invite=true&data=(.+)|https:\/\/lettubbe\.com\/community\/([^?]+)\?invite=true(?:&.*)?)$/;
  
  // Cache for processed user data to avoid recomputation
  private static readonly userCache = new Map<string, { displayName: string; avatarUrl: string; lastUpdated: number }>();
  private static readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Clear all caches when new messages arrive
  static clearCaches(): void {
    this.unreadCountCache.clear();
    this.messageDisplayCache.clear();
    this.userCache.clear();
  }

  // Clear specific conversation cache
  static clearConversationCache(chatId: string): void {
    // Clear unread count cache entries for this conversation
    const keysToDelete = Array.from(this.unreadCountCache.keys()).filter(key => key.startsWith(chatId));
    keysToDelete.forEach(key => this.unreadCountCache.delete(key));
    
    // Clear message display cache (we could be more specific here if needed)
    this.messageDisplayCache.clear();
  }

  static determineOtherUser(chat: ChatPreview, currentUserId: string): User | null {
    if (!currentUserId || !chat?.sender?._id || !chat?.receiver?._id) {
      return null;
    }
    
    const senderIdStr = chat.sender._id.toString();
    const currentUserIdStr = currentUserId.toString();
    
    return senderIdStr === currentUserIdStr ? chat.receiver : chat.sender;
  }

  static getLatestMessage(chat: ChatPreview): Message | null {
    const messages = Array.isArray(chat?.messages) ? chat.messages : [];
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }

  // Cache for unread counts to avoid recomputation
  private static readonly unreadCountCache = new Map<string, { count: number; lastUpdated: number }>();

  static calculateUnreadCount(chat: ChatPreview, currentUserId: string): number {
    const messages = Array.isArray(chat?.messages) ? chat.messages : [];
    if (!currentUserId || messages.length === 0) return 0;
    
    // Create cache key based on chat ID and last message timestamp
    const lastMessage = messages[messages.length - 1];
    const cacheKey = `${chat._id}-${lastMessage?.updatedAt || chat.updatedAt}-${currentUserId}`;
    
    // Check cache first
    const cached = this.unreadCountCache.get(cacheKey);
    if (cached && (Date.now() - cached.lastUpdated) < this.CACHE_EXPIRY) {
      return cached.count;
    }
    
    let count = 0;
    const currentUserIdStr = currentUserId.toString();
    
    // Optimized loop - break early when possible
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageUserId = message?.userId?.toString();
      if (messageUserId && messageUserId !== currentUserIdStr && !message?.seen) {
        count++;
      }
    }
    
    // Cache the result
    this.unreadCountCache.set(cacheKey, { count, lastUpdated: Date.now() });
    
    // Clean up old cache entries
    if (this.unreadCountCache.size > 100) {
      const keys = Array.from(this.unreadCountCache.keys());
      const oldKeys = keys.slice(0, keys.length - 100);
      oldKeys.forEach(key => this.unreadCountCache.delete(key));
    }
    
    return count;
  }

  static isMessageUnread(message: Message | null, currentUserId: string): boolean {
    if (!message) return false;
    
    const messageUserId = message.userId?.toString();
    const currentUserIdStr = currentUserId.toString();
    
    return !message.seen && messageUserId !== currentUserIdStr;
  }

  // Cache for formatted message display
  private static readonly messageDisplayCache = new Map<string, string>();

  static formatMessageForDisplay(message: Message | null, currentUserId: string): string {
    if (!message) return "No messages yet";
    
    // Check if message is deleted first
    if (message.isDeleted) {
      return "This message was deleted";
    }
    
    const messageUserId = message.userId?.toString();
    const currentUserIdStr = currentUserId.toString();
    
    // Create cache key
    const cacheKey = `${message._id}-${messageUserId}-${currentUserIdStr}-${message.isDeleted || false}`;
    
    // Check cache first
    const cached = this.messageDisplayCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const isFromCurrentUser = messageUserId === currentUserIdStr;
    let result: string;
    
    // Check for media messages first (before text)
    const hasImages = !!(
      (message.imageUrl && typeof message.imageUrl === 'string' && message.imageUrl.length > 0) ||
      (message.images && Array.isArray(message.images) && message.images.length > 0)
    );
    const hasVideo = !!(message.videoUrl && typeof message.videoUrl === 'string' && message.videoUrl.length > 0);
    const hasAudio = !!(message.audioUrl && typeof message.audioUrl === 'string' && message.audioUrl.length > 0);
    const hasDocuments = !!(
      (message.documentUrl && typeof message.documentUrl === 'string' && message.documentUrl.length > 0) ||
      (message.documentUrls && Array.isArray(message.documentUrls) && message.documentUrls.length > 0)
    );
    
    if (hasVideo) {
      result = isFromCurrentUser ? "You shared a video" : "shared a video";
    } else if (hasImages) {
      // Check if multiple images were shared
      const imageCount = message.images && Array.isArray(message.images) && message.images.length > 1 
        ? message.images.length 
        : 1;
      
      if (imageCount > 1) {
        result = isFromCurrentUser ? `You shared ${imageCount} photos` : `shared ${imageCount} photos`;
      } else {
        result = isFromCurrentUser ? "You shared a photo" : "shared a photo";
      }
    } else if (hasAudio) {
      result = isFromCurrentUser ? "You sent a voice message" : "sent a voice message";
    } else if (hasDocuments) {
      // Check if multiple documents were shared
      const documentCount = message.documentUrls && Array.isArray(message.documentUrls) 
        ? message.documentUrls.length 
        : 1;
      
      if (documentCount > 1) {
        result = isFromCurrentUser ? `You shared ${documentCount} documents` : `shared ${documentCount} documents`;
      } else {
        result = isFromCurrentUser ? "You shared a document" : "shared a document";
      }
    } else if (message.text) {
      // Handle text messages with special patterns
      const messageText = message.text.toString();
      if (this.STREAM_LINK_PATTERN.test(messageText)) {
        result = isFromCurrentUser ? "You shared a live stream" : "shared a live stream";
      } else if (this.VIDEO_LINK_PATTERN.test(messageText)) {
        result = isFromCurrentUser ? "You shared a video post" : "shared a video post";
      } else if (this.PHOTO_LINK_PATTERN.test(messageText)) {
        result = isFromCurrentUser ? "You shared a photo post" : "shared a photo post";
      } else if (this.INVITE_LINK_PATTERN.test(messageText)) {
        result = isFromCurrentUser ? "You shared an invite" : "shared an invite";
      } else {
        result = messageText;
      }
    } else {
      // No text and no media
      return "No messages yet";
    }
    
    // Cache the result
    this.messageDisplayCache.set(cacheKey, result);
    
    // Clean up old cache entries
    if (this.messageDisplayCache.size > 200) {
      const keys = Array.from(this.messageDisplayCache.keys());
      const oldKeys = keys.slice(0, keys.length - 200);
      oldKeys.forEach(key => this.messageDisplayCache.delete(key));
    }
    
    return result;
  }

  static getDisplayName(user: User | null): string {
    if (!user) return 'Unknown User';
    
    const userId = user._id.toString();
    const now = Date.now();
    const cached = this.userCache.get(userId);
    
    // Return cached value if it exists and is not expired
    if (cached && (now - cached.lastUpdated) < this.CACHE_EXPIRY) {
      return cached.displayName;
    }
    
    let displayName: string;
    if (user.displayName) displayName = user.displayName.toString();
    else if (user.firstName && user.lastName) displayName = `${user.firstName} ${user.lastName}`;
    else if (user.firstName) displayName = user.firstName.toString();
    else if (user.username) displayName = user.username.toString();
    else displayName = 'Unknown User';
    
    // Cache the result
    const avatarUrl = this.getAvatarUrlInternal(user);
    this.userCache.set(userId, { displayName, avatarUrl, lastUpdated: now });
    
    return displayName;
  }

  static getAvatarUrl(user: User | null): string {
    if (!user) return '';
    
    const userId = user._id.toString();
    const now = Date.now();
    const cached = this.userCache.get(userId);
    
    // Return cached value if it exists and is not expired
    if (cached && (now - cached.lastUpdated) < this.CACHE_EXPIRY) {
      return cached.avatarUrl;
    }
    
    return this.getAvatarUrlInternal(user);
  }

  private static getAvatarUrlInternal(user: User | null): string {
    if (!user) return '';
    
    if (user.profilePicture?.trim()) return user.profilePicture.trim();
    if (user.avatar?.trim()) return user.avatar.trim();
    if (user.image?.trim()) return user.image.trim();
    
    return '';
  }

  static filterChatsByTab(
    chats: ChatPreview[], 
    activeTab: "All" | "Unread" | "Favorites" | "Archived",
    currentUserId: string
  ): ChatPreview[] {
    return chats.filter(chat => {
      switch (activeTab) {
        case "All": 
          return true;
        case "Unread": 
          return this.calculateUnreadCount(chat, currentUserId) > 0;
        case "Favorites": 
          return !!chat.isFavourite;
        case "Archived": 
          return !!chat.isArchived;
        default: 
          return true;
      }
    });
  }

  static sortChatsByMostRecent(chats: ChatPreview[]): ChatPreview[] {
    return [...chats].sort((a, b) => {
      const dateA = new Date(a?.updatedAt || 0).getTime();
      const dateB = new Date(b?.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  }
}