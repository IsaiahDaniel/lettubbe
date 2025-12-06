import React, { memo, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { UpcomingStream } from '@/helpers/types/streaming/streaming.types';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { formatNumber } from '@/helpers/utils/formatting';

interface StreamVideoCardProps {
  stream: UpcomingStream;
  onPress: (stream: UpcomingStream) => void;
  onAvatarPress?: (userId: string) => void;
  onSharePress?: (stream: UpcomingStream) => void;
}

const StreamVideoCard = memo(({ 
  stream, 
  onPress,
  onAvatarPress,
  onSharePress
}: StreamVideoCardProps) => {
  const { theme } = useCustomTheme();

  const handlePress = () => {
    onPress(stream);
  };

  const handleAvatarPress = () => {
    if (onAvatarPress && stream.user?.user?._id) {
      onAvatarPress(stream.user.user._id);
    }
  };

  const handleShareStream = () => {
    onSharePress?.(stream);
  };

  const formatStreamDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      
      if (isToday(date)) {
        return 'Today';
      } else if (isTomorrow(date)) {
        return 'Tomorrow';
      } else if (isThisWeek(date)) {
        return format(date, 'EEEE');
      } else {
        return format(date, 'MMM dd');
      }
    } catch {
      return 'Scheduled';
    }
  };

  const userInfo = useMemo(() => ({
    firstName: stream.user?.user?.firstName || "",
    profilePicture: stream.user?.user?.profilePicture || "",
    username: stream.user?.user?.username || ""
  }), [stream.user?.user]);

  const formattedTime = useMemo(() => {
    const date = formatStreamDate(stream.startDate);
    const time = stream.time ? ` • ${stream.time}` : '';
    return `${date}${time}`;
  }, [stream.startDate, stream.time]);


  return (
    <View style={styles.container}>
      {/* Thumbnail Section */}
      <View style={styles.thumbnailContainer}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          {stream.coverPhoto ? (
            <Image
              source={{ uri: stream.coverPhoto }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.defaultBackground}
            />
          )}

          {/* Badge overlay */}
          <View style={styles.overlayContainer}>
            <View style={stream.isLive ? styles.liveBadge : styles.scheduledBadge}>
              <Ionicons 
                name={stream.isLive ? "radio-outline" : "calendar-outline"} 
                size={12} 
                color="white" 
              />
              <Typography size={10} color="white" weight="600">
                {stream.isLive ? "LIVE" : "SCHEDULED"}
              </Typography>
            </View>
          </View>
          
          {/* User avatar overlay */}
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarButton}>
            <Avatar 
              imageSource={userInfo.profilePicture} 
              size={36} 
              uri 
              ringColor={stream.isLive ? Colors.general.live : Colors[theme].avatar} 
              expandable={false}
            />
            <Typography
              weight="600"
              size={16}
              lineHeight={17}
              color="#fff"
              style={styles.avatarText}
            >
              {userInfo.username}
            </Typography>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Stream Info */}
        <View style={styles.streamInfoContainer}>
          {/* <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
            <Typography
              weight="600"
              size={14}
              lineHeight={20}
              style={styles.usernameText}
            >
              {`${userInfo.firstName} ${stream.user?.user?.lastName || ''}`.trim()}
            </Typography>
          </TouchableOpacity> */}

          <Typography
            weight="600"
            size={16}
            color={Colors[theme].text}
            style={styles.titleText}
            numberOfLines={2}
          >
            {stream.title}
          </Typography>

          {stream.description && (
            <Typography
              weight="400"
              size={14}
              color={Colors[theme].textLight}
              style={styles.descriptionText}
              numberOfLines={3}
            >
              {stream.description}
            </Typography>
          )}

          <Typography 
            weight="400" 
            size={12} 
            color={Colors[theme].textLight}
            style={styles.timeText}
          >
            {formattedTime}
          </Typography>
        </View>

        {/* Stream Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons 
              name="eye-outline" 
              size={16} 
              color={Colors[theme].textLight} 
            />
            <Typography
              weight="400"
              size={12}
              color={Colors[theme].textLight}
            >
              {formatNumber(stream.views || 0)} views
            </Typography>
          </View>
          
          <TouchableOpacity 
            onPress={handleShareStream} 
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="share-outline" 
              size={16} 
              color={Colors[theme].textLight} 
            />
            <Typography
              weight="400"
              size={12}
              color={Colors[theme].textLight}
            >
              Share
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

StreamVideoCard.displayName = 'StreamVideoCard';

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 220,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  defaultBackground: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.general.live,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  avatarButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  avatarText: {
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  streamInfoContainer: {
    gap: 4,
  },
  usernameText: {
    marginBottom: 2,
  },
  titleText: {
    lineHeight: 20,
  },
  descriptionText: {
    lineHeight: 18,
    marginTop: 4,
  },
  timeText: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

export default StreamVideoCard;