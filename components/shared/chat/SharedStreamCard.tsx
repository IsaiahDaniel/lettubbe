import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import useGetStream from '@/hooks/streaming/useGetStream';
import { formatNumber } from '@/helpers/utils/formatting';

interface SharedStreamCardProps {
  streamId: string;
  // Make other props optional since they can be fetched
  title?: string;
  description?: string;
  coverPhoto?: string;
  startDate?: string;
  time?: string;
  isLive?: boolean;
  views?: number;
  userName?: string;
  userAvatar?: string;
  onPress: () => void;
}

const SharedStreamCard: React.FC<SharedStreamCardProps> = ({
  streamId,
  title: propTitle,
  description: propDescription,
  coverPhoto: propCoverPhoto,
  startDate: propStartDate,
  time: propTime,
  isLive: propIsLive = false,
  views: propViews = 0,
  userName: propUserName,
  userAvatar: propUserAvatar,
  onPress,
}) => {
  const { theme } = useCustomTheme();

  // Check if we need to fetch data (if critical props are missing)
  const needsDataFetch = !propTitle || !propStartDate;
  
  // Fetch stream data if needed
  const { data: fetchedStreamData, isPending: isLoadingStream } = useGetStream(
    needsDataFetch ? streamId : ''
  );

  // Use provided props or fallback to fetched data
  const streamData = fetchedStreamData || {};
  const title = propTitle || streamData.title || 'Live Stream';
  const description = propDescription || streamData.description;
  const coverPhoto = propCoverPhoto || streamData.coverPhoto;
  const startDate = propStartDate || streamData.startDate || new Date().toISOString();
  const time = propTime || streamData.time;
  const isLive = propIsLive || streamData.isLive || false;
  const views = propViews || streamData.views || 0;
  const userName = propUserName || streamData.user?.user?.firstName || streamData.user?.username || 'Unknown';
  const userAvatar = propUserAvatar || streamData.user?.profilePicture;
  const status = streamData.status || 'upcoming';

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

  const formattedTime = useMemo(() => {
    const date = formatStreamDate(startDate);
    const timeStr = time ? ` • ${time}` : '';
    return `${date}${timeStr}`;
  }, [startDate, time]);

  // Show loading state if we're fetching data
  if (needsDataFetch && isLoadingStream) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.thumbnailContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.defaultBackground}
          >
            <ActivityIndicator size="small" color="white" />
          </LinearGradient>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.loadingTextContainer}>
            <View style={[styles.loadingText, { width: '70%' }]} />
            <View style={[styles.loadingText, { width: '50%', height: 12 }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.9}>
      <View style={styles.thumbnailContainer}>
        {coverPhoto ? (
          <Image
            source={{ uri: coverPhoto }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.defaultBackground}
          >
            <Ionicons name="videocam" size={32} color="white" />
          </LinearGradient>
        )}
        
        {/* Live/Scheduled/Finished Badge */}
        <View style={styles.badgeContainer}>
          <View style={
            isLive ? styles.liveBadge : 
            status === 'finished' ? styles.finishedBadge : 
            styles.scheduledBadge
          }>
            <Ionicons 
              name={
                isLive ? "radio-outline" : 
                status === 'finished' ? "checkmark-circle-outline" : 
                "calendar-outline"
              } 
              size={10} 
              color="white" 
            />
            <Typography size={9} color="white" weight="600">
              {
                isLive ? "LIVE" : 
                status === 'finished' ? "FINISHED" : 
                "UPCOMING"
              }
            </Typography>
          </View>
        </View>
        
        {/* Views/Stream Icon Overlay */}
        <View style={styles.overlayContainer}>
          {isLive ? (
            <View style={styles.viewsContainer}>
              <Ionicons name="eye" size={12} color="white" />
              <Typography size={10} color="white" weight="500">
                {formatNumber(views)}
              </Typography>
            </View>
          ) : (
            <View style={styles.streamIconContainer}>
              <Ionicons name="play-circle" size={24} color="rgba(255, 255, 255, 0.9)" />
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        {/* User Info */}
        {(userName || userAvatar) && (
          <View style={styles.userContainer}>
            {userAvatar && (
              <Avatar
                imageSource={{ uri: userAvatar }}
                size={24}
                uri
                showRing={false}
                ringColor={isLive ? Colors.general.live : Colors[theme].avatar}
              />
            )}
            {userName && (
              <Typography size={12} color={Colors[theme].textLight} weight="500">
                {userName}
              </Typography>
            )}
          </View>
        )}
        
        {/* Stream Title */}
        <Typography
          size={14}
          color={Colors[theme].text}
          weight="600"
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Typography>
        
        {/* Description */}
        {description && (
          <Typography
            size={12}
            color={Colors[theme].textLight}
            numberOfLines={2}
            style={styles.description}
          >
            {description}
          </Typography>
        )}
        
        {/* Time Info */}
        <Typography
          size={11}
          color={Colors[theme].textLight}
          weight="500"
          style={styles.timeInfo}
        >
          {formattedTime}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 280,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  defaultBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 2,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 2,
  },
  finishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 2,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 5,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  streamIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    lineHeight: 18,
    marginBottom: 4,
  },
  description: {
    lineHeight: 16,
    marginBottom: 6,
  },
  timeInfo: {
    marginTop: 4,
  },
  loadingContainer: {
    opacity: 0.7,
  },
  loadingTextContainer: {
    gap: 8,
  },
  loadingText: {
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
  },
});

export default SharedStreamCard;