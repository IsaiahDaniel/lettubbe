import { useState, useEffect, useRef, useCallback } from "react";
import { OptimisticMessageService } from "../services/OptimisticMessageService";

interface OptimisticMessage {
  id: string;
  text: string;
  userId: string;
  time: string;
  images?: string[];
  videos?: string[];
  audioUrl?: string;
  videoUrl?: string;
  documentUrls?: string[];
  documentDetails?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  repliedTo?: any;
  isUploading: boolean;
  isSent?: boolean;
  uploadProgress?: number;
  uploadError?: boolean;
  retryFn: () => void; // Always available - not optional
}

export const useOptimisticMessages = (
  messages: any[],
  uploadedImageUrls: string[],
  uploadedVideoUrls: string[],
  uploadedAudioUrl: string,
  uploadedDocumentUrls: string[],
  uploadedDocumentDetails: Array<{url: string; name: string; size: number; type: string}>,
  handleSendChat: (caption: string, skipOptimisticMessage?: boolean, replyMessage?: any, onSent?: () => void, onError?: (error: any) => void) => void,
  currentUserId: string
) => {
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const hasSentMessageRef = useRef(false);

  // Clear all optimistic messages when real messages arrive - since server doesn't echo back
  useEffect(() => {
    console.log("🔄 [OPTIMISTIC] Remove effect triggered:", {
      messagesCount: messages?.length || 0,
      optimisticCount: optimisticMessages.length,
      hasMessages: messages?.length > 0,
      hasOptimistic: optimisticMessages.length > 0
    });
    
    // Clear all optimistic messages since server doesn't echo back own messages
    if (optimisticMessages.length > 0 && messages?.length > 0) {
      console.log("🧹 [OPTIMISTIC] Clearing all optimistic messages - server doesn't echo back");
      setOptimisticMessages([]);
    }
  }, [messages?.length]); // Only depend on message count to avoid infinite loop


  // Auto-send message when media upload completes
  useEffect(() => {
    console.log("🔄 [OPTIMISTIC] Upload effect triggered:", {
      imageUrls: uploadedImageUrls.length,
      videoUrls: uploadedVideoUrls.length,
      audioUrl: !!uploadedAudioUrl,
      documentUrls: uploadedDocumentUrls.length,
      documentDetails: uploadedDocumentDetails.length,
      hasSent: hasSentMessageRef.current,
      optimisticCount: optimisticMessages.length,
      optimisticMessages: optimisticMessages.map(msg => ({
        id: msg.id,
        text: msg.text?.substring(0, 20),
        isUploading: msg.isUploading
      }))
    });
    
    console.log("📄 [OPTIMISTIC] Document details received:", uploadedDocumentDetails);

    // Only proceed if we have media URLs and haven't sent the message yet
    const hasMediaUrls = uploadedImageUrls.length > 0 || uploadedVideoUrls.length > 0 || !!uploadedAudioUrl || uploadedDocumentUrls.length > 0;
    const hasOptimisticMessage = optimisticMessages.length > 0;
    
    // For documents, ensure we have both URLs and details before proceeding
    const hasDocuments = uploadedDocumentUrls.length > 0;
    const documentsReady = !hasDocuments || (hasDocuments && uploadedDocumentDetails.length > 0 && uploadedDocumentUrls.length === uploadedDocumentDetails.length);
    
    console.log("🔄 [OPTIMISTIC] Media readiness check:", {
      hasMediaUrls,
      hasOptimisticMessage,
      hasDocuments,
      documentsReady,
      hasSent: hasSentMessageRef.current,
      documentUrlsCount: uploadedDocumentUrls.length,
      documentDetailsCount: uploadedDocumentDetails.length
    });
    
    if (hasMediaUrls && hasOptimisticMessage && !hasSentMessageRef.current && documentsReady) {
      console.log("✅ [OPTIMISTIC] Upload detected, updating optimistic message");
      console.log("🎵 [OPTIMISTIC] Audio URL to process:", uploadedAudioUrl);
      console.log("📊 [OPTIMISTIC] Current optimistic messages:", optimisticMessages.map(msg => ({
        id: msg.id,
        isUploading: msg.isUploading,
        hasImages: (msg.images?.length || 0) > 0,
        hasVideos: (msg.videos?.length || 0) > 0,
        hasAudio: !!msg.audioUrl
      })));
      
      // Update optimistic message with uploaded URLs
      OptimisticMessageService.updateOptimisticMessageWithUpload(
        optimisticMessages,
        uploadedImageUrls,
        uploadedVideoUrls,
        uploadedAudioUrl,
        uploadedDocumentUrls,
        uploadedDocumentDetails,
        setOptimisticMessages
      );

      // Mark as sent to prevent duplicate sends
      hasSentMessageRef.current = true;

      // Send the actual message
      setTimeout(() => {
        // Find the optimistic message that was just updated (no longer uploading and has the uploaded media)
        const hasImages = uploadedImageUrls.length > 0;
        const hasVideos = uploadedVideoUrls.length > 0;
        const hasAudio = !!uploadedAudioUrl;
        const hasDocuments = uploadedDocumentUrls.length > 0;
        
        // First, try to find the message that has matching media (regardless of upload status)
        const messagesWithMatchingMedia = optimisticMessages.filter(msg => (
          (hasImages && (msg.images?.length || 0) > 0) ||
          (hasVideos && (msg.videos?.length || 0) > 0) ||
          (hasAudio && !!msg.audioUrl) ||
          (hasDocuments && (msg.documentUrls?.length || 0) > 0)
        ));
        
        // Get the most recent message with matching media (based on creation time)
        let targetMessage = messagesWithMatchingMedia.sort((a, b) => 
          new Date(b.time).getTime() - new Date(a.time).getTime()
        )[0];
        
        // If no message with media found, get the most recent non-uploading message
        if (!targetMessage) {
          const nonUploadingMessages = optimisticMessages.filter(msg => !msg.isUploading);
          targetMessage = nonUploadingMessages.sort((a, b) => 
            new Date(b.time).getTime() - new Date(a.time).getTime()
          )[0];
        }
        
        const caption = targetMessage?.text || "";
        
        // Debug logging for message selection
        console.log("🎯 [OPTIMISTIC] Message selection debug:", {
          totalMessages: optimisticMessages.length,
          messagesWithMedia: messagesWithMatchingMedia.length,
          uploadedMediaTypes: { hasImages, hasVideos, hasAudio, hasDocuments },
          selectedMessageId: targetMessage?.id,
          allMessages: optimisticMessages.map(m => ({
            id: m.id,
            text: m.text?.substring(0, 20),
            isUploading: m.isUploading,
            hasImages: (m.images?.length || 0) > 0,
            hasVideos: (m.videos?.length || 0) > 0,
            time: m.time
          }))
        });
        
        console.log("📤 [OPTIMISTIC] Sending chat message with caption:", caption);
        console.log("📤 [OPTIMISTIC] Selected optimistic message:", {
          id: targetMessage?.id,
          text: caption?.substring(0, 30),
          isUploading: targetMessage?.isUploading,
          hasImages: (targetMessage?.images?.length || 0) > 0,
          hasVideos: (targetMessage?.videos?.length || 0) > 0,
          hasAudio: !!targetMessage?.audioUrl,
          hasDocuments: (targetMessage?.documentUrls?.length || 0) > 0
        });
        console.log("📤 [OPTIMISTIC] Final URLs being sent:", { 
          images: uploadedImageUrls, 
          videos: uploadedVideoUrls, 
          audioUrl: uploadedAudioUrl,
          documents: uploadedDocumentUrls
        });
        // Create callback to keep message in sending state until refetch completes
        const markAsSentCallback = () => {
          if (targetMessage) {
            console.log("✅ [OPTIMISTIC] Message sent to server, keeping in sending state until refetch:", {
              id: targetMessage.id,
              text: targetMessage.text?.substring(0, 30)
            });
            // Keep message in uploading state until real server message arrives
            // The cleanup effect will handle the final replacement
          }
        };
        
        // Create error callback to mark message as failed
        const markAsErrorCallback = (error: any) => {
          if (targetMessage) {
            console.log("❌ [OPTIMISTIC] Marking message as failed:", {
              id: targetMessage.id,
              error: error.message
            });
            setOptimisticMessages(prev => prev.map(msg => 
              msg.id === targetMessage.id 
                ? { ...msg, uploadError: true, isUploading: false, isSent: false }
                : msg
            ));
          }
        };
        
        handleSendChat(caption, true, targetMessage?.repliedTo, markAsSentCallback, markAsErrorCallback);
      }, 100);
    }
  }, [uploadedImageUrls, uploadedVideoUrls, uploadedAudioUrl, uploadedDocumentUrls, uploadedDocumentDetails, handleSendChat]);

  const sendMediaMessage = useCallback(async (
    caption: string, 
    mediaAssets: any[],
    replyMessage?: any
  ) => {
    console.log("🚀 [OPTIMISTIC] sendMediaMessage called:", {
      caption,
      mediaAssetsCount: mediaAssets.length,
      hasText: !!caption.trim(),
      hasMedia: mediaAssets.length > 0,
      hasReply: !!replyMessage,
      currentOptimisticCount: optimisticMessages.length
    });

    if (mediaAssets.length === 0 && !caption.trim()) {
      console.log("❌ [OPTIMISTIC] Early return - no content");
      return;
    }

    console.log("✅ [OPTIMISTIC] Passed content check, proceeding to message creation...");

    // Generate message ID first
    console.log("🆔 [OPTIMISTIC] Generating message ID...");
    const messageId = `temp-${Date.now()}`;
    console.log("✅ [OPTIMISTIC] Message ID generated:", messageId);
    
    // Create retry function for this specific message - NO CIRCULAR DEPENDENCY
    console.log("🔄 [OPTIMISTIC] Creating retry function...");
    const retryFn = () => {
      console.log("🔄 [RETRY] Retrying message:", { id: messageId, caption, mediaAssetsCount: mediaAssets.length });
      // Reset any error state 
      setOptimisticMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, uploadError: false, isUploading: true, isSent: false } : msg
      ));
      // Call handleSendChat directly - no circular dependency
      handleSendChat(caption, false, replyMessage);
    };
    console.log("✅ [OPTIMISTIC] Retry function created");

    console.log("🔧 [OPTIMISTIC] About to create optimistic message...", { messageId, caption, mediaCount: mediaAssets.length });
    
    console.log("📞 [OPTIMISTIC] Calling OptimisticMessageService.createOptimisticMessage...");
    try {
      const baseMessage = OptimisticMessageService.createOptimisticMessage(
        caption,
        currentUserId,
        mediaAssets,
        retryFn,
        replyMessage
      );
      console.log("✅ [OPTIMISTIC] Base message created from service:", baseMessage);
      
      const optimisticMessage = {
        ...baseMessage,
        id: messageId // Override with our pre-generated ID
      };
      console.log("✅ [OPTIMISTIC] Final optimistic message ready:", {
        id: optimisticMessage.id,
        text: optimisticMessage.text,
        hasRetryFn: !!optimisticMessage.retryFn,
        isUploading: optimisticMessage.isUploading
      });

      console.log("📝 [OPTIMISTIC] About to add to state...");
      setOptimisticMessages(prev => {
        console.log("📝 [OPTIMISTIC] Inside setOptimisticMessages callback, prev count:", prev.length);
        const newArray = [...prev, optimisticMessage];
        console.log("📝 [OPTIMISTIC] Created new array with count:", newArray.length);
        console.log("📝 [OPTIMISTIC] New message ID in array:", optimisticMessage.id);
        return newArray;
      });
      
      console.log("✅ [OPTIMISTIC] Message added to state successfully");
      hasSentMessageRef.current = false;
      console.log("✅ [OPTIMISTIC] Reset hasSentMessageRef to false");
      
    } catch (error) {
      console.error("❌ [OPTIMISTIC] Error creating optimistic message:", error);
      return; // Exit if message creation fails
    }
    
    // For text-only messages, immediately trigger the send
    if (mediaAssets.length === 0 && caption.trim()) {
      console.log("📤 [OPTIMISTIC] Sending text-only message immediately");
      setTimeout(() => {
        console.log("📤 [OPTIMISTIC] Calling handleSendChat for text message:", caption);
        
        // Create callback to keep text message in sending state until refetch completes
        const markAsSentCallback = () => {
          console.log("✅ [OPTIMISTIC] Text message sent to server, keeping in sending state until refetch:", messageId);
          // Keep message in uploading state until real server message arrives
          // The cleanup effect will handle the final replacement
        };
        
        // Create error callback for text-only message
        const markAsErrorCallback = (error: any) => {
          console.log("❌ [OPTIMISTIC] Marking text-only message as failed:", error.message);
          setOptimisticMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, uploadError: true, isUploading: false, isSent: false }
              : msg
          ));
        };
        
        handleSendChat(caption, true, replyMessage, markAsSentCallback, markAsErrorCallback);
      }, 100);
    }
  }, [currentUserId, handleSendChat]);

  return {
    optimisticMessages,
    setOptimisticMessages,
    sendMediaMessage,
    hasSentMessageRef
  };
};