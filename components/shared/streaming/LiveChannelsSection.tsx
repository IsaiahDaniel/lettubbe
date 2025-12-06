import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import StreamCard from './StreamCard';
import { Colors } from '@/constants';
import { StreamCard as StreamCardType } from '@/helpers/types/streaming/streaming.types';

interface LiveChannelsSectionProps {
  streams: StreamCardType[];
  onStreamPress: (stream: StreamCardType) => void;
  onViewAllPress: () => void;
  onRefresh?: () => void;
}

const LiveChannelsSection = ({ 
  streams, 
  onStreamPress, 
  onViewAllPress,
  onRefresh
}: LiveChannelsSectionProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography size={16} weight="700">
          Live channels
        </Typography>
        {streams?.length > 0 && (
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

        <View style={styles.grid}>
          {streams.map(stream => (
            <StreamCard 
              key={stream.id} 
              stream={stream} 
              onPress={onStreamPress} 
            />
          ))}
        </View>
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
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
});

export default LiveChannelsSection;