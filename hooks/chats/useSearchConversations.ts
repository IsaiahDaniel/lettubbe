import { useQuery } from '@tanstack/react-query';
import { searchConversations, SearchConversationsParams } from '@/services/chats.service';
import { useDebounce } from '@/hooks/explore/useDebounce';

export const useSearchConversations = (
  searchTerm: string, 
  options?: Omit<SearchConversationsParams, 'search'>
) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const {
    data,
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['searchConversations', debouncedSearchTerm, options?.limit, options?.page],
    queryFn: () => searchConversations({
      search: debouncedSearchTerm,
      limit: options?.limit || 20,
      page: options?.page || 1
    }),
    enabled: !!debouncedSearchTerm && debouncedSearchTerm.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    data: data?.data,
    conversations: data?.data?.conversations || [],
    totalResults: data?.data?.totalResults || 0,
    hasMore: data?.data?.hasMore || false,
    page: data?.data?.page || 1,
    totalPages: data?.data?.totalPages || 1,
    isLoading,
    error,
    isError,
    refetch
  };
};

export default useSearchConversations;