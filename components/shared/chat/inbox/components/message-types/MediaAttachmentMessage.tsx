import React from "react";
import { View } from "react-native";
import ChatImageRenderer from "@/components/shared/chat/ChatImageRenderer";
import ChatVideoRenderer from "@/components/shared/chat/ChatVideoRenderer";
import VoiceMessageRenderer from "@/components/shared/chat/renderers/VoiceMessageRenderer";
import DocumentMessageRenderer from "@/components/shared/chat/renderers/DocumentMessageRenderer";
import { TimestampDisplay } from "../TimestampDisplay";
import { TimestampService } from "../../services/TimestampService";
import { styles } from "../../styles/MessageStyles";
import { Colors } from "@/constants/Colors";
import InboxReplyPreview from "../InboxReplyPreview";

interface MediaAttachmentMessageProps {
  message: any;
  isUser: boolean;
  formattedTime: string;
  theme: string;
  messageImages: string[];
  messageVideos: string[];
  messageAudioUrl: string;
  messageDocumentUrls?: string[];
  messageDocumentDetails?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  onMediaPress: (mediaItems: Array<{ uri: string, type: 'image' | 'video', caption?: string }>, initialIndex?: number) => void;
  replyMessage?: any;
  // Optimistic message props
  retryFn?: () => void;
  isOptimistic?: boolean;
  isSent?: boolean;
  uploadError?: boolean;
  isUploading?: boolean;
  scrollToMessage?: (messageId: string) => void;
  highlightedMessageId?: string | null;
  isHighlighted?: boolean;
}

export const MediaAttachmentMessage: React.FC<MediaAttachmentMessageProps> = ({
  message,
  isUser,
  formattedTime,
  theme,
  messageImages,
  messageVideos,
  messageAudioUrl,
  messageDocumentUrls = [],
  messageDocumentDetails = [],
  onMediaPress,
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
  const shouldShowTimestamp = TimestampService.shouldShowTimestamp(message, [], 0);

  return (
    <View style={[
      styles.messageWrapper, 
      isUser && styles.userMessageWrapper,
      styles.videoMessageWrapper
    ]}>
      <View
        style={[
          styles.messageBubble,
          { padding: 0, backgroundColor: "transparent" },
          isHighlighted && {
            backgroundColor: Colors.general.primary + '20',
          },
        ]}
      >
        {/* Reply Preview inside bubble for media messages */}
        {replyMessage && (
          <View style={{ padding: 8 }}>
            <InboxReplyPreview message={message} onPress={scrollToMessage} />
          </View>
        )}
        
        {messageImages.length > 0 && (
          <ChatImageRenderer
            images={messageImages}
            caption={message.text?.trimEnd()}
            onPress={onMediaPress}
            isUploading={message.isUploading}
            uploadProgress={message.uploadProgress}
            uploadError={message.uploadError}
            onRetry={message.retryFn}
          />
        )}
        {messageVideos.length > 0 && (
          <ChatVideoRenderer
            videoUrl={messageVideos[0]}
            caption={message.text?.trimEnd()}
            onPress={onMediaPress}
            isUploading={message.isUploading}
            uploadProgress={message.uploadProgress}
            uploadError={message.uploadError}
            onRetry={message.retryFn}
          />
        )}
        {messageAudioUrl && (
          <VoiceMessageRenderer
            audioUri={messageAudioUrl}
            duration={message.audioDuration || 0}
            isCurrentUser={isUser}
            caption={message.text?.trimEnd()}
          />
        )}
        {messageDocumentUrls.length > 0 && (
          <>
            {messageDocumentUrls.map((docUrl, index) => {
              const docDetails = messageDocumentDetails[index];
              
              console.log(`📄 [MEDIA_ATTACHMENT] Rendering document ${index + 1}:`, {
                docUrl,
                docDetails,
                hasDetails: !!docDetails,
                docName: docDetails?.name,
                fallbackName: `Document ${index + 1}`,
                messageDocumentDetails: messageDocumentDetails,
                messageId: message.id
              });
              
              return (
                <DocumentMessageRenderer
                  key={docUrl}
                  documentUrl={docUrl}
                  documentName={docDetails?.name || `Document ${index + 1}`}
                  documentSize={docDetails?.size || 0}
                  documentType={docDetails?.type || 'application/octet-stream'}
                  isCurrentUser={isUser}
                  caption={index === 0 ? message.text : undefined} // Only show caption on first document
                  isUploading={message.isUploading}
                  uploadProgress={message.uploadProgress}
                  uploadError={message.uploadError}
                  onRetry={message.retryFn}
                />
              );
            })}
          </>
        )}
      </View>
      <TimestampDisplay
        formattedTime={formattedTime}
        isUser={isUser}
        theme={theme}
        message={message}
        shouldShow={shouldShowTimestamp}
      />
    </View>
  );
};