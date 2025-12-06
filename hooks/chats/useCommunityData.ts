import { useState, useEffect, useMemo } from "react";
import { router } from "expo-router";
import { useGetCommunity } from "@/hooks/community/useGetCommunity";
import { useGetJoinedCommunities } from "@/hooks/community/useGetJoinedCommunities";
import { useJoinCommunity } from "@/hooks/community/useJoinCommunity";
import { useSendJoinRequest } from "@/hooks/community/useSendJoinRequest";
import { useLeaveCommunity } from "@/hooks/community/useLeaveCommunity";
import { useCheckPendingJoinRequest } from "@/hooks/community/useCheckPendingJoinRequest";
import useCommunityGroup from "./useCommunityGroup";
import useCommunityChat from "./useCommunityChat";
import useUploadPhotoInCommunity from "@/hooks/community/useUploadPhotoInCommunity";
import useUploadVideoInCommunity from "@/hooks/community/useUploadVideoInCommunity";
import useUploadAudioInCommunity from "@/hooks/community/useUploadAudioInCommunity";
import useUploadDocumentInCommunity from "@/hooks/community/useUploadDocumentInCommunity";
import useChatPicker from "./useChatPicker";

interface UseCommunityDataProps {
  id: string;
  name: string | string[];
  isNew: string | string[];
}

export const useCommunityData = ({ id, name, isNew }: UseCommunityDataProps) => {
  const [manualPendingState, setManualPendingState] = useState(false);
  
  const {
    data: communityResponse,
    isLoading,
    error,
  } = useGetCommunity(id) as {
    data: {
      _id: string;
      name: string;
      description?: string;
      avatar?: string;
      memberCount?: number;
      approvals?: any;
      [key: string]: any;
    } | undefined;
    isLoading: boolean;
    error: any;
  };

  const { isPending: loadingUserJoinedCommunities } = useGetJoinedCommunities();
  
  const joinedCommunitiesQuery = useGetJoinedCommunities(
    !!communityResponse?.data
  );
  const joinedCommunitiesData = joinedCommunitiesQuery.data;
  
  const { join, isLoading: isJoining } = useJoinCommunity();
  const sendJoinRequestMutation = useSendJoinRequest();
  const { leave, isLoading: isLeaving } = useLeaveCommunity();
  
  const { hasPendingRequest } = useCheckPendingJoinRequest(
    communityResponse?.data
  );

  const actualPendingState = manualPendingState || hasPendingRequest;

  const {
    communityData,
    isUserMember,
    handleBack,
    handleCommunityInfo,
    handleCommunityVideos,
    handleInviteMembers: originalHandleInviteMembers,
    handleMoreButton,
    isInviteModalVisible,
    handleCloseInviteModal,
  } = useCommunityGroup(
    communityResponse,
    isNew,
    name,
    id,
    joinedCommunitiesData,
    join,
    sendJoinRequestMutation.mutateAsync
  );

  const handleInviteMembers = async () => {
    console.log(" handleInviteMembers called");

    if (!communityData.isPublic) {
      console.log("Setting manual pending state for private community");
      setManualPendingState(true);
    }

    try {
      await originalHandleInviteMembers();
      console.log("✅ Join request completed");
      setManualPendingState(false);
    } catch (error) {
      console.log("❌ Join request failed, resetting pending state");
      setManualPendingState(false);
    }
  };

  const { isPickerOpen, togglePicker } = useChatPicker("community");
  const { 
    isUploading: isUploadingPhoto, 
    uploadedImageUrls, 
    setUploadedImageUrls, 
    removeUploadedUrl 
  } = useUploadPhotoInCommunity(togglePicker);
  
  const { 
    isUploading: isUploadingVideo, 
    setUploadedVideoUrls, 
    uploadedVideoUrls, 
    videoDetails, 
    removeUploadedVideoUrl 
  } = useUploadVideoInCommunity(togglePicker);

  const { 
    isUploading: isUploadingAudio, 
    uploadedAudioUrl, 
    setUploadedAudioUrl, 
    removeUploadedUrl: removeUploadedAudioUrl 
  } = useUploadAudioInCommunity(togglePicker);

  const { 
    isUploading: isUploadingDocument, 
    uploadedDocumentUrls, 
    uploadedDocumentDetails,
    setUploadedDocumentUrls,
    removeUploadedUrl: removeUploadedDocumentUrl 
  } = useUploadDocumentInCommunity(togglePicker);

  // Enable chat when we have enough data to determine membership
  const canInitializeChat = !!communityResponse?.data && communityData !== undefined;
  
  // Overall loading state - true until we have community data AND chat is initialized
  const isOverallLoading = isLoading || !canInitializeChat;
  
  // Memoize community ID to prevent unnecessary re-renders
  const stableCommunityId = useMemo(() => 
    communityResponse?.data?.communityId || communityResponse?.data?._id || id,
    [communityResponse?.data?.communityId, communityResponse?.data?._id, id]
  );

  // Use regular community chat
  const chatData = useCommunityChat({
    communityId: stableCommunityId,
    isUserMember,
    isPublic: communityData?.isPublic || false,
    uploadedImages: uploadedImageUrls,
    setUploadedImageUrls,
    setUploadedVideoUrls,
    uploadedVideoUrls,
    uploadedAudioUrl,
    setUploadedAudioUrl,
    uploadedDocumentUrls,
    setUploadedDocumentUrls,
    uploadedDocumentDetails,
    enabled: canInitializeChat,
  });

  const handleLeaveCommunity = async () => {
    try {
      await leave(id);
      router.replace({
        pathname: "/(tabs)/chat",
        params: { tab: "communities" },
      });
    } catch (error) {
      console.error("Error leaving community:", error);
    }
  };

  useEffect(() => {
    console.log("🔄 Community data updated:", {
      communityId: id,
      hasData: !!communityResponse,
      approvals: communityResponse?.data?.approvals,
      timestamp: new Date().toISOString(),
    });
  }, [communityResponse, id]);

  const handleRemoveImage = (url: string) => {
    removeUploadedUrl(url, id);
  };

  const handleRemoveVideo = (url: string) => {
    removeUploadedVideoUrl(url, id);
  };

  const handleRemoveDocument = (url: string) => {
    removeUploadedDocumentUrl(id);
  };

  return {
    // Community data
    communityResponse,
    communityData,
    isLoading,
    isOverallLoading,
    // error,
    isUserMember,
    loadingUserJoinedCommunities,
    
    // Community actions
    handleBack,
    handleCommunityInfo,
    handleInviteMembers,
    handleLeaveCommunity,
    isInviteModalVisible,
    handleCloseInviteModal,
    
    // Join/Leave state
    isJoining: isJoining || sendJoinRequestMutation.isPending,
    isLeaving,
    actualPendingState,
    
    // Chat data
    ...chatData,
    
    // Method aliases for backward compatibility
    sendMessage: (message: string) => {
      chatData.setChatMessage(message);
      chatData.handleSendChat();
    },
    startTyping: chatData.handleTypingStart,
    stopTyping: chatData.handleTypingStop,
    updateMessageUploadProgress: (messageId: string, uploadProgress: number, uploadError?: boolean) => {}, // Placeholder since regular chat doesn't have this
    sendMediaMessage: (caption: string, mediaAssets: any[], uploadingHooks?: any) => {
      // Call the regular sendMediaMessage (which only accepts 2 params)
      chatData.sendMediaMessage(caption, mediaAssets);
      // Return a placeholder message ID since the regular version doesn't return one
      return `msg-${Date.now()}`;
    },
    
    // Upload state
    isUploadingPhoto,
    isUploadingVideo,
    isUploadingAudio,
    isUploadingDocument,
    uploadedImageUrls,
    uploadedVideoUrls,
    uploadedAudioUrl,
    uploadedDocumentUrls,
    uploadedDocumentDetails,
    videoDetails,
    setUploadedImageUrls,
    setUploadedVideoUrls,
    setUploadedAudioUrl,
    setUploadedDocumentUrls,
    handleRemoveImage,
    handleRemoveVideo,
    handleRemoveAudio: (url: string) => removeUploadedAudioUrl(id),
    handleRemoveDocument,
    
    // Picker state
    isPickerOpen,
    togglePicker,
  };
};