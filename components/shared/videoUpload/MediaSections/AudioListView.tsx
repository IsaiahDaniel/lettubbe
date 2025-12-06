import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { AudioListItem } from '../MediaItems/AudioListItem';

interface AudioListViewProps {
  media: MediaLibrary.Asset[];
  selectedMedia: MediaLibrary.Asset[];
  loadingMore: boolean;
  hasMoreMedia: boolean;
  onItemPress: (mediaAsset: MediaLibrary.Asset) => void;
}

export const AudioListView: React.FC<AudioListViewProps> = ({
  media,
  selectedMedia,
  loadingMore,
  hasMoreMedia,
  onItemPress,
}) => {
  const { theme } = useCustomTheme();

  const isSelected = (mediaId: string): boolean => {
    return selectedMedia.some(item => item.id === mediaId);
  };

  return (
    <View style={styles.audioList}>
      {media.map((mediaAsset, index) => {
        if (!mediaAsset || !mediaAsset.id) return null;
        
        return (
          <AudioListItem
            key={`${String(mediaAsset.id)}-${index}`}
            mediaAsset={mediaAsset}
            index={index}
            isSelected={isSelected(mediaAsset.id)}
            onPress={() => onItemPress(mediaAsset)}
          />
        );
      })}

      {/* Loading indicator when fetching more */}
      {loadingMore && (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator
            size="small"
            color={Colors.general.primary}
          />
        </View>
      )}

      {/* End of content indicator */}
      {!hasMoreMedia && media.length > 0 && (
        <View style={styles.endOfContentContainer}>
          <Typography
            size={12}
            color={Colors[theme].textLight}
            style={{ textAlign: "center" }}
          >
            {media.length} audio files loaded
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  audioList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingMoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginTop: 10,
  },
  endOfContentContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
});