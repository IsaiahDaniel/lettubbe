import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Ionicons } from '@expo/vector-icons';

type Album = {
  id: string;
  title: string;
  assetCount?: number;
};

type AlbumWithThumbnail = Album & {
  thumbnail?: string;
};

interface FolderSelectionScreenProps {
  albums: Album[];
  onSelectAlbum: (album: Album) => void;
  onBack: () => void;
  uploadMode: "video" | "photo";
  showBackButton?: boolean;
}

const FolderSelectionScreen: React.FC<FolderSelectionScreenProps> = ({
  albums,
  onSelectAlbum,
  onBack,
  uploadMode,
  showBackButton = true
}) => {
  const { theme } = useCustomTheme();
  const [albumsWithThumbnails, setAlbumsWithThumbnails] = useState<AlbumWithThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastProcessedAlbumIds, setLastProcessedAlbumIds] = useState<string>('');

  const screenWidth = Dimensions.get('window').width;
  const padding = 16;
  const gap = 12;
  const itemsPerRow = 3;
  const itemWidth = (screenWidth - padding * 2 - gap * (itemsPerRow - 1)) / itemsPerRow;


  useEffect(() => {
    console.log(`FolderSelectionScreen received ${albums.length} albums:`, albums.map(a => `${a.title} (${a.assetCount})`));

    // Early return if no albums provided
    if (albums.length === 0) {
      console.log('📁 [FOLDER_SELECTION] No albums provided, clearing state');
      setAlbumsWithThumbnails([]);
      setLoading(false);
      setLastProcessedAlbumIds('');
      return;
    }

    // Only load thumbnails if albums actually changed (not just re-rendered)
    const albumIds = albums.map(a => a.id).join(',');

    if (albumIds !== lastProcessedAlbumIds) {
      console.log('📁 [FOLDER_SELECTION] Albums changed, loading thumbnails');
      setLastProcessedAlbumIds(albumIds);
      
      // Inline the thumbnail loading to avoid callback dependency issues
      const loadThumbnailsInline = async () => {
        setLoading(true);
        const albumsWithThumb: AlbumWithThumbnail[] = [];
        const mediaType = uploadMode === 'video' ? 'video' : 'photo';

        for (const album of albums) {
          console.log(`Loading thumbnail for album: ${album.title} (${album.assetCount} ${mediaType}s)`);
          try {
            let thumbnail: string | undefined;

            if (album.id === 'recents') {
              // For recents, get the most recent media of the current type
              const recentAssets = await MediaLibrary.getAssetsAsync({
                mediaType,
                first: 1,
                sortBy: [[MediaLibrary.SortBy.creationTime, false]]
              });

              if (recentAssets.assets.length > 0) {
                thumbnail = recentAssets.assets[0].uri;
              }
            } else {
              // For regular albums, get the first media of the current type from the album
              const albumAssets = await MediaLibrary.getAssetsAsync({
                album: album.id,
                mediaType,
                first: 1,
                sortBy: [[MediaLibrary.SortBy.creationTime, false]]
              });

              if (albumAssets.assets.length > 0) {
                thumbnail = albumAssets.assets[0].uri;
              }

              // Update the actual asset count based on what we found
              (album as any).assetCount = albumAssets.totalCount;
            }

            // Only add albums that actually have media of the current type
            if (album.id === 'recents' || (album.assetCount ?? 0) > 0) {
              albumsWithThumb.push({
                ...album,
                thumbnail
              });
              console.log(`✅ Album ${album.title} added to display`);
            } else {
              console.log(`❌ Album ${album.title} skipped - no ${mediaType}s found`);
            }
          } catch (error) {
            console.error(`❌ Error loading thumbnail for album ${album.title}:`, error);
            albumsWithThumb.push(album);
          }
        }

        console.log(`FolderSelectionScreen loaded ${albumsWithThumb.length} albums with thumbnails`);
        setAlbumsWithThumbnails(albumsWithThumb);
        setLoading(false);
      };
      
      loadThumbnailsInline();
    } else {
      console.log('📁 [FOLDER_SELECTION] Albums unchanged, skipping thumbnail load');
    }
  }, [albums, uploadMode, lastProcessedAlbumIds]);

  const renderAlbumItem = ({ item }: { item: AlbumWithThumbnail }) => (
    <TouchableOpacity
      style={[styles.albumItem, { width: itemWidth }]}
      onPress={() => onSelectAlbum(item)}
    >
      <View style={[styles.thumbnailContainer, { height: itemWidth * 1 }]}>
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderContainer, { backgroundColor: Colors[theme].borderColor }]}>
            <Ionicons
              name="videocam-outline"
              size={24}
              color={Colors[theme].textLight}
            />
          </View>
        )}

        {/* Media count overlay */}
        <View style={styles.countOverlay}>
          <Typography size={12} color="white" weight="500" lineHeight={18}>
            {item.assetCount ?? 0}
          </Typography>
        </View>
      </View>

      <Typography
        size={14}
        weight="500"
        color={Colors[theme].textBold}
        numberOfLines={2}
        style={styles.albumTitle}
      >
        {item.title}
      </Typography>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: Colors[theme].borderColor }]}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors[theme].textBold} />
          </TouchableOpacity>
        )}
        <View style={{ marginLeft: showBackButton ? 0 : 8 }}>
          <Typography size={16} weight="600" color={Colors[theme].textBold}>
            Select Folder
          </Typography>
        </View>
      </View>
      <View style={styles.placeholder} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.general.purple} />
          <Typography
            size={16}
            color={Colors[theme].textLight}
            style={styles.loadingText}
          >
            Loading folders...
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <FlatList
        data={albumsWithThumbnails}
        renderItem={renderAlbumItem}
        keyExtractor={(item) => item.id}
        numColumns={itemsPerRow}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={() => <View style={{ height: gap }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 4,
    marginRight: 6,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  albumItem: {
    marginBottom: 12,
  },
  thumbnailContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.borderColor,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  albumTitle: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default FolderSelectionScreen;