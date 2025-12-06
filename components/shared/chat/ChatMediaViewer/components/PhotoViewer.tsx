import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { MediaItem } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface PhotoViewerProps {
  item: MediaItem;
  index: number;
  onMediaPress: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  item,
  index,
  onMediaPress,
}) => {
  const handleImageLoad = () => {
    console.log(`Image ${index} loaded successfully:`, item.uri);
  };

  const handleImageError = (error: any) => {
    console.log(`Image ${index} failed to load:`, item.uri, error);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onMediaPress}
      style={styles.container}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.image}
        resizeMode="contain"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignSelf: 'center',
  },
});