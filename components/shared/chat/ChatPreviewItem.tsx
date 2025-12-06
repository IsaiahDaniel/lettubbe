import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ChatPreview } from '@/helpers/types/chat/chat.types';
import ChatAvatar from './ChatAvatar';
import ChatHeader from './ChatHeader';
import MessagePreview from './MessagePreview';

interface ChatPreviewItemProps {
  chat: ChatPreview;
  displayName: string;
  avatarUrl: string;
  messageText: string;
  timestamp: string;
  unreadCount: number;
  isUnread: boolean;
  isOnline: boolean;
  theme: 'light' | 'dark';
  onPress: () => void;
  onLongPress?: (chat: ChatPreview, position: { x: number; y: number }) => void;
}

const ChatPreviewItem = ({
  chat,
  displayName,
  avatarUrl,
  messageText,
  timestamp,
  unreadCount,
  isUnread,
  isOnline,
  theme,
  onPress,
  onLongPress,
}: ChatPreviewItemProps) => {
  
  const handleLongPress = (event: any) => {
    if (onLongPress) {
      const { pageX, pageY } = event.nativeEvent;
      onLongPress(chat, { x: pageX, y: pageY });
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.touchableArea}
          onPress={onPress}
          onLongPress={handleLongPress}
          delayLongPress={600}
          activeOpacity={0.95}
        >
          <ChatAvatar 
            avatarUrl={avatarUrl}
            isOnline={isOnline}
            size={50}
          />

          <View style={styles.content}>
            <ChatHeader
              displayName={displayName}
              timestamp={timestamp}
              unreadCount={unreadCount}
              theme={theme}
            />

            <MessagePreview
              messageText={messageText}
              isUnread={isUnread}
              theme={theme}
              maxLength={40}
            />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* <View style={[styles.separator, { backgroundColor: Colors[theme].borderColor }]} /> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  touchableArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
});

export default React.memo(ChatPreviewItem, (prevProps, nextProps) => {
  const prevId = prevProps.chat?.id || prevProps.chat?._id;
  const nextId = nextProps.chat?.id || nextProps.chat?._id;
  
  return (
    prevId === nextId &&
    prevProps.displayName === nextProps.displayName &&
    prevProps.messageText === nextProps.messageText &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.unreadCount === nextProps.unreadCount &&
    prevProps.isUnread === nextProps.isUnread &&
    prevProps.isOnline === nextProps.isOnline &&
    prevProps.theme === nextProps.theme
  );
});