import { useState, useCallback } from 'react';

export const useOnlineUsers = () => {
  const [usersOnline, setUsersOnline] = useState<string[]>([]);

  const updateOnlineUsers = useCallback((users: string[]) => {
    setUsersOnline(users);
  }, []);

  const getUserOnlineStatus = useCallback((userId: string): 'online' | 'offline' => {
    return usersOnline.includes(userId) ? 'online' : 'offline';
  }, [usersOnline]);

  return {
    usersOnline,
    updateOnlineUsers,
    getUserOnlineStatus,
  };
};