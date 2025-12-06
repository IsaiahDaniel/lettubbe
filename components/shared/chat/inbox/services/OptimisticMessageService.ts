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

export class OptimisticMessageService {
  // Simplified stale message cleanup - only removes old messages as fallback
  static removeStaleMessages(
    optimisticMessages: OptimisticMessage[],
    setOptimisticMessages: (updater: (prev: OptimisticMessage[]) => OptimisticMessage[]) => void,
    maxAgeMs: number = 60000 // 1 minute
  ): void {
    const now = Date.now();
    
    setOptimisticMessages(prev => {
      const filtered = prev.filter(msg => {
        const messageAge = now - new Date(msg.time).getTime();
        const isStale = messageAge > maxAgeMs;
        
        if (isStale) {
          console.log("🧹 [OPTIMISTIC] Removing stale message:", {
            id: msg.id,
            text: msg.text?.substring(0, 30),
            ageMs: messageAge
          });
        }
        
        return !isStale;
      });
      
      if (filtered.length !== prev.length) {
        console.log("🔍 [OPTIMISTIC] Stale cleanup results:", {
          beforeCount: prev.length,
          afterCount: filtered.length,
          removedCount: prev.length - filtered.length
        });
      }
      
      return filtered;
    });
  }


  static createOptimisticMessage(
    caption: string,
    currentUserId: string,
    mediaAssets: any[],
    retryFn: () => void,
    replyMessage?: any
  ): OptimisticMessage {
    return {
      id: `temp-${Date.now()}`,
      text: caption,
      userId: currentUserId,
      time: new Date().toISOString(),
      repliedTo: replyMessage || null,
      isUploading: true,
      images: mediaAssets
        .filter(asset => asset.mediaType === 'photo')
        .map(asset => asset.uri),
      videos: mediaAssets
        .filter(asset => asset.mediaType === 'video')
        .map(asset => asset.uri),
      audioUrl: mediaAssets
        .filter(asset => asset.mediaType === 'audio')
        .map(asset => asset.uri)[0] || '',
      documentUrls: mediaAssets
        .filter(asset => asset.mediaType === 'document')
        .map(asset => asset.uri),
      documentDetails: mediaAssets
        .filter(asset => asset.mediaType === 'document')
        .map(asset => ({
          url: asset.uri,
          name: asset.name || asset.filename || 'Document',
          size: asset.size || 0,
          type: asset.type || asset.mimeType || 'application/octet-stream'
        })),
      retryFn,
    };
  }

  static updateOptimisticMessageWithUpload(
    optimisticMessages: OptimisticMessage[],
    uploadedImageUrls: string[],
    uploadedVideoUrls: string[],
    uploadedAudioUrl: string,
    uploadedDocumentUrls: string[] = [],
    uploadedDocumentDetails: Array<{url: string; name: string; size: number; type: string}> = [],
    setOptimisticMessages: (updater: (prev: OptimisticMessage[]) => OptimisticMessage[]) => void
  ): void {
    // Find the most recent uploading message that matches the media type being uploaded
    const hasImages = uploadedImageUrls.length > 0;
    const hasVideos = uploadedVideoUrls.length > 0;
    const hasAudio = !!uploadedAudioUrl;
    const hasDocuments = uploadedDocumentUrls.length > 0;
    
    const uploadingMessages = optimisticMessages.filter(msg => msg.isUploading);
    console.log("🔍 [OPTIMISTIC] Looking for matching uploading message:", {
      uploadingCount: uploadingMessages.length,
      hasImages,
      hasVideos,
      hasAudio,
      hasDocuments,
      uploadingMessages: uploadingMessages.map(msg => ({
        id: msg.id,
        text: msg.text?.substring(0, 20),
        hasImages: (msg.images?.length || 0) > 0,
        hasVideos: (msg.videos?.length || 0) > 0,
        hasAudio: !!msg.audioUrl,
        hasDocuments: (msg.documentUrls?.length || 0) > 0,
        timestamp: msg.time
      }))
    });
    
    // Find the most recent message that matches the media type
    let targetMessage = null;
    if (hasImages) {
      targetMessage = uploadingMessages.reverse().find(msg => 
        (msg.images?.length || 0) > 0 || (!msg.images?.length && !msg.videos?.length && !msg.audioUrl && !msg.documentUrls?.length)
      );
    } else if (hasVideos) {
      targetMessage = uploadingMessages.reverse().find(msg => 
        (msg.videos?.length || 0) > 0 || (!msg.images?.length && !msg.videos?.length && !msg.audioUrl && !msg.documentUrls?.length)
      );
    } else if (hasAudio) {
      targetMessage = uploadingMessages.reverse().find(msg => 
        !!msg.audioUrl || (!msg.images?.length && !msg.videos?.length && !msg.audioUrl && !msg.documentUrls?.length)
      );
    } else if (hasDocuments) {
      targetMessage = uploadingMessages.reverse().find(msg => 
        (msg.documentUrls?.length || 0) > 0 || (!msg.images?.length && !msg.videos?.length && !msg.audioUrl && !msg.documentUrls?.length)
      );
    }
    
    // Fallback to the most recent uploading message
    if (!targetMessage && uploadingMessages.length > 0) {
      targetMessage = uploadingMessages[uploadingMessages.length - 1];
    }
    
    if (!targetMessage) {
      console.log("⚠️ [OPTIMISTIC] No suitable uploading message found to update");
      return;
    }

    console.log("🔄 [OPTIMISTIC] Updating optimistic message with upload URLs:", {
      messageId: targetMessage.id,
      messageText: targetMessage.text?.substring(0, 30),
      imageUrls: uploadedImageUrls,
      videoUrls: uploadedVideoUrls,
      audioUrl: uploadedAudioUrl,
      documentUrls: uploadedDocumentUrls,
      documentDetails: uploadedDocumentDetails
    });

    setOptimisticMessages(prev =>
      prev.map(msg => {
        if (msg.id === targetMessage.id) {
          const updated = { 
            ...msg, 
            isUploading: false, 
            images: uploadedImageUrls, 
            videos: uploadedVideoUrls,
            audioUrl: uploadedAudioUrl,
            documentUrls: uploadedDocumentUrls,
            documentDetails: uploadedDocumentDetails
          };
          console.log("✅ [OPTIMISTIC] Updated message from uploading to ready:", {
            id: updated.id,
            text: updated.text?.substring(0, 30),
            wasUploading: msg.isUploading,
            nowUploading: updated.isUploading
          });
          return updated;
        }
        return msg;
      })
    );
  }
}