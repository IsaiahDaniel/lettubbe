import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import UpcomingStreamCard from './UpcomingStreamCard';
import { Colors } from '@/constants';
import { UpcomingStream } from '@/helpers/types/streaming/streaming.types';

interface UpcomingStreamsSectionProps {
  streams: UpcomingStream[];
  onStreamPress: (stream: UpcomingStream) => void;
  onViewAllPress: () => void;
  onRefresh?: () => void;
}

const UpcomingStreamsSection = ({ 
  streams, 
  onStreamPress, 
  onViewAllPress,
  onRefresh
}: UpcomingStreamsSectionProps) => {
  // Filter out live streams - only show upcoming/scheduled streams
  const upcomingStreams = streams.filter(stream => !stream.isLive);

  // Don't render section if no upcoming streams
  if (!upcomingStreams || upcomingStreams.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography size={16} weight="700">
          Upcoming Streams
        </Typography>
        <TouchableOpacity onPress={onViewAllPress}>
          <Typography
            size={12}
            weight="500"
            color={Colors.general.primary}
          >
            View All
          </Typography>
        </TouchableOpacity>
      </View>
    
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          style={styles.scrollView}
        >
          {upcomingStreams.map(stream => (
            <UpcomingStreamCard 
              key={stream._id} 
              stream={stream} 
              onPress={onStreamPress} 
            />
          ))}
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    marginHorizontal: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollView: {
    marginHorizontal: -16,
  },
  scrollContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
  },
  emptyContainer: {
    marginHorizontal: -16,
  },
});

export default UpcomingStreamsSection;