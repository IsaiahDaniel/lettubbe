import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatPreview } from '@/helpers/types/chat/chat.types';
import { ProcessedChat } from './useChatProcessing';
import { ChatDomainService } from '@/services/chat.domain.service';
import { formatTimeAgo } from '@/helpers/utils/formatting';

interface UseProgressiveProcessingProps {
  chatPreviews: ChatPreview[];
  currentUserId: string;
  onlineUsers: string[];
  activeTab: "All" | "Unread" | "Favorites" | "Archived";
}

export const useProgressiveProcessing = ({
  chatPreviews,
  currentUserId,
  onlineUsers,
  activeTab,
}: UseProgressiveProcessingProps) => {
  const [processedChats, setProcessedChats] = useState<ProcessedChat[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Cache for processed conversations to avoid reprocessing
  const conversationCache = useMemo(() => new Map<string, ProcessedChat>(), []);

  // Process single conversation
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

  // Progressive processing with immediate UI updates
  useEffect(() => {
    if (!currentUserId || !Array.isArray(chatPreviews) || chatPreviews.length === 0) {
      setProcessedChats([]);
      setIsProcessing(false);
      return;
    }

    console.log('🔄 useProgressiveProcessing: Starting progressive processing for', chatPreviews.length, 'conversations');
    setIsProcessing(true);
    setProcessedChats([]); // Clear previous results

    const processInBatches = async () => {
      const batchSize = 5; // Larger batches for better efficiency
      const allProcessed: ProcessedChat[] = [];
      const startTime = performance.now();
      
      for (let i = 0; i < chatPreviews.length; i += batchSize) {
        const batchStart = performance.now();
        const batch = chatPreviews.slice(i, i + batchSize);
        
        // Process each item in the batch
        const processedBatch: ProcessedChat[] = [];
        for (const chat of batch) {
          if (chat != null) {
            const itemStart = performance.now();
            const processed = processConversation(chat);
            if (processed) {
              processedBatch.push(processed);
            }
            const itemEnd = performance.now();
            
            // Log if an individual item is taking too long
            if (itemEnd - itemStart > 10) {
              console.log(`⚠️ Slow conversation processing: ${chat._id} took ${(itemEnd - itemStart).toFixed(2)}ms`);
            }
          }
        }
        
        allProcessed.push(...processedBatch);
        
        // Update UI immediately with current batch
        setProcessedChats([...allProcessed]);
        const batchEnd = performance.now();
        
        console.log(`📦 useProgressiveProcessing: Batch ${Math.floor(i/batchSize) + 1} (${processedBatch.length} items) took ${(batchEnd - batchStart).toFixed(2)}ms`);
        
        // No artificial delay - let React schedule the next batch
        if (i + batchSize < chatPreviews.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      const endTime = performance.now();
      setIsProcessing(false);
      console.log('✅ useProgressiveProcessing: Completed processing', allProcessed.length, 'conversations in', (endTime - startTime).toFixed(2), 'ms');
    };

    processInBatches();
  }, [chatPreviews, processConversation, currentUserId]);

  // Filter processed chats based on active tab
  const filteredChats = useMemo(() => {
    if (processedChats.length === 0) return [];
    
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
    isProcessing,
    processingProgress: chatPreviews.length > 0 ? (processedChats.length / chatPreviews.length) * 100 : 0,
  };
};