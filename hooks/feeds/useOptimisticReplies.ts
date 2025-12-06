import { useState, useEffect, useCallback } from 'react';
import { filterOutMatchedOptimisticReplies } from '@/helpers/utils/reply-matching';

interface OptimisticReply {
  _id: string;
  text: string;
  user: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  createdAt: string;
  likes: any[];
  isOptimistic: boolean;
}

interface UserData {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

export const useOptimisticReplies = (realReplies: any[] = []) => {
  const [optimisticReplies, setOptimisticReplies] = useState<OptimisticReply[]>([]);

  const cleanupOptimisticReplies = useCallback(() => {
    if (realReplies.length > 0 && optimisticReplies.length > 0) {
      setOptimisticReplies(prev => 
        filterOutMatchedOptimisticReplies(prev, realReplies)
      );
    }
  }, [realReplies.length, optimisticReplies.length]);

  useEffect(() => {
    cleanupOptimisticReplies();
  }, [cleanupOptimisticReplies]);

  const addOptimisticReply = useCallback((text: string, userData: UserData) => {
    const optimisticReply: OptimisticReply = {
      _id: `temp-reply-${Date.now()}`,
      text: text.trim(),
      user: userData,
      createdAt: new Date().toISOString(),
      likes: [],
      isOptimistic: true,
    };
    
    setOptimisticReplies(prev => [...prev, optimisticReply]);
  }, []);

  const clearOptimisticReplies = useCallback(() => {
    setOptimisticReplies([]);
  }, []);

  const allReplies = [...realReplies, ...optimisticReplies];

  return {
    optimisticReplies,
    allReplies,
    addOptimisticReply,
    clearOptimisticReplies,
  };
};