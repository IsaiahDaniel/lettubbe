import { useMemo, useCallback } from 'react';
import { ChatPreview, Message } from '@/helpers/types/chat/chat.types';
import { ChatDomainService, User  } from '@/services/chat.domain.service';
import { formatTimeAgo } from '@/helpers/utils/formatting';

export interface ProcessedChat {
  id: string;
  otherUser: User | null;
  displayName: string;
  avatarUrl: string;
  latestMessage: Message | null;
  messageText: string;
  timestamp: string;
  unreadCount: number;
  isUnread: boolean;
  isOnline: boolean;
  isFavourite: boolean;
  isArchived: boolean;
  originalChat: ChatPreview;
}

interface UseChatProcessingProps {
  chatPreviews: ChatPreview[];
  currentUserId: string;
  onlineUsers: string[];
  activeTab: "All" | "Unread" | "Favorites" | "Archived";
}

export const useChatProcessing = ({
  chatPreviews,
  currentUserId,
  onlineUsers,
  activeTab,
}: UseChatProcessingProps) => {
  // Cache for processed conversations to avoid reprocessing
  const conversationCache = useMemo(() => new Map<string, ProcessedChat>(), []);

  // Memoized conversation processor for individual chats
  const processConversation = useCallback((chat: ChatPreview): ProcessedChat | null => {
    const chatId = chat._id;
    const cacheKey = `${chatId}-${chat.updatedAt}-${onlineUsers.join(',')}`;
    
    // Check cache first
    const cached = conversationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const otherUser = ChatDomainService.determineOtherUser(chat, currentUserId);
    if (!otherUser) return null;

    const latestMessage = ChatDomainService.getLatestMessage(chat);
    const unreadCount = ChatDomainService.calculateUnreadCount(chat, currentUserId);
    const isUnread = latestMessage ? ChatDomainService.isMessageUnread(latestMessage, currentUserId) : false;
    const isOnline = onlineUsers.includes(otherUser._id.toString());

    const processed: ProcessedChat = {
      id: chat._id,
      otherUser,
      displayName: ChatDomainService.getDisplayName(otherUser),
      avatarUrl: ChatDomainService.getAvatarUrl(otherUser),
      latestMessage,
      messageText: ChatDomainService.formatMessageForDisplay(latestMessage, currentUserId),
      timestamp: chat.updatedAt ? formatTimeAgo(new Date(chat.updatedAt).getTime()) : '',
      unreadCount,
      isUnread,
      isOnline,
      isFavourite: !!chat.isFavourite,
      isArchived: !!chat.isArchived,
      originalChat: chat,
    };

    // Cache the result
    conversationCache.set(cacheKey, processed);
    
    // Clean up old cache entries (keep only last 100)
    if (conversationCache.size > 100) {
      const keys = Array.from(conversationCache.keys());
      const oldKeys = keys.slice(0, keys.length - 100);
      oldKeys.forEach(key => conversationCache.delete(key));
    }

    return processed;
  }, [currentUserId, onlineUsers, conversationCache]);

  // Create a stable reference for memoization
  const conversationIds = useMemo(() => 
    chatPreviews?.map(chat => chat._id).join(',') || '', 
    [chatPreviews]
  );

  const processedChats = useMemo(() => {
    console.log('🔄 useChatProcessing: Starting to process', chatPreviews?.length || 0, 'conversations');
    const start = performance.now();
    
    if (!currentUserId || !Array.isArray(chatPreviews)) {
      return [];
    }

    // Process conversations in batches to avoid blocking UI
    const batchSize = 10;
    const allProcessed: ProcessedChat[] = [];
    
    for (let i = 0; i < chatPreviews.length; i += batchSize) {
      const batchStart = performance.now();
      const batch = chatPreviews.slice(i, i + batchSize);
      const processedBatch = batch
        .filter(chat => chat != null)
        .map(processConversation)
        .filter((chat): chat is ProcessedChat => chat !== null);
      
      allProcessed.push(...processedBatch);
      const batchEnd = performance.now();
      console.log(`📦 useChatProcessing: Batch ${i/batchSize + 1} took ${(batchEnd - batchStart).toFixed(2)}ms`);
    }

    const end = performance.now();
    console.log('✅ useChatProcessing: Processing completed in', (end - start).toFixed(2), 'ms, result:', allProcessed.length);
    
    return allProcessed;
  }, [chatPreviews, processConversation, conversationIds]);

  const filteredChats = useMemo(() => {
    const filtered = ChatDomainService.filterChatsByTab(
      processedChats.map(chat => chat.originalChat),
      activeTab,
      currentUserId
    );
    
    const filteredProcessed = processedChats.filter(chat =>
      filtered.some(filteredChat => filteredChat._id === chat.id)
    );

    return ChatDomainService.sortChatsByMostRecent(filteredProcessed.map(chat => chat.originalChat))
      .map(sortedChat => processedChats.find(chat => chat.id === sortedChat._id))
      .filter((chat): chat is ProcessedChat => chat !== null);
  }, [processedChats, activeTab, currentUserId]);

  return {
    processedChats,
    filteredChats,
  };
};