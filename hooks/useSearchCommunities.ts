import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { baseURL } from '@/config/axiosInstance';
import useAuth from '@/hooks/auth/useAuth';

interface SearchCommunity {
  _id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  members?: any[];
  type: 'public' | 'private' | 'hidden';
}

interface SearchCommunitiesResponse {
  success: boolean;
  data: SearchCommunity[];
}

const useSearchCommunities = (searchTerm: string) => {
  const { token } = useAuth();
  const [isSearching, setIsSearching] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<SearchCommunitiesResponse>({
    queryKey: ['searchCommunities', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return { success: true, data: [] };
      }

      const response = await axios.get(`${baseURL}/communities/community/joined/search`, {
        params: {
          searchTerm: searchTerm.trim(),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
    enabled: !!token,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
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
    communities: data?.data || [],
    isLoading: isLoading || isSearching,
    error,
    refetch,
  };
};

export default useSearchCommunities;