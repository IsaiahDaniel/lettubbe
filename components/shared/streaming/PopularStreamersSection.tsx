import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import StreamerAvatar from './StreamerAvatar';
import { Colors } from '@/constants';
import { PopularStreamer } from '@/helpers/types/streaming/streaming.types';
import { format, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns';

interface PopularStreamersSectionProps {
  streamers: PopularStreamer[];
  onStreamerPress: (streamer: PopularStreamer) => void;
  onViewAllPress: () => void;
  onRefresh?: () => void;
}

const PopularStreamersSection = ({ 
  streamers, 
  onStreamerPress, 
  onViewAllPress,
  onRefresh
}: PopularStreamersSectionProps) => {
  
  const formatLastActive = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      
      if (isToday(date)) {
        return 'Active today';
      } else if (isYesterday(date)) {
        return 'Active yesterday';
      } else if (isThisWeek(date)) {
        return `Active ${format(date, 'EEEE')}`; // "Active Monday"
      } else {
        return `Active ${format(date, 'MMM dd')}`; // "Active Jan 15"
      }
    } catch {
      return 'Recently active';
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography size={16} weight="700">
          Channels
        </Typography>
        {streamers?.length > 0 && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Typography
              size={14}
              weight="500"
              color={Colors.general.primary}
            >
              View All
            </Typography>
          </TouchableOpacity>
        )}
      </View>
      
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          style={styles.scrollView}
        >
          {streamers.map(streamer => (
            <StreamerAvatar
              key={streamer.userId}
              name={`${streamer.user.firstName} ${streamer.user.lastName}`}
              avatar={streamer.user.profilePicture || ''}
              lastStreamDate={formatLastActive(streamer.lastActive)}
              isLive={streamer.isLive}
              onPress={() => onStreamerPress(streamer)}
            />
          ))}
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
  },
  scrollView: {
    marginHorizontal: -16,
  },
  scrollContainer: {
    paddingLeft: 16,
    paddingRight: 16,
  },
});

export default PopularStreamersSection;