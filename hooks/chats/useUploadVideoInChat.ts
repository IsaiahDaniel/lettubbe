import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import useVideoUploadStore from "@/store/videoUploadStore";
import { getPresignedUrl } from "@/services/aws.service";
import { getMediaDetails, uploadImage } from "@/helpers/utils/upload-utils";
import { handleError, handleErrorMessage } from "@/helpers/utils/handleError";
import { getData, storeData } from "@/helpers/utils/storage";
import useAuth from "../auth/useAuth";

const MAX_VIDEO_SIZE_MB = 20;

const useUploadVideoInChat = (togglePicker: any, parentSetUploadedVideoUrls?: (urls: string[]) => void) => {
  const {
    isChatUpload,
    isUploadingVideoInChat,
    selectedVideo,
    setIsChatUpload,
    setIsUploadingVideoInChat,
    clearSelections,
  } = useVideoUploadStore();

  const { userDetails } = useAuth();

  const [videoDetails, setVideoDetails] = useState<any>();
  const [uploadedVideoUrls, setUploadedVideoUrls] = useState<string[]>([]);

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationKey: ["uploadVideoToChat"],
    mutationFn: async () => {
      if (!selectedVideo) throw new Error("No video selected");

      const { uri, name, type, size } = getMediaDetails(selectedVideo);

      const isValidVideoType =
        type?.startsWith("video/") ||
        /\.(mp4|mov|avi|mkv|webm)$/i.test(name || uri);

      if (!isValidVideoType) {
        throw new Error("Only video files are allowed.");
      }

      const isTooLarge = size && size > MAX_VIDEO_SIZE_MB * 1024 * 1024;
      if (isTooLarge) {
        throw new Error("Video size must not exceed 20MB.");
      }

      const signedResponse = await getPresignedUrl();
      const signedUrl = signedResponse?.data;

      if (!signedUrl || typeof signedUrl !== "string") {
        throw new Error("Invalid signed URL");
      }

      const uploadedUrl = await uploadImage({ uri, name, type }, signedUrl);

      if (typeof uploadedUrl !== "string") {
        throw new Error("Video upload failed");
      }

      setVideoDetails({ uri, name, type });

      const cleaned = uploadedUrl.split("?")[0];
      return [cleaned];
    },
    onSuccess: (urls: string[]) => {
      console.log("✅ [VIDEO UPLOAD] Upload success callback:", urls);
      setUploadedVideoUrls(urls);
      
      // Call parent state setter if provided
      if (parentSetUploadedVideoUrls) {
        console.log("📤 [VIDEO UPLOAD] Calling parent state setter with URLs:", urls);
        parentSetUploadedVideoUrls(urls);
      }
      
      setIsChatUpload(false);
      setIsUploadingVideoInChat(false);
      clearSelections(); // Clear selected video after successful upload
    },
    onError: (err) => {
      console.error("Video upload error:", err);
      setUploadedVideoUrls([]);
      setIsChatUpload(false);
      setIsUploadingVideoInChat(false);
      handleError(err);
    },
  });

  useEffect(() => {
    if (isUploadingVideoInChat && selectedVideo) {
      const { uri, name, type, size } = getMediaDetails(selectedVideo);

      const isValid = (
        type?.startsWith("video/") ||
        /\.(mp4|mov|avi|mkv|webm)$/i.test(name || uri)
      );

      if (!isValid) {
        setIsUploadingVideoInChat(false);
        handleErrorMessage("Please select a valid video file.");
        return;
      }

      const isTooLarge = size && size > MAX_VIDEO_SIZE_MB * 1024 * 1024;
      if (isTooLarge) {
        setIsUploadingVideoInChat(false);
        handleErrorMessage("Video must not exceed 20MB.");
        return;
      }

      mutate();
    }
  }, [isUploadingVideoInChat, selectedVideo]);

  const removeUploadedVideoUrl = async (
    urlToRemove: string,
    conversationId: string
  ) => {
    console.log("removing video", urlToRemove, "from chat", conversationId);

    setUploadedVideoUrls((prev) =>
      prev.filter((url: string) => url !== urlToRemove)
    );

    // Save to local storage
    const removedKey = `${conversationId}/${userDetails._id}/@chat_removed_video_uploads`;
    try {
      const removed: string[] = (await getData<string[]>(removedKey)) || [];
      await storeData(removedKey, [...removed, urlToRemove]);
    } catch (e) {
      console.error("Failed to save removed video:", e);
    }
  };

  return {
    uploadedVideoUrls,
    setUploadedVideoUrls,
    isUploading: isPending,
    isUploadError: isError,
    uploadError: error,
    isUploadSuccess: isSuccess,
    isChatUpload,
    videoDetails,
    startUpload: () => {
      setIsUploadingVideoInChat(true);
    },
    removeUploadedVideoUrl,
  };
};

export default useUploadVideoInChat;