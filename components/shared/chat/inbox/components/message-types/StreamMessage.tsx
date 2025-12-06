import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import SharedStreamCard from '../../../SharedStreamCard';
import InboxReplyPreview from '../InboxReplyPreview';
import { TimestampDisplay } from '../TimestampDisplay';
import { styles } from '../../styles/MessageStyles';
import { Colors } from '@/constants/Colors';

interface StreamMessageProps {
  message: any;
  isUser: boolean;
  formattedTime: string;
  theme: string;
  currentUserId: string;
  profile: any;
  userDetails: any;
  otherUser: any;
  streamData: any;
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

export const StreamMessage: React.FC<StreamMessageProps> = ({
  message,
  isUser,
  formattedTime,
  theme,
  currentUserId,
  profile,
  userDetails,
  otherUser,
  streamData,
  replyMessage,
  retryFn,
  isOptimistic,
  isSent,
  uploadError,
  isUploading,
  scrollToMessage,
  highlightedMessageId,
  isHighlighted
}) => {
  const router = useRouter();

  const handleStreamPress = () => {
    if (streamData?.streamId) {
      // Navigate to stream
      router.push(`/(streaming)/stream/${streamData.streamId}`);
    }
  };

  // Only show the stream card if we have stream data with at least a streamId
  if (!streamData || !streamData.streamId) {
    return null;
  }

  return (
    <View style={[
      styles.messageWrapper, 
      isUser && styles.userMessageWrapper,
      isHighlighted && {
        backgroundColor: Colors.general.primary + '20',
      }
    ]}>
      {replyMessage && (
        <InboxReplyPreview
          message={message}
          onPress={scrollToMessage}
        />
      )}
      
      <SharedStreamCard
        streamId={streamData.streamId}
        title={streamData.title}
        description={streamData.description}
        coverPhoto={streamData.coverPhoto}
        startDate={streamData.startDate}
        time={streamData.time}
        isLive={streamData.isLive}
        views={streamData.views}
        userName={streamData.userName}
        userAvatar={streamData.userAvatar}
        onPress={handleStreamPress}
      />

      <TimestampDisplay
        isUser={isUser}
        formattedTime={formattedTime}
        theme={theme}
        message={message}
        shouldShow={true}
      />
    </View>
  );
};