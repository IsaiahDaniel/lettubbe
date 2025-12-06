import { useState, useMemo, useCallback } from 'react';
import useSearchUsers from '@/hooks/useSearchUsers';
import useSearchCommunities from '@/hooks/useSearchCommunities';
import useSearchConversations from '@/hooks/chats/useSearchConversations';
import useAuth from '@/hooks/auth/useAuth';
import { 
  createUserDisplayName,
  getOtherUserFromConversation,
  createSearchConversationId 
} from '@/helpers/utils/chat-utils';

export const useSearchLogic = () => {
  const { userDetails } = useAuth();
  const [messagesSearchTerm, setMessagesSearchTerm] = useState("");
  const [communitiesSearchTerm, setCommunitiesSearchTerm] = useState("");

  // Stable user ID reference for dependencies
  const currentUserId = userDetails?._id;

  const { users: userSearchResults, isLoading: isSearchingUsers } = useSearchUsers(messagesSearchTerm);
  const { communities: communitySearchResults, isLoading: isSearchingCommunities } = useSearchCommunities(communitiesSearchTerm);
  const { conversations: conversationSearchResults, isLoading: isSearchingConversations } = useSearchConversations(messagesSearchTerm);

  // Memoized function to find existing conversation with user
  const findExistingConversation = useCallback((userId: string, existingConversations: any[]) => {
    return existingConversations.find((conv: any) => {
      if (!conv || !currentUserId) return false;
      const otherUser = getOtherUserFromConversation(conv, currentUserId);
      return otherUser?._id === userId;
    });
  }, [currentUserId]);

  // Memoized function to transform search user to conversation format
  const transformSearchUserToConversation = useCallback((user: any, existingConversations: any[]) => {
    const fullName = createUserDisplayName(user);
    const existingConversation = findExistingConversation(user._id, existingConversations);
    
    // If conversation exists, return the real conversation with updated user info
    if (existingConversation) {
      const otherUser = getOtherUserFromConversation(existingConversation, currentUserId || '');
      
      const updatedOtherUser = {
        ...otherUser,
        firstName: user.firstName || otherUser?.firstName || '',
        lastName: user.lastName || otherUser?.lastName || '',
        username: user.username || otherUser?.username || 'Unknown User',
        profilePicture: otherUser?.profilePicture || '',
        fullName: fullName || `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim(),
        displayName: fullName || otherUser?.displayName || otherUser?.username,
        subscriberCount: otherUser?.subscriberCount || 0,
      };
      
      // Update the appropriate user in the conversation
      const updatedConversation = { ...existingConversation };
      
      if (existingConversation.sender._id === currentUserId) {
        updatedConversation.receiver = updatedOtherUser;
      } else {
        updatedConversation.sender = updatedOtherUser;
      }
      
      return updatedConversation;
    }
    
    // If no conversation exists, create a new search result with no messages
    return {
      _id: createSearchConversationId(user._id),
      sender: { 
        _id: currentUserId || 'current_user', 
        firstName: userDetails?.firstName || '', 
        lastName: userDetails?.lastName || '', 
        username: userDetails?.username || '', 
        profilePicture: userDetails?.profilePicture || '' 
      },
      receiver: {
        _id: user._id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || 'Unknown User',
        profilePicture: '',
        fullName: fullName,
        displayName: fullName,
        subscriberCount: 0
      },
      otherUser: {
        _id: user._id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || 'Unknown User',
        profilePicture: '',
        fullName: fullName,
        displayName: fullName,
        subscriberCount: 0
      },
      isArchived: false,
      isFavourite: false,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [currentUserId, userDetails?.firstName, userDetails?.lastName, userDetails?.username, userDetails?.profilePicture, findExistingConversation]);

  // Memoized display conversations for search
  const getSearchResults = useCallback((existingConversations: any[]) => {
    if (!messagesSearchTerm) return existingConversations;

    // Use conversation search results if available, otherwise fallback to user search
    if (conversationSearchResults && conversationSearchResults.length > 0) {
      return conversationSearchResults;
    } else {
      // Fallback to user search for finding new users to chat with
      const searchResults = Array.isArray(userSearchResults) ? userSearchResults : [];
      return searchResults.map(user => transformSearchUserToConversation(user, existingConversations));
    }
  }, [messagesSearchTerm, conversationSearchResults, userSearchResults, transformSearchUserToConversation]);

  // Memoized communities display
  const displayCommunities = useMemo(() => {
    return communitiesSearchTerm
      ? (Array.isArray(communitySearchResults) ? communitySearchResults : [])
      : [];
  }, [communitiesSearchTerm, communitySearchResults]);

  // Memoized loading state for search
  const isSearchLoading = useMemo(() => {
    if (messagesSearchTerm) {
      return isSearchingConversations || isSearchingUsers;
    }
    return false;
  }, [messagesSearchTerm, isSearchingConversations, isSearchingUsers]);

  const handleCancelSearch = useCallback((activeHeaderTab: string) => {
    if (activeHeaderTab === "Inbox") {
      setMessagesSearchTerm("");
    } else {
      setCommunitiesSearchTerm("");
    }
  }, []);

  return {
    messagesSearchTerm,
    setMessagesSearchTerm,
    communitiesSearchTerm,
    setCommunitiesSearchTerm,
    getSearchResults,
    displayCommunities,
    isSearchLoading,
    isSearchingCommunities,
    handleCancelSearch,
  };
};