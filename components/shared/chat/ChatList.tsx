import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { ChatPreview } from '@/helpers/types/chat/chat.types';
import EmptyState from '@/components/shared/chat/EmptyState';
import { useGetUserIdState, useGetOnlineUsersState } from '@/store/UsersStore';
import useAuth from '@/hooks/auth/useAuth';
import ScrollAwareFlatList from '@/components/ui/ScrollAwareFlatList';
import ChatListSkeleton from '@/components/shared/chat/ChatListSkeleton';
import ChatContextMenu from '@/components/shared/chat/ChatContextMenu';
import ChatPreviewItem from './ChatPreviewItem';
import { useChatProcessing } from '@/hooks/chats/useChatProcessing';
import { useProgressiveProcessing } from '@/hooks/chats/useProgressiveProcessing';
import { useChatContextMenu } from '@/hooks/chats/useChatContextMenu';

interface ChatListProps {
  chatPreviews: ChatPreview[];
  activeTab: "All" | "Unread" | "Favorites" | "Archived";
  onChatPress: (chatId: string, username: string, displayName: string, avatar: string, subscriberCount: string, userId: string) => void;
  onToggleFavorite?: (chatId: string) => void;
  onToggleArchive?: (chatId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isInitialLoading?: boolean;
}

const ChatList = ({ 
  chatPreviews, 
  activeTab, 
  onChatPress, 
  onToggleFavorite,
  onToggleArchive,
  onRefresh, 
  refreshing,
  onEndReached,
  hasNextPage,
  isFetchingNextPage,
  isInitialLoading
}: ChatListProps) => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const { setUserId } = useGetUserIdState();
  const { usersOnline } = useGetOnlineUsersState();
  
  const { contextMenu, showContextMenu, hideContextMenu } = useChatContextMenu();
  
  // Use pre-processed data directly
  const filteredChats = useMemo(() => {
    // console.log('🔄 ChatList: Processing pre-processed data', chatPreviews?.length || 0, 'conversations');
    const start = performance.now();
    
    if (!Array.isArray(chatPreviews) || !userDetails?._id) {
      return [];
    }

    // Data is already processed, just add online status
    const result = chatPreviews.map(chat => ({
      ...chat,
      isOnline: Array.isArray(usersOnline) && usersOnline.includes(chat.otherUser?._id?.toString()),
    }));
    
    const end = performance.now();
    // console.log('✅ ChatList: Processed data in', (end - start).toFixed(2), 'ms, result:', result.length);
    
    return result;
  }, [chatPreviews, usersOnline, userDetails?._id]);


  const handleChatPress = useCallback((processedChat: any) => {
    if (!processedChat?.otherUser?._id) return;
    
    setUserId(processedChat.otherUser._id.toString());
    onChatPress(
      processedChat._id,
      processedChat.displayName,
      processedChat.displayName,
      processedChat.avatarUrl,
      processedChat.otherUser.subscriberCount?.toString() || "0",
      processedChat.otherUser._id.toString()
    );
  }, [setUserId, onChatPress]);

  const handleToggleFavorite = useCallback((chatId: string) => {
    onToggleFavorite?.(chatId);
  }, [onToggleFavorite]);

  const handleToggleArchive = useCallback((chatId: string) => {
    onToggleArchive?.(chatId);
  }, [onToggleArchive]);

  const renderChatItem = useCallback(({ item, index }: { item: any; index: number }) => {
    // if (index === 0) {
    //   console.log('🎨 ChatList: Rendering first chat item at', performance.now());
    // }
    
    return (
      <ChatPreviewItem
        chat={item}
        displayName={item.displayName}
        avatarUrl={item.avatarUrl}
        messageText={item.messageText}
        timestamp={item.timestamp}
        unreadCount={item.unreadCount}
        isUnread={item.isUnread}
        isOnline={item.isOnline}
        theme={theme}
        onPress={() => handleChatPress(item)}
        onLongPress={showContextMenu}
      />
    );
  }, [theme, handleChatPress, showContextMenu]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors[theme].cardBackground} />
      </View>
    );
  }, [isFetchingNextPage, theme]);

  const getEmptyState = () => {
    const emptyStates = {
      All: {
        title: "No Conversations",
        subtitle: "Start a new chat to begin messaging",
        image: require("@/assets/images/EmptyChat.png"),
      },
      Unread: {
        title: "No Unread Messages",
        subtitle: "You're all caught up with your messages",
        image: require("@/assets/images/EmptyUnread.png"),
      },
      Favorites: {
        title: "No Favorite Chats",
        subtitle: "Chats you mark as favorites will appear here",
        image: require("@/assets/images/EmptyFav.png"),
      },
      Archived: {
        title: "No Archived Chats",
        subtitle: "Chats you archive will appear here",
        image: require("@/assets/images/EmptyChat.png"),
      },
    };
    
    return emptyStates[activeTab];
  };

  // console.log('🎨 ChatList: Rendering with', filteredChats.length, 'chats, isInitialLoading:', isInitialLoading, 'userDetails:', !!userDetails?._id);

  if (isInitialLoading || !userDetails?._id) {
    // console.log('🎨 ChatList: Showing skeleton - initial loading or no user');
    return <ChatListSkeleton />;
  }

  // Show skeleton only if we have no conversations at all and are still loading
  if (chatPreviews?.length > 0 && filteredChats.length === 0 && isInitialLoading) {
    // console.log('🎨 ChatList: Showing skeleton - have raw data but no filtered results');
    return <ChatListSkeleton />;
  }

  if (filteredChats.length === 0) {
    // Show skeleton if we have raw data but no filtered results (processing)
    // OR if we don't have any data yet (initial loading)
    if (chatPreviews?.length > 0 || !chatPreviews) {
      // console.log('🎨 ChatList: Showing skeleton - processing or no data');
      return <ChatListSkeleton />;
    }
    
    // Only show empty state if we definitely have no chats after loading
    // console.log('🎨 ChatList: Showing empty state');
    const emptyState = getEmptyState();
    return (
      <EmptyState
        title={emptyState.title}
        subtitle={emptyState.subtitle}
        image={emptyState.image}
      />
    );
  }

  // console.log('🎨 ChatList: Rendering FlatList with', filteredChats.length, 'chats at', performance.now());

  return (
    <>
      <ScrollAwareFlatList
        data={filteredChats}
        keyExtractor={(item, index) => item?._id || `chat-${index}`}
        renderItem={renderChatItem}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            tintColor={Colors[theme].cardBackground}
            colors={[Colors[theme].cardBackground]}
          />
        }
      />
      
      <ChatContextMenu
        visible={contextMenu.visible}
        onClose={hideContextMenu}
        chat={contextMenu.chat}
        onToggleFavorite={handleToggleFavorite}
        onToggleArchive={handleToggleArchive}
        position={contextMenu.position}
      />
    </>
  );
};

const styles = StyleSheet.create({
  chatList: {
    flex: 1,
    marginTop: 2,
  },
  chatListContent: {
    paddingBottom: 140,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatList;