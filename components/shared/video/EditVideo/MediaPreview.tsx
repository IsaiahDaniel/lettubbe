import React from 'react';
import { View, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';
import RemixIcon from 'react-native-remix-icon';
import { VideoToEdit } from '@/helpers/types/edit-video.types';

interface MediaPreviewProps {
  video: VideoToEdit;
  thumbnail: string;
  isUploading: boolean;
  onThumbnailPress: () => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  video,
  thumbnail,
  isUploading,
  onThumbnailPress,
}) => {
  const { theme } = useCustomTheme();
  const isPhotoPost = video.images && video.images.length > 0;

  const formatDuration = (seconds?: number | string): string => {
    if (!seconds) return '--:--';

    const duration = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
    const min = Math.floor(duration / 60);
    const sec = Math.floor(duration % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  return (
    <View style={styles.container}>
      {isPhotoPost ? (
        <PhotoPreview images={video.images!} theme={theme} />
      ) : (
        <VideoPreview 
          thumbnail={thumbnail}
          duration={video.duration}
          theme={theme}
          isUploading={isUploading}
          onThumbnailPress={onThumbnailPress}
          formatDuration={formatDuration}
        />
      )}
    </View>
  );
};

const PhotoPreview: React.FC<{ images: string[]; theme: string }> = ({ images, theme }) => (
  <>
    {images.length > 0 ? (
      <ScrollView 
        horizontal 
        style={styles.photoCarousel}
        showsHorizontalScrollIndicator={false}
      >
        {images.map((imageUri, index) => (
          <Image
            key={index}
            source={{ uri: imageUri }}
            style={styles.photoThumbnail}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    ) : (
      <View style={styles.placeholder}>
        <Typography textType="secondary">No photos</Typography>
      </View>
    )}
  </>
);

interface VideoPreviewProps {
  thumbnail: string;
  duration?: number | string;
  theme: string;
  isUploading: boolean;
  onThumbnailPress: () => void;
  formatDuration: (seconds?: number | string) => string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  thumbnail, 
  duration, 
  theme, 
  isUploading, 
  onThumbnailPress,
  formatDuration 
}) => (
  <>
    {thumbnail ? (
      <Image
        source={{ uri: thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.placeholder}>
        <Typography textType="secondary">No thumbnail</Typography>
      </View>
    )}
    
    <View style={styles.durationBadge}>
      <Typography size={12} weight="500" color="#FFFFFF">
        {formatDuration(duration)}
      </Typography>
    </View>

    <TouchableOpacity
      style={styles.editButton}
      onPress={onThumbnailPress}
      disabled={isUploading}
    >
      <View style={styles.editContent}>
        <RemixIcon name="image-edit-line" size={20} color="#FFFFFF" />
        <Typography size={12} weight="600" color="#FFFFFF" style={{ marginLeft: 4 }}>
          {isUploading ? 'Uploading...' : 'Edit Thumbnail'}
        </Typography>
      </View>
    </TouchableOpacity>
  </>
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  editContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
  },
  photoCarousel: {
    height: '100%',
  },
  photoThumbnail: {
    width: 120,
    height: '100%',
    marginRight: 8,
    borderRadius: 8,
  },
});