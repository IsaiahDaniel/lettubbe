import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import MessageAvatar from '../MessageAvatar';
import MessageTimestamp from './MessageTimestamp';

interface DocumentMessageRendererProps {
  documentUrl: string;
  documentName?: string;
  documentSize?: number;
  documentType?: string;
  isCurrentUser: boolean;
  caption?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadError?: boolean;
  onRetry?: () => void;
  item?: any;
  formattedTime?: string;
  shouldShowTimestamp?: boolean;
  onUserPress?: (userId: string) => void;
  useOwnPositioning?: boolean; // control positioning
}

const DocumentMessageRenderer: React.FC<DocumentMessageRendererProps> = ({
  documentUrl,
  documentName,
  documentSize = 0,
  documentType = 'application/octet-stream',
  isCurrentUser,
  caption,
  isUploading = false,
  uploadProgress = 0,
  uploadError = false,
  onRetry,
  item,
  formattedTime,
  shouldShowTimestamp,
  onUserPress,
  useOwnPositioning = false,
}) => {
  const { theme } = useCustomTheme();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };



  const handleDocumentPress = useCallback(async () => {
    if (isUploading || uploadError) return;

    try {
      console.log('📄 [DOCUMENT] Opening document in browser:', documentUrl);
      await Linking.openURL(documentUrl);
      console.log('✅ [DOCUMENT] Successfully opened in browser');
    } catch (error) {
      console.error('❌ [DOCUMENT] Error opening document:', error);
      Alert.alert('Error', 'Unable to open document. Please try again.');
    }
  }, [documentUrl, isUploading, uploadError]);

  const renderDocumentContent = () => (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: isCurrentUser
              ? Colors[theme].chatSender 
              : Colors[theme].chatReceiver,
          },
        ]}
        onPress={handleDocumentPress}
        disabled={isUploading}
        activeOpacity={0.7}
      >
        {isUploading ? (
          <ActivityIndicator
            size="large"
            color={isCurrentUser ? Colors[theme].text : 'white'}
          />
        ) : uploadError ? (
          <TouchableOpacity onPress={onRetry} disabled={!onRetry}>
            <Feather
              name="alert-circle"
              size={48}
              color="#ff4444"
            />
          </TouchableOpacity>
        ) : (
          <Feather
            name="file-text"
            size={48}
            color={Colors[theme].text}
          />
        )}

        {isUploading && (
          <Text
            style={[
              styles.progressText,
              {
                color: Colors[theme].textLight,
                marginTop: 8,
              },
            ]}
          >
            {Math.round(uploadProgress)}%
          </Text>
        )}
      </TouchableOpacity>

      {/* Caption */}
      {caption && caption.trim() && (
        <Text
          style={[
            styles.caption,
            {
              color: Colors[theme].text,
            },
          ]}
        >
          {caption}
        </Text>
      )}
    </View>
  );

  if (useOwnPositioning) {
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isCurrentUser && item?.userId && (
          <MessageAvatar
            user={item.userId}
            onPress={() => onUserPress && onUserPress(typeof item.userId === "object" ? item.userId._id : item.userId)}
            disabled={!item.userId}
          />
        )}

        <View style={styles.messageWrapper}>
          {renderDocumentContent()}
          
          <MessageTimestamp
            show={shouldShowTimestamp || false}
            time={formattedTime || ''}
            isOwnMessage={isCurrentUser}
          />
        </View>
      </View>
    );
  }

  return renderDocumentContent();
};

const styles = StyleSheet.create({
  outerContainer: {
    maxWidth: 120,
    minWidth: 120,
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    aspectRatio: 1,
  },
  documentInfo: {
    flex: 1,
    gap: 2,
  },
  documentType: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  documentSize: {
    fontSize: 12,
    fontWeight: '400',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '500',
    minWidth: 32,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  downloadIndicator: {
    opacity: 0.7,
    paddingRight: 2
  },
  caption: {
    fontSize: 14,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  // Positioning styles for community chat
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageWrapper: {
    maxWidth: '75%',
  },
});

export default React.memo(DocumentMessageRenderer);