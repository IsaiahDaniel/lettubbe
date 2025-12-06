import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import Typography from '@/components/ui/Typography/Typography';
import ChatUploadProgress from './ChatUploadProgress';
import MessageAvatar from './MessageAvatar';
import MessageTimestamp from './renderers/MessageTimestamp';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChatImageRendererProps {
  images: string[];
  caption?: string;
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

const ChatImageRenderer: React.FC<ChatImageRendererProps> = ({
  images,
  caption,
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

  const handleImagePress = (index: number) => {
    const mediaItems = images.map(uri => ({
      uri,
      type: 'image' as const,
      caption: caption || undefined
    }));
    onPress(mediaItems, index);
  };

  if (images.length === 0) return null;

  const containerWidth = SCREEN_WIDTH * 0.75; // 75% of screen width
  const imageSize = containerWidth - 16; // Account for padding

  const renderImageContent = () => (
    <View>
      <View style={[
        styles.container,
        { backgroundColor: isOwnMessage ? Colors[theme].chatSender : Colors[theme].chatReceiver },
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        isHighlighted && {
          backgroundColor: Colors.general.primary + '20',
        },
      ]}>

        {images.length === 1 ? (
          // Single image
          <TouchableOpacity
            style={[styles.singleImageContainer, { width: imageSize, height: imageSize }]}
            onPress={() => handleImagePress(0)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: images[0] }}
              style={styles.singleImage}
              resizeMode="cover"
            />
            <ChatUploadProgress
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadError={uploadError}
              onRetry={onRetry}
            />
          </TouchableOpacity>
        ) : images.length === 2 ? (
          // Two images - vertical layout
          <View style={[styles.twoImageContainer, { width: imageSize }]}>
            <TouchableOpacity
              style={styles.longImageContainer}
              onPress={() => handleImagePress(0)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: images[0] }}
                style={styles.longImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.longImageContainer}
              onPress={() => handleImagePress(1)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: images[1] }}
                style={styles.longImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        ) : images.length === 3 ? (
          // Three images - one large on left, two stacked on right
          <View style={[styles.threeImageContainer, { width: imageSize }]}>
            <TouchableOpacity
              style={styles.leftLargeImage}
              onPress={() => handleImagePress(0)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: images[0] }}
                style={styles.fullImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <View style={styles.rightStackContainer}>
              <TouchableOpacity
                style={styles.stackImage}
                onPress={() => handleImagePress(1)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: images[1] }}
                  style={styles.fullImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stackImage}
                onPress={() => handleImagePress(2)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: images[2] }}
                  style={styles.fullImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Multiple images (4+) - create a grid
          <View style={[styles.gridContainer, { width: imageSize }]}>
            {images.slice(0, 4).map((uri, index) => {
              const isLastItem = index === 3 && images.length > 4;
              const remainingCount = images.length - 4;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.gridItem}
                  onPress={() => handleImagePress(index)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  {isLastItem && remainingCount > 0 && (
                    <View style={styles.moreOverlay}>
                      <Typography
                        size={18}
                        weight="600"
                        style={{ color: '#FFFFFF' }}
                      >
                        +{remainingCount}
                      </Typography>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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
          {renderImageContent()}

          <MessageTimestamp
            show={shouldShowTimestamp || false}
            time={formattedTime || ''}
            isOwnMessage={isOwnMessage}
          />
        </View>
      </View>
    );
  }

  return renderImageContent();
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
  singleImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
    gap: 4,
    alignItems: 'flex-start',
  },
  twoImageContainer: {
    flexDirection: 'column',
    padding: 2,
    gap: 4,
  },
  longImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    height: 120,
  },
  longImage: {
    width: '100%',
    height: '100%',
  },
  threeImageContainer: {
    flexDirection: 'row',
    padding: 2,
    gap: 4,
    height: 200,
  },
  leftLargeImage: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    height: '100%',
  },
  rightStackContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  stackImage: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  gridItem: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    width: '49%',
    aspectRatio: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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

export default ChatImageRenderer;