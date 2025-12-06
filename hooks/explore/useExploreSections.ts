import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Post } from '@/helpers/types/explore/explore';
import { likePost as likePostService, bookmarkedPost } from '@/services/feed.service';
import { getTrendingPosts, getPopularPosts /*, getForYouPosts */ } from '@/services/explore.service';
import useAuth from '@/hooks/auth/useAuth';

export type SectionType = 'trending' | 'popular' | 'forYou';

interface UseExploreSectionsProps {
  initialSection?: SectionType;
}

export const useExploreSections = ({
  initialSection = 'trending'
}: UseExploreSectionsProps = {}) => {
  // State variables
  const [currentSection, setCurrentSection] = useState<SectionType>(initialSection);
  
  // Get authentication data
  const { userDetails } = useAuth();
  const userId = userDetails?._id;
  const queryClient = useQueryClient();
  
  // Debouncing refs for actions
  const lastLikeActionTime = useRef(0);
  const lastSaveActionTime = useRef(0);
  const actionDebounceMs = 1000; // 1 second debounce

  // Helper function to invalidate all explore section caches efficiently
  const invalidateExploreSections = useCallback(() => {
    const sectionsToInvalidate: SectionType[] = ['trending', 'popular', 'forYou'];
    sectionsToInvalidate.forEach(section => {
      queryClient.invalidateQueries({ 
        queryKey: ['explore', section],
        exact: true
      });
    });
  }, [queryClient]);

  const formatPostData = useCallback((post: any): Post => {
    const likesArray = post.reactions?.likes || [];
    const isAuthenticated = !!userId;
    const isPostLiked = isAuthenticated && Array.isArray(likesArray) && likesArray.includes(userId);
    
    return {
      _id: post._id,
      id: post._id,
      description: post.description || "",
      thumbnail: post.thumbnail || "",
      videoUrl: post.videoUrl || "",
      images: post.images || [],
      user: {
        id: post.user._id,
        username: post.user.username || "",
        firstName: post.user.firstName || "",
        lastName: post.user.lastName || "",
        fullName: `${post.user.firstName || ""} ${post.user.lastName || ""}`,
        avatar: post.user.profilePicture || ""
      },
      likes: post.metrics?.likesCount || 0,
      isLiked: isPostLiked,
      isSaved: post.isBookmarked || false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: post.tags || [],
      visibility: post.visibility || "public",
      isCommentsAllowed: post.isCommentsAllowed ?? true,
      dislikes: post.reactions?.dislikes?.length || 0,
      shares: post.reactions?.shares || 0,
      comments: post.metrics?.commentsCount || 0,
      views: post.metrics?.viewsCount || 0,
      isDisliked: isAuthenticated && Array.isArray(post.reactions?.dislikes) && post.reactions.dislikes.includes(userId),
      duration: post.duration || 0,
      plays: post.metrics?.viewsCount || 0,
      totalViews: post.totalViews
    };
  }, [userId]);

  const {
    data: trendingResponse,
    isLoading: trendingLoading,
    isError: trendingError,
    error: trendingErrorDetails,
    refetch: refetchTrending
  } = useQuery({
    queryKey: ['explore', 'trending'],
    queryFn: () => {
      // console.log("🔍 TRENDING DEBUG: Calling getTrendingPosts (viral endpoint)");
      return getTrendingPosts();
    },
  });

  const {
    data: popularResponse,
    isLoading: popularLoading,
    isError: popularError,
    error: popularErrorDetails,
    refetch: refetchPopular
  } = useQuery({
    queryKey: ['explore', 'popular'],
    queryFn: () => getPopularPosts(),
  });

  // const {
  //   data: forYouResponse,
  //   isLoading: forYouLoading,
  //   isError: forYouError,
  //   error: forYouErrorDetails,
  //   refetch: refetchForYou
  // } = useQuery({
  //   queryKey: ['explore', 'forYou'],
  //   queryFn: () => getForYouPosts(),
  // });

  // Mock forYou data until backend endpoint is implemented
  const forYouResponse = null;
  const forYouLoading = false;
  const forYouError = false;
  const forYouErrorDetails = null;
  const refetchForYou = () => Promise.resolve();

  const trendingData = trendingResponse?.success && trendingResponse.data?.data ? 
    (Array.isArray(trendingResponse.data.data) ? trendingResponse.data.data : []) : [];
  const popularData = popularResponse?.success && popularResponse.data?.data ? 
    (Array.isArray(popularResponse.data.data) ? popularResponse.data.data : []) : [];
  const forYouData = forYouResponse?.success && forYouResponse.data?.data ? 
    (Array.isArray(forYouResponse.data.data) ? forYouResponse.data.data : []) : [];

  // Debug logging for data
  // console.log("🔍 EXPLORE DEBUG: Data lengths:", {
  //   trending: trendingData.length,
  //   popular: popularData.length,
  //   forYou: forYouData.length,
  //   trendingLoading,
  //   popularLoading,
  //   trendingError,
  //   popularError,
  //   trendingResponse: !!trendingResponse,
  //   popularResponse: !!popularResponse
  // });

  // Transform data to posts - with extra defensive checks
  const posts: Record<SectionType, Post[]> = {
    trending: Array.isArray(trendingData) ? trendingData.map(formatPostData) : [],
    popular: Array.isArray(popularData) ? popularData.map(formatPostData) : [],
    forYou: Array.isArray(forYouData) ? forYouData.map(formatPostData) : []
  };

  // Loading states
  const loading: Record<SectionType, boolean> = {
    trending: trendingLoading,
    popular: popularLoading,
    forYou: forYouLoading
  };

  // Error states
  const errors: Record<SectionType, string | null> = {
    trending: trendingError ? 
      (trendingErrorDetails instanceof Error ? trendingErrorDetails.message : 'Failed to load trending videos') : null,
    popular: popularError ? 
      (popularErrorDetails instanceof Error ? popularErrorDetails.message : 'Failed to load popular videos') : null,
    forYou: forYouError ? 
      (forYouErrorDetails instanceof Error ? forYouErrorDetails.message : 'Failed to load for you videos') : null
  };

  // Refreshing states (for UI indicators)
  const [refreshing, setRefreshing] = useState<Record<SectionType, boolean>>({
    trending: false,
    popular: false,
    forYou: false
  });

  // Handle refresh for a specific section
  const handleRefresh = useCallback((section: SectionType) => {
    setRefreshing(prev => ({ ...prev, [section]: true }));
    
    switch (section) {
      case 'trending':
        refetchTrending();
        break;
      case 'popular':
        refetchPopular();
        break;
      case 'forYou':
        refetchForYou();
        break;
    }
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      setRefreshing(prev => ({ ...prev, [section]: false }));
    }, 1000);
  }, [refetchTrending, refetchPopular, refetchForYou]);

  // Like post functionality with debouncing
  const handleLikePost = useCallback(async (postId: string) => {
    // Check if user is authenticated
    if (!userId) {
      console.error('Cannot like post: User not authenticated');
      return;
    }
    
    // Debounce rapid like actions
    const now = Date.now();
    if (now - lastLikeActionTime.current < actionDebounceMs) {
      return; // Skip if too soon
    }
    lastLikeActionTime.current = now;
    
    try {
      const response = await likePostService(postId);
      
      if (response.success) {
        // Use targeted cache invalidation for only the sections that need updating
        invalidateExploreSections();
      } else {
        // Handle API-level failure
        console.error('Failed to like post:', response.message);
      }
    } catch (err) {
      // Handle network/request errors
      console.error('Error liking post:', err);
    }
  }, [userId, queryClient]);

  // Save post functionality with debouncing
  const handleSavePost = useCallback(async (postId: string) => {
    // Check if user is authenticated
    if (!userId) {
      console.error('Cannot save post: User not authenticated');
      return;
    }
    
    // Debounce rapid save actions
    const now = Date.now();
    if (now - lastSaveActionTime.current < actionDebounceMs) {
      return; // Skip if too soon
    }
    lastSaveActionTime.current = now;
    
    try {
      const response = await bookmarkedPost(postId);
      
      if (response.success) {
        // Use targeted cache invalidation for only the sections that need updating
        invalidateExploreSections();
      } else {
        // Handle API-level failure
        console.error('Failed to save post:', response.message);
      }
    } catch (err) {
      // Handle network/request errors
      console.error('Error saving post:', err);
    }
  }, [userId, queryClient]);

  // Get the error for current section
  const getCurrentSectionError = useCallback((section: SectionType) => {
    return errors[section];
  }, [errors]);

  // Refetch function for specific section
  const refetch = useCallback((section: SectionType) => {
    switch (section) {
      case 'trending':
        return refetchTrending();
      case 'popular':
        return refetchPopular();
      case 'forYou':
        return refetchForYou();
      default:
        return Promise.resolve();
    }
  }, [refetchTrending, refetchPopular, refetchForYou]);

  return {
    // Data
    posts,
    currentSection,
    
    // States
    loading,
    refreshing,
    errors,
    error: getCurrentSectionError,
    isAuthenticated: !!userId,
    
    // Actions
    setCurrentSection,
    handleRefresh,
    refetch,
    likePost: handleLikePost,
    savePost: handleSavePost
  };
};