import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { formatDuration } from '@/helpers/utils/media-utils';

interface MediaGridItemProps {
  mediaAsset: MediaLibrary.Asset;
  index: number;
  uploadMode: "video" | "photo" | "document" | "audio";
  isSelected: boolean;
  selectionNumber?: number;
  showSelectionCircle?: boolean;
  onPress: () => void;
  onSelectionCirclePress?: () => void;
}

export const MediaGridItem: React.FC<MediaGridItemProps> = ({
  mediaAsset,
  index,
  uploadMode,
  isSelected,
  selectionNumber,
  showSelectionCircle = true,
  onPress,
  onSelectionCirclePress,
}) => {
  const isVideo = uploadMode === "video" || uploadMode === "audio";

  try {

  // Safety check for mediaAsset
  if (!mediaAsset || !mediaAsset.id || !mediaAsset.uri) {
    console.warn('MediaGridItem received invalid mediaAsset:', mediaAsset);
    return <View style={[styles.mediaItem, styles.emptySlot]} />;
  }

  // Additional safety checks for string types
  if (typeof mediaAsset.id !== 'string' && typeof mediaAsset.id !== 'number') {
    console.warn('MediaGridItem received invalid id type:', typeof mediaAsset.id, mediaAsset.id);
    return <View style={[styles.mediaItem, styles.emptySlot]} />;
  }

  if (typeof mediaAsset.uri !== 'string') {
    console.warn('MediaGridItem received invalid uri type:', typeof mediaAsset.uri, mediaAsset.uri);
    return <View style={[styles.mediaItem, styles.emptySlot]} />;
  }

  return (
    <TouchableOpacity
      key={String(mediaAsset.id)}
      style={[styles.mediaItem, isSelected && styles.selectedMediaItem]}
      onPress={onPress}
    >
      <Image
        source={{ uri: String(mediaAsset.uri) }}
        style={styles.thumbnail}
      />

      {/* overlay for selected items */}
      {isSelected && (
        <View style={styles.selectedOverlay} />
      )}

      {/* Duration badge for videos */}
      {isVideo && mediaAsset.duration != null && Number.isFinite(mediaAsset.duration) && mediaAsset.duration > 0 && (
        <View style={styles.durationBadge}>
          <Typography size={10} weight="600" style={{ color: "#FFFFFF" }}>
            {formatDuration(mediaAsset.duration)}
          </Typography>
        </View>
      )}

      {/* Selection circle for photos */}
      {!isVideo && showSelectionCircle && (
        <TouchableOpacity
          style={styles.selectionIndicator}
          onPress={(e) => {
            e.stopPropagation();
            onSelectionCirclePress?.();
          }}
        >
          {isSelected ? (
            <View style={styles.selectedIndicator}>
              {selectionNumber ? (
                <Typography size={13} weight="500" style={{ color: "#FFFFFF" }}>
                  {String(selectionNumber)}
                </Typography>
              ) : null}
            </View>
          ) : (
            <View style={styles.unselectedIndicator} />
          )}
        </TouchableOpacity>
      )}

      {/* Selection circle for chat/community mode */}
      {!isVideo && !showSelectionCircle && (
        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <View style={styles.selectedIndicator}>
              {selectionNumber ? (
                <Typography size={13} weight="500" style={{ color: "#FFFFFF" }}>
                  {String(selectionNumber)}
                </Typography>
              ) : null}
            </View>
          ) : (
            <View style={styles.unselectedIndicator} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
  } catch (error) {
    console.error('Error rendering MediaGridItem:', error, { mediaAsset, index, uploadMode });
    return <View style={[styles.mediaItem, styles.emptySlot]} />;
  }
};

const styles = StyleSheet.create({
  mediaItem: {
    flex: 1,
    aspectRatio: 1,
    margin: "0.40%",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  selectedMediaItem: {
    // borderWidth: 3,
    // borderColor: Colors.general.primary,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ddd",
  },
  selectedThumbnail: {
    opacity: 0.8,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.general.primary,
    opacity: 0.15,
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 21,
    height: 21,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicator: {
    backgroundColor: Colors.general.primary,
    width: 21,
    height: 21,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unselectedIndicator: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    width: 21,
    height: 21,
    borderRadius: 12,
  },
  emptySlot: {
    backgroundColor: "transparent",
  },
});