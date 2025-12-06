import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import { StreamCard as StreamCardType } from '@/helpers/types/streaming/streaming.types';

interface StreamCardProps {
  stream: StreamCardType;
  onPress: (stream: StreamCardType) => void;
}

const StreamCard = ({ stream, onPress }: StreamCardProps) => {
  const { theme } = useCustomTheme();

  const handlePress = () => {
    onPress(stream);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: stream.thumbnail }} style={styles.image} />
        {stream.isLive && (
          <View style={styles.liveIndicator}>
            <Ionicons name="wifi" size={12} color="white" />
            <Typography size={10} weight="700" color="white">
              LIVE
            </Typography>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Typography
          size={14}
          weight="600"
          color={Colors[theme].textBold}
          numberOfLines={1}
          style={styles.title}
        >
          {stream.title}
        </Typography>
        <View style={styles.viewersContainer}>
          <View style={styles.blueDot} />
          <Typography
            size={12}
            weight="500"
            color={Colors[theme].textLight}
            style={styles.viewers}
          >
            {stream.viewers} watching
          </Typography>
        </View>
        <Typography
          size={12}
          weight="400"
          color={Colors[theme].textLight}
          numberOfLines={2}
          style={styles.description}
        >
          {stream.description}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  content: {
    paddingVertical: 12,
  },
  title: {
    marginBottom: 4,
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.general.blue,
  },
  viewers: {
    flex: 1,
  },
  description: {
    lineHeight: 16,
  },
});

export default StreamCard;