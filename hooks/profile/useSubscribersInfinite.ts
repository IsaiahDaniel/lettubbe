import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserSubscribers, getUserSubscriptions } from '@/services/profile.service';

export const useSubscribersInfinite = (userId?: string) => {
  return useInfiniteQuery({
    queryKey: ['subscribers', userId],
    queryFn: ({ pageParam = 1 }) => {
      console.log('Fetching subscribers page:', pageParam);
      return getUserSubscribers(userId, pageParam, 10);
    },
    getNextPageParam: (lastPage) => {
      console.log('getNextPageParam - lastPage:', lastPage);
      const paginationData = lastPage?.data;
      console.log('Pagination data:', paginationData);
      const hasNext = paginationData?.hasNextPage;
      const nextPage = paginationData?.nextPage;
      console.log('hasNextPage:', hasNext, 'nextPage:', nextPage);
      return hasNext ? nextPage : undefined;
    },
    initialPageParam: 1,
  });
};

export const useSubscriptionsInfinite = (userId?: string) => {
  return useInfiniteQuery({
    queryKey: ['subscriptions', userId],
    queryFn: ({ pageParam = 1 }) => {
      console.log('Fetching subscriptions page:', pageParam);
      return getUserSubscriptions(userId, pageParam, 10);
    },
    getNextPageParam: (lastPage) => {
      console.log('getNextPageParam - lastPage:', lastPage);
      const paginationData = lastPage?.data;
      console.log('Pagination data:', paginationData);
      const hasNext = paginationData?.hasNextPage;
      const nextPage = paginationData?.nextPage;
      console.log('hasNextPage:', hasNext, 'nextPage:', nextPage);
      return hasNext ? nextPage : undefined;
    },
    initialPageParam: 1,
  });
};