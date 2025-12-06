import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import useVideoUploadStore from "@/store/videoUploadStore";
import { getPresignedUrl } from "@/services/aws.service";
import { getMediaDetails, uploadImage } from "@/helpers/utils/upload-utils";
import { handleError, handleErrorMessage } from "@/helpers/utils/handleError";
import { getData, storeData } from "@/helpers/utils/storage";
import useAuth from "../auth/useAuth";

const MAX_VIDEO_SIZE_MB = 20;

const useUploadVideoInCommunity = (togglePicker: any) => {
  const {
    isCommunityUpload,
    isUploadingVideoInCommunity,
    selectedVideo,
    setisCommunityUpload,
    setIsUploadingVideoInCommunity,
  } = useVideoUploadStore();

  const { userDetails } = useAuth();

  const [videoDetails, setVideoDetails] = useState<any>();

  const [uploadedVideoUrls, setUploadedVideoUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // "https://lettubbe-development.s3.eu-north-1.amazonaws.com/686ed9ab7642712231dfcf97/0.7055111409978383/1752151560124"
  // ["https://lettubbe-development.s3.eu-north-1.amazonaws.com/686ed9ab7642712231dfcf97/0.7055111409978383/1752151560124"]

  // console.log("uploadedVideoUrls", uploadedVideoUrls);

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationKey: ["uploadCommunityVideo"],
    mutationFn: async () => {
      if (!selectedVideo) throw new Error("No video selected");

      // Start progress tracking
      setUploadProgress(10);

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

      setUploadProgress(30);

      const signedResponse = await getPresignedUrl();
      const signedUrl = signedResponse?.data;

      if (!signedUrl || typeof signedUrl !== "string") {
        throw new Error("Invalid signed URL");
      }

      setUploadProgress(50);

      const uploadedUrl = await uploadImage({ uri, name, type }, signedUrl);

      if (typeof uploadedUrl !== "string") {
        throw new Error("Video upload failed");
      }

      setUploadProgress(90);

      setVideoDetails({ uri, name, type });

      const cleaned = uploadedUrl.split("?")[0];

      console.log("cleaned", cleaned);

      setUploadProgress(100);
      return [cleaned];
    },
    onSuccess: (urls: string[]) => {
      setUploadedVideoUrls(urls);
      setisCommunityUpload(false);
      setIsUploadingVideoInCommunity(false);
      setUploadProgress(0); // Reset progress
    },
    onError: (err) => {
      console.error("Video upload error:", err);
      setUploadedVideoUrls([]);
      setisCommunityUpload(false);
      setIsUploadingVideoInCommunity(false);
      setUploadProgress(0); // Reset progress on error
      handleError(err);
    },
  });

  useEffect(() => {
    console.log("selectedVideo", selectedVideo);
    if (isUploadingVideoInCommunity && selectedVideo) {
      const { uri, name, type, size } = getMediaDetails(selectedVideo);

      const isValid = (
        type?.startsWith("video/") ||
        /\.(mp4|mov|avi|mkv|webm)$/i.test(name || uri)
      );

      if (!isValid) {
        setIsUploadingVideoInCommunity(false);
        togglePicker();
        handleErrorMessage("Please select a valid video file.");
        return;
      }

      const isTooLarge = size && size > MAX_VIDEO_SIZE_MB * 1024 * 1024;
      if (isTooLarge) {
        setIsUploadingVideoInCommunity(false);
        togglePicker();
        handleErrorMessage("Video must not exceed 20MB.");
        return;
      }

      mutate();
      togglePicker();
    }
  }, [isUploadingVideoInCommunity, selectedVideo]);

  const removeUploadedVideoUrl = async (
    urlToRemove: string,
    communityId: string
  ) => {

    console.log("removing photo");

    setUploadedVideoUrls((prev) =>
      prev.filter((url: string) => url !== urlToRemove)
    );

    const removedKey = `${communityId}/${userDetails._id}/@community_removed_video_uploads`;
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
    isCommunityUpload,
    videoDetails,
    uploadProgress,
    startUpload: () => {
      setUploadProgress(0); // Reset progress when starting new upload
      setIsUploadingVideoInCommunity(true);
    },
    retryUpload: () => {
      setUploadProgress(0); // Reset progress for retry
      mutate(); // Retry the upload
    },
    removeUploadedVideoUrl,
  };
};

export default useUploadVideoInCommunity;