import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';

interface ChatMessageSkeletonProps {
  isOwnMessage?: boolean;
}

const ChatMessageSkeleton: React.FC<ChatMessageSkeletonProps> = ({ isOwnMessage = false }) => {
  const { theme } = useCustomTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start(() => animate());
    };
    animate();

    return () => {
      animatedValue.stopAnimation();
      animatedValue.setValue(0);
    };
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      {!isOwnMessage && (
        <Animated.View 
          style={[
            styles.avatar, 
            { 
              backgroundColor: Colors[theme].borderColor,
              opacity 
            }
          ]} 
        />
      )}
      <View style={styles.messageContent}>
        <Animated.View 
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            { 
              backgroundColor: isOwnMessage ? Colors.general.primary + '40' : Colors[theme].borderColor,
              opacity 
            }
          ]}
        >
          <Animated.View style={[styles.textLine, styles.longLine, { opacity }]} />
          <Animated.View style={[styles.textLine, styles.shortLine, { opacity }]} />
        </Animated.View>
        <Animated.View 
          style={[
            styles.timestamp, 
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
            { 
              backgroundColor: Colors[theme].borderColor,
              opacity 
            }
          ]} 
        />
      </View>
    </View>
  );
};

const ChatSkeletonLoader: React.FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      <ChatMessageSkeleton isOwnMessage={false} />
      <ChatMessageSkeleton isOwnMessage={true} />
      <ChatMessageSkeleton isOwnMessage={false} />
      <ChatMessageSkeleton isOwnMessage={true} />
      <ChatMessageSkeleton isOwnMessage={false} />
      <ChatMessageSkeleton isOwnMessage={false} />
      <ChatMessageSkeleton isOwnMessage={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ownBubble: {
    alignSelf: 'flex-end',
  },
  otherBubble: {
    alignSelf: 'flex-start',
  },
  textLine: {
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  longLine: {
    width: '100%',
    minWidth: 120,
  },
  shortLine: {
    width: '60%',
    minWidth: 80,
  },
  timestamp: {
    height: 10,
    width: 40,
    borderRadius: 5,
    marginTop: 4,
  },
  ownTimestamp: {
    alignSelf: 'flex-end',
  },
  otherTimestamp: {
    alignSelf: 'flex-start',
  },
});

export default ChatSkeletonLoader;