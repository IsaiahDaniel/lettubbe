import React from 'react';
import { TouchableOpacity, StyleSheet, View, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { UpcomingStream } from '@/helpers/types/streaming/streaming.types';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UpcomingStreamCardProps {
  stream: UpcomingStream;
  onPress: (stream: UpcomingStream) => void;
}

const UpcomingStreamCard = ({ stream, onPress }: UpcomingStreamCardProps) => {
  const { theme } = useCustomTheme();

  const handlePress = () => {
    onPress(stream);
  };

  const formatStreamDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      
      if (isToday(date)) {
        return 'Today';
      } else if (isTomorrow(date)) {
        return 'Tomorrow';
      } else if (isThisWeek(date)) {
        return format(date, 'EEEE'); // Day name like "Monday"
      } else {
        return format(date, 'MMM dd'); // "Jan 15"
      }
    } catch {
      return 'Scheduled';
    }
  };


  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {stream.coverPhoto ? (
        <ImageBackground
          source={{ uri: stream.coverPhoto }}
          style={styles.imageBackground}
          imageStyle={styles.image}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.content}>
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
              <View style={styles.streamInfo}>
                <Typography size={14} weight="600" color="white" numberOfLines={2}>
                  {stream.title}
                </Typography>
                <View style={styles.scheduleDetails}>
                  <Typography size={12} color="rgba(255,255,255,0.9)">
                    {formatStreamDate(stream.startDate)}
                  </Typography>
                  {stream.time && (
                    <Typography size={12} color="rgba(255,255,255,0.9)">
                      • {stream.time}
                    </Typography>
                  )}
                </View>
                <View style={styles.streamerInfo}>
                  <View style={styles.streamerAvatar}>
                    {stream.user.user?.profilePicture ? (
                      <ImageBackground
                        source={{ uri: stream.user.user.profilePicture }}
                        style={styles.avatarImage}
                        imageStyle={styles.avatarImageStyle}
                      />
                    ) : (
                      <Typography size={12} color="white" weight="600">
                        {stream.user.user?.firstName?.[0] || stream.user.user?.username?.[0] || 'S'}
                      </Typography>
                    )}
                  </View>
                  <Typography size={11} color="rgba(255,255,255,0.8)" numberOfLines={1}>
                    {stream.user.user?.firstName} {stream.user.user?.lastName}
                  </Typography>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.defaultBackground}
        >
          <View style={styles.content}>
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
            <View style={styles.streamInfo}>
              <Typography size={14} weight="600" color="white" numberOfLines={2}>
                {stream.title}
              </Typography>
              <View style={styles.scheduleDetails}>
                <Typography size={12} color="rgba(255,255,255,0.9)">
                  {formatStreamDate(stream.startDate)}
                </Typography>
                {stream.time && (
                  <Typography size={12} color="rgba(255,255,255,0.9)">
                    • {stream.time}
                  </Typography>
                )}
              </View>
              <View style={styles.streamerInfo}>
                <View style={styles.streamerAvatar}>
                  {stream.user.user?.profilePicture ? (
                    <ImageBackground
                      source={{ uri: stream.user.user.profilePicture }}
                      style={styles.avatarImage}
                      imageStyle={styles.avatarImageStyle}
                    />
                  ) : (
                    <Typography size={12} color="white" weight="600">
                      {stream.user.user?.firstName?.[0] || stream.user.user?.username?.[0] || 'S'}
                    </Typography>
                  )}
                </View>
                <Typography size={11} color="rgba(255,255,255,0.8)" numberOfLines={1}>
                  {stream.user.user?.firstName} {stream.user.user?.lastName}
                </Typography>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.2,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageBackground: {
    flex: 1,
  },
  image: {
    borderRadius: 12,
  },
  defaultBackground: {
    flex: 1,
    borderRadius: 12,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 2,
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
  streamInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
    gap: 4,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImageStyle: {
    borderRadius: 10,
  },
});

export default UpcomingStreamCard;