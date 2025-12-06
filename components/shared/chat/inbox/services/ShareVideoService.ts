import { getSocket } from "@/helpers/utils/socket";

export class ShareVideoService {
  static processSharedVideoData(
    shareVideoData: string,
    currentUserId: string,
    userId: string,
    token: string,
    processedRef: React.MutableRefObject<string | null>
  ): void {
    if (
      !shareVideoData ||
      typeof shareVideoData !== "string" ||
      processedRef.current === shareVideoData ||
      !currentUserId ||
      !userId ||
      !token
    ) {
      return;
    }

    try {
      const parsedData = JSON.parse(shareVideoData);
      const video = parsedData?.video || null;
      const caption = parsedData?.caption?.toString() || '';

      if (!video || !video._id) {
        console.warn("Invalid video data in shareVideoData");
        return;
      }

      const videoLink = `lettubbe://video/${video._id?.toString() || ''}?data=${encodeURIComponent(JSON.stringify(video))}`;
      const socket = getSocket(token);
      
      if (!socket) {
        console.warn("Socket not available for sharing video");
        return;
      }

      const videoMessage = {
        sender: currentUserId,
        receiver: userId,
        text: videoLink,
        userId: currentUserId,
      };

      socket.emit("chat", videoMessage);
      processedRef.current = shareVideoData;

      if (caption && caption.trim()) {
        setTimeout(() => {
          const captionMessage = {
            sender: currentUserId,
            receiver: userId,
            text: caption,
            userId: currentUserId,
          };
          socket.emit("chat", captionMessage);
        }, 300);
      }
    } catch (error) {
      console.error("Error processing shared video data:", error);
    }
  }
}