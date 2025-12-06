import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';

interface ChatListSkeletonItemProps {
  index: number;
}

const ChatListSkeletonItem: React.FC<ChatListSkeletonItemProps> = ({ index }) => {
  const { theme } = useCustomTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
          delay: index * 100, // Stagger animation
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
  }, [animatedValue, index]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <>
      <View style={styles.chatPreviewItem}>
        {/* Avatar skeleton */}
        <View style={styles.avatarContainer}>
          <Animated.View 
            style={[
              styles.avatarSkeleton, 
              { 
                backgroundColor: Colors[theme].borderColor,
                opacity 
              }
            ]} 
          />
        </View>

        {/* Content skeleton */}
        <View style={styles.chatPreviewContent}>
          {/* Header with name and time */}
          <View style={styles.chatPreviewHeader}>
            <Animated.View 
              style={[
                styles.nameSkeleton, 
                { 
                  backgroundColor: Colors[theme].borderColor,
                  opacity 
                }
              ]} 
            />
            <View style={styles.rightHeaderContent}>
              <Animated.View 
                style={[
                  styles.timeSkeleton, 
                  { 
                    backgroundColor: Colors[theme].borderColor,
                    opacity 
                  }
                ]} 
              />
              {/* Sometimes show badge skeleton */}
              {index % 3 === 0 && (
                <Animated.View 
                  style={[
                    styles.badgeSkeleton, 
                    { 
                      backgroundColor: Colors.general.primary + '40',
                      opacity 
                    }
                  ]} 
                />
              )}
            </View>
          </View>

          {/* Message preview skeleton */}
          <View style={styles.messageSkeletonContainer}>
            <Animated.View 
              style={[
                styles.messageSkeleton, 
                styles.longMessageSkeleton,
                { 
                  backgroundColor: Colors[theme].borderColor,
                  opacity 
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.messageSkeleton, 
                styles.shortMessageSkeleton,
                { 
                  backgroundColor: Colors[theme].borderColor,
                  opacity 
                }
              ]} 
            />
          </View>
        </View>
      </View>
      
      {/* Separator */}
      <View style={[styles.separator, { backgroundColor: Colors[theme].borderColor, opacity: 0.3 }]} />
    </>
  );
};

const ChatListSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 8 }, (_, index) => (
        <ChatListSkeletonItem key={index} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    paddingBottom: 140,
  },
  chatPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    position: "relative",
  },
  avatarSkeleton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatPreviewContent: {
    flex: 1,
    marginLeft: 16,
  },
  chatPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rightHeaderContent: {
    alignItems: 'center',
    gap: 4,
  },
  nameSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 8,
  },
  timeSkeleton: {
    width: 45,
    height: 12,
    borderRadius: 6,
  },
  badgeSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  messageSkeletonContainer: {
    gap: 4,
  },
  messageSkeleton: {
    height: 14,
    borderRadius: 7,
  },
  longMessageSkeleton: {
    width: '85%',
  },
  shortMessageSkeleton: {
    width: '60%',
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
});

export default ChatListSkeleton;