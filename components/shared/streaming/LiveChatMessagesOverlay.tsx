import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { StreamingChatMessage } from '@/helpers/types/streaming/streaming.types';

const LiveChatMessageItem: React.FC<{ message: StreamingChatMessage }> = ({ message }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const user = message.user || (typeof message.userId === 'object' ? message.userId : null);
  const displayName = user?.displayName || user?.firstName || user?.username || 'User';

  useEffect(() => {
    // Simple fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.messageItem, { opacity: fadeAnim }]}>
      <View style={styles.messageBubble}>
        <Avatar
          size={24}
          imageSource={user?.profilePicture}
          uri={!!user?.profilePicture}
          showTextFallback={true}
          fallbackText={displayName[0]}
          showRing={false}
        />
        <Typography size={12} weight="600" numberOfLines={1} color='#fff'>
          {displayName}
        </Typography>
        <Typography size={14} style={styles.messageText} color='#fff'>
          {message.message}
        </Typography>
      </View>
    </Animated.View>
  );
};

interface LiveChatMessagesOverlayProps {
  messages: StreamingChatMessage[];
  maxVisibleMessages?: number;
  keyboardHeight?: number;
}

export const LiveChatMessagesOverlay: React.FC<LiveChatMessagesOverlayProps> = ({
  messages,
  maxVisibleMessages = 8,
  keyboardHeight = 0,
}) => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  // Show only recent messages
  const displayMessages = messages.slice(-maxVisibleMessages);

  // Auto-scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    if (displayMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayMessages.length]); // Use displayMessages.length instead of messages.length

  // Also scroll to bottom when component first mounts with existing messages
  useEffect(() => {
    if (displayMessages.length > 0) {
      // Longer delay for initial load to ensure FlatList is fully rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false }); // No animation for initial load
      }, 300);
    }
  }, []); // Run only once on mount

  if (displayMessages.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { bottom: insets.bottom + 70 + keyboardHeight }]}>
      <FlatList
        ref={flatListRef}
        data={displayMessages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <LiveChatMessageItem message={item} />}
        showsVerticalScrollIndicator={false}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    maxHeight: 200,
    pointerEvents: 'auto',
    zIndex: 50, // Lower than emoji picker (1000) but above video controls
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  messageItem: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '80%',
  },
  messageText: {
    // flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 16,
    // paddingVertical: 4,
    paddingHorizontal: 6,
  },    

});

export default LiveChatMessagesOverlay;