import { useInfiniteQuery } from '@tanstack/react-query';
import { getJoinedCommunities } from '@/services/community.service';

export const useGetJoinedCommunities = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['communities', 'joined'],
    queryFn: ({ pageParam = 1 }) => getJoinedCommunities(pageParam, 10),
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) => {
      const data = lastPage?.data;
      // console.log('🔄 getNextPageParam - lastPage data:', data);
      return data?.hasNextPage ? data.nextPage : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Don't automatically refetch if data exists
    refetchOnWindowFocus: false,
  });
};