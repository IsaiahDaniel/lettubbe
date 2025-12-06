import React, { useState, useCallback, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Hooks for upload functionality
import useChatPicker from '@/hooks/chats/useChatPicker';
import useUploadPhotoInChat from '@/hooks/chats/useUploadPhotoInChat';
import useUploadVideoInChat from '@/hooks/chats/useUploadVideoInChat';
import useUploadAudioInChat from '@/hooks/chats/useUploadAudioInChat';
import useUploadDocumentInChat from '@/hooks/chats/useUploadDocumentInChat';
import useVideoUploadStore from '@/store/videoUploadStore';
import { useAlert } from '@/components/ui/AlertProvider';

// Components
import ChatInput from '@/components/ui/inputs/ChatInput';
import Typography from '@/components/ui/Typography/Typography';
import ReplyPreview from './ReplyPreview';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface ChatInputContainerProps {
  onSend: (message: string) => void;
  onSendVoiceNote?: (audioUri: string, duration: number) => void;
  conversationId: string;
  uploadedImageUrls: string[];
  uploadedVideoUrls: string[];
  uploadedAudioUrl: string;
  uploadedDocumentUrls: string[];
  uploadedDocumentDetails: Array<{url: string; name: string; size: number; type: string}>;
  setUploadedImageUrls: (urls: string[]) => void;
  setUploadedVideoUrls: (urls: string[]) => void;
  setUploadedAudioUrl: (url: string) => void;
  setUploadedDocumentUrls: (urls: string[]) => void;
  setUploadedDocumentDetails: (details: Array<{url: string; name: string; size: number; type: string}>) => void;
  sendMediaMessage: (caption: string, mediaAssets: any[], replyMessage?: any) => void;
  onMediaHandlerReady?: (handler: (caption: string, mediaAssets: any[], replyMessage?: any) => void) => void;
  otherUserTyping?: boolean;
  otherUserName?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  replyMessage?: any;
  onClearReply?: () => void;
}

const ChatInputContainer: React.FC<ChatInputContainerProps> = ({
  onSend,
  onSendVoiceNote,
  conversationId,
  uploadedImageUrls,
  uploadedVideoUrls,
  uploadedAudioUrl,
  uploadedDocumentUrls,
  uploadedDocumentDetails,
  setUploadedImageUrls,
  setUploadedVideoUrls,
  setUploadedAudioUrl,
  setUploadedDocumentUrls,
  setUploadedDocumentDetails,
  sendMediaMessage,
  onMediaHandlerReady,
  otherUserTyping,
  otherUserName,
  onTypingStart,
  onTypingStop,
  replyMessage,
  onClearReply,
}) => {
  const { theme } = useCustomTheme();
  const { showError } = useAlert();
  
  // State
  const [chatMessage, setChatMessage] = useState("");
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);

  // Upload hooks
  const { isPickerOpen, togglePicker } = useChatPicker("chat");
  const { 
    isUploading: isUploadingPhoto, 
    removeUploadedUrl, 
    startUpload: startPhotoUpload 
  } = useUploadPhotoInChat(togglePicker, setUploadedImageUrls);
  
  const {
    isUploading: isUploadingVideo,
    videoDetails,
    removeUploadedVideoUrl,
    startUpload: startVideoUpload
  } = useUploadVideoInChat(togglePicker, setUploadedVideoUrls);
  
  const {
    startUpload: startAudioUpload,
    isUploading: isUploadingAudio,
  } = useUploadAudioInChat(togglePicker, setUploadedAudioUrl);
  
  const {
    startUpload: startDocumentUpload,
    isUploading: isUploadingDocument,
  } = useUploadDocumentInChat(togglePicker, setUploadedDocumentUrls, setUploadedDocumentDetails);

  // Store actions
  const {
    setSelectedPhotos,
    setSelectedVideo,
    setSelectedAudios,
    setSelectedDocuments,
  } = useVideoUploadStore();

  // Create enhanced sendMediaMessage that includes store actions and upload triggers
  const handleSendMediaMessage = useCallback(async (caption: string, mediaAssets: any[], replyMessage?: any) => {
    console.log("📤 [CHAT_INPUT_CONTAINER] handleSendMediaMessage called:", {
      caption,
      mediaAssetsCount: mediaAssets.length,
      mediaTypes: mediaAssets.map(asset => asset.mediaType),
      hasCaption: !!caption.trim(),
      hasReply: !!replyMessage
    });

    // First, set the media in the store
    const photoAssets = mediaAssets.filter(asset => asset.mediaType === 'photo');
    const videoAssets = mediaAssets.filter(asset => asset.mediaType === 'video');
    const audioAssets = mediaAssets.filter(asset => asset.mediaType === 'audio');
    const documentAssets = mediaAssets.filter(asset => asset.mediaType === 'document');

    console.log("🔍 [CHAT_INPUT_CONTAINER] Asset filtering results:", {
      totalAssets: mediaAssets.length,
      photoCount: photoAssets.length,
      videoCount: videoAssets.length,
      audioCount: audioAssets.length,
      documentCount: documentAssets.length,
      allAssets: mediaAssets.map(asset => ({ mediaType: asset.mediaType, uri: asset.uri?.substring(0, 30) + '...' }))
    });

    // Set photos in store and trigger upload
    if (photoAssets.length > 0) {
      const photoData = photoAssets.map(asset => ({
        uri: asset.uri,
        fileName: asset.filename,
        width: asset.width,
        height: asset.height,
        type: asset.type,
      }));
      setSelectedPhotos(photoData);
      startPhotoUpload();
    }

    // Set video in store and trigger upload
    if (videoAssets.length > 0) {
      setSelectedVideo(videoAssets[0]);
      startVideoUpload();
    }

    // Set audios in store and trigger upload
    if (audioAssets.length > 0) {
      console.log("🎵 [CHAT_INPUT_CONTAINER] Processing audio assets:", audioAssets);
      setSelectedAudios(audioAssets);
      console.log("🎵 [CHAT_INPUT_CONTAINER] Set audio assets in store, starting upload...");
      startAudioUpload();
      console.log("🎵 [CHAT_INPUT_CONTAINER] Audio upload started");
    }

    // Set documents in store and trigger upload
    if (documentAssets.length > 0) {
      setSelectedDocuments(documentAssets);
      startDocumentUpload();
    }

    // Then call the original sendMediaMessage
    console.log("📤 [CHAT_INPUT_CONTAINER] Calling sendMediaMessage from props:", {
      hasSendMediaMessage: !!sendMediaMessage,
      caption,
      mediaAssetsCount: mediaAssets.length,
      hasReply: !!replyMessage
    });
    return sendMediaMessage(caption, mediaAssets, replyMessage);
  }, [sendMediaMessage, setSelectedPhotos, setSelectedVideo, setSelectedAudios, setSelectedDocuments, startPhotoUpload, startVideoUpload, startAudioUpload, startDocumentUpload]);

  // Provide the media handler to parent component - run only once when component mounts
  const hasProvidedHandler = useRef(false);
  React.useEffect(() => {
    if (onMediaHandlerReady && !hasProvidedHandler.current) {
      console.log("📤 [CHAT_INPUT_CONTAINER] Providing media handler to parent");
      onMediaHandlerReady(handleSendMediaMessage);
      hasProvidedHandler.current = true;
    }
  }, [onMediaHandlerReady]); // Only run once when component mounts

  // Message handling
  const handleSendMessage = useCallback((messageText: string) => {
    if (!messageText.trim() && uploadedImageUrls.length === 0 && uploadedVideoUrls.length === 0 && !uploadedAudioUrl && uploadedDocumentUrls.length === 0) {
      return;
    }
    onSend(messageText);
    setChatMessage("");
  }, [onSend, uploadedImageUrls, uploadedVideoUrls, uploadedAudioUrl, uploadedDocumentUrls]);

  // Voice message handling - passthrough to parent handler
  const handleSendVoiceNote = useCallback(async (audioUri: string, duration: number) => {
    console.log("🎵 [CHAT_INPUT_CONTAINER] handleSendVoiceNote passthrough:", {
      audioUri: audioUri?.substring(0, 50) + '...',
      duration,
      hasOnSendVoiceNote: !!onSendVoiceNote
    });
    
    if (onSendVoiceNote) {
      onSendVoiceNote(audioUri, duration);
    }
  }, [onSendVoiceNote]);

  // Media handlers
  const handleRemoveImage = useCallback((url: string, type: string) => {
    removeUploadedUrl(url, conversationId);
  }, [removeUploadedUrl, conversationId]);

  const handleRemoveVideo = useCallback((url: string, type: string) => {
    removeUploadedVideoUrl(url, conversationId);
  }, [removeUploadedVideoUrl, conversationId]);

  // Debug logging for typing indicator
  React.useEffect(() => {
    console.log("⌨️ [CHAT_INPUT_CONTAINER] Typing state updated:", {
      otherUserTyping,
      shouldShowIndicator: !!otherUserTyping
    });
  }, [otherUserTyping]);

  return (
    <View style={{ position: 'relative' }}>
      {/* Reply Preview */}
      {replyMessage && onClearReply && (
        <ReplyPreview
          replyToMessage={replyMessage}
          onClose={onClearReply}
        />
      )}
      
      {/* Message Input */}
      <ChatInput
        onSend={handleSendMessage}
        onSendVoiceNote={handleSendVoiceNote}
        message={chatMessage}
        setMessage={setChatMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        otherUserTyping={otherUserTyping}
        otherUserName={otherUserName}
        togglePicker={togglePicker}
        isPickerOpen={isPickerOpen}
        uploadedImages={uploadedImageUrls}
        onRemoveImage={handleRemoveImage}
        conversationId={conversationId}
        onRemoveVideo={handleRemoveVideo}
        uploadedVideo={uploadedVideoUrls}
        videoDetails={videoDetails}
        isUploadingAudio={isUploadingAudio}
        chatFunctions={{
          setUploadedImageUrls,
          setUploadedVideoUrls,
          setChatMessage,
          handleSendChat: () => handleSendMessage(chatMessage),
          sendMediaMessage: handleSendMediaMessage,
          closeModal: togglePicker,
        }}
      />

      {/* Scroll to Bottom Button */}
      {showScrollToBottomButton && (
        <TouchableOpacity
          style={[
            {
              position: 'absolute',
              bottom: 80,
              right: 16,
              width: 48,
              height: 48,
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              zIndex: 1000,
              backgroundColor: Colors[theme].cardBackground,
            }
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chevron-down"
            size={24}
            color={Colors[theme].text}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ChatInputContainer;