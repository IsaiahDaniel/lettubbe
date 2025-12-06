import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { MediaGridItem } from '../MediaItems/MediaGridItem';
import { CameraButton } from '../MediaItems/CameraButton';
import { PhotoAsset } from '@/store/videoUploadStore';

interface MediaGridViewProps {
  media: MediaLibrary.Asset[];
  uploadMode: "video" | "photo" | "document" | "audio";
  selectedMedia: MediaLibrary.Asset[];
  selectedPhotos?: PhotoAsset[];
  loadingMore: boolean;
  hasMoreMedia: boolean;
  isChatUpload: boolean;
  isCommunityUpload: boolean;
  onItemPress: (mediaAsset: MediaLibrary.Asset) => void;
  onSelectionCirclePress?: (mediaAsset: MediaLibrary.Asset) => void;
  onCameraPress: () => void;
}

export const MediaGridView: React.FC<MediaGridViewProps> = ({
  media,
  uploadMode,
  selectedMedia,
  selectedPhotos = [],
  loadingMore,
  hasMoreMedia,
  isChatUpload,
  isCommunityUpload,
  onItemPress,
  onSelectionCirclePress,
  onCameraPress,
}) => {
  const { theme } = useCustomTheme();

  const isSelected = (mediaId: string): boolean => {
    return selectedMedia.some(item => item.id === mediaId);
  };

  const getSelectionNumber = (mediaId: string): number => {
    // For chat/community uploads, use selectedMedia array
    if (isChatUpload || isCommunityUpload) {
      const index = selectedMedia.findIndex(item => item.id === mediaId);
      return index >= 0 ? index + 1 : 0;
    }

    // For standard photo uploads, use selectedPhotos array to maintain selection order
    const mediaItem = media.find(item => item.id === mediaId);
    if (mediaItem) {
      const index = selectedPhotos.findIndex(photo => photo.uri === mediaItem.uri);
      return index >= 0 ? index + 1 : 0;
    }

    return 0;
  };

  // Prepare rows of 3 media items for the grid below
  // Skip first 6 items for chat/community (3x2 grid), or first 4 items for main upload (2x2 grid + camera)
  const topItemsCount = (isChatUpload || isCommunityUpload) ? 6 : 4;
  const remainingMedia = media.slice(topItemsCount);
  
  const renderGridRows = () => {
    const rows = [];
    for (let i = 0; i < remainingMedia.length; i += 3) {
      const rowMedia = remainingMedia.slice(i, i + 3);
      rows.push(
        <View key={`row-${i}`} style={styles.gridRow}>
          {rowMedia.map((mediaAsset, index) => {
            if (!mediaAsset || !mediaAsset.id || !mediaAsset.uri) {
              console.warn('Invalid mediaAsset in grid row:', mediaAsset);
              return <View key={`invalid-${i}-${index}`} style={[styles.mediaItem, styles.emptySlot]} />;
            }
            
            // Additional validation for types that could cause rendering issues
            if (typeof mediaAsset.id !== 'string' && typeof mediaAsset.id !== 'number') {
              console.warn('Invalid mediaAsset id type:', typeof mediaAsset.id, mediaAsset);
              return <View key={`invalid-id-${i}-${index}`} style={[styles.mediaItem, styles.emptySlot]} />;
            }
            
            if (typeof mediaAsset.uri !== 'string') {
              console.warn('Invalid mediaAsset uri type:', typeof mediaAsset.uri, mediaAsset);
              return <View key={`invalid-uri-${i}-${index}`} style={[styles.mediaItem, styles.emptySlot]} />;
            }
            
            try {
              return (
                <MediaGridItem
                  key={`${String(mediaAsset.id)}-${topItemsCount + i * 3 + index}`}
                  mediaAsset={mediaAsset}
                  index={topItemsCount + i * 3 + index}
                  uploadMode={uploadMode}
                  isSelected={isSelected(mediaAsset.id)}
                  selectionNumber={getSelectionNumber(mediaAsset.id)}
                  showSelectionCircle={isChatUpload || isCommunityUpload}
                  onPress={() => onItemPress(mediaAsset)}
                  onSelectionCirclePress={() => onSelectionCirclePress?.(mediaAsset)}
                />
              );
            } catch (error) {
              console.error('Error rendering MediaGridItem in grid:', error, mediaAsset);
              return <View key={`error-${i}-${index}`} style={[styles.mediaItem, styles.emptySlot]} />;
            }
          })}
          {/* Add empty placeholder slots if row has less than 3 items */}
          {rowMedia.length === 2 && (
            <View style={[styles.mediaItem, styles.emptySlot]} />
          )}
          {rowMedia.length === 1 && (
            <>
              <View style={[styles.mediaItem, styles.emptySlot]} />
              <View style={[styles.mediaItem, styles.emptySlot]} />
            </>
          )}
        </View>
      );
    }
    return rows;
  };

  const renderEmptySlots = (count: number, keyPrefix: string) => {
    const slots = [];
    for (let i = 0; i < count; i++) {
      slots.push(
        <View key={`${keyPrefix}-${i}`} style={[styles.mediaItem, styles.emptySlot]} />
      );
    }
    return slots;
  };

  const renderTopSection = () => (
    <View style={styles.topSection}>
      {/* Camera button on the left - only show for main upload, not chat upload */}
      {!isChatUpload && !isCommunityUpload && (
        <CameraButton uploadMode={uploadMode} onPress={onCameraPress} />
      )}

      {/* Media items container - adjust layout based on camera visibility */}
      <View style={isChatUpload || isCommunityUpload ? styles.topGridContainer : styles.topRightContainer}>
        {isChatUpload || isCommunityUpload ? (
          // 3x2 grid layout when no camera (6 items total)
          <>
            {/* First row of 3 media items */}
            <View style={styles.topVideoRow}>
              {media[0] && (
                <MediaGridItem
                  mediaAsset={media[0]}
                  index={0}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[0].id)}
                  selectionNumber={getSelectionNumber(media[0].id)}
                  showSelectionCircle={true}
                  onPress={() => onItemPress(media[0])}
                  onSelectionCirclePress={() => onSelectionCirclePress?.(media[0])}
                />
              )}
              {media[1] && (
                <MediaGridItem
                  mediaAsset={media[1]}
                  index={1}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[1].id)}
                  selectionNumber={getSelectionNumber(media[1].id)}
                  showSelectionCircle={true}
                  onPress={() => onItemPress(media[1])}
                  onSelectionCirclePress={() => onSelectionCirclePress?.(media[1])}
                />
              )}
              {media[2] && (
                <MediaGridItem
                  mediaAsset={media[2]}
                  index={2}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[2].id)}
                  selectionNumber={getSelectionNumber(media[2].id)}
                  showSelectionCircle={true}
                  onPress={() => onItemPress(media[2])}
                  onSelectionCirclePress={() => onSelectionCirclePress?.(media[2])}
                />
              )}
              {/* Fill remaining slots */}
              {renderEmptySlots(Math.max(0, 3 - Math.min(media.length, 3)), 'row1')}
            </View>

            {/* Second row of 3 media items */}
            <View style={styles.topVideoRow}>
              {media[3] && (
                <MediaGridItem
                  mediaAsset={media[3]}
                  index={3}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[3].id)}
                  selectionNumber={getSelectionNumber(media[3].id)}
                  showSelectionCircle={true}
                  onPress={() => onItemPress(media[3])}
                  onSelectionCirclePress={() => onSelectionCirclePress?.(media[3])}
                />
              )}
              {media[4] && (
                <MediaGridItem
                  mediaAsset={media[4]}
                  index={4}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[4].id)}
                  selectionNumber={getSelectionNumber(media[4].id)}
                  showSelectionCircle={true}
                  onPress={() => onItemPress(media[4])}
                  onSelectionCirclePress={() => onSelectionCirclePress?.(media[4])}
                />
              )}
              {media[5] && (
                <MediaGridItem
                  mediaAsset={media[5]}
                  index={5}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[5].id)}
                  selectionNumber={getSelectionNumber(media[5].id)}
                  showSelectionCircle={true}
                  onPress={() => onItemPress(media[5])}
                  onSelectionCirclePress={() => onSelectionCirclePress?.(media[5])}
                />
              )}
              {/* Fill remaining slots */}
              {renderEmptySlots(Math.max(0, 6 - Math.min(media.length, 6)), 'row2')}
            </View>
          </>
        ) : (
          // 2x2 grid layout when camera is present (4 items total)
          <>
            {/* First row of 2 media items */}
            <View style={styles.topVideoRow}>
              {media[0] && (
                <MediaGridItem
                  mediaAsset={media[0]}
                  index={0}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[0].id)}
                  selectionNumber={getSelectionNumber(media[0].id)}
                  onPress={() => onItemPress(media[0])}
                />
              )}
              {media[1] && (
                <MediaGridItem
                  mediaAsset={media[1]}
                  index={1}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[1].id)}
                  selectionNumber={getSelectionNumber(media[1].id)}
                  onPress={() => onItemPress(media[1])}
                />
              )}
              {/* Fill remaining slots */}
              {renderEmptySlots(Math.max(0, 2 - Math.min(media.length, 2)), 'std-row1')}
            </View>

            {/* Second row of 2 media items */}
            <View style={styles.topVideoRow}>
              {media[2] && (
                <MediaGridItem
                  mediaAsset={media[2]}
                  index={2}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[2].id)}
                  selectionNumber={getSelectionNumber(media[2].id)}
                  onPress={() => onItemPress(media[2])}
                />
              )}
              {media[3] && (
                <MediaGridItem
                  mediaAsset={media[3]}
                  index={3}
                  uploadMode={uploadMode}
                  isSelected={isSelected(media[3].id)}
                  selectionNumber={getSelectionNumber(media[3].id)}
                  onPress={() => onItemPress(media[3])}
                />
              )}
              {/* Fill remaining slots */}
              {renderEmptySlots(Math.max(0, 4 - Math.min(media.length, 4)), 'std-row2')}
            </View>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTopSection()}
      
      <View style={styles.videoGrid}>
        {renderGridRows()}

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
              {media.length} {uploadMode === "video" ? "videos" : "photos"} loaded
            </Typography>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    flexDirection: "row",
    width: "100%",
    paddingTop: 1,
    paddingHorizontal: 1,
  },
  topGridContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingTop: 1.5,
  },
  topRightContainer: {
    flex: 1.999,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingTop: 1.5,
  },
  topVideoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  videoGrid: {
    width: "100%",
    paddingHorizontal: 1,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  mediaItem: {
    flex: 1,
    aspectRatio: 1,
    margin: "0.40%",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  emptySlot: {
    backgroundColor: "transparent",
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