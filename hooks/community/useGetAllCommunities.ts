import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getAllCommunities } from '@/services/community.service';
import { useMemo, useCallback, useRef } from 'react';

export const useGetAllCommunities = () => {
  return useQuery({
    queryKey: ['communities', 'all'],
    queryFn: () => getAllCommunities(),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const useGetAllCommunitiesInfinite = () => {
  const lastEndReachedTime = useRef(0);

  const queryResult = useInfiniteQuery({
    queryKey: ['communities', 'all', 'infinite'],
    queryFn: ({ pageParam = 1 }) => getAllCommunities(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.data) {
        return undefined;
      }
      
      const pageData = lastPage.data.data || lastPage.data;
      if (!Array.isArray(pageData) || pageData.length === 0) {
        return undefined;
      }
      
      // Primary check: Use hasNextPage from API response
      if (lastPage.data.hasNextPage === false) {
        return undefined;
      }
      
      // Secondary check: Compare with totalPages if available
      if (lastPage.data.totalPages && allPages.length >= lastPage.data.totalPages) {
        return undefined;
      }
      
      // If we got a full page (20 items) and hasNextPage is true (or undefined), get next page
      const nextPage = allPages.length + 1;
      
      return nextPage;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const communities = useMemo(() => {
    if (!queryResult.data?.pages || !Array.isArray(queryResult.data.pages)) return [];
    
    const allCommunities = queryResult.data.pages.reduce((acc, page) => {
      const pageData = page?.data?.data || page?.data || [];
      if (Array.isArray(pageData)) {
        return [...acc, ...pageData];
      }
      return acc;
    }, [] as any[]);
    
    return allCommunities;
  }, [queryResult.data?.pages]);

  const handleEndReached = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastEndReachedTime.current;
    
    // Debounce end reached calls (minimum 500ms between calls)
    if (timeSinceLastCall < 500) {
      return;
    }
    
    if (queryResult.hasNextPage && !queryResult.isFetchingNextPage && !queryResult.isLoading) {
      lastEndReachedTime.current = now;
      queryResult.fetchNextPage();
    } else if (!queryResult.hasNextPage && !queryResult.isFetchingNextPage && queryResult.data?.pages?.length === 1) {
      // If hasNextPage is false but we only have 1 page and the API says there are more, force fetch
      const lastPage = queryResult.data.pages[0];
      if (lastPage?.data?.hasNextPage === true || (lastPage?.data?.totalPages && lastPage.data.totalPages > 1)) {
        lastEndReachedTime.current = now;
        queryResult.fetchNextPage();
      }
    }
  }, [queryResult.hasNextPage, queryResult.isFetchingNextPage, queryResult.fetchNextPage, queryResult.isLoading, queryResult.data]);

  return {
    ...queryResult,
    communities,
    handleEndReached,
  };
};