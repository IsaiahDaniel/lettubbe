import React from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants/Colors";
import SwipeableMessage from "@/components/shared/chat/SwipeableMessage";
import ChatSkeletonLoader from "@/components/shared/chat/ChatMessageSkeleton";
import NetworkError from "@/components/shared/NetworkError";
import { isDateSeparator, isCommunityMessage, extractUserId } from "@/helpers/utils/messageUtils";
import useAuth from "@/hooks/auth/useAuth";

interface CommunityMessageListProps {
  messages: any[];
  loadingMessages: boolean;
  messagesError?: string | null;
  onRetryConnection?: () => void;
  renderListHeader: () => React.ReactNode;
  renderEmptyState: () => React.ReactNode;
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactNode;
  flatListRef: React.RefObject<FlatList>;
  onScroll: (event: any) => void;
  onSwipeToReply: (message: any) => void;
  onLongPress: (event: any, message: any) => void;
  longPressedMessageId: string | null;
  showScrollToBottomButton: boolean;
  onScrollToBottom: () => void;
}

const CommunityMessageList: React.FC<CommunityMessageListProps> = ({
  messages,
  loadingMessages,
  messagesError,
  onRetryConnection,
  renderListHeader,
  renderEmptyState,
  renderItem,
  flatListRef,
  onScroll,
  onSwipeToReply,
  onLongPress,
  longPressedMessageId,
  showScrollToBottomButton,
  onScrollToBottom,
}) => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();


  const handleSwipeToReply = (item: any) => {
    if (!item.isDeleted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSwipeToReply(item);
    }
  };

  const renderMessageWithActions = ({ item, index }: { item: any; index: number }): React.ReactElement | null => {
    if (isDateSeparator(item)) {
      const renderedItem = renderItem({ item, index });
      return renderedItem as React.ReactElement | null;
    }

    if (!isCommunityMessage(item)) {
      return null;
    }

    const messageUserId = extractUserId(item.userId);
    const isOwnMessage = userDetails._id === messageUserId;
    const isMessageDeleted = item.isDeleted;
    const messageId = item.id || item._id;
    const isLongPressed = longPressedMessageId === messageId;

    const renderedItem = renderItem({ item, index });
    
    if (!renderedItem) {
      return null;
    }

    return (
      <SwipeableMessage
        onSwipeToReply={() => handleSwipeToReply(item)}
        onLongPress={(event) => onLongPress(event, item)}
        isOwnMessage={isOwnMessage}
        disabled={isMessageDeleted}
      >
        <View
          style={[
            isLongPressed && styles.longPressedMessage,
            { opacity: isLongPressed ? 0.7 : 1 },
          ]}
        >
          {renderedItem}
        </View>
      </SwipeableMessage>
    );
  };

  const keyExtractor = (item: any, index: number) => {
    if (isDateSeparator(item)) {
      return item.id;
    }
    
    if (isCommunityMessage(item)) {
      const messageId = item.id || item._id;
      const timestamp = item.createdAt || Date.now();
      return messageId ? `${messageId}-${timestamp}` : `message-${index}-${timestamp}`;
    }
    
    return `unknown-${index}`;
  };

  // Show skeleton loader if we're loading
  if (loadingMessages) {
    return (
      <View style={[styles.chatContainer, styles.emptyMessagesContainer]}>
        {renderListHeader()}
        <ChatSkeletonLoader />
      </View>
    );
  }

  // Show error state if there's an error
  if (messagesError) {
    return (
      <View style={[styles.chatContainer, styles.emptyMessagesContainer]}>
        {renderListHeader()}
        <NetworkError 
          error={messagesError}
          refetch={onRetryConnection || (() => {})}
        />
      </View>
    );
  }

  // Show empty state only when not loading and no messages
  if (!messages || messages.length === 0) {
    return (
      <View style={[styles.chatContainer, styles.emptyMessagesContainer]}>
        {renderListHeader()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageWithActions}
        keyExtractor={keyExtractor}
        style={[styles.messagesList, styles.chatContainer]}
        contentContainerStyle={styles.messagesContainer}
        ListFooterComponent={renderListHeader}
        showsVerticalScrollIndicator={false}
        inverted={true}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: 120, // Estimated item height
          offset: 120 * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          console.warn("🎯 [SCROLL] scrollToIndexFailed:", info);
          // Fallback to scrollToOffset
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true
          });
        }}
      />
      
      {showScrollToBottomButton && (
        <TouchableOpacity
          style={[
            styles.scrollToBottomButton,
            { backgroundColor: Colors[theme].cardBackground },
          ]}
          onPress={onScrollToBottom}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chevron-down"
            size={32}
            color={Colors[theme].text}
          />
        </TouchableOpacity>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  emptyMessagesContainer: {
    flexGrow: 1,
  },
  longPressedMessage: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
    transform: [{ scale: 0.98 }],
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 80,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.4,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
});

export default CommunityMessageList;