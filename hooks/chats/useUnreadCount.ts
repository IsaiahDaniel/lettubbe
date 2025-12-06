import { useMemo } from 'react';
import useGetUserConversationsInfinite from './useGetUserConversationsInfinite';
import useAuth from '../auth/useAuth';

const useUnreadCount = () => {
  const { data: conversations, isPending } = useGetUserConversationsInfinite();
  const { userDetails } = useAuth();

  const unreadCount = useMemo(() => {
    // if (!conversations || !userDetails || !Array.isArray(conversations)) {
    //   console.log('🔍 [UNREAD_COUNT] No conversations or user details');
    //   return 0;
    // }

    const totalUnread = conversations.reduce((count, chat) => {
      if (!chat || !chat.messages || !Array.isArray(chat.messages) || chat.messages.length === 0) {
        return count;
      }
      
      const latestMessage = chat.messages[chat.messages.length - 1];
      const isFromOtherUser = latestMessage && latestMessage.userId !== userDetails._id;
      const isNotSeen = !latestMessage?.seen;
      const isUnread = isFromOtherUser && isNotSeen;
      
      // if (isUnread) {
      //   console.log('🔍 [UNREAD_COUNT] Found unread conversation:', {
      //     chatId: chat._id,
      //     messageId: latestMessage._id,
      //     seen: latestMessage.seen,
      //     userId: latestMessage.userId,
      //     currentUserId: userDetails._id,
      //   });
      // }
      
      return count + (isUnread ? 1 : 0);
    }, 0);

    // console.log('🔍 [UNREAD_COUNT] Total unread conversations:', totalUnread);
    return totalUnread;
  }, [conversations, userDetails]);

  return {
    unreadCount,
    isPending,
  };
};

export default useUnreadCount;