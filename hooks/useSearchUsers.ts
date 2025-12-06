import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { baseURL } from '@/config/axiosInstance';
import useAuth from '@/hooks/auth/useAuth';

interface SearchUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

interface SearchUsersResponse {
  success: boolean;
  message: string;
  data: {
    data: SearchUser[];
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
    nextPage: number | null;
    page: number;
    pagingCounter: number;
    prevPage: number | null;
    totalDocs: number;
    totalPages: number;
  };
}

const useSearchUsers = (searchTerm: string) => {
  const { token } = useAuth();
  const [isSearching, setIsSearching] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<SearchUsersResponse>({
    queryKey: ['searchUsers', searchTerm],
    queryFn: async ({ signal }) => {
      if (!searchTerm.trim()) {
        return { success: true, data: [] };
      }

      try {
        const response = await axios.get(`${baseURL}/profile/search`, {
          params: {
            searchTerm: searchTerm.trim(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal, // AbortController signal for request cancellation
          timeout: 10000, // 10 second timeout
        });

        return response.data;
      } catch (error: unknown) {
        // Handle specific error cases
        if (axios.isCancel(error)) {
          throw new Error('Search cancelled');
        }
        
        // Type guard for axios errors
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            throw new Error('Search timeout - please try again');
          }
          if (error.response?.status === 429) {
            throw new Error('Too many requests - please wait a moment');
          }
          if (error.response?.status && error.response.status >= 500) {
            throw new Error('Server error - please try again later');
          }
        }
        
        throw new Error('Failed to search users');
      }
    },
    enabled: !!token,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: (failureCount, error: Error) => {
      // Don't retry on client errors or cancellation
      if (error.message.includes('cancelled') || error.message.includes('429')) {
        return false;
      }
      return failureCount < 2; // Retry up to 2 times for server errors
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm]);

  return {
    users: data?.data?.data || [],
    isLoading: isLoading || isSearching,
    error,
    refetch,
  };
};

export default useSearchUsers;