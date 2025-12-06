import { CommunityMessage } from "@/helpers/types/chat/chat.types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import useAuth from "../auth/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const useCommunityGroup = (
  communityResponse: any,
  isNew: any,
  name: any,
  id: any,
  joinedCommunitiesData: any,
  join: any,
  sendJoinRequest: any
) => {
  const router = useRouter();
  const { userDetails } = useAuth();
  const queryClient = useQueryClient();

  const apiCommunity = communityResponse?.data;

  const communityData = {
    _id: apiCommunity?._id,
    avatar: apiCommunity?.photoUrl || "",
    description:
      apiCommunity?.description ||
      "...",
    memberCount: apiCommunity?.members?.length || 0,
    isPublic: apiCommunity?.type === "public",
    name: apiCommunity?.name || name || "Community",
  };

  // Check if user is a member of this community
  // Flatten all pages of joined communities data (infinite query structure)
  const allJoinedCommunitiesData = joinedCommunitiesData?.pages?.flatMap((page: any) => page?.data?.data || []) || [];
  const joinedCommunityIds = allJoinedCommunitiesData.map((c: any) => c._id);
  const isOwner = userDetails?._id === apiCommunity?.owner;
  const isAdmin = apiCommunity?.admins?.includes(userDetails?._id);
  const isMember = apiCommunity?.members?.includes(userDetails?._id);
  const isUserMember = joinedCommunityIds.includes(id) || isOwner || isAdmin || isMember;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);

  const handleCommunityInfo = () => {
    router.push({
      pathname: '/(community)/info/[id]',
      params: {
        id: id as string,
      },
    });
  };

  const handleInviteMembers = async () => {
    if (isUserMember) {
      setIsInviteModalVisible(true);
    } else {
      try {
        if (communityData.isPublic) {
          await join(id as string);
          console.log(`Successfully joined community ${id}`);
        } else {
          await sendJoinRequest(id as string);
          console.log(`Successfully sent join request for community ${id}`);
        }
      } catch (error: any) {
        console.error(`Failed to join/request community ${id}:`, error);
        
        // Check if the error is because user is already a member
        if (error?.response?.status === 400 || 
            error?.status === 400 ||
            error?.data?.error?.includes('already') ||
            error?.message?.includes('already')) {
          // console.log('User is already a member, refreshing data');
          // Invalidate and refetch relevant queries
          queryClient.invalidateQueries({ queryKey: ['communities', 'joined'] });
          queryClient.invalidateQueries({ queryKey: ['community', id] });
        }
      }
    }
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalVisible(false);
  };

  const handleCommunityVideos = () => {
    console.log("Community videos");
  };

  const handleMoreButton = () => {
    console.log("More options");
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: CommunityMessage = {
        id: Date.now().toString(),
        userId: {
          username: "You",
          _id: "1",
          profilePicture: "https://randomuser.me/api/portraits/men/1.jpg"
        },
        username: "You",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        text: message.trim(),
        createdAt: new Date().toISOString(),
        isOwnMessage: true,
        _id: "",
        isDeleted: false,
        repliedTo: undefined
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
    }
  };
  const handleBack = () => {
    // Always navigate to Communities tab, regardless of how we got here
    router.replace({
      pathname: "/(tabs)/chat",
      params: { tab: "communities" }
    });
  };

  // Reset state when ID changes
  useEffect(() => {
    setMessage("");
    setMessages([]);
  }, [id]);

  // Handle hardware back button for newly created communities
  useEffect(() => {
    if (isNew === "true") {
      const backAction = () => {
        // Navigate to communities list instead of going back to creation flow
        router.replace("/(tabs)/chat?tab=Communities");
        return true; // Prevent default back action
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }
  }, [isNew]);

  return {
    isUserMember,
    apiCommunity,
    communityData,
    messages,
    message,
    setMessage,
    handleSendMessage,
    handleCommunityInfo,
    handleInviteMembers,
    handleCommunityVideos,
    handleMoreButton,
    handleBack,
    isInviteModalVisible,
    handleCloseInviteModal,
  };
};

export default useCommunityGroup;