import React from "react";
import { View, StyleSheet } from "react-native";
import ChatInput from "@/components/ui/inputs/ChatInput";
import ReplyMessagePreview from "./ReplyMessagePreview";

interface CommunityMessageInputProps {
  chatMessage: string;
  setChatMessage: (message: string) => void;
  onSendChat: () => void;
  onSendVoiceNote?: (audioUri: string, duration: number, replyMessage?: any) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  isUserMember: boolean;
  isPublicCommunity: boolean;
  onJoinCommunity: () => void;
  isJoining: boolean;
  hasPendingRequest: boolean;
  replyMessage: any;
  showReplyMessage: boolean;
  replyMessageAnimatedStyle: any;
  onCloseReply: () => void;
  togglePicker: () => void;
  isPickerOpen: boolean;
  uploadedImages: string[];
  onRemoveImage: (url: string) => void;
  communityId: string;
  onRemoveVideo: (url: string) => void;
  uploadedVideo: string[];
  videoDetails: any;
  chatFunctions: {
    setUploadedImageUrls: (urls: string[]) => void;
    setUploadedVideoUrls: (urls: string[]) => void;
    setChatMessage: (message: string) => void;
    handleSendChat: () => void;
    sendMediaMessage: (caption: string, assets: any[], replyMessage?: any) => void;
  };
}

const CommunityMessageInput: React.FC<CommunityMessageInputProps> = ({
  chatMessage,
  setChatMessage,
  onSendChat,
  onSendVoiceNote,
  onTypingStart,
  onTypingStop,
  isUserMember,
  isPublicCommunity,
  onJoinCommunity,
  isJoining,
  hasPendingRequest,
  replyMessage,
  showReplyMessage,
  replyMessageAnimatedStyle,
  onCloseReply,
  togglePicker,
  isPickerOpen,
  uploadedImages,
  onRemoveImage,
  communityId,
  onRemoveVideo,
  uploadedVideo,
  videoDetails,
  chatFunctions,
}) => {
  return (
    <View style={styles.messageInputContainer}>
      <ReplyMessagePreview
        replyMessage={replyMessage && showReplyMessage ? replyMessage : null}
        animatedStyle={replyMessageAnimatedStyle}
        onClose={onCloseReply}
      />

      <ChatInput
        onSend={onSendChat}
        onSendVoiceNote={onSendVoiceNote}
        message={chatMessage}
        setMessage={setChatMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        isUserMember={isUserMember}
        isPublicCommunity={isPublicCommunity}
        onJoinCommunity={onJoinCommunity}
        isJoining={isJoining}
        hasPendingRequest={hasPendingRequest}
        replyMessage={replyMessage}
        togglePicker={togglePicker}
        isPickerOpen={isPickerOpen}
        uploadedImages={uploadedImages}
        onRemoveImage={onRemoveImage}
        communityId={communityId}
        onRemoveVideo={onRemoveVideo}
        uploadedVideo={uploadedVideo}
        videoDetails={videoDetails}
        chatFunctions={chatFunctions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  messageInputContainer: {
    backgroundColor: "transparent",
    position: "relative",
  },
});

export default CommunityMessageInput;