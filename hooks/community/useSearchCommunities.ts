import { useQuery } from '@tanstack/react-query';
import { searchCommunities, SearchCommunitiesParams } from '@/services/community.service';
import { useDebounce } from '@/hooks/explore/useDebounce';

export const useSearchCommunities = (searchTerm: string, options?: Omit<SearchCommunitiesParams, 'searchTerm'>) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 150); // Faster debounce for better UX
  
  return useQuery({
    queryKey: ['searchCommunities', debouncedSearchTerm, options?.page, options?.limit],
    queryFn: () => searchCommunities({ 
      searchTerm: debouncedSearchTerm, 
      ...options 
    }),
    enabled: debouncedSearchTerm.length > 0,
    staleTime: 5000, // Shorter stale time for real-time feel
    refetchOnWindowFocus: false,
    gcTime: 10000, // 10 seconds garbage collection
  });
};