export class MessageExtractorService {
  static extractStreamData(message: any) {
    try {
      // First check if the message has streamData property directly
      if (message.streamData) {
        return message.streamData;
      }

      // Then check if the text contains a stream deep link
      const text = message.text;
      if (!text || typeof text !== 'string') return null;

      const streamLinkPattern = /^lettubbe:\/\/streaming\/([^?]+)$/;
      const streamMatch = text.match(streamLinkPattern);

      if (streamMatch) {
        const streamId = streamMatch[1]?.toString() || '';
        if (!streamId) return null;

        return { streamId };
      }

      return null;
    } catch (error) {
      console.error('Error extracting stream data:', error);
      return null;
    }
  }
  static extractPhotoData(text: string) {
    try {
      if (!text || typeof text !== 'string') return null;

      const photoLinkPattern = /^lettubbe:\/\/photo\/([^?]+)$/;
      const photoMatch = text.match(photoLinkPattern);

      if (photoMatch) {
        const photoId = photoMatch[1]?.toString() || '';
        if (!photoId) return null;

        return { _id: photoId };
      }

      return null;
    } catch (error) {
      console.error('Error extracting photo data:', error);
      return null;
    }
  }

  static extractVideoData(text: string) {
    try {
      if (!text || typeof text !== 'string') return null;

      // Check for full video link with embedded data
      const fullVideoLinkPattern = /^lettubbe:\/\/video\/([^?]+)\?data=(.+)$/;
      const fullMatch = text.match(fullVideoLinkPattern);

      if (fullMatch) {
        const videoId = fullMatch[1]?.toString() || '';
        const encodedData = fullMatch[2]?.toString() || '';

        if (!videoId || !encodedData) return null;

        const videoData = JSON.parse(decodeURIComponent(encodedData));
        return videoData || {};
      }

      // Check for simple video link (just ID)
      const simpleVideoLinkPattern = /^lettubbe:\/\/video\/([^?]+)$/;
      const simpleMatch = text.match(simpleVideoLinkPattern);

      if (simpleMatch) {
        const videoId = simpleMatch[1]?.toString() || '';
        if (!videoId) return null;

        return { _id: videoId };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  static extractAudioData(text: string) {
    try {
      if (!text || typeof text !== 'string') return null;

      const audioLinkPattern = /^lettubbe:\/\/audio\/([^?]+)(?:\?data=(.+))?$/;
      const audioMatch = text.match(audioLinkPattern);

      if (audioMatch) {
        const audioId = audioMatch[1]?.toString() || '';
        const encodedData = audioMatch[2];

        if (!audioId) return null;

        if (encodedData) {
          const audioData = JSON.parse(decodeURIComponent(encodedData));
          return audioData || {};
        }

        return { _id: audioId };
      }

      return null;
    } catch (error) {
      console.error('Error extracting audio data:', error);
      return null;
    }
  }

  static extractCommunityInviteData(text: string) {
    try {
      if (!text || typeof text !== 'string') return null;

      // Pattern for deep links with encoded data: lettubbe://community/123?invite=true&data=encodedData
      const deepLinkPattern = /^lettubbe:\/\/community\/([^?]+)\?invite=true&data=(.+)$/;
      const deepLinkMatch = text.match(deepLinkPattern);

      if (deepLinkMatch) {
        const communityId = deepLinkMatch[1]?.toString() || '';
        const encodedData = deepLinkMatch[2]?.toString() || '';

        if (!communityId || !encodedData) return null;

        const inviteData = JSON.parse(decodeURIComponent(encodedData));
        return inviteData || {};
      }

      // Pattern for HTTPS URLs: https://lettubbe.com/community/123?invite=true
      const httpsPattern = /^https:\/\/lettubbe\.com\/community\/([^?]+)\?invite=true(?:&.*)?$/;
      const httpsMatch = text.match(httpsPattern);

      if (httpsMatch) {
        const communityId = httpsMatch[1]?.toString() || '';
        
        if (!communityId) return null;

        // For HTTPS URLs, return minimal structure with the community ID
        // The CommunityInviteCard component will fetch additional data
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
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}