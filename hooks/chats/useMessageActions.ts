import { useState, useCallback } from "react";
import useAuth from "../auth/useAuth";
import { CommunityMessage } from "@/helpers/types/chat/message.types";

interface UseMessageActionsProps {
  communityId: string;
  sendMessage: (message: any) => void;
  emitStoppedTyping: () => void;
  addOptimisticMessage: (message: CommunityMessage) => void;
  updateMessage: (messageId: string, updates: Partial<CommunityMessage>) => void;
  uploadedImages: string[];
  setUploadedImageUrls: (urls: string[]) => void;
  setUploadedVideoUrls: (urls: string[]) => void;
  uploadedVideoUrls: string[];
  uploadedAudioUrl?: string;
  setUploadedAudioUrl?: (url: string) => void;
  uploadedDocumentUrls?: string[];
  setUploadedDocumentUrls?: (urls: string[]) => void;
  uploadedDocumentDetails?: Array<{url: string; name: string; size: number; type: string}>;
}

export const useMessageActions = ({
  communityId,
  sendMessage,
  emitStoppedTyping,
  addOptimisticMessage,
  updateMessage,
  uploadedImages,
  setUploadedImageUrls,
  setUploadedVideoUrls,
  uploadedVideoUrls,
  uploadedAudioUrl = "",
  setUploadedAudioUrl,
  uploadedDocumentUrls = [],
  setUploadedDocumentUrls,
  uploadedDocumentDetails = [],
}: UseMessageActionsProps) => {
  const { userDetails: user } = useAuth();
  const [chatMessage, setChatMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState<CommunityMessage | null>(null);
  const [showReplyMessage, setShowReplyMessage] = useState<boolean>(false);

  const handleSendChat = useCallback(() => {
    const hasText = chatMessage.trim().length > 0;
    const hasMedia = uploadedImages.length > 0 || uploadedVideoUrls.length > 0 || uploadedAudioUrl.length > 0 || uploadedDocumentUrls.length > 0;

    if (!hasText && !hasMedia) return;

    // Create optimistic message with full reply object for UI
    const optimisticMessage: CommunityMessage = {
      sender: user._id,
      groupId: communityId,
      text: chatMessage,
      userId: user._id,
      id: `temp-${Date.now()}`,
      repliedTo: replyMessage ? replyMessage : null,
      createdAt: new Date().toISOString(),
      documentDetails: [],
      documentUrl: undefined,
      documentUrls: [],
    };

    // Socket message with just reply ID
    const socketMessage = {
      sender: user._id,
      groupId: communityId,
      text: chatMessage,
      userId: user._id,
      id: optimisticMessage.id,
      repliedTo:
        replyMessage && (replyMessage._id || replyMessage.id)
          ? replyMessage._id || replyMessage.id
          : null,
      createdAt: optimisticMessage.createdAt,
      imageUrl: uploadedImages.length === 1 ? uploadedImages[0] : "",
      images: uploadedImages.length > 1 ? uploadedImages : [],
      videoUrl: uploadedVideoUrls.length > 0 ? uploadedVideoUrls[0] : "",
      audioUrl: uploadedAudioUrl || "",
      documentUrl: uploadedDocumentUrls.length > 0 ? uploadedDocumentUrls[0] : "",
      documentUrls: uploadedDocumentUrls,
      documentDetails: uploadedDocumentDetails,
    };

    console.log("📨 Sending chat message:", socketMessage);

    emitStoppedTyping();
    addOptimisticMessage(optimisticMessage);
    sendMessage(socketMessage);

    setChatMessage("");
    setReplyMessage(null);
    setShowReplyMessage(false);
    setUploadedImageUrls([]);
    setUploadedVideoUrls([]);
    if (setUploadedAudioUrl) {
      setUploadedAudioUrl("");
    }
    if (setUploadedDocumentUrls) {
      setUploadedDocumentUrls([]);
    }
  }, [
    chatMessage,
    uploadedImages,
    uploadedVideoUrls,
    uploadedAudioUrl,
    uploadedDocumentUrls,
    user._id,
    communityId,
    replyMessage,
    emitStoppedTyping,
    addOptimisticMessage,
    sendMessage,
    setUploadedImageUrls,
    setUploadedVideoUrls,
    setUploadedAudioUrl,
    setUploadedDocumentUrls,
  ]);

  const sendMediaMessage = useCallback(async (caption: string, mediaAssets: any[], replyMessage?: any) => {
    // Separate media types for optimistic message
    const photos = mediaAssets.filter(item => item.mediaType !== 'video' && item.mediaType !== 'audio' && item.mediaType !== 'document');
    const videos = mediaAssets.filter(item => item.mediaType === 'video');
    const audios = mediaAssets.filter(item => item.mediaType === 'audio');
    const documents = mediaAssets.filter(item => item.mediaType === 'document');
    
    // Create optimistic message with local media for immediate display
    const optimisticMessage: CommunityMessage = {
      sender: user._id,
      groupId: communityId,
      text: caption,
      userId: user._id,
      id: `temp-${Date.now()}`,
      repliedTo: replyMessage ? replyMessage : null,
      createdAt: new Date().toISOString(),
      localMedia: mediaAssets,
      isUploading: true,
      // Add specific URLs for optimistic display if needed
      ...(audios.length > 0 && { audioUrl: audios[0].uri }),
      ...(photos.length === 1 && { imageUrl: photos[0].uri }),
      ...(photos.length > 1 && { images: photos.map(p => p.uri) }),
      ...(videos.length > 0 && { videoUrl: videos[0].uri }),
      ...(documents.length > 0 && { 
        documentUrls: documents.map(d => d.uri),
        documentDetails: documents.map(d => ({
          url: d.uri,
          name: d.name || d.filename || 'Document',
          size: d.size || 0,
          type: d.type || d.mimeType || 'application/octet-stream'
        }))
      }),
    };


    addOptimisticMessage(optimisticMessage);
    setReplyMessage(null);
    setShowReplyMessage(false);

    try {
      const uploadedUrls: string[] = [];
      
      for (const mediaAsset of mediaAssets) {
        const { getPresignedUrl } = await import("@/services/aws.service");
        const { getImageDetails, getMediaDetails, uploadImage } = await import("@/helpers/utils/upload-utils");
        
        const signedResponse = await getPresignedUrl();
        const signedUrl = signedResponse?.data;
        
        if (!signedUrl) throw new Error("Failed to get upload URL");
        
        let uploadedUrl;
        if (mediaAsset.mediaType === 'video') {
          const videoAsset = {
            uri: mediaAsset.uri,
            fileName: mediaAsset.filename,
            width: mediaAsset.width,
            height: mediaAsset.height,
            duration: mediaAsset.duration,
          };
          const { uri, name, type } = getMediaDetails(videoAsset);
          uploadedUrl = await uploadImage({ uri, name, type }, signedUrl);
        } else if (mediaAsset.mediaType === 'audio') {
          const audioAsset = {
            uri: mediaAsset.uri,
            name: mediaAsset.filename || `audio_${Date.now()}.mp3`,
            type: 'audio/mpeg'
          };
          uploadedUrl = await uploadImage(audioAsset, signedUrl);
        } else if (mediaAsset.mediaType === 'document') {
          const documentAsset = {
            uri: mediaAsset.uri,
            name: mediaAsset.name || mediaAsset.filename || `document_${Date.now()}`,
            type: mediaAsset.type || mediaAsset.mimeType || 'application/octet-stream'
          };
          uploadedUrl = await uploadImage(documentAsset, signedUrl);
        } else {
          const photoAsset = {
            uri: mediaAsset.uri,
            fileName: mediaAsset.filename,
            width: mediaAsset.width,
            height: mediaAsset.height,
            type: "image/jpeg",
          };
          const { uri, name, type } = getImageDetails(photoAsset);
          uploadedUrl = await uploadImage({ uri, name, type }, signedUrl);
        }
        
        if (typeof uploadedUrl !== 'string') {
          throw new Error("Upload failed");
        }
        
        const cleanedUrl = uploadedUrl.split("?")[0];
        uploadedUrls.push(cleanedUrl);
      }

      const photoUrls = uploadedUrls.slice(0, photos.length);
      const videoUrls = uploadedUrls.slice(photos.length, photos.length + videos.length);
      const audioUrls = uploadedUrls.slice(photos.length + videos.length, photos.length + videos.length + audios.length);
      const documentUrls = uploadedUrls.slice(photos.length + videos.length + audios.length);

      const socketMessage = {
        sender: user._id,
        groupId: communityId,
        text: caption,
        userId: user._id,
        id: optimisticMessage.id,
        repliedTo: replyMessage ? (replyMessage._id || replyMessage.id) : null,
        createdAt: optimisticMessage.createdAt,
        imageUrl: photoUrls.length === 1 ? photoUrls[0] : "",
        images: photoUrls.length > 1 ? photoUrls : [],
        videoUrl: videoUrls.length > 0 ? videoUrls[0] : "",
        audioUrl: audioUrls.length > 0 ? audioUrls[0] : "",
        documentUrl: documentUrls.length > 0 ? documentUrls[0] : "",
        documentUrls: documentUrls,
        documentDetails: documents.map((doc, index) => ({
          url: documentUrls[index],
          name: doc.name || doc.filename || 'Document',
          size: doc.size || 0,
          type: doc.type || doc.mimeType || 'application/octet-stream'
        })),
      };

      sendMessage(socketMessage);

      updateMessage(optimisticMessage.id!, {
        imageUrl: socketMessage.imageUrl,
        images: socketMessage.images,
        videoUrl: socketMessage.videoUrl,
        audioUrl: socketMessage.audioUrl,
        documentUrls: socketMessage.documentUrls,
        documentDetails: socketMessage.documentDetails,
        isUploading: false,
        localMedia: undefined,
      });

    } catch (error) {
      console.error('Media upload failed:', error);
      
      updateMessage(optimisticMessage.id!, {
        isUploading: false,
        uploadError: true,
        text: optimisticMessage.text + " (Upload failed)",
      });
    }
  }, [user._id, communityId, addOptimisticMessage, sendMessage, updateMessage]);

  const sendVoiceMessage = useCallback(async (audioUri: string, duration: number, replyMessage?: any) => {
    console.log('🎵 [COMMUNITY_VOICE] Sending voice message:', { audioUri, duration });
    
    // Create optimistic message with local audio for immediate display
    const optimisticMessage: CommunityMessage = {
      sender: user._id,
      groupId: communityId,
      text: "", // Voice messages typically don't have text
      userId: user._id,
      id: `temp-${Date.now()}`,
      repliedTo: replyMessage ? replyMessage : null,
      createdAt: new Date().toISOString(),
      localMedia: [{
        uri: audioUri,
        mediaType: 'audio',
        duration: duration,
        mimeType: 'audio/mpeg',
        type: 'audio/mpeg',
        size: 0,
        name: `voice_message_${Date.now()}.mp3`,
      }],
      audioDuration: duration,
      isUploading: true,
      documentDetails: [],
      documentUrl: undefined,
      documentUrls: [],
    };

    addOptimisticMessage(optimisticMessage);
    setReplyMessage(null);
    setShowReplyMessage(false);

    try {
      const { getPresignedUrl } = await import("@/services/aws.service");
      const { uploadImage } = await import("@/helpers/utils/upload-utils");
      
      const signedResponse = await getPresignedUrl();
      const signedUrl = signedResponse?.data;
      
      if (!signedUrl) throw new Error("Failed to get upload URL");
      
      const audioDetails = {
        uri: audioUri,
        name: `voice_message_${Date.now()}.mp3`,
        type: 'audio/mpeg'
      };
      
      const uploadedUrl = await uploadImage(audioDetails, signedUrl);
      
      if (typeof uploadedUrl !== 'string') {
        throw new Error("Voice message upload failed");
      }
      
      const cleanedUrl = uploadedUrl.split("?")[0];
      
      const socketMessage = {
        sender: user._id,
        groupId: communityId,
        text: "", // Voice messages don't have text
        userId: user._id,
        id: optimisticMessage.id,
        repliedTo: replyMessage ? (replyMessage._id || replyMessage.id) : null,
        createdAt: optimisticMessage.createdAt,
        audioUrl: cleanedUrl,
        audioDuration: duration,
      };

      console.log('🎵 [COMMUNITY_VOICE] Sending socket message:', socketMessage);
      sendMessage(socketMessage);

      updateMessage(optimisticMessage.id!, {
        audioUrl: cleanedUrl,
        audioDuration: duration,
        isUploading: false,
        localMedia: undefined,
      });

    } catch (error) {
      console.error('🎵 [COMMUNITY_VOICE] Voice message upload failed:', error);
      
      updateMessage(optimisticMessage.id!, {
        isUploading: false,
        uploadError: true,
        text: "🎵 Voice message (Upload failed)",
      });
    }
  }, [user._id, communityId, addOptimisticMessage, sendMessage, updateMessage]);

  const sendDocumentMessage = useCallback(async (documents: Array<{uri: string; name: string; size: number; type: string}>) => {
    console.log('📄 [COMMUNITY_DOCUMENT] Sending document message:', { documents });
    
    // Create optimistic message with local documents for immediate display
    const optimisticMessage: CommunityMessage = {
      sender: user._id,
      groupId: communityId,
      text: "", // Document messages typically don't have text
      userId: user._id,
      id: `temp-${Date.now()}`,
      repliedTo: replyMessage ? replyMessage : null,
      createdAt: new Date().toISOString(),
      localMedia: documents.map(doc => ({
        uri: doc.uri,
        mediaType: 'document',
        name: doc.name,
        size: doc.size,
        type: doc.type,
        mimeType: doc.type,
      })),
      documentUrls: documents.map(doc => doc.uri),
      documentDetails: documents,
      isUploading: true,
    };

    addOptimisticMessage(optimisticMessage);
    setReplyMessage(null);
    setShowReplyMessage(false);

    try {
      const { getPresignedUrl } = await import("@/services/aws.service");
      const { uploadImage } = await import("@/helpers/utils/upload-utils");
      
      const uploadedUrls: string[] = [];
      
      for (const document of documents) {
        const signedResponse = await getPresignedUrl();
        const signedUrl = signedResponse?.data;
        
        if (!signedUrl) throw new Error("Failed to get upload URL");
        
        const documentDetails = {
          uri: document.uri,
          name: document.name,
          type: document.type
        };
        
        const uploadedUrl = await uploadImage(documentDetails, signedUrl);
        
        if (typeof uploadedUrl !== 'string') {
          throw new Error("Document upload failed");
        }
        
        const cleanedUrl = uploadedUrl.split("?")[0];
        uploadedUrls.push(cleanedUrl);
      }
      
      const socketMessage = {
        sender: user._id,
        groupId: communityId,
        text: "", // Document messages don't have text
        userId: user._id,
        id: optimisticMessage.id,
        repliedTo: replyMessage ? (replyMessage._id || replyMessage.id) : null,
        createdAt: optimisticMessage.createdAt,
        documentUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : "",
        documentUrls: uploadedUrls,
        documentDetails: documents.map((doc, index) => ({
          url: uploadedUrls[index],
          name: doc.name,
          size: doc.size,
          type: doc.type
        })),
      };

      console.log('📄 [COMMUNITY_DOCUMENT] Sending socket message:', socketMessage);
      sendMessage(socketMessage);

      updateMessage(optimisticMessage.id!, {
        documentUrls: uploadedUrls,
        documentDetails: socketMessage.documentDetails,
        isUploading: false,
        localMedia: undefined,
      });

    } catch (error) {
      console.error('📄 [COMMUNITY_DOCUMENT] Document upload failed:', error);
      
      updateMessage(optimisticMessage.id!, {
        isUploading: false,
        uploadError: true,
        text: "📄 Document (Upload failed)",
      });
    }
  }, [user._id, communityId, addOptimisticMessage, sendMessage, updateMessage]);

  return {
    chatMessage,
    setChatMessage,
    replyMessage,
    setReplyMessage,
    showReplyMessage,
    setShowReplyMessage,
    handleSendChat,
    sendMediaMessage,
    sendVoiceMessage,
    sendDocumentMessage,
  };
};