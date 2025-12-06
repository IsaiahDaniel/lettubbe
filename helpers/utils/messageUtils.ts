import { CommunityMessage, MessageUser, MessageType, MediaItem, MessageListItem, DateSeparatorItem } from '@/helpers/types/chat/message.types';

export const extractUserId = (userId: string | MessageUser | null): string => {
  if (!userId) return "";
  return typeof userId === "object" ? userId._id : userId;
};

export const extractUsername = (userId: string | MessageUser | null): string => {
  if (!userId) return "Unknown";
  return typeof userId === "object" ? userId.username || "Unknown" : "Unknown";
};

export const getUserProfilePicture = (userId: string | MessageUser | null): string | undefined => {
  if (!userId) return undefined;
  return typeof userId === "object" ? userId.profilePicture : undefined;
};

export const isOwnMessage = (message: CommunityMessage, currentUserId: string): boolean => {
  return extractUserId(message.userId) === currentUserId;
};

export const formatMessageTime = (createdAt: string): string => {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getMessageType = (message: CommunityMessage): MessageType => {
  if (message.isDeleted) return 'deleted';
  
  // Check for shared content first
  if (extractStreamDataFromMessage(message.text)) return 'stream';
  if (extractPhotoDataFromMessage(message.text)) return 'shared_photo';
  if (extractVideoDataFromMessage(message.text)) return 'shared_video';
  if (extractCommunityInviteDataFromMessage(message.text)) return 'community_invite';
  
  if (hasImages(message)) return 'image';
  if (hasVideo(message)) return 'video';
  if (hasAudio(message)) return 'audio';
  if (hasDocuments(message)) return 'document';
  
  return 'text';
};

export const hasImages = (message: CommunityMessage): boolean => {
  return !!(
    (message.imageUrl && typeof message.imageUrl === 'string' && message.imageUrl.length > 0) ||
    (message.images && Array.isArray(message.images) && message.images.length > 0) ||
    (message.localMedia && Array.isArray(message.localMedia) && 
     message.localMedia.some(media => media.mediaType !== 'video' && media.mediaType !== 'audio' && media.mediaType !== 'document'))
  );
};

export const hasVideo = (message: CommunityMessage): boolean => {
  return !!(
    message.videoUrl ||
    (message.localMedia && Array.isArray(message.localMedia) && 
     message.localMedia.some(media => media.mediaType === 'video'))
  );
};

export const hasAudio = (message: CommunityMessage): boolean => {
  return !!(
    message.audioUrl ||
    (message.localMedia && Array.isArray(message.localMedia) && 
     message.localMedia.some(media => media.mediaType === 'audio'))
  );
};

export const getImageList = (message: CommunityMessage): string[] => {
  const imageList: string[] = [];

  if (message.localMedia?.length) {
    const localImages = message.localMedia.filter(media => media.mediaType !== 'video' && media.mediaType !== 'audio');
    imageList.push(...localImages.map(media => media.uri));
  } else {
    if (message.imageUrl && typeof message.imageUrl === 'string') {
      imageList.push(message.imageUrl);
    }
    if (message.images?.length) {
      imageList.push(...message.images);
    }
  }

  return imageList;
};

export const getVideoUri = (message: CommunityMessage): string | null => {
  if (message.videoUrl) return message.videoUrl;
  
  const videoMedia = message.localMedia?.find(media => media.mediaType === 'video');
  return videoMedia?.uri || null;
};

export const getAudioUri = (message: CommunityMessage): string | null => {
  if (message.audioUrl) return message.audioUrl;
  
  const audioMedia = message.localMedia?.find(media => media.mediaType === 'audio');
  return audioMedia?.uri || null;
};

export const hasDocuments = (message: CommunityMessage): boolean => {
  return !!(
    (message.documentUrls && Array.isArray(message.documentUrls) && message.documentUrls.length > 0) ||
    (message.documentUrl && typeof message.documentUrl === 'string' && message.documentUrl.length > 0) ||
    (message.localMedia && Array.isArray(message.localMedia) && 
     message.localMedia.some(media => media.mediaType === 'document'))
  );
};

export const getDocumentUrls = (message: CommunityMessage): string[] => {
  if (message.documentUrls && Array.isArray(message.documentUrls)) {
    return message.documentUrls;
  }
  if (message.documentUrl && typeof message.documentUrl === 'string') {
    return [message.documentUrl];
  }
  if (message.localMedia && Array.isArray(message.localMedia)) {
    return message.localMedia
      .filter(media => media.mediaType === 'document')
      .map(media => media.uri);
  }
  return [];
};

export const getDocumentDetails = (message: CommunityMessage): Array<{url: string; name: string; size: number; type: string}> => {
  if (message.documentDetails && Array.isArray(message.documentDetails)) {
    return message.documentDetails;
  }
  if (message.localMedia && Array.isArray(message.localMedia)) {
    return message.localMedia
      .filter(media => media.mediaType === 'document')
      .map(media => ({
        url: media.uri,
        name: media.name || media.filename || 'Document',
        size: media.size || 0,
        type: media.type || media.mimeType || 'application/octet-stream'
      }));
  }
  // Fallback: create basic document details from URLs
  const urls = getDocumentUrls(message);
  return urls.map(url => ({
    url,
    name: 'Document',
    size: 0,
    type: 'application/octet-stream'
  }));
};

export const createMediaItems = (imageList: string[], caption?: string): MediaItem[] => {
  return imageList.map(uri => ({ uri, type: 'image' as const, caption }));
};

export const extractVideoDataFromMessage = (text: string) => {
  // First try to match full video link with embedded data
  const fullVideoLinkPattern = /^lettubbe:\/\/video\/([^?]+)\?data=(.+)$/;
  const fullMatch = text.match(fullVideoLinkPattern);

  if (fullMatch) {
    try {
      const videoId = fullMatch[1];
      const encodedData = fullMatch[2];
      const videoData = JSON.parse(decodeURIComponent(encodedData));
      return videoData;
    } catch (error) {
      console.log("Error parsing video data:", error);
      return null;
    }
  }

  // Try simple video link (just ID)
  const simpleVideoLinkPattern = /^lettubbe:\/\/video\/([^?]+)$/;
  const simpleMatch = text.match(simpleVideoLinkPattern);

  if (simpleMatch) {
    const videoId = simpleMatch[1];
    return { _id: videoId };
  }

  return null;
};

export const extractStreamDataFromMessage = (text: string) => {
  if (!text || typeof text !== 'string') return null;

  const streamLinkPattern = /^lettubbe:\/\/stream\/([^?]+)$/;
  const streamMatch = text.match(streamLinkPattern);

  if (streamMatch) {
    const streamId = streamMatch[1]?.toString() || '';
    if (!streamId) return null;
    return { streamId };
  }

  return null;
};

export const extractPhotoDataFromMessage = (text: string) => {
  // First try to match full photo link with embedded data
  const fullPhotoLinkPattern = /^lettubbe:\/\/photo\/([^?]+)\?data=(.+)$/;
  const fullMatch = text.match(fullPhotoLinkPattern);

  if (fullMatch) {
    try {
      const photoId = fullMatch[1];
      const encodedData = fullMatch[2];
      const photoData = JSON.parse(decodeURIComponent(encodedData));
      return photoData;
    } catch (error) {
      console.log("Error parsing photo data:", error);
      return null;
    }
  }

  // Try simple photo link (just ID)
  const simplePhotoLinkPattern = /^lettubbe:\/\/photo\/([^?]+)$/;
  const simpleMatch = text.match(simplePhotoLinkPattern);

  if (simpleMatch) {
    const photoId = simpleMatch[1];
    return { _id: photoId };
  }

  return null;
};

export const extractCommunityInviteDataFromMessage = (text: string) => {
  // Pattern for deep links with encoded data: lettubbe://community/123?invite=true&data=encodedData
  const deepLinkPattern = /^lettubbe:\/\/community\/([^?]+)\?invite=true&data=(.+)$/;
  const deepLinkMatch = text.match(deepLinkPattern);

  if (deepLinkMatch) {
    try {
      const communityId = deepLinkMatch[1];
      const encodedData = deepLinkMatch[2];
      const inviteData = JSON.parse(decodeURIComponent(encodedData));
      return inviteData;
    } catch (error) {
      console.log("Error parsing community invite data from deep link:", error);
      return null;
    }
  }

  // Pattern for HTTPS URLs: https://lettubbe.com/community/123?invite=true
  const httpsPattern = /^https:\/\/lettubbe\.com\/community\/([^?]+)\?invite=true(?:&.*)?$/;
  const httpsMatch = text.match(httpsPattern);

  if (httpsMatch) {
    try {
      const communityId = httpsMatch[1];
      
      // For HTTPS URLs, we need to return a minimal structure with the community ID
      // The CommunityInviteCard component will need to fetch additional data
      return {
        communityId,
        communityName: '', // Will be fetched by the component
        communityAvatar: '',
        memberCount: 0,
        description: '',
        invitedBy: {
          username: 'Someone',
          firstName: '',
          lastName: ''
        },
        isWebLink: true // Flag to indicate this came from a web URL
      };
    } catch (error) {
      console.log("Error parsing community invite data from HTTPS URL:", error);
      return null;
    }
  }

  return null;
};

export const shouldShowTimestamp = (
  currentMessage: CommunityMessage,
  messages: CommunityMessage[],
  index?: number
): boolean => {
  if (!messages?.length || index === undefined) return true;
  if (!currentMessage?.userId) return true;

  const currentSender = extractUserId(currentMessage.userId);
  if (!currentSender) return true;

  const currentTime = new Date(currentMessage.createdAt);
  const currentMinute = currentTime.getTime() - (currentTime.getTime() % 60000);

  const sameMinuteMessages = messages.filter((msg) => {
    if (!msg?.userId || !msg?.createdAt) return false;

    const msgSender = extractUserId(msg.userId);
    if (!msgSender) return false;

    const msgTime = new Date(msg.createdAt);
    const msgMinute = msgTime.getTime() - (msgTime.getTime() % 60000);

    return msgSender === currentSender && msgMinute === currentMinute;
  });

  if (sameMinuteMessages.length <= 1) return true;

  sameMinuteMessages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const latestMessage = sameMinuteMessages[sameMinuteMessages.length - 1];
  const latestMessageId = latestMessage.id || latestMessage._id;
  const currentMessageId = currentMessage.id || currentMessage._id;

  return latestMessageId === currentMessageId;
};

// Type guard functions
export const isDateSeparator = (item: MessageListItem): item is DateSeparatorItem => {
  return (item as DateSeparatorItem).type === 'dateSeparator';
};

export const isCommunityMessage = (item: MessageListItem): item is CommunityMessage => {
  return !isDateSeparator(item);
};