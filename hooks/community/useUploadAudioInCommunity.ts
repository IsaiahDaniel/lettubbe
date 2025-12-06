import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import useVideoUploadStore from "@/store/videoUploadStore";
import { getPresignedUrl } from "@/services/aws.service";
import { uploadImage } from "@/helpers/utils/upload-utils";
import { handleError } from "@/helpers/utils/handleError";
import { getData, storeData } from "@/helpers/utils/storage";
import useAuth from "../auth/useAuth";

const useUploadAudioInCommunity = (togglePicker: any) => {
  const {
    isCommunityUpload,
    isUploadingAudioInCommunity,
    selectedAudios,
    setisCommunityUpload,
    setIsUploadingAudioInCommunity,
    clearSelections,
  } = useVideoUploadStore();

  const { userDetails } = useAuth();

  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string>("");
  const hasTriggeredUploadRef = useRef(false);

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationKey: ["uploadAudioToCommunity"],
    mutationFn: async () => {
      console.log("🔄 [COMMUNITY UPLOAD] Starting audio upload process");
      console.log("🎵 [COMMUNITY UPLOAD] Selected audios:", selectedAudios?.length || 0);

      if (!selectedAudios || selectedAudios.length === 0) {
        throw new Error("No audio files selected");
      }

      // Only upload the first audio file (single audio support)
      const audio = selectedAudios[0];
      console.log("🎵 [COMMUNITY UPLOAD] Processing audio:", audio);
      
      const audioDetails = {
        uri: audio.uri,
        name: audio.filename || 'audio.mp3',
        type: 'audio/mpeg'
      };
      
      console.log("🎵 [COMMUNITY UPLOAD] Audio details:", audioDetails);

      console.log("🔗 [COMMUNITY UPLOAD] Getting presigned URL...");
      const signedResponse = await getPresignedUrl();
      const signedUrl = signedResponse?.data;

      console.log("🔗 [COMMUNITY UPLOAD] Signed URL:", signedUrl);

      if (!signedUrl || typeof signedUrl !== "string") {
        console.error("❌ [COMMUNITY UPLOAD] Invalid signed URL");
        throw new Error("Invalid signed URL");
      }

      console.log("⬆️ [COMMUNITY UPLOAD] Uploading audio...");
      const uploadedUrl = await uploadImage(audioDetails, signedUrl);

      if (typeof uploadedUrl !== "string") {
        console.error("❌ [COMMUNITY UPLOAD] Upload failed");
        throw new Error("Audio upload failed");
      }

      const cleaned = uploadedUrl.split("?")[0];
      console.log("✅ [COMMUNITY UPLOAD] Upload successful:", cleaned);
      return cleaned;
    },
    onSuccess: (url: string) => {
      console.log("✅ [COMMUNITY UPLOAD] Upload success callback:", url);
      setUploadedAudioUrl(url);
      console.log("📝 [COMMUNITY UPLOAD] Set uploaded audio URL:", url);
      setIsUploadingAudioInCommunity(false);
      setisCommunityUpload(false);
      clearSelections(); // Clear selected audios after successful upload
      console.log("🏁 [COMMUNITY UPLOAD] Upload process completed");
    },
    onError: (err) => {
      console.error("❌ [COMMUNITY UPLOAD] Upload error:", err);
      setisCommunityUpload(false);
      setIsUploadingAudioInCommunity(false);
      handleError(err);
    },
  });

  // Automatically trigger upload when flag is true
  useEffect(() => {
    // Early return if no upload activity - prevents running on every render
    if (!isUploadingAudioInCommunity || !selectedAudios || selectedAudios.length === 0 || isPending || hasTriggeredUploadRef.current) {
      return;
    }
    
    console.log("🔄 [COMMUNITY UPLOAD] Upload effect triggered:", { 
      isUploadingAudioInCommunity, 
      selectedAudiosCount: selectedAudios?.length || 0,
      isPending,
      hasTriggered: hasTriggeredUploadRef.current
    });
    console.log("🚀 [COMMUNITY UPLOAD] Starting audio upload process...");
    hasTriggeredUploadRef.current = true;
    mutate();
    togglePicker();
  }, [isUploadingAudioInCommunity, selectedAudios?.length, isPending, mutate, togglePicker]);

  // Reset trigger when upload completes or fails
  useEffect(() => {
    if (!isUploadingAudioInCommunity && hasTriggeredUploadRef.current) {
      console.log("🔄 [COMMUNITY UPLOAD] Resetting upload trigger");
      hasTriggeredUploadRef.current = false;
    }
  }, [isUploadingAudioInCommunity]);

  const removeUploadedUrl = async (communityId: string) => {
    console.log("removing audio url from community", communityId);

    const urlToRemove = uploadedAudioUrl;
    setUploadedAudioUrl("");

    // Save to local storage
    const removedKey = `${communityId}/${userDetails._id}/@community_removed_audio_uploads`;
    try {
      const removed: string[] = (await getData<string[]>(removedKey)) || [];
      await storeData(removedKey, [...removed, urlToRemove]);
    } catch (e) {
      console.error("Failed to save removed audio:", e);
    }
  };

  return {
    uploadedAudioUrl,
    setUploadedAudioUrl,
    isUploading: isPending,
    isUploadError: isError,
    uploadError: error,
    isUploadSuccess: isSuccess,
    isCommunityUpload,
    startUpload: () => {
      setIsUploadingAudioInCommunity(true);
    },
    retryUpload: () => {
      mutate(); // Retry the upload
    },
    removeUploadedUrl,
  };
};

export default useUploadAudioInCommunity;