import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import useVideoUploadStore from "@/store/videoUploadStore";
import { getPresignedUrl } from "@/services/aws.service";
import { getImageDetails, uploadImage } from "@/helpers/utils/upload-utils";
import { handleError, handleErrorMessage } from "@/helpers/utils/handleError";
import useChatPicker from "../chats/useChatPicker";
import { getData, storeData } from "@/helpers/utils/storage";
import useAuth from "../auth/useAuth";

const useUploadPhotoInCommunity = (togglePicker: any) => {
  const {
    isCommunityUpload,
    isUploadingPhotoInCommunity,
    selectedPhotos,
    setisCommunityUpload,
    setIsUploadingPhotoInCommunity,
  } = useVideoUploadStore();

  const { userDetails } = useAuth();

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([
    // "https://lettubbe-development.s3.eu-north-1.amazonaws.com/67fe04a2a60b572975c1cd75/0.5996420535482538/1752056949328",
    // "https://lettubbe-development.s3.eu-north-1.amazonaws.com/67fe04a2a60b572975c1cd75/0.5996420535482538/1752056949328",
  ]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationKey: ["uploadToCommunity"],
    mutationFn: async () => {
      const uploaded: string[] = [];

      console.log("mutationFn ran>>>>>>>>>>");

      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        console.log("selecting photos ran....");
        
        // Update progress based on current photo index
        const progressPerPhoto = 100 / selectedPhotos.length;
        const currentProgress = Math.round(i * progressPerPhoto);
        setUploadProgress(currentProgress);

        const { uri, name, type } = getImageDetails(photo);

        const isValidImageType =
          type?.startsWith("image/") ||
          /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(name || uri);

        if (!isValidImageType) {
          throw new Error("Only image files are allowed.");
        }

        const signedResponse = await getPresignedUrl();
        const signedUrl = signedResponse?.data;

        console.log("signedResponse", signedResponse);
        console.log("signedUrl", signedUrl);

        if (!signedUrl || typeof signedUrl !== "string") {
          throw new Error("Invalid signed URL");
        }

        const imageDetails = getImageDetails(photo);
        const uploadedUrl = await uploadImage(imageDetails, signedUrl);

        if (typeof uploadedUrl !== "string") {
          throw new Error("Image upload failed");
        }

        const cleaned = uploadedUrl.split("?")[0];

        console.log("cleaned", cleaned);

        uploaded.push(cleaned);
      }

      // Set progress to 100% when done
      setUploadProgress(100);
      return uploaded;
    },
    onSuccess: (urls: string[]) => {
      setUploadedImageUrls(urls);
      setIsUploadingPhotoInCommunity(false);
      setisCommunityUpload(false);
      setUploadProgress(0); // Reset progress
    },
    onError: (err) => {
      console.error("Upload error:", err);
      setisCommunityUpload(false);
      setIsUploadingPhotoInCommunity(false);
      setUploadProgress(0); // Reset progress on error
      handleError(err);
    },
  });

  // Automatically trigger upload when flag is true
  useEffect(() => {
    // selectedPhotos.length > 0
    console.log("isUploadingPhotoInCommunity rann..");
    if (isUploadingPhotoInCommunity) {
      // console.log("uploading photo in community");

      let invalid;

      if(selectedPhotos.length > 0){
        invalid = selectedPhotos.some((photo) => {
          const { uri, name, type } = getImageDetails(photo);
          return !(
            type?.startsWith("image/") ||
            /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(name || uri)
          );
        });
      }


      if (invalid) {
        setIsUploadingPhotoInCommunity(false);
        togglePicker();
        handleErrorMessage("Please select only image files.");
        return;
      }

      mutate();
      togglePicker();
    }
    // selectedPhotos
  }, [isUploadingPhotoInCommunity,]);

  const removeUploadedUrl = async (
    urlToRemove: string,
    communityId: string
  ) => {
    // console.log("removing url", urlToRemove, "from community", communityId);

    setUploadedImageUrls((prev) =>
      prev.filter((u: any) => u.uploadedUrl !== urlToRemove)
    );

    // console.log("updated uploadedUrls", uploadedUrls);

    // Save to local storage
    const removedKey = `${communityId}/${userDetails._id}/@community_removed_uploads`;
    try {
      const removed: string[] = (await getData<string[]>(removedKey)) || [];
      await storeData(removedKey, [...removed, urlToRemove]);
    } catch (e) {
      console.error("Failed to save removed image:", e);
    }
  };

  return {
    uploadedImageUrls,
    setUploadedImageUrls,
    isUploading: isPending,
    isUploadError: isError,
    uploadError: error,
    isUploadSuccess: isSuccess,
    isCommunityUpload,
    uploadProgress,
    startUpload: () => {
      setUploadProgress(0); // Reset progress when starting new upload
      setIsUploadingPhotoInCommunity(true);
    },
    retryUpload: () => {
      setUploadProgress(0); // Reset progress for retry
      mutate(); // Retry the upload
    },
    removeUploadedUrl,
  };
};

export default useUploadPhotoInCommunity;