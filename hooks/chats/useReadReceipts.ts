import { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markConversationAsRead } from '@/services/chats.service';

const MARK_READ_THROTTLE = 3000;

export const useReadReceipts = () => {
  const queryClient = useQueryClient();
  const lastMarkReadTimeRef = useRef<number>(0);

  const markAsRead = useCallback(async (
    conversationId: string,
    socketMarkRead: () => void
  ) => {
    const now = Date.now();
    if (now - lastMarkReadTimeRef.current < MARK_READ_THROTTLE) {
      return;
    }

    lastMarkReadTimeRef.current = now;

    try {
      await markConversationAsRead(conversationId);
      queryClient.invalidateQueries({ queryKey: ['getUserConversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      socketMarkRead();
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  }, [queryClient]);

  const canMarkAsRead = useCallback((): boolean => {
    const now = Date.now();
    return now - lastMarkReadTimeRef.current >= MARK_READ_THROTTLE;
  }, []);

  return {
    markAsRead,
    canMarkAsRead,
  };
};