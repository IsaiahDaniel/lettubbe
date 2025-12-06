import { getLiveStreams } from '@/services/streaming.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const useGetLiveStreams = () => {
  const { isPending, data, isSuccess, isError, error, refetch } = useQuery({
    queryKey: ['getLiveStreams'],
    queryFn: getLiveStreams,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always fetch fresh data for live streaming content
    refetchOnWindowFocus: true, // Refetch when returning to the app
  });

  // Transform streaming data to map _views to views for consistent usage
  const transformedStreams = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return [];
    
    return data.data.map((stream: any) => ({
      ...stream,
      views: stream._views || stream.views || 0, // Use _views if available, fallback to views
    }));
  }, [data?.data]);

  return {
    isPending,
    isSuccess,
    isError,
    error,
    refetch,
    liveStreams: transformedStreams,
  };
};

export default useGetLiveStreams;