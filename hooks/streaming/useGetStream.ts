import { getStreamById } from '@/services/streaming.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const useGetStream = (streamId: string) => {
  const { isPending, data, isSuccess, isError, error, isRefetching, refetch } = useQuery({
    queryKey: ['getSingleStream', streamId],
    queryFn: () => getStreamById(streamId),
    enabled: !!streamId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always fetch fresh data for stream details and view counts
    refetchOnWindowFocus: true, // Refetch when returning to the app
  });

  // Debug logging for stream data
  // console.log('🔍 useGetStream - streamId:', streamId);
  // console.log('🔍 useGetStream - data:', JSON.stringify(data, null, 2));

  const rawStreamData = data?.data;
  
  // Transform streaming data to map _views to views for consistent usage
  const streamData = useMemo(() => {
    if (!rawStreamData) return null;
    
    return {
      ...rawStreamData,
      views: rawStreamData._views || rawStreamData.views || 0, // Use _views if available, fallback to views
    };
  }, [rawStreamData]);
  
  // Handle both upcoming streams (with streamLink) and regular streams (with streamKey)
  const streamSource = streamData?.streamLink || streamData?.streamKey;
  
  // console.log('🔍 useGetStream - streamSource:', streamSource);
  // console.log('🔍 useGetStream - streamLink:', streamData?.streamLink);
  // console.log('🔍 useGetStream - streamKey:', streamData?.streamKey);

  return {
    isPending,
    isSuccess,
    isError,
    error,
    data: streamData,
    streamKey: streamSource, // Use streamLink if available, fallback to streamKey
    isRefetching, // Return refetching state for reconnection UI
    refetch, // Return refetch function for manual refresh
  };
};

export default useGetStream;