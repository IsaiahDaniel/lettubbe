import React from "react";
import { View, TouchableOpacity } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import MentionText from "@/components/ui/MentionText";
import { Feather } from '@expo/vector-icons';
import SharedPhotoCard from "@/components/shared/chat/SharedPhotoCard";
import SharedVideoCard from "@/components/shared/chat/SharedVideoCard";
import VoiceMessageRenderer from "@/components/shared/chat/renderers/VoiceMessageRenderer";
import { Colors } from "@/constants/Colors";
import { TimestampDisplay } from "../TimestampDisplay";
import { TimestampService } from "../../services/TimestampService";
import { styles } from "../../styles/MessageStyles";
import { useCustomTheme } from '@/hooks/useCustomTheme';
import InboxReplyPreview from "../InboxReplyPreview";

interface RegularMessageProps {
  message: any;
  isUser: boolean;
  formattedTime: string;
  theme: string;
  isVideoMessage: boolean;
  isPhotoMessage: boolean;
  isAudioMessage: boolean;
  videoData: any;
  photoData: any;
  audioData: any;
  userDetails: any;
  otherUser: any;
  replyMessage?: any;
  retryFn?: () => void;
  isOptimistic?: boolean;
  isSent?: boolean;
  uploadError?: boolean;
  isUploading?: boolean;
  scrollToMessage?: (messageId: string) => void;
  highlightedMessageId?: string | null;
  isHighlighted?: boolean;
}

export const RegularMessage: React.FC<RegularMessageProps> = ({
  message,
  isUser,
  formattedTime,
  isVideoMessage,
  isPhotoMessage,
  isAudioMessage,
  videoData,
  photoData,
  audioData,
  userDetails,
  otherUser,
  replyMessage,
  retryFn,
  scrollToMessage,
  highlightedMessageId,
  isHighlighted,
  isOptimistic,
  isSent,
  uploadError,
  isUploading
}) => {
  const { theme } = useCustomTheme();

  const shouldShowTimestamp = TimestampService.shouldShowTimestamp(message, [], 0);

  const renderMessageContent = () => {
    if (isPhotoMessage && photoData) {
      return (
        <SharedPhotoCard
          photoData={photoData}
          messageSender={isUser ? userDetails : (otherUser || {})}
        />
      );
    }

    if (isVideoMessage && videoData) {
      return (
        <SharedVideoCard
          videoData={videoData}
          messageSender={isUser ? userDetails : (otherUser || {})}
        />
      );
    }

    if (isAudioMessage && audioData) {
      return (
        <VoiceMessageRenderer
          audioUri={audioData.audioUrl || audioData.uri || ''}
          duration={audioData.duration || 0}
          isCurrentUser={isUser}
        />
      );
    }

    return (
      <MentionText
        text={message.text?.trimEnd() || ''}
        mentions={[]}
        style={[
          styles.messageText,
          {
            textDecorationLine: 'none', // no underline by default
          },
        ]}
        color={isUser ? Colors[theme].chatSenderText : Colors[theme].chatReceiverText}
        size={14}
        weight="400"
      />
    );
  };

  return (
    <View style={[
      styles.messageWrapper, 
      isUser && styles.userMessageWrapper,
      (isVideoMessage || isAudioMessage) && styles.videoMessageWrapper
    ]}>
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userMessageBubble, { backgroundColor: Colors[theme].chatSender } ]
            : [
              styles.otherMessageBubble,
              { backgroundColor: Colors[theme].chatReceiver },
            ],
          (isVideoMessage || isPhotoMessage || isAudioMessage) && {
            padding: 0,
            backgroundColor: "transparent"
          },
          isHighlighted && {
            backgroundColor: Colors.general.primary + '20',
          },
        ]}
      >
        {/* Reply Preview inside bubble */}
        {replyMessage && (
          <InboxReplyPreview message={message} onPress={scrollToMessage} />
        )}
        {renderMessageContent()}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <TimestampDisplay
          formattedTime={formattedTime}
          isUser={isUser}
          theme={theme}
          message={message}
          shouldShow={shouldShowTimestamp}
        />
        
        {/* Retry button only shown for failed optimistic messages */}
        {isOptimistic && retryFn && uploadError && (
          <TouchableOpacity
            onPress={retryFn}
            style={{
              marginLeft: isUser ? 8 : 0,
              marginRight: isUser ? 0 : 8,
              padding: 4,
            }}
          >
            <Feather
              name="alert-circle"
              size={14}
              color="#ff4444"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};