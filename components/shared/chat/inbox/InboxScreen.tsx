import React, { useState, useCallback, useMemo, useRef, Suspense, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

// Hooks and utilities
import { useCustomTheme } from "@/hooks/useCustomTheme";
import useAuth from "@/hooks/auth/useAuth";
import { useLazyProfileFeatures, useLazyUploadFeatures, useInboxParams } from "./hooks/useLazyFeatures";
import { useInboxProfile } from "./hooks/useInboxProfile";
import useGetPublicProfile from "@/hooks/profile/useGetPublicProfile";
import { useMessageUI } from "@/hooks/chats/useMessageUI";
import useDeleteInboxMessage from "@/hooks/chats/useDeleteInboxMessage";
import { useOnlineUsers } from "@/hooks/chats/useOnlineUsers";
import * as Clipboard from 'expo-clipboard';

// Components
import ChatMediaViewer from "@/components/shared/chat/ChatMediaViewer";
import GrainyBackground from "@/components/shared/chat/GrainyBackground";
import { InboxHeader } from "./components/InboxHeader";
import MessageView from "./components/MessageView";
import ProfileSection from "./components/ProfileSection";
import ChatInput from "@/components/ui/inputs/ChatInput";
import ChatSkeletonLoader from "@/components/shared/chat/ChatMessageSkeleton";
import MessageActionModal from "@/components/shared/chat/MessageActionModal";
import { VoiceMessageProvider } from "@/contexts/VoiceMessageContext";

// Services
import { ShareVideoService } from "./services/ShareVideoService";

// Constants
import { Colors } from "@/constants/Colors";

// Lazy components
const ChatInputContainer = React.lazy(() => import('./components/ChatInputContainer'));

const InboxScreen = () => {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { theme } = useCustomTheme();
  const { userDetails, token } = useAuth();

  // Optimized parameter extraction
  const params = useInboxParams(searchParams);
  const { chatId, username, displayName, userId, subscriberCount, avatar, shareVideoData } = params;

  // State for media viewer
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [mediaViewerItems, setMediaViewerItems] = useState<Array<{ uri: string, type: 'image' | 'video', caption?: string }>>([]);
  const [mediaViewerInitialIndex, setMediaViewerInitialIndex] = useState(0);

  // Upload state
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadedVideoUrls, setUploadedVideoUrls] = useState<string[]>([]);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string>("");
  const [uploadedDocumentUrls, setUploadedDocumentUrls] = useState<string[]>([]);
  const [uploadedDocumentDetails, setUploadedDocumentDetails] = useState<Array<{url: string; name: string; size: number; type: string}>>([]);

  // Message UI state for long-press actions
  const messageUIState = useMessageUI();

  // Store the updateMessages function from MessageView
  const updateMessagesRef = useRef<((updater: (prevMessages: any[]) => any[]) => void) | null>(null);

  // Copy message functionality
  const handleCopyMessage = useCallback(async (message: any) => {
    try {
      const textToCopy = message?.text || '';
      if (textToCopy) {
        await Clipboard.setStringAsync(textToCopy);
        console.log("✅ Message copied to clipboard");
      }
    } catch (error) {
      console.error("❌ Error copying message:", error);
    }
  }, []);

  // Delete message functionality
  const { handleDeleteChat: deleteMessage } = useDeleteInboxMessage(
    null, // No longer needed since we pass messageId directly
    chatId,
    updateMessagesRef.current
  );

  const handleDeleteChat = () => {
    console.log("🗑️ [InboxScreen] handleDeleteChat called");
    const messageId = messageUIState.selectedMessage?._id || messageUIState.selectedMessage?.id;
    console.log("🗑️ [InboxScreen] extracted messageId:", messageId);
    if (messageId) {
      deleteMessage(messageId);
    } else {
      console.warn("🗑️ [InboxScreen] No messageId found, aborting");
    }
  };

  // Debug upload state changes
  React.useEffect(() => {
    console.log("📊 [INBOX_STATE] Upload state changed:", {
      imageUrls: uploadedImageUrls.length,
      videoUrls: uploadedVideoUrls.length,
      audioUrl: !!uploadedAudioUrl,
      documentUrls: uploadedDocumentUrls.length,
      hasAnyMedia: uploadedImageUrls.length > 0 || uploadedVideoUrls.length > 0 || !!uploadedAudioUrl || uploadedDocumentUrls.length > 0
    });
  }, [uploadedImageUrls, uploadedVideoUrls, uploadedAudioUrl, uploadedDocumentUrls]);

  // Refs
  const processedShareVideoData = useRef<string | null>(null);

  // Lazy loading hooks
  const isProfileEnabled = useLazyProfileFeatures(true, 800); // Enable profile after 800ms
  const { isUploadEnabled, enableUploads } = useLazyUploadFeatures();
  
  // State for tracking if user has attempted to use upload features
  const [hasAttemptedUpload, setHasAttemptedUpload] = useState(false);

  // Graceful preloading of upload features after chat loads
  useEffect(() => {
    // Preload upload features after a delay to avoid initial render blocking
    // prevents the heavy initialization from happening on first voice note
    const preloadTimer = setTimeout(() => {
      if (!hasAttemptedUpload && !isUploadEnabled) {
        console.log("🔄 [INBOX] Preloading upload features gracefully...");
        enableUploads();
        setHasAttemptedUpload(true);
      }
    }, 2000); // Wait 2 seconds after chat loads

    return () => clearTimeout(preloadTimer);
  }, [enableUploads, hasAttemptedUpload, isUploadEnabled]);
  
  // Chat input state
  const [chatMessage, setChatMessage] = useState("");

  // Profile data (for header only - main profile is lazy loaded)
  const { data: preloadedProfileData, profilePic: preloadedProfilePic } =
    useGetPublicProfile(userId || '', { enabled: true }); // Keep enabled for header

  const profile = useInboxProfile({
    preloadedProfileData,
    preloadedProfilePic,
    username,
    displayName,
    avatar,
    subscriberCount
  });

  // Current user ID
  const currentUserId = useMemo(() => {
    if (userDetails?._id) return userDetails._id.toString();
    
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload?.id?.toString() || null;
    } catch (error) {
      return null;
    }
  }, [userDetails?._id, token]);


  // Get real-time online status
  const { getUserOnlineStatus } = useOnlineUsers();
  const userOnlineStatus = getUserOnlineStatus(userId as string); 

  // Other user object
  const otherUser = useMemo(() => {
    if (!userId || !profile) return null;

    const preloadedData = preloadedProfileData || {};
    const displayNameParts = (profile.displayName || '').toString().split(' ');

    return {
      _id: userId?.toString() || '',
      username: profile.username?.toString() || '',
      firstName: preloadedData?.firstName?.toString() || displayNameParts[0] || profile.username?.toString() || '',
      lastName: preloadedData?.lastName?.toString() || displayNameParts.slice(1).join(' ') || '',
      profilePicture: profile.avatar?.toString() || '',
    };
  }, [userId, profile, preloadedProfileData]);

  // Handle shared video data (deferred)
  React.useEffect(() => {
    if (shareVideoData) {
      ShareVideoService.processSharedVideoData(
        shareVideoData,
        currentUserId || '',
        userId,
        token || '',
        processedShareVideoData
      );
    }
  }, [shareVideoData, currentUserId, token, userId]);

  // Navigation handlers
  const viewProfile = useCallback(() => {
    if (!userId || !router || !profile) {
      console.warn("Cannot navigate to profile: missing required data");
      return;
    }

    try {
      const profileParams = new URLSearchParams({
        userId: userId?.toString() || '',
        username: profile.username?.toString() || '',
        displayName: profile.displayName?.toString() || '',
        subscriberCount: profile.subscribers?.toString() || '',
        avatar: profile.avatar?.toString() || '',
      });

      router.push(`/(chat)/${userId}/Profile?${profileParams.toString()}` as any);
    } catch (error) {
      console.error("Error navigating to profile:", error);
    }
  }, [userId, profile, router]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  // Store the sendMediaMessage function from MessageView
  const [sendMediaMessageFn, setSendMediaMessageFn] = useState<((caption: string, mediaAssets: any[], replyMessage?: any) => void) | null>(null);
  
  // Store the actual send function from MessageView
  const [actualSendFn, setActualSendFn] = useState<((message: string, replyMessage?: any) => void) | null>(null);

  // Store typing state from MessageView
  const [otherUserTyping, setOtherUserTyping] = useState<boolean>(false);
  const [handleTypingStart, setHandleTypingStart] = useState<(() => void) | null>(null);
  const [handleTypingStop, setHandleTypingStop] = useState<(() => void) | null>(null);

  // Reply state
  const [replyMessage, setReplyMessage] = useState<any | null>(null);

  // Store the ChatInputContainer media handler for voice notes
  const [chatInputMediaHandler, setChatInputMediaHandler] = useState<((caption: string, mediaAssets: any[], replyMessage?: any) => void) | null>(null);
  const chatInputMediaHandlerRef = useRef<((caption: string, mediaAssets: any[], replyMessage?: any) => void) | null>(null);

  // Handle picker toggle - now mostly a fallback since features are preloaded
  const handlePickerToggle = useCallback(() => {
    console.log("🔄 [INBOX] handlePickerToggle called!", {
      hasAttemptedUpload,
      isUploadEnabled,
      needsFallbackEnable: !hasAttemptedUpload && !isUploadEnabled
    });
    
    // Fallback in case preloading didn't complete yet
    if (!hasAttemptedUpload && !isUploadEnabled) {
      console.log("⚡ [INBOX] Fallback: Enabling upload features immediately");
      setHasAttemptedUpload(true);
      enableUploads();
    } else {
      console.log("✅ [INBOX] Upload features already preloaded and ready");
    }
  }, [hasAttemptedUpload, enableUploads, isUploadEnabled]);

  // Handle typing state changes from MessageView - use refs to avoid dependency issues
  const typingStateRef = useRef({
    setOtherUserTyping,
    setHandleTypingStart,
    setHandleTypingStop,
  });
  typingStateRef.current = {
    setOtherUserTyping,
    setHandleTypingStart,
    setHandleTypingStop,
  };

  const handleTypingStateChange = useCallback((
    otherTyping: boolean, 
    startTypingFn: () => void, 
    stopTypingFn: () => void
  ) => {
    console.log("⌨️ [INBOX_REFACTORED] Received typing state change:", {
      otherTyping,
      hasStartTypingFn: !!startTypingFn,
      hasStopTypingFn: !!stopTypingFn,
      currentOtherUserTyping: otherUserTyping
    });
    typingStateRef.current.setOtherUserTyping(otherTyping);
    typingStateRef.current.setHandleTypingStart(() => startTypingFn);
    typingStateRef.current.setHandleTypingStop(() => stopTypingFn);
  }, []); // Empty dependency array since we use refs

  // Handle reply change
  const handleReplyChange = useCallback((reply: any) => {
    console.log("💬 [INBOX_REFACTORED] Reply selected:", {
      messageId: reply?.id,
      text: reply?.text?.substring(0, 50),
      senderName: reply?.senderName
    });
    setReplyMessage(reply);
  }, []);

  // Clear reply
  const clearReply = useCallback(() => {
    console.log("💬 [INBOX_REFACTORED] Clearing reply");
    setReplyMessage(null);
  }, []);

  // Voice note handler - optimized for preloaded upload features
  const handleSendVoiceNote = useCallback(async (audioUri: string, duration: number, retryCount: number = 0) => {
    console.log("🎵 [INBOX] handleSendVoiceNote called:", {
      audioUri: audioUri?.substring(0, 50) + '...',
      duration,
      retryCount,
      isUploadEnabled,
      hasPreloadedFeatures: hasAttemptedUpload,
      hasChatInputMediaHandler: !!chatInputMediaHandler,
      hasSendMediaMessageFn: !!sendMediaMessageFn
    });
    
    if (!audioUri) {
      console.warn("🎵 [INBOX] Missing audioUri");
      return;
    }

    // Prevent infinite retries
    if (retryCount > 5) {
      console.error("🎵 [INBOX] Too many retries, falling back to optimistic system");
      if (sendMediaMessageFn) {
        const audioFile = {
          uri: audioUri,
          filename: `voice_note_${Date.now()}.m4a`,
          mediaType: 'audio',
          duration: duration,
        };
        sendMediaMessageFn("", [audioFile], replyMessage);
        if (replyMessage) clearReply();
      }
      return;
    }
    
    // Create the audio file data
    const audioFile = {
      uri: audioUri,
      filename: `voice_note_${Date.now()}.m4a`,
      mediaType: 'audio',
      duration: duration,
    };
    
    console.log("🎵 [INBOX] Created audio file object:", audioFile);
    
    // Since upload features are preloaded, we expect handlers to be available
    const currentHandler = chatInputMediaHandlerRef.current || chatInputMediaHandler;
    if (currentHandler) {
      console.log("🎵 [INBOX] Using preloaded ChatInputContainer media handler");
      currentHandler("", [audioFile], replyMessage);
      if (replyMessage) clearReply();
    } else if (sendMediaMessageFn) {
      console.log("🎵 [INBOX] Using optimistic message system");
      sendMediaMessageFn("", [audioFile], replyMessage);
      if (replyMessage) clearReply();
    } else if (!isUploadEnabled) {
      // Fallback: if upload features somehow aren't loaded yet, wait a bit
      console.log("🎵 [INBOX] Upload features not ready, waiting...");
      setTimeout(() => handleSendVoiceNote(audioUri, duration, retryCount + 1), 200);
    } else {
      console.warn("🎵 [INBOX] No media handler available, retrying...", retryCount);
      setTimeout(() => handleSendVoiceNote(audioUri, duration, retryCount + 1), 200);
    }
  }, [chatInputMediaHandler, sendMediaMessageFn, hasAttemptedUpload, isUploadEnabled, replyMessage, clearReply]);

  // Handler to receive sendMediaMessage from MessageView
  const handleReceiveSendMediaMessage = useCallback((sendMediaMessage: (caption: string, mediaAssets: any[], replyMessage?: any) => void) => {
    setSendMediaMessageFn(() => sendMediaMessage);
  }, []);

  // Handler to receive actual send function from MessageView
  const handleReceiveSendFunction = useCallback((sendFunction: (message: string, replyMessage?: any) => void) => {
    setActualSendFn(() => sendFunction);
  }, []);

  // Handler to receive updateMessages function from MessageView
  const handleReceiveUpdateMessages = useCallback((updateMessages: (updater: (prevMessages: any[]) => any[]) => void) => {
    console.log("🔄 [INBOX] Received updateMessages function from MessageView");
    updateMessagesRef.current = updateMessages;
  }, []);

  // Handler to receive media handler from ChatInputContainer
  const handleReceiveChatInputMediaHandler = useCallback((handler: (caption: string, mediaAssets: any[], replyMessage?: any) => void) => {
    console.log("📤 [INBOX] Received ChatInputContainer media handler", {
      hasHandler: !!handler,
      previousHandler: !!chatInputMediaHandler
    });
    setChatInputMediaHandler(() => handler);
    chatInputMediaHandlerRef.current = handler;
  }, [chatInputMediaHandler]);

  // Media handlers
  const openMediaViewer = useCallback((mediaItems: Array<{ uri: string, type: 'image' | 'video', caption?: string }>, initialIndex: number = 0) => {
    setMediaViewerItems(mediaItems);
    setMediaViewerInitialIndex(initialIndex);
    setMediaViewerVisible(true);
  }, []);

  return (
    <VoiceMessageProvider>
      <View style={styles.fullScreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <GrainyBackground />
        <SafeAreaView
          style={[styles.container, { backgroundColor: 'transparent' }]}
        >
        <InboxHeader
          profile={profile}
          userOnlineStatus={userOnlineStatus}
          theme={theme}
          onGoBack={goBack}
          onViewProfile={viewProfile}
        />

        {/* Core Message View - Always visible */}
        <MessageView
        chatId={chatId}
        userId={userId}
        currentUserId={currentUserId || ''}
        profile={profile}
        userDetails={userDetails}
        otherUser={otherUser}
        theme={theme}
        onMediaPress={openMediaViewer}
        onSendMediaMessage={handleReceiveSendMediaMessage}
        onReceiveSendFunction={handleReceiveSendFunction}
        onReceiveUpdateMessages={handleReceiveUpdateMessages}
        onTypingStateChange={handleTypingStateChange}
        onReplyChange={handleReplyChange}
        onLongPress={messageUIState.handleLongPress}
        longPressedMessageId={messageUIState.longPressedMessageId}
        uploadedImageUrls={uploadedImageUrls}
        uploadedVideoUrls={uploadedVideoUrls}
        uploadedAudioUrl={uploadedAudioUrl}
        uploadedDocumentUrls={uploadedDocumentUrls}
        uploadedDocumentDetails={uploadedDocumentDetails}
        setUploadedImageUrls={setUploadedImageUrls}
        setUploadedVideoUrls={setUploadedVideoUrls}
        setUploadedAudioUrl={setUploadedAudioUrl}
        setUploadedDocumentUrls={setUploadedDocumentUrls}
        profileSection={isProfileEnabled ? (
          <ProfileSection
            userId={userId}
            username={username}
            displayName={displayName}
            avatar={avatar}
            subscriberCount={subscriberCount}
            theme={theme}
            onViewProfile={viewProfile}
            enabled={isProfileEnabled}
          />
        ) : undefined}
      />

      {/* Chat Input - Switches between simple and full-featured based on lazy loading */}
      {isUploadEnabled && hasAttemptedUpload ? (
        <ChatInputContainer
          onSend={(messageText: string) => {
            // Prepare media assets from uploaded URLs
            const mediaAssets: any[] = [];
            
            // Add images
            uploadedImageUrls.forEach(url => {
              mediaAssets.push({
                uri: url,
                mediaType: 'image',
                filename: `image_${Date.now()}.jpg`
              });
            });
            
            // Add videos  
            uploadedVideoUrls.forEach(url => {
              mediaAssets.push({
                uri: url,
                mediaType: 'video',
                filename: `video_${Date.now()}.mp4`
              });
            });
            
            // Add audio
            if (uploadedAudioUrl) {
              mediaAssets.push({
                uri: uploadedAudioUrl,
                mediaType: 'audio',
                filename: `audio_${Date.now()}.m4a`
              });
            }
            
            // Add documents
            uploadedDocumentUrls.forEach((url, index) => {
              const docDetail = uploadedDocumentDetails[index];
              mediaAssets.push({
                uri: url,
                mediaType: 'document',
                filename: docDetail?.name || `document_${Date.now()}.pdf`,
                name: docDetail?.name,
                size: docDetail?.size,
                type: docDetail?.type
              });
            });
            
            if (sendMediaMessageFn) {
              sendMediaMessageFn(messageText, mediaAssets, replyMessage);
            } else if (actualSendFn) {
              actualSendFn(messageText, replyMessage);
            }
            // Clear reply after sending
            if (replyMessage) {
              clearReply();
            }
          }}
          onSendVoiceNote={handleSendVoiceNote}
          conversationId={chatId}
          uploadedImageUrls={uploadedImageUrls}
          uploadedVideoUrls={uploadedVideoUrls}
          uploadedAudioUrl={uploadedAudioUrl}
          uploadedDocumentUrls={uploadedDocumentUrls}
          uploadedDocumentDetails={uploadedDocumentDetails}
          setUploadedImageUrls={setUploadedImageUrls}
          setUploadedVideoUrls={setUploadedVideoUrls}
          setUploadedAudioUrl={setUploadedAudioUrl}
          setUploadedDocumentUrls={setUploadedDocumentUrls}
          setUploadedDocumentDetails={setUploadedDocumentDetails}
          sendMediaMessage={sendMediaMessageFn || (() => {})}
          onMediaHandlerReady={handleReceiveChatInputMediaHandler}
          otherUserTyping={otherUserTyping}
          otherUserName={profile.displayName}
          onTypingStart={handleTypingStart || undefined}
          onTypingStop={handleTypingStop || undefined}
          replyMessage={replyMessage}
          onClearReply={clearReply}
        />
      ) : (
        <ChatInput
          onSend={(messageText: string) => {
            if (sendMediaMessageFn) {
              sendMediaMessageFn(messageText, [], replyMessage);
            } else if (actualSendFn) {
              actualSendFn(messageText, replyMessage);
            }
            setChatMessage("");
            // Clear reply after sending
            if (replyMessage) {
              clearReply();
            }
          }}
          onSendVoiceNote={handleSendVoiceNote}
          message={chatMessage}
          setMessage={setChatMessage}
          conversationId={chatId}
          uploadedImages={uploadedImageUrls}
          uploadedVideo={uploadedVideoUrls}
          onPickerToggle={handlePickerToggle}
          onTypingStart={handleTypingStart || undefined}
          onTypingStop={handleTypingStop || undefined}
          otherUserTyping={otherUserTyping}
          otherUserName={profile.displayName}
          replyMessage={replyMessage}
          onClearReply={clearReply}
        />
      )}

      {/* Media Viewer */}
      <ChatMediaViewer
        visible={mediaViewerVisible}
        mediaItems={mediaViewerItems}
        initialIndex={mediaViewerInitialIndex}
        onClose={() => setMediaViewerVisible(false)}
        senderName={profile.displayName}
      />

      {/* Simple dark overlay when message is long-pressed */}
      {messageUIState.longPressedMessageId && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 500,
          }}
          pointerEvents="none"
        />
      )}

      {/* Message Action Modal with integrated message preview */}
      <MessageActionModal
        visible={messageUIState.showMessageActionModal}
        onClose={messageUIState.closeModal}
        message={messageUIState.selectedMessage}
        messagePosition={messageUIState.messagePosition}
        isOwnMessage={messageUIState.selectedMessage?.userId === currentUserId}
        currentUserId={currentUserId || ''}
        profile={profile}
        userDetails={userDetails}
        otherUser={otherUser}
        theme={theme}
        onMediaPress={openMediaViewer}
        onReply={() => {
          const message = messageUIState.selectedMessage;
          if (message) {
            // Determine sender name based on message ownership
            const senderName = message.userId === currentUserId ? 
              userDetails?.username || userDetails?.firstName || 'You' : 
              profile?.displayName || otherUser?.firstName || otherUser?.username || 'User';
            
            const replyMessage = {
              ...message,
              senderName
            };
            
            handleReplyChange(replyMessage);
          }
        }}
        onDelete={handleDeleteChat}
      />
        </SafeAreaView>
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
  },
  simpleInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  enableButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default InboxScreen;