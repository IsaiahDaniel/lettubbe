import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import useVideoUploadStore from "@/store/videoUploadStore";
import { getPresignedUrl } from "@/services/aws.service";
import { getImageDetails, uploadImage } from "@/helpers/utils/upload-utils";
import { handleError, handleErrorMessage } from "@/helpers/utils/handleError";
import { getData, storeData } from "@/helpers/utils/storage";
import useAuth from "../auth/useAuth";

const useUploadPhotoInChat = (togglePicker: any, parentSetUploadedImageUrls?: (urls: string[]) => void) => {
  const {
    isChatUpload,
    isUploadingPhotoInChat,
    selectedPhotos,
    setIsChatUpload,
    setIsUploadingPhotoInChat,
    clearSelections,
  } = useVideoUploadStore();

  const { userDetails } = useAuth();

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([
    // "https://lettubbe-development.s3.eu-north-1.amazonaws.com/67fe04a2a60b572975c1cd75/0.5996420535482538/1752056949328",
    // "https://lettubbe-development.s3.eu-north-1.amazonaws.com/67fe04a2a60b572975c1cd75/0.5996420535482538/1752056949328",
  ]);
  const hasTriggeredUploadRef = useRef(false);

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationKey: ["uploadToChat"],
    mutationFn: async () => {
      console.log("🔄 [CHAT UPLOAD] Starting photo upload process");
      console.log("📷 [CHAT UPLOAD] Selected photos:", selectedPhotos.length);
      
      const uploaded: string[] = [];

      for (const photo of selectedPhotos) {
        console.log("📸 [CHAT UPLOAD] Processing photo:", photo);
        const { uri, name, type } = getImageDetails(photo);
        console.log("📸 [CHAT UPLOAD] Image details:", { uri, name, type });

        const isValidImageType =
          type?.startsWith("image/") ||
          /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(name || uri);

        if (!isValidImageType) {
          console.error("❌ [CHAT UPLOAD] Invalid image type:", type);
          throw new Error("Only image files are allowed.");
        }

        console.log("🔗 [CHAT UPLOAD] Getting presigned URL...");
        const signedResponse = await getPresignedUrl();
        const signedUrl = signedResponse?.data;

        console.log("🔗 [CHAT UPLOAD] Presigned URL response:", signedResponse);
        console.log("🔗 [CHAT UPLOAD] Signed URL:", signedUrl);

        if (!signedUrl || typeof signedUrl !== "string") {
          console.error("❌ [CHAT UPLOAD] Invalid signed URL");
          throw new Error("Invalid signed URL");
        }

        console.log("⬆️ [CHAT UPLOAD] Uploading image...");
        const imageDetails = getImageDetails(photo);
        const uploadedUrl = await uploadImage(imageDetails, signedUrl);

        if (typeof uploadedUrl !== "string") {
          console.error("❌ [CHAT UPLOAD] Upload failed");
          throw new Error("Image upload failed");
        }

        const cleaned = uploadedUrl.split("?")[0];
        console.log("✅ [CHAT UPLOAD] Upload successful:", cleaned);
        uploaded.push(cleaned);
      }

      console.log("🎉 [CHAT UPLOAD] All photos uploaded:", uploaded);
      return uploaded;
    },
    onSuccess: (urls: string[]) => {
      console.log("✅ [CHAT UPLOAD] Upload success callback:", urls);
      setUploadedImageUrls(urls);
      console.log("📝 [CHAT UPLOAD] Set uploaded image URLs:", urls);
      
      // Call parent state setter if provided
      if (parentSetUploadedImageUrls) {
        console.log("📤 [CHAT UPLOAD] Calling parent state setter with URLs:", urls);
        parentSetUploadedImageUrls(urls);
      }
      
      setIsUploadingPhotoInChat(false);
      setIsChatUpload(false);
      clearSelections(); // Clear selected photos after successful upload
      console.log("🏁 [CHAT UPLOAD] Upload process completed");
    },
    onError: (err) => {
      console.error("❌ [CHAT UPLOAD] Upload error:", err);
      setIsChatUpload(false);
      setIsUploadingPhotoInChat(false);
      handleError(err);
    },
  });

  // Automatically trigger upload when flag is true
  useEffect(() => {
    // Early return if no upload activity - prevents running on every render
    if (!isUploadingPhotoInChat || selectedPhotos.length === 0 || isPending || hasTriggeredUploadRef.current) {
      return;
    }
    
    console.log("🔄 [CHAT UPLOAD] Upload effect triggered:", { isUploadingPhotoInChat, selectedPhotosCount: selectedPhotos.length, isPending, hasTriggered: hasTriggeredUploadRef.current });
    
    console.log("🚀 [CHAT UPLOAD] Starting upload process...");

    const invalid = selectedPhotos.some((photo) => {
      const { uri, name, type } = getImageDetails(photo);
      return !(
        type?.startsWith("image/") ||
        /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(name || uri)
      );
    });

    if (invalid) {
      console.error("❌ [CHAT UPLOAD] Invalid photo detected");
      setIsUploadingPhotoInChat(false);
      handleErrorMessage("Please select only image files.");
      return;
    }

    console.log("✅ [CHAT UPLOAD] Photos validated, starting upload...");
    hasTriggeredUploadRef.current = true;
    mutate();
  }, [isUploadingPhotoInChat, selectedPhotos.length, isPending, mutate, setIsUploadingPhotoInChat]);

  // Reset trigger when upload completes or fails
  useEffect(() => {
    if (!isUploadingPhotoInChat && hasTriggeredUploadRef.current) {
      console.log("🔄 [CHAT UPLOAD] Resetting upload trigger");
      hasTriggeredUploadRef.current = false;
    }
  }, [isUploadingPhotoInChat]);

  const removeUploadedUrl = async (
    urlToRemove: string,
    communityId: string
  ) => {
    console.log("removing url", urlToRemove, "from community", communityId);

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
    isChatUpload,
    startUpload: () => {
      setIsUploadingPhotoInChat(true);
    },
    removeUploadedUrl,
  };
};

export default useUploadPhotoInChat;