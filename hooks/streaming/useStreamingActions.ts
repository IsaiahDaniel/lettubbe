import { useCallback } from 'react';
import { router } from 'expo-router';
import { StreamCard, Category, PopularStreamer, UpcomingStream } from '@/helpers/types/streaming/streaming.types';

export const useStreamingActions = () => {
  const handleStreamPress = useCallback((stream: StreamCard) => {
    if (stream.id) {
      router.push(`/(streaming)/stream/${stream.id}`);
    } else {
      console.log("Stream missing ID:", stream.title);
    }
  }, []);

  const handleCategoryPress = useCallback((category: Category) => {
    console.log("Category pressed:", category.name);
  }, []);

  const handleStreamerPress = useCallback((streamer: PopularStreamer) => {
    console.log("Streamer pressed:", streamer.name);
  }, []);

  const handleViewAllStreams = useCallback(() => {
    console.log("View all streams pressed");
  }, []);

  const handleViewAllCategories = useCallback(() => {
    console.log("View all categories pressed");
  }, []);

  const handleViewAllStreamers = useCallback(() => {
    console.log("View all streamers pressed");
  }, []);

  const handleUpcomingStreamPress = useCallback((stream: UpcomingStream) => {
    console.log("Upcoming stream pressed:", stream.title, "isLive:", stream.isLive);
    
    // Always navigate to the stream screen -handles both live and upcoming streams
    router.push(`/(streaming)/stream/${stream._id}`);
  }, []);

  const handleViewAllUpcomingStreams = useCallback(() => {
    router.push('/(streaming)/upcoming');
  }, []);

  const handleAvatarPress = useCallback((userId: string) => {
    console.log("Avatar pressed for user:", userId);
  }, []);

  return {
    handleStreamPress,
    handleCategoryPress,
    handleStreamerPress,
    handleViewAllStreams,
    handleViewAllCategories,
    handleViewAllStreamers,
    handleUpcomingStreamPress,
    handleViewAllUpcomingStreams,
    handleAvatarPress,
  };
};