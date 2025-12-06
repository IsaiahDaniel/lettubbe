import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';

interface ReplyPreviewProps {
  replyToMessage: {
    id: string;
    text: string;
    userId: string;
    senderName?: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
  };
  onClose: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyToMessage, onClose }) => {
  const { theme } = useCustomTheme();

  const getMessagePreview = () => {
    if (replyToMessage.imageUrl) {
      return 'Photo';
    }
    if (replyToMessage.videoUrl) {
      return 'Video';
    }
    if (replyToMessage.audioUrl) {
      return 'Audio';
    }
    return replyToMessage.text || 'Message';
  };

  return (
    <View
      style={{
        backgroundColor: Colors[theme].cardBackground,
        borderLeftWidth: 4,
        borderLeftColor: Colors.general.primary,
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Typography
          style={{
            color: Colors.general.primary,
            fontWeight: '600',
            fontSize: 14,
          }}
        >
          {replyToMessage.senderName || 'User'}
        </Typography>
        <Typography
          style={{
            color: Colors[theme].textLight,
            fontSize: 14,
          }}
          numberOfLines={1}
        >
          {getMessagePreview()}
        </Typography>
      </View>

      <TouchableOpacity
        onPress={onClose}
        style={{
          padding: 4,
          marginLeft: 8,
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="close"
          size={18}
          color={Colors[theme].textLight}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ReplyPreview;