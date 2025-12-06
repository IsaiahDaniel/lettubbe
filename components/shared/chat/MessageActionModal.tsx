import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import { MessageRenderer } from '@/components/shared/chat/inbox/components/MessageRenderer';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MessageActionModalProps {
  visible: boolean;
  onClose: () => void;
  message: any;
  onReply: () => void;
  onDelete: () => void;
  isOwnMessage: boolean;
  messagePosition?: { x: number; y: number; width: number; height: number } | null;
  // Props for rendering the actual message
  currentUserId?: string;
  profile?: any;
  userDetails?: any;
  otherUser?: any;
  theme?: string;
  onMediaPress?: (mediaItems: Array<{ uri: string, type: 'image' | 'video', caption?: string }>, initialIndex?: number) => void;
}

const MessageActionModal: React.FC<MessageActionModalProps> = ({
  visible,
  onClose,
  message,
  onReply,
  onDelete,
  isOwnMessage,
  messagePosition,
  currentUserId,
  profile,
  userDetails,
  otherUser,
  theme: themeFromProps,
  onMediaPress,
}) => {
  const { theme } = useCustomTheme();
  const actualTheme = themeFromProps || theme;

  const handleCopy = async () => {
    if (message?.text) {
      await Clipboard.setStringAsync(message.text);
      onClose();
    }
  };

  const handleReply = () => {
    onReply();
    onClose();
  };

  const handleDelete = () => {
    const messageId = message?._id || message?.id;
    console.log("🗑️ [MessageActionModal] handleDelete called for message:", messageId);
    console.log("🗑️ [MessageActionModal] isOwnMessage:", isOwnMessage, "isDeleted:", message?.isDeleted);
    onDelete();
    onClose();
  };

  const actions = [
    {
      icon: 'arrow-undo',
      label: 'Reply',
      onPress: handleReply,
      show: !message?.isDeleted,
    },
    {
      icon: 'copy-outline',
      label: 'Copy',
      onPress: handleCopy,
      show: !message?.isDeleted && message?.text,
    },
    {
      icon: 'trash-outline',
      label: 'Delete',
      onPress: handleDelete,
      show: isOwnMessage && !message?.isDeleted,
      destructive: true,
    },
  ].filter(action => action.show);

  // Smart positioning based on message position and sender alignment
  const getModalPosition = () => {
    const modalWidth = 380; // Match updated modal width
    const messagePreviewHeight = 100; // Increased height for better message preview
    const modalHeight = messagePreviewHeight + actions.length * 44 + 32; // Message + actions + padding
    const padding = 20; // Screen edge padding
    const messageUserId = message?.userId?.toString();
    const currentUserIdStr = currentUserId?.toString();
    const isUserMessage = messageUserId === currentUserIdStr;
    
    if (messagePosition) {
      // Start with message position
      let top = messagePosition.y;
      let left = messagePosition.x;
      
      // Horizontal alignment based on message sender
      if (isUserMessage) {
        // User's message: align modal to the right edge of message, or as close as possible
        left = Math.min(
          messagePosition.x + messagePosition.width - modalWidth, // Align right edges
          screenWidth - modalWidth - padding // Don't go off screen
        );
        // If still going off left edge, align to left edge of message
        if (left < padding) {
          left = Math.max(messagePosition.x, padding);
        }
      } else {
        // Other person's message: align modal to the left edge of message
        left = messagePosition.x;
        // Ensure modal doesn't go off right edge
        if (left + modalWidth + padding > screenWidth) {
          left = screenWidth - modalWidth - padding;
        }
        // Ensure modal doesn't go off left edge
        if (left < padding) {
          left = padding;
        }
      }
      
      // Vertical positioning - try to position as close to message as possible
      const preferredTop = messagePosition.y - 10; // Small offset above message
      
      if (preferredTop + modalHeight + padding <= screenHeight) {
        // Modal fits above with small offset
        top = preferredTop;
      } else if (messagePosition.y + messagePosition.height + 10 + modalHeight + padding <= screenHeight) {
        // Modal fits below message with small offset
        top = messagePosition.y + messagePosition.height + 10;
      } else {
        // Use original logic - center vertically or position above
        if (messagePosition.y + modalHeight + padding > screenHeight) {
          top = messagePosition.y - modalHeight - padding;
        }
      }
      
      // Ensure modal doesn't go above screen
      if (top < padding) {
        top = padding;
      }
      
      // Ensure modal doesn't go below screen
      if (top + modalHeight + padding > screenHeight) {
        top = screenHeight - modalHeight - padding;
      }
      
      return { top, left };
    }
    
    // Fallback to centered positioning
    return {
      top: screenHeight / 2 - modalHeight / 2,
      left: screenWidth / 2 - modalWidth / 2,
    };
  };

  const modalPosition = getModalPosition();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View 
          style={[
            styles.modalContainer, 
            { 
              position: 'absolute',
              top: modalPosition.top,
              left: modalPosition.left,
            }
          ]}
        >
          {/* Message Preview */}
          <View style={styles.messagePreviewSection}>
            {currentUserId && profile && userDetails && otherUser && message ? (
              <MessageRenderer
                message={message}
                index={0}
                currentUserId={currentUserId}
                profile={profile}
                userDetails={userDetails}
                otherUser={otherUser}
                theme={actualTheme}
                onMediaPress={onMediaPress || (() => {})}
                // Don't pass onReply or onLongPress to avoid nested interactions
              />
            ) : (
              <View style={styles.fallbackMessagePreview}>
                <Typography
                  numberOfLines={2}
                  size={14}
                  weight="500"
                  style={[styles.fallbackMessageText, { color: Colors[theme].text }]}
                >
                  {message?.text || 'Message'}
                </Typography>
              </View>
            )}
          </View>

          <View style={[styles.actionsContainer, { backgroundColor: Colors[theme].cardBackground }]}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  { borderBottomColor: Colors[theme].borderColor },
                  index === actions.length - 1 && styles.lastActionButton,
                ]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={action.icon as any}
                  size={20}
                  color={action.destructive ? '#FF4444' : Colors[theme].text}
                  style={styles.actionIcon}
                />
                <Typography
                  style={[
                    styles.actionLabel,
                    { color: action.destructive ? '#FF4444' : Colors[theme].text }
                  ]}
                >
                  {action.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 380,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1001,
  },
  messagePreviewSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  fallbackMessagePreview: {
    padding: 8,
  },
  fallbackMessageText: {
    lineHeight: 20,
  },
  actionsContainer: {
    paddingVertical: 8,
    borderRadius: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastActionButton: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MessageActionModal;