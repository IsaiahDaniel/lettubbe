import React from 'react';
import { View, StyleSheet } from 'react-native';
import FilterTabs from '@/components/shared/chat/FilterTabs';
import ChatList from '@/components/shared/chat/ChatList';
import FloatingButton from '@/components/shared/chat/FloatingButton';
import type { ChatFilterTab } from '@/constants/chat.constants';

interface InboxTabContentProps {
  activeTab: ChatFilterTab;
  onTabPress: (tab: ChatFilterTab) => void;
  displayConversations: any[];
  onChatPress: (chatId: string, username: string, displayName: string, avatar: string, subscriberCount: string, userId: string) => void;
  onToggleFavorite: (chatId: string) => void;
  onToggleArchive: (chatId: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onEndReached?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isInitialLoading: boolean;
  onNewMessagePress: () => void;
  screenWidth: number;
}

const InboxTabContent: React.FC<InboxTabContentProps> = ({
  activeTab,
  onTabPress,
  displayConversations,
  onChatPress,
  onToggleFavorite,
  onToggleArchive,
  onRefresh,
  refreshing,
  onEndReached,
  hasNextPage,
  isFetchingNextPage,
  isInitialLoading,
  onNewMessagePress,
  screenWidth,
}) => {
  return (
    <View style={[styles.tabContent, { width: screenWidth }]}>
      <FilterTabs activeTab={activeTab} onTabPress={onTabPress} />
      <ChatList 
        chatPreviews={displayConversations} 
        activeTab={activeTab} 
        onChatPress={onChatPress}
        onToggleFavorite={onToggleFavorite}
        onToggleArchive={onToggleArchive}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isInitialLoading={isInitialLoading}
      />
      <FloatingButton icon="chatbubble-outline" onPress={onNewMessagePress} />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
});

export default InboxTabContent;