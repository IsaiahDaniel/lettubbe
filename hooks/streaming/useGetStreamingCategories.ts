import { getPopularStreamCategories } from '@/services/streaming.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { PaginatedResponse, Category } from '@/helpers/types/streaming/streaming.types';

const useGetStreamingCategories = () => {
  const { isPending, data, isSuccess, isError, error, refetch } = useQuery({
    queryKey: ['getStreamingCategories'],
    queryFn: getPopularStreamCategories,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 300000, // 5 minutes - categories don't change often
  });

  // Handle paginated response structure
  const paginatedData = data?.data as PaginatedResponse<Category> | undefined;

  // Transform categories to use _views if available, fallback to views
  const transformedCategories = useMemo(() => {
    if (!paginatedData?.docs || !Array.isArray(paginatedData.docs)) return [];
    
    return paginatedData.docs.map((category: any) => ({
      ...category,
      views: category._views || category.views || 0, // Use _views if available, fallback to views
    }));
  }, [paginatedData?.docs]);

  return {
    isPending,
    isSuccess,
    isError,
    error,
    refetch,
    categories: transformedCategories,
    totalCategories: paginatedData?.totalDocs || 0,
    hasMore: paginatedData?.hasNextPage || false,
    currentPage: paginatedData?.page || 1,
    totalPages: paginatedData?.totalPages || 1,
  };
};

export default useGetStreamingCategories;