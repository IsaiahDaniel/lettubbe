import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import useVideoUploadStore from "@/store/videoUploadStore";
import { getPresignedUrl } from "@/services/aws.service";
import { uploadImage } from "@/helpers/utils/upload-utils";
import { handleError, handleErrorMessage } from "@/helpers/utils/handleError";
import { getData, storeData } from "@/helpers/utils/storage";
import useAuth from "../auth/useAuth";

const useUploadAudioInChat = (togglePicker: any, parentSetUploadedAudioUrl?: (url: string) => void) => {
  const {
    isChatUpload,
    isUploadingAudioInChat,
    selectedAudios,
    setIsChatUpload,
    setIsUploadingAudioInChat,
    clearSelections,
  } = useVideoUploadStore();

  const { userDetails } = useAuth();

  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string>("");
  const hasTriggeredUploadRef = useRef(false);

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationKey: ["uploadAudioToChat"],
    mutationFn: async () => {
      console.log("🔄 [CHAT UPLOAD] Starting audio upload process");
      console.log("🎵 [CHAT UPLOAD] Selected audios:", selectedAudios?.length || 0);

      if (!selectedAudios || selectedAudios.length === 0) {
        throw new Error("No audio files selected");
      }

      // Only upload the first audio file (single audio support)
      const audio = selectedAudios[0];
      console.log("🎵 [CHAT UPLOAD] Processing audio:", audio);
      
      const audioDetails = {
        uri: audio.uri,
        name: audio.filename || 'audio.mp3',
        type: 'audio/mpeg'
      };
      
      console.log("🎵 [CHAT UPLOAD] Audio details:", audioDetails);

      console.log("🔗 [CHAT UPLOAD] Getting presigned URL...");
      const signedResponse = await getPresignedUrl();
      const signedUrl = signedResponse?.data;

      console.log("🔗 [CHAT UPLOAD] Signed URL:", signedUrl);

      if (!signedUrl || typeof signedUrl !== "string") {
        console.error("❌ [CHAT UPLOAD] Invalid signed URL");
        throw new Error("Invalid signed URL");
      }

      console.log("⬆️ [CHAT UPLOAD] Uploading audio...");
      const uploadedUrl = await uploadImage(audioDetails, signedUrl);

      if (typeof uploadedUrl !== "string") {
        console.error("❌ [CHAT UPLOAD] Upload failed");
        throw new Error("Audio upload failed");
      }

      const cleaned = uploadedUrl.split("?")[0];
      console.log("✅ [CHAT UPLOAD] Upload successful:", cleaned);
      return cleaned;
    },
    onSuccess: (url: string) => {
      console.log("✅ [AUDIO UPLOAD] Upload success callback:", url);
      setUploadedAudioUrl(url);
      console.log("📝 [AUDIO UPLOAD] Set uploaded audio URL:", url);
      
      // Call parent state setter if provided
      if (parentSetUploadedAudioUrl) {
        console.log("📤 [AUDIO UPLOAD] Calling parent state setter with URL:", url);
        parentSetUploadedAudioUrl(url);
      }
      
      setIsUploadingAudioInChat(false);
      setIsChatUpload(false);
      clearSelections(); // Clear selected audios after successful upload
      console.log("🏁 [AUDIO UPLOAD] Upload process completed");
    },
    onError: (err) => {
      console.error("❌ [CHAT UPLOAD] Upload error:", err);
      setIsChatUpload(false);
      setIsUploadingAudioInChat(false);
      handleError(err);
    },
  });

  // Automatically trigger upload when flag is true
  useEffect(() => {
    // Early return if no upload activity - prevents running on every render
    if (!isUploadingAudioInChat || !selectedAudios || selectedAudios.length === 0 || isPending || hasTriggeredUploadRef.current) {
      return;
    }
    
    console.log("🔄 [CHAT UPLOAD] Upload effect triggered:", { 
      isUploadingAudioInChat, 
      selectedAudiosCount: selectedAudios?.length || 0,
      isPending,
      hasTriggered: hasTriggeredUploadRef.current
    });
      console.log("🚀 [CHAT UPLOAD] Starting audio upload process...");
    hasTriggeredUploadRef.current = true;
    mutate();
  }, [isUploadingAudioInChat, selectedAudios?.length, isPending, mutate]);

  // Reset trigger when upload completes or fails
  useEffect(() => {
    if (!isUploadingAudioInChat && hasTriggeredUploadRef.current) {
      console.log("🔄 [CHAT UPLOAD] Resetting upload trigger");
      hasTriggeredUploadRef.current = false;
    }
  }, [isUploadingAudioInChat]);

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
    isChatUpload,
    startUpload: () => {
      setIsUploadingAudioInChat(true);
    },
    removeUploadedUrl,
  };
};

export default useUploadAudioInChat;