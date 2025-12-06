import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import Typography from '@/components/ui/Typography/Typography';
import ChatUploadProgress from './ChatUploadProgress';
import MessageAvatar from './MessageAvatar';
import MessageTimestamp from './renderers/MessageTimestamp';
import * as VideoThumbnails from 'expo-video-thumbnails';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChatVideoRendererProps {
  videoUrl: string;
  caption?: string;
  thumbnail?: string;
  duration?: string;
  onPress: (mediaItems: Array<{ uri: string, type: 'image' | 'video', caption?: string }>, index: number) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadError?: boolean;
  onRetry?: () => void;
  isOwnMessage?: boolean;
  formattedTime?: string;
  shouldShowTimestamp?: boolean;
  item?: any;
  onUserPress?: (userId: string) => void;
  useOwnPositioning?: boolean;
  highlightedMessageId?: string | null;
}

const ChatVideoRenderer: React.FC<ChatVideoRendererProps> = ({
  videoUrl,
  caption,
  thumbnail,
  duration,
  onPress,
  isUploading = false,
  uploadProgress = 0,
  uploadError = false,
  onRetry,
  isOwnMessage = false,
  formattedTime,
  shouldShowTimestamp = false,
  item,
  onUserPress,
  useOwnPositioning = false,
  highlightedMessageId
}) => {
  const { theme } = useCustomTheme();
  const messageId = item?._id || item?.id;
  const isHighlighted = highlightedMessageId === messageId;
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);

  // Generate thumbnail if not provided
  useEffect(() => {
    if (!thumbnail && videoUrl && !generatedThumbnail && !thumbnailLoading) {
      generateThumbnail();
    }
  }, [videoUrl, thumbnail, generatedThumbnail, thumbnailLoading]);

  const generateThumbnail = async () => {
    try {
      setThumbnailLoading(true);
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
        time: 1000, // Get thumbnail from 1 second into the video
        quality: 0.7,
      });
      setGeneratedThumbnail(uri);
    } catch (error) {
      console.warn('Error generating video thumbnail:', error);
      setGeneratedThumbnail(null);
    } finally {
      setThumbnailLoading(false);
    }
  };

  const handleVideoPress = () => {
    const mediaItems = [{
      uri: videoUrl,
      type: 'video' as const,
      caption: caption || undefined
    }];
    onPress(mediaItems, 0);
  };

  if (!videoUrl) return null;

  const displayThumbnail = thumbnail || generatedThumbnail;

  const containerWidth = SCREEN_WIDTH * 0.75; // 75% of screen width
  const videoSize = containerWidth - 16; // Account for padding

  const renderVideoContent = () => (
    <View>
      <View style={[
        styles.container,
        { backgroundColor: Colors[theme].cardBackground },
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        isHighlighted && {
          backgroundColor: Colors.general.primary + '20',
        },
      ]}>
        <TouchableOpacity
          style={[styles.videoContainer, { width: videoSize, height: videoSize * 0.75 }]} // 4:3 aspect ratio
          onPress={handleVideoPress}
          activeOpacity={0.8}
        >
          {displayThumbnail ? (
            <Image
              source={{ uri: displayThumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderThumbnail, { backgroundColor: Colors[theme].cardBackground }]}>
              {thumbnailLoading ? (
                <ActivityIndicator size="small" color={Colors[theme].textLight} />
              ) : (
                <Ionicons name="videocam" size={40} color={Colors[theme].textLight} />
              )}
            </View>
          )}
          {/* Play button overlay */}
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </View>
          </View>

          {/* Duration badge */}
          {duration && (
            <View style={styles.durationBadge}>
              <Typography
                size={12}
                weight="600"
                style={{ color: '#FFFFFF' }}
              >
                {duration}
              </Typography>
            </View>
          )}

          <ChatUploadProgress
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadError={uploadError}
            onRetry={onRetry}
          />
        </TouchableOpacity>

        {caption && caption.trim() && (
          <View style={styles.captionContainer}>
            <Typography
              size={14}
              style={{ color: Colors[theme].text }}
            >
              {caption}
            </Typography>
          </View>
        )}

      </View>
      {/* Timestamp display - only show when not using own positioning */}
      {!useOwnPositioning && shouldShowTimestamp && formattedTime && (
        <View style={[
          styles.timestampContainer,
          isOwnMessage ? styles.ownTimestampContainer : styles.otherTimestampContainer
        ]}>
          <Typography
            size={12}
            style={{
              opacity: 0.7
            }}
          >
            {formattedTime}
          </Typography>
        </View>
      )}
    </View>
  );

  if (useOwnPositioning) {
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && item?.userId && (
          <MessageAvatar
            user={item.userId}
            onPress={() => onUserPress && onUserPress(typeof item.userId === "object" ? item.userId._id : item.userId)}
            disabled={!item.userId}
          />
        )}

        <View style={styles.messageWrapper}>
          {renderVideoContent()}

          <MessageTimestamp
            show={shouldShowTimestamp || false}
            time={formattedTime || ''}
            isOwnMessage={isOwnMessage}
          />
        </View>
      </View>
    );
  }

  return renderVideoContent();
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 6,
    flexDirection: "row",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageWrapper: {
    maxWidth: "85%",
  },
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    // marginVertical: 4,
  },
  videoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4, // Slight offset to center the play icon
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
  captionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  timestampContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  ownTimestampContainer: {
    alignItems: 'flex-end',
  },
  otherTimestampContainer: {
    alignItems: 'flex-start',
  },
});

export default ChatVideoRenderer;