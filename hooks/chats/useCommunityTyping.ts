import { useState, useCallback } from "react";

interface TypingUser {
  userId: string;
  username: string;
}

export const useCommunityTyping = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const addTypingUser = useCallback((user: TypingUser) => {
    setTypingUsers((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.some((u) => u && u.userId === user.userId);
      if (!exists) {
        return [...safePrev, user];
      }
      return safePrev;
    });
  }, []);

  const removeTypingUser = useCallback((userId: string) => {
    setTypingUsers((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter((u) => u && u.userId !== userId);
    });
  }, []);

  const startTyping = useCallback(() => {
    setIsTyping(true);
  }, []);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
  }, []);

  return {
    isTyping,
    typingUsers,
    addTypingUser,
    removeTypingUser,
    startTyping,
    stopTyping,
  };
};