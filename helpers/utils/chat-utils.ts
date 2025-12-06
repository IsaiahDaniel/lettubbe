export const createUserDisplayName = (user: any): string => {
  if (!user) return 'Unknown User';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.username || 'Unknown User';
};

export const buildNavigationParams = (
  username: string,
  displayName: string,
  avatar: string,
  subscriberCount: string,
  userId: string
): URLSearchParams => {
  return new URLSearchParams({
    username,
    displayName,
    avatar,
    subscriberCount,
    userId,
  });
};

export const isSearchResultChat = (chatId: string): boolean => {
  return chatId.startsWith('search_');
};

export const createNewConversationId = (userId: string): string => {
  return `new-${userId}`;
};

export const createSearchConversationId = (userId: string): string => {
  return `search_${userId}`;
};

export const getOtherUserFromConversation = (
  conversation: any,
  currentUserId: string
): any => {
  if (!conversation || !currentUserId) return null;
  return conversation.sender._id === currentUserId 
    ? conversation.receiver 
    : conversation.sender;
};

export const hasUnreadMessages = (
  conversation: any,
  currentUserId: string
): boolean => {
  if (!conversation?.messages || conversation.messages.length === 0) {
    return false;
  }
  
  return conversation.messages.some((msg: any) => 
    !msg.seen && msg.userId !== currentUserId
  );
};

export const filterConversationsByTab = (
  conversations: any[],
  activeTab: string,
  currentUserId: string
): any[] => {
  if (!Array.isArray(conversations)) return [];
  
  switch (activeTab) {
    case 'Unread':
      return conversations.filter((conv: any) => 
        hasUnreadMessages(conv, currentUserId)
      );
    case 'Favorites':
      return conversations.filter((conv: any) => conv.isFavourite === true);
    case 'Archived':
      return conversations.filter((conv: any) => conv.isArchived === true);
    case 'All':
    default:
      return conversations.filter((conv: any) => !conv.isArchived);
  }
};

export const calculateUnreadCount = (
  conversations: any[],
  currentUserId: string
): number => {
  if (!Array.isArray(conversations)) return 0;
  
  return conversations.filter((conv: any) => 
    hasUnreadMessages(conv, currentUserId)
  ).length;
};


export const getChatRemoveType = (conversationId: string | null, communityId: string | null) => {
  const type = conversationId ? conversationId : communityId;

  return type;
}