import { getRecommendedStreamers, getPopularStreamers } from '@/services/streaming.service';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useGetRecommendedStreams = () => {
  const { isPending, data, isSuccess, isError, error, refetch } = useQuery({
    queryKey: ['getRecommendedStreams'],
    queryFn: getRecommendedStreamers,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always fetch fresh data for streaming content
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
    streams: transformedStreams,
  };
};

export const useGetPopularStreamers = () => {
  const { isPending, data, isSuccess, isError, error, refetch } = useQuery({
    queryKey: ['getPopularStreamers'],
    queryFn: getPopularStreamers,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always fetch fresh data for streaming content
    refetchOnWindowFocus: true, // Refetch when returning to the app
  });

  // Transform streamer data if it contains _views field
  const transformedStreamers = useMemo(() => {
    if (!data?.data || !Array.isArray(data.data)) return [];
    
    return data.data.map((streamer: any) => ({
      ...streamer,
      // Transform any nested view fields if present
      totalViews: streamer._views || streamer.totalViews || 0,
    }));
  }, [data?.data]);

  return {
    isPending,
    isSuccess,
    isError,
    error,
    refetch,
    streamers: transformedStreamers,
  };
};