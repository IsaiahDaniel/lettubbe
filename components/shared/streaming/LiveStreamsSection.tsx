import React from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import StreamVideoCard from './StreamVideoCard';
import { Colors } from '@/constants';
import { UpcomingStream } from '@/helpers/types/streaming/streaming.types';
import useGetLiveStreams from '@/hooks/streaming/useGetLiveStreams';

interface LiveStreamsSectionProps {
  onStreamPress: (stream: UpcomingStream) => void;
  onAvatarPress?: (userId: string) => void;
  onSharePress?: (stream: UpcomingStream) => void;
}

const LiveStreamsSection = ({ 
  onStreamPress,
  onAvatarPress,
  onSharePress,
}: LiveStreamsSectionProps) => {
  const { liveStreams, isPending, isError, error } = useGetLiveStreams();
  
  // Debug logging
  // console.log('🔴 LiveStreamsSection - isPending:', isPending);
  // console.log('🔴 LiveStreamsSection - isError:', isError);
  // console.log('🔴 LiveStreamsSection - error:', error);
  // console.log('🔴 LiveStreamsSection - liveStreams:', liveStreams);
  // console.log('🔴 LiveStreamsSection - liveStreams length:', liveStreams?.length);

  // Don't render section if loading, error, or no live streams
  if (isPending) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.liveIndicator} />
            <Typography size={16} weight="700">
              Live Now
            </Typography>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.general.live} />
        </View>
      </View>
    );
  }

  if (isError || !liveStreams || liveStreams.length === 0) {
    return null;
  }

  const renderStreamItem = ({ item }: { item: UpcomingStream }) => (
    <StreamVideoCard
      stream={item}
      onPress={onStreamPress}
      onAvatarPress={onAvatarPress}
      onSharePress={onSharePress}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.liveIndicator} />
          <Typography size={16} weight="700">
            Live Now
          </Typography>
        </View>
      </View>
    
      <FlatList
        data={liveStreams}
        renderItem={renderStreamItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Disable scroll since it's in a parent ScrollView
        contentContainerStyle={styles.listContainer}
      />
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
    marginHorizontal: 16
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.general.live,
  },
  listContainer: {
    gap: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});

export default LiveStreamsSection;