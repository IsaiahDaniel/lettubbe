import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/explore/useDebounce';
import useSearchUsers from '@/hooks/useSearchUsers';
import useSearchCommunities from '@/hooks/useSearchCommunities';
import useGetUserConversationsInfinite from '@/hooks/chats/useGetUserConversationsInfinite';
import { useGetJoinedCommunities } from '@/hooks/community/useGetJoinedCommunities';

interface Conversation {
  _id: string;
  sender: any;
  receiver: any;
  messages?: any[];
  updatedAt?: string;
}

interface Community {
  id: string;
  name: string;
  avatar: string;
  memberCount: number;
  isJoined: boolean;
  description: string;
  lastMessage: null;
  lastMessageTime: null;
}

export const useShareSearch = (userDetails: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<'chats' | 'communities'>('chats');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Data fetching
  const { data: conversations, isPending } = useGetUserConversationsInfinite();
  const { data: communitiesResponse, isPending: isLoadingCommunities } = useGetJoinedCommunities();
  const { users: searchedUsers, isLoading: isSearchingUsers } = useSearchUsers(debouncedSearchQuery);
  const { communities: searchedCommunities, isLoading: isSearchingCommunities } = useSearchCommunities(debouncedSearchQuery);

  // Process conversations
  const conversationsList: Conversation[] = useMemo(() => 
    (conversations || []).filter((item: any): item is Conversation => 
      item && typeof item === 'object' && item._id && item.sender && item.receiver
    ), [conversations]);

  // Process communities
  const communitiesList: Community[] = useMemo(() => {
    const allJoinedCommunitiesData = communitiesResponse?.pages?.flatMap((page: any) => page?.data?.data || []) || [];
    return allJoinedCommunitiesData.map((apiCommunity: any) => ({
      id: apiCommunity._id,
      name: apiCommunity.name,
      avatar: apiCommunity.photoUrl || '',
      memberCount: apiCommunity.members?.length || 0,
      isJoined: true,
      description: apiCommunity.description || '',
      lastMessage: null,
      lastMessageTime: null
    }));
  }, [communitiesResponse?.pages]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversationsList;
    
    return conversationsList.filter((conversation: Conversation) => {
      const otherParticipant = conversation.sender._id === userDetails?._id
        ? conversation.receiver
        : conversation.sender;
      
      if (!otherParticipant) return false;
      
      const displayName = `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim();
      const username = otherParticipant.username || '';
      
      return (
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [conversationsList, searchQuery, userDetails?._id]);

  // Filter communities based on search
  const filteredCommunities = useMemo(() => {
    if (!searchQuery.trim()) return communitiesList;
    
    return communitiesList.filter((community: Community) => (
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (community.description && community.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
  }, [communitiesList, searchQuery]);

  // Helper functions
  const getConversationDisplayName = (conversation: Conversation) => {
    if (!conversation?.sender || !conversation?.receiver) return 'Unknown User';
    
    const otherParticipant = conversation.sender._id === userDetails?._id
      ? conversation.receiver
      : conversation.sender;
    
    if (!otherParticipant) return 'Unknown User';
    
    return `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || 
           otherParticipant.username || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (!conversation?.sender || !conversation?.receiver) return '';
    
    const otherParticipant = conversation.sender._id === userDetails?._id
      ? conversation.receiver
      : conversation.sender;
    
    return otherParticipant?.profilePicture || '';
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedTarget,
    setSelectedTarget,
    debouncedSearchQuery,
    
    // Data
    conversationsList,
    communitiesList,
    filteredConversations,
    filteredCommunities,
    searchedUsers,
    searchedCommunities,
    
    // Loading states
    isPending,
    isLoadingCommunities,
    isSearchingUsers,
    isSearchingCommunities,
    
    // Helpers
    getConversationDisplayName,
    getConversationAvatar,
  };
};