import { getUpcomingStreams } from '@/services/streaming.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { PaginatedResponse, UpcomingStream } from '@/helpers/types/streaming/streaming.types';

const useGetUpcomingStreams = () => {
  const { isPending, data, isSuccess, isError, error, refetch } = useQuery({
    queryKey: ['getUpcomingStreams'],
    queryFn: getUpcomingStreams,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always fetch fresh data for streaming content with view counts
    refetchOnWindowFocus: true, // Refetch when returning to the app
  });

  // Debug logging
  // console.log('🔍 useGetUpcomingStreams - Raw data:', JSON.stringify(data, null, 2));
  // console.log('🔍 useGetUpcomingStreams - isPending:', isPending);
  // console.log('🔍 useGetUpcomingStreams - isSuccess:', isSuccess);
  // console.log('🔍 useGetUpcomingStreams - isError:', isError);
  if (error) console.log('❌ useGetUpcomingStreams - Error:', error);

  // Handle paginated response structure or direct array
  const paginatedData = data?.data as PaginatedResponse<UpcomingStream> | UpcomingStream[] | undefined;
  const isArray = Array.isArray(paginatedData);

  console.log('🔍 useGetUpcomingStreams - paginatedData:', JSON.stringify(paginatedData, null, 2));
  console.log('🔍 useGetUpcomingStreams - isArray:', isArray);

  const rawStreams = isArray ? paginatedData : (paginatedData as any)?.data || [];
  
  // Transform streaming data to map _views to views for consistent usage
  const streams = useMemo(() => {
    if (!rawStreams || !Array.isArray(rawStreams)) return [];
    
    return rawStreams.map((stream: any) => ({
      ...stream,
      views: stream._views || stream.views || 0, // Use _views if available, fallback to views
    }));
  }, [rawStreams]);
  
  console.log('🔍 useGetUpcomingStreams - Final streams:', JSON.stringify(streams, null, 2));
  console.log('🔍 useGetUpcomingStreams - Stream count:', streams.length);

  return {
    isPending,
    isSuccess,
    isError,
    error,
    refetch,
    streams,
    totalStreams: isArray ? rawStreams?.length || 0 : (paginatedData as any)?.totalDocs || 0,
    hasMore: isArray ? false : (paginatedData as any)?.hasNextPage || false,
    currentPage: isArray ? 1 : (paginatedData as any)?.page || 1,
    totalPages: isArray ? 1 : (paginatedData as any)?.totalPages || 1,
  };
};

export default useGetUpcomingStreams;