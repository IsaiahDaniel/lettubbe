import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants/Colors";
import Wrapper from "@/components/utilities/Wrapper";
import GrainyBackground from "@/components/shared/chat/GrainyBackground";
import CommunityInviteModal from "@/components/shared/chat/CommunityInviteModal";
import CustomAlert from "@/components/ui/CustomAlert";
import MessageActionModal from "@/components/shared/chat/MessageActionModal";
import Spinner from "react-native-loading-spinner-overlay";
import CommunityHeader from "@/components/shared/community/CommunityHeader";
import CommunityMessageList from "@/components/shared/community/CommunityMessageList";
import CommunityMessageInput from "@/components/shared/community/CommunityMessageInput";
import { useMessageUI } from "@/hooks/chats/useMessageUI";
import { useScrollBehavior } from "@/hooks/chats/useScrollBehavior";
import { useCommunityData } from "@/hooks/chats/useCommunityData";
import useCommunityGroupConstants from "@/hooks/chats/useCommunityGroupConstants";
import useDeleteGroupMessage from "@/hooks/chats/useDeleteGroupMessage";
import useAuth from "@/hooks/auth/useAuth";
import useUploadPhotoInCommunity from "@/hooks/community/useUploadPhotoInCommunity";
import useUploadVideoInCommunity from "@/hooks/community/useUploadVideoInCommunity";
import useUploadAudioInCommunity from "@/hooks/community/useUploadAudioInCommunity";
import { extractUserId } from "@/helpers/utils/messageUtils";
import { VoiceMessageProvider } from "@/contexts/VoiceMessageContext";

const CommunityChat = () => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const params = useLocalSearchParams();
  const { id, name, isNew } = params;

  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);


  // Upload hooks
  const photoUpload = useUploadPhotoInCommunity(() => { });
  const videoUpload = useUploadVideoInCommunity(() => { });
  const audioUpload = useUploadAudioInCommunity(() => { });

  const communityState = useCommunityData({
    id: id as string,
    name,
    isNew
  });

  const messageUIState = useMessageUI();
  const { handleDeleteChat } = useDeleteGroupMessage(
    messageUIState.selectedMessage?._id,
    communityState.communityResponse?.data?._id,
    communityState.setMessages
  );

  // Create a temporary scroll function that will be updated later
  const scrollToMessageRef = useRef<((messageId: string) => void) | null>(null);
  const scrollToMessage = useCallback((messageId: string) => {
    if (scrollToMessageRef.current) {
      scrollToMessageRef.current(messageId);
    }
  }, []);

  const handleRetryUpload = (messageId: string) => {
    // Find the message that failed
    const failedMessage = communityState.messages.find(msg =>
      (msg._id === messageId || msg.id === messageId) && msg.uploadError
    );

    if (!failedMessage) return;

    // Determine if it's an image, video, or audio and retry accordingly
    if (failedMessage.imageUrl || failedMessage.images?.length ||
      failedMessage.localMedia?.some(media => media.mediaType !== 'video' && media.mediaType !== 'audio')) {
      photoUpload.retryUpload();
    } else if (failedMessage.videoUrl ||
      failedMessage.localMedia?.some(media => media.mediaType === 'video')) {
      videoUpload.retryUpload();
    } else if (failedMessage.audioUrl ||
      failedMessage.localMedia?.some(media => media.mediaType === 'audio')) {
      audioUpload.retryUpload();
    }
  };

  const {
    renderEmptyState,
    renderListHeader,
    renderItem,
    processMessagesWithDateSeparators,
    renderMediaViewer,
  } = useCommunityGroupConstants({
    isUserMember: communityState.isUserMember,
    name,
    loadingUserJoinedCommunities: communityState.loadingUserJoinedCommunities,
    communityData: communityState.communityData,
    isJoining: communityState.isJoining,
    handleInviteMembers: communityState.handleInviteMembers,
    handleCommunityInfo: communityState.handleCommunityInfo,
    isSendingRequest: false,
    hasPendingRequest: communityState.actualPendingState,
    messages: communityState.messages,
    setReplyMessage: communityState.setReplyMessage,
    replyMessage: communityState.replyMessage,
    scrollToMessage: scrollToMessage,
    onRetryUpload: handleRetryUpload,
    highlightedMessageId: messageUIState.highlightedMessageId,
  });

  const messagesWithDateSeparators = useMemo(() => {
    const safeMessages = communityState.messages && Array.isArray(communityState.messages)
      ? communityState.messages : [];
    const processed = processMessagesWithDateSeparators(safeMessages);
    // console.log("📅 [COMMUNITY] messagesWithDateSeparators processed:", {
    //   originalCount: safeMessages.length,
    //   processedCount: processed.length,
    //   hasDateSeparators: processed.some(item => 'displayDate' in item)
    // });
    return processed;
  }, [communityState.messages, processMessagesWithDateSeparators]);

  const scrollBehavior = useScrollBehavior(messagesWithDateSeparators, messageUIState.highlightMessage);
  
  // Update the ref to point to the real scroll function
  useEffect(() => {
    scrollToMessageRef.current = scrollBehavior.scrollToMessage;
  }, [scrollBehavior.scrollToMessage]);

  const replyMessageHeight = useSharedValue(0);
  const replyMessageOpacity = useSharedValue(0);

  const replyMessageAnimatedStyle = useAnimatedStyle(() => ({
    height: replyMessageHeight.value,
    opacity: replyMessageOpacity.value,
    overflow: "hidden",
  }));

  useEffect(() => {
    if (communityState.replyMessage && communityState.showReplyMessage) {
      replyMessageHeight.value = withTiming(80, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      });
      replyMessageOpacity.value = withTiming(1, {
        duration: 80,
        easing: Easing.out(Easing.quad),
      });
    } else {
      replyMessageHeight.value = withTiming(0, {
        duration: 100,
        easing: Easing.in(Easing.quad),
      });
      replyMessageOpacity.value = withTiming(0, {
        duration: 60,
        easing: Easing.in(Easing.quad),
      });
    }
  }, [communityState.replyMessage, communityState.showReplyMessage]);

  useEffect(() => {
    if (communityState.messages.length > 0) {
      setTimeout(() => {
        scrollBehavior.flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [communityState.messages.length]);

  const handleMenuOptionSelect = (option: string) => {
    switch (option) {
      case "Info":
        communityState.handleCommunityInfo();
        break;
      case "Invite Members":
        setShowInviteModal(true);
        break;
      case "Leave Community":
        setShowLeaveAlert(true);
        break;
      default:
        console.log("Unknown menu option:", option);
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveAlert(false);
  };

  const handleSwipeToReply = (message: any) => {
    communityState.setReplyMessage(message);
    communityState.setShowReplyMessage(true);
  };

  const handleCloseReply = () => {
    communityState.setReplyMessage(null);
    communityState.setShowReplyMessage(false);
  };

  return (
    <VoiceMessageProvider>
      <View style={styles.fullScreenContainer}>
        <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <GrainyBackground />
        <SafeAreaView
          style={[styles.container, { backgroundColor: 'transparent' }]}
          // edges={["left", "right", "bottom"]}
        >
        <CommunityHeader
          communityData={{
            name: communityState.communityData?.name || name as string,
            avatar: communityState.communityData?.avatar,
            memberCount: communityState.communityData?.memberCount,
          }}
          isUserMember={communityState.isUserMember}
          isLoading={communityState.isOverallLoading}
          onBack={communityState.handleBack}
          onCommunityInfo={communityState.handleCommunityInfo}
          onMenuSelect={handleMenuOptionSelect}
        />

        {(communityState.isUploadingPhoto || communityState.isUploadingVideo || communityState.isUploadingAudio) && (
          <Spinner visible={communityState.isUploadingPhoto || communityState.isUploadingVideo || communityState.isUploadingAudio} />
        )}

        <CommunityMessageList
          messages={messagesWithDateSeparators || []}
          loadingMessages={communityState.loadingMessages}
          messagesError={communityState.messagesError}
          onRetryConnection={communityState.retryConnection}
          renderListHeader={renderListHeader}
          renderEmptyState={renderEmptyState}
          renderItem={renderItem}
          flatListRef={scrollBehavior.flatListRef}
          onScroll={scrollBehavior.handleScroll}
          onSwipeToReply={handleSwipeToReply}
          onLongPress={messageUIState.handleLongPress}
          longPressedMessageId={messageUIState.longPressedMessageId}
          showScrollToBottomButton={scrollBehavior.showScrollToBottomButton}
          onScrollToBottom={scrollBehavior.scrollToBottom}
        />

        {communityState.typingUsers.length > 0 && (
          <View
            style={[
              styles.typingIndicator,
              { backgroundColor: Colors[theme].cardBackground },
            ]}
          >
            <Typography
              style={[styles.typingText, { color: Colors[theme].textLight }]}
            >
              {communityState.typingUsers.length === 1
                ? `${communityState.typingUsers[0].username} is typing...`
                : communityState.typingUsers.length === 2
                  ? `${communityState.typingUsers[0].username} and ${communityState.typingUsers[1].username} are typing...`
                  : `${communityState.typingUsers[0].username} and ${communityState.typingUsers.length - 1
                  } others are typing...`}
            </Typography>
          </View>
        )}

        <CommunityMessageInput
          chatMessage={communityState.chatMessage}
          setChatMessage={communityState.setChatMessage}
          onSendChat={() => {
            if (communityState.chatMessage.trim()) {
              communityState.sendMessage(communityState.chatMessage);
              communityState.setChatMessage('');
            }
          }}
          onSendVoiceNote={communityState.sendVoiceMessage}
          onTypingStart={communityState.startTyping}
          onTypingStop={communityState.stopTyping}
          isUserMember={communityState.isUserMember}
          isPublicCommunity={communityState.communityData.isPublic}
          onJoinCommunity={communityState.handleInviteMembers}
          isJoining={communityState.isJoining}
          hasPendingRequest={communityState.actualPendingState}
          replyMessage={communityState.replyMessage}
          showReplyMessage={communityState.showReplyMessage}
          replyMessageAnimatedStyle={replyMessageAnimatedStyle}
          onCloseReply={handleCloseReply}
          togglePicker={communityState.togglePicker}
          isPickerOpen={communityState.isPickerOpen}
          uploadedImages={communityState.uploadedImageUrls}
          onRemoveImage={communityState.handleRemoveImage}
          communityId={communityState.communityData._id}
          onRemoveVideo={communityState.handleRemoveVideo}
          uploadedVideo={communityState.uploadedVideoUrls}
          videoDetails={communityState.videoDetails}
          chatFunctions={{
            setUploadedImageUrls: communityState.setUploadedImageUrls,
            setUploadedVideoUrls: communityState.setUploadedVideoUrls,
            setChatMessage: communityState.setChatMessage,
            handleSendChat: () => {
              if (communityState.chatMessage.trim()) {
                communityState.sendMessage(communityState.chatMessage);
                communityState.setChatMessage('');
              }
            },
            sendMediaMessage: (caption: string, mediaAssets: any[], replyMessage?: any) => {
              // Create upload hooks state to pass to sendMediaMessage
              const uploadingHooks = {
                photoUpload: {
                  isUploading: photoUpload.isUploading,
                  uploadProgress: photoUpload.uploadProgress,
                  uploadError: photoUpload.isUploadError,
                },
                videoUpload: {
                  isUploading: videoUpload.isUploading,
                  uploadProgress: videoUpload.uploadProgress,
                  uploadError: videoUpload.isUploadError,
                },
              };

              // Call the new sendMediaMessage with upload progress tracking
              const messageId = communityState.sendMediaMessage?.(caption, mediaAssets, replyMessage);

              // Track upload progress updates
              if (messageId) {
                // Monitor photo upload progress
                if (photoUpload.isUploading) {
                  const updateProgress = () => {
                    communityState.updateMessageUploadProgress?.(
                      messageId,
                      photoUpload.uploadProgress,
                      photoUpload.isUploadError
                    );

                    if (photoUpload.uploadProgress < 100 && !photoUpload.isUploadError) {
                      setTimeout(updateProgress, 100); // Update every 100ms
                    }
                  };
                  updateProgress();
                }

                // Monitor video upload progress
                if (videoUpload.isUploading) {
                  const updateProgress = () => {
                    communityState.updateMessageUploadProgress?.(
                      messageId,
                      videoUpload.uploadProgress,
                      videoUpload.isUploadError
                    );

                    if (videoUpload.uploadProgress < 100 && !videoUpload.isUploadError) {
                      setTimeout(updateProgress, 100); // Update every 100ms
                    }
                  };
                  updateProgress();
                }
              }

              return messageId;
            },
          }}
        />
      </SafeAreaView>

      {communityState.communityResponse?.data && (
        <CommunityInviteModal
          isVisible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          communityData={{
            _id: communityState.communityResponse.data._id,
            name: communityState.communityData.name,
            description: communityState.communityData.description,
            photoUrl: communityState.communityData.avatar,
            memberCount: communityState.communityData.memberCount,
          }}
        />
      )}

      <CustomAlert
        visible={showLeaveAlert}
        title="Leave Community"
        message="Are you sure you want to leave this community?"
        primaryButton={{
          text: "Leave",
          onPress: () => {
            communityState.handleLeaveCommunity();
            setShowLeaveAlert(false);
          },
          variant: "danger",
        }}
        secondaryButton={{
          text: "Stay",
          onPress: handleCancelLeave,
        }}
        onClose={handleCancelLeave}
      />

      <MessageActionModal
        visible={messageUIState.showMessageActionModal}
        onClose={messageUIState.closeModal}
        message={messageUIState.selectedMessage}
        messagePosition={messageUIState.messagePosition ?? undefined}
        onReply={() => {
          if (messageUIState.selectedMessage) {
            communityState.setReplyMessage(messageUIState.selectedMessage);
            communityState.setShowReplyMessage(true);
          }
        }}
        onDelete={handleDeleteChat}
        isOwnMessage={
          messageUIState.selectedMessage &&
          userDetails._id === extractUserId(messageUIState.selectedMessage.userId)
        }
      />

      {renderMediaViewer()}
      </View>
    </VoiceMessageProvider>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 0,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 16,
  },
  typingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default CommunityChat;