import React from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomBottomSheet from '@/components/ui/CustomBottomSheet';
import CommentSection from '@/components/shared/home/CommentSection';
import ShareVideoModal from '@/components/shared/video/ShareVideoModal';
import PlaylistCard from '@/components/shared/profile/PlaylistCard';
import Typography from '@/components/ui/Typography/Typography';
import { ExternalLink } from '@/components/ExternalLink';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

type SheetType = 'comments' | 'plays' | 'share' | 'playlist';

interface VideoBottomSheetsProps {
  activeSheet: SheetType | null;
  onClose: () => void;
  postId: string;
  playsCount: number;
  playlistData?: any;
  currentPlaylist?: any[];
  currentVideoIndex?: number;
  onVideoSelect?: (video: any, index: number) => void;
  videoData?: {
    _id: string;
    thumbnail: string;
    images?: string[];
    duration: string;
    description: string;
    user: {
      _id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      profilePicture?: string;
    };
  };
}

const VideoBottomSheets: React.FC<VideoBottomSheetsProps> = ({
  activeSheet,
  onClose,
  postId,
  playsCount,
  playlistData,
  currentPlaylist = [],
  currentVideoIndex = 0,
  onVideoSelect,
  videoData,
}) => {
  const { theme } = useCustomTheme();

  return (
    <>
      {/* Comments Sheet */}
      {activeSheet === 'comments' && (
        <CustomBottomSheet
          isVisible={activeSheet === 'comments'}
          onClose={onClose}
          showCloseIcon={false}
          sheetheight={600}
        >
          <CommentSection postId={postId} authorId="" />
        </CustomBottomSheet>
      )}

      {/* Plays Sheet */}
      {activeSheet === 'plays' && (
        <CustomBottomSheet
          isVisible={activeSheet === 'plays'}
          onClose={onClose}
        >
          <View style={styles.playsContent}>
            <View style={styles.rowContainer}>
              <Ionicons
                name="play-outline"
                size={24}
                color={Colors[theme].textBold}
              />
              <Typography
                weight="600"
                size={20}
                lineHeight={24}
                color={Colors[theme].textBold}
              >
                Plays ({playsCount})
              </Typography>
            </View>
            <Typography textType="textBold">
              This video has been played {playsCount} times. To learn
              more, visit the{' '}
              <ExternalLink href="#">
                <Typography weight="600" color={Colors.general.blue}>
                  Help Center
                </Typography>
              </ExternalLink>
              .
            </Typography>
          </View>
        </CustomBottomSheet>
      )}

      {/* Share Sheet */}
      {activeSheet === 'share' && videoData && (
        <ShareVideoModal 
          isVisible={activeSheet === 'share'} 
          onClose={onClose}
          videoData={videoData}
        />
      )}

      {/* Playlist Sheet */}
      {activeSheet === 'playlist' && onVideoSelect && (
        <CustomBottomSheet
          isVisible={activeSheet === 'playlist'}
          onClose={onClose}
          title={playlistData?.data?.name || 'Playlist'}
          sheetheight={600}
        >
          <View style={styles.playlistContent}>
            <View style={[styles.playlistHeader, { borderBottomColor: Colors[theme].cardBackground }]}>
              <Typography
                weight="400"
                size={14}
                color={Colors[theme].textLight}
              >
                {currentPlaylist.length} videos • Playing video {currentVideoIndex + 1}
              </Typography>
            </View>

            <FlatList
              data={currentPlaylist}
              renderItem={({ item, index }) => (
                <View style={styles.playlistVideoItem}>
                  <TouchableOpacity
                    onPress={() => onVideoSelect(item, index)}
                    style={[
                      styles.playlistVideoContent,
                      index === currentVideoIndex && {
                        backgroundColor: Colors[theme].cardBackground + '40',
                      },
                    ]}
                  >
                    <PlaylistCard
                      item={item}
                      isPlaylist={false}
                      onPress={() => onVideoSelect(item, index)}
                    />
                    {index === currentVideoIndex && (
                      <View style={[styles.currentIndicator, { backgroundColor: Colors.general.primary }]}>
                        <Ionicons
                          name="play"
                          size={16}
                          color={Colors[theme].textBold}
                        />
                        <Typography
                          weight="600"
                          size={12}
                          color={Colors[theme].textBold}
                        >
                          Now Playing
                        </Typography>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item, index) => `${item._id}-${index}`}
              showsVerticalScrollIndicator={false}
              style={styles.playlistVideosList}
              initialScrollIndex={Math.max(0, currentVideoIndex - 1)}
              getItemLayout={(data, index) => ({
                length: 90,
                offset: 90 * index,
                index,
              })}
            />
          </View>
        </CustomBottomSheet>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  playsContent: {
    gap: 21,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playlistContent: {
    flex: 1,
  },
  playlistHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  playlistVideoItem: {
    marginBottom: 8,
  },
  playlistVideoContent: {
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  playlistVideosList: {
    flex: 1,
  },
  currentIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});

export default VideoBottomSheets;
