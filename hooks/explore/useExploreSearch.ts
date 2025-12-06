import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Post } from '@/helpers/types/explore/explore';
import { searchPosts } from '@/services/explore.service';
import { likePost, bookmarkedPost } from '@/services/feed.service';
import useAuth from '@/hooks/auth/useAuth';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  description?: string;
  email?: string;
  dob?: string;
  coverPhoto?: string;
}

interface UseExploreSearchProps {
  initialCategory?: string;
  initialSearchTerm?: string;
}

// React Query keys
const QUERY_KEYS = {
  SEARCH: 'search',
  POSTS: 'posts',
  USERS: 'users',
} as const;

export const useExploreSearch = ({
  initialCategory = 'All',
  initialSearchTerm = '',
}: UseExploreSearchProps = {}) => {
  // State variables
  const [category, setCategory] = useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(!!initialSearchTerm);
  
  // Get authentication data
  const { userDetails } = useAuth();
  const queryClient = useQueryClient();
  
  // Extract userId from userDetails
  const userId = userDetails?._id || userDetails?.userId || userDetails?.id;
  
  
  // Transform API post data to match Post type
  const formatPostData = useCallback((post: any): Post => {
    const likesArray = post.reactions?.likes || [];
    
    // Check if user is authenticated and their ID is in the likes array
    const isAuthenticated = !!userId;
    const isPostLiked = isAuthenticated && Array.isArray(likesArray) && likesArray.includes(userId);
    
    
    return {
      id: post._id,
      _id: post._id,
      description: post.description || "",
      thumbnail: post.thumbnail || "",
      videoUrl: post.videoUrl || "",
      images: post.images || [],
      user: post.user ? {
        id: post.user._id,
        username: post.user.username,
        firstName: post.user.firstName,
        lastName: post.user.lastName,
        fullName: `${post.user.firstName} ${post.user.lastName}`,
        avatar: post.user.profilePicture || ""
      } : {
        id: "",
        username: "Unknown",
        firstName: "Unknown",
        lastName: "User",
        fullName: "Unknown User",
        avatar: ""
      },
      likes: post.reactions?.likes?.length || 0,
      isLiked: isPostLiked,
      isSaved: false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: post.tags || [],
      visibility: post.visibility || "public",
      isCommentsAllowed: post.isCommentsAllowed ?? true,
      dislikes: post.reactions?.dislikes?.length || 0,
      shares: post.reactions?.shares || 0,
      comments: post.comments?.length || 0,
      views: post.reactions?.totalViews || 0,
      plays: post.reactions?.totalViews || 0,
      isDisliked: isAuthenticated && 
                  Array.isArray(post.reactions?.dislikes) && 
                  post.reactions?.dislikes?.includes(userId) || false,
      duration: post.duration || 0,
      totalViews: post.reactions?.totalViews || 0,
    };
  }, [userId]);

  // Transform API user data
  const formatUserData = useCallback((user: any): User => {
    if (!user) {
      return {
        _id: "",
        firstName: "Unknown",
        lastName: "User",
        username: "unknown",
        displayName: "Unknown User",
        profilePicture: "",
        description: "",
        email: "",
        dob: "",
        coverPhoto: "",
      };
    }
    
    return {
      _id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      displayName: user.displayName || user.firstName || user.username,
      profilePicture: user.profilePicture || '',
      description: user.description || '',
      email: user.email,
      dob: user.dob,
      coverPhoto: user.coverPhoto || '',
    };
  }, []);

  // Transform API community data
  const formatCommunityData = useCallback((community: any) => {
    return {
      _id: community._id,
      name: community.name,
      owner: community.owner ? {
        _id: community.owner._id,
        firstName: community.owner.firstName,
        lastName: community.owner.lastName,
        username: community.owner.username,
      } : {
        _id: "",
        firstName: "Unknown",
        lastName: "User",
        username: "unknown",
      },
      description: community.description || '',
      topics: community.topics || [],
      categories: community.categories || [],
      type: community.type,
      date: community.date,
      isSetupComplete: community.isSetupComplete,
      members: community.members || [],
      approvals: community.approvals || [],
      subAdmins: community.subAdmins || [],
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      profilePicture: community.photoUrl || '',
      coverPhoto: community.coverPhoto || '',
      isJoined: community.members?.includes(userId) || false,
    };
  }, [userId]);

  // Search query function
  const searchQueryFn = async ({ pageParam = 1 }) => {
    if (!searchTerm || !searchTerm.trim()) {
      return { 
        posts: [], 
        users: [], 
        communities: [],
        hasNextPage: false, 
        currentPage: pageParam // Always return currentPage
      };
    }

    try {
      const response = await searchPosts({
        searchTerm: searchTerm.trim(),
        category: category !== 'All' ? category : undefined,
        page: pageParam,
        limit: 20
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Search failed');
      }

      // Extract posts, users, and communities data
      const postsData = response.data.posts?.data || [];
      const accountsData = response.data.accounts || [];
      const communitiesData = response.data.communities || [];
      
      
      // Format data
      const formattedPosts = Array.isArray(postsData) ? postsData.map(formatPostData) : [];
      const formattedUsers = Array.isArray(accountsData) ? accountsData.map(formatUserData) : [];
      const formattedCommunities = Array.isArray(communitiesData) ? communitiesData.map(formatCommunityData) : [];
      
      // Get pagination info
      const postsPaginationInfo = response.data.posts;
      const hasNextPage = postsPaginationInfo?.hasNextPage || false;

      return {
        posts: formattedPosts,
        users: pageParam === 1 ? formattedUsers : [], // Only return users on first page
        communities: pageParam === 1 ? formattedCommunities : [], // Only return communities on first page
        hasNextPage,
        currentPage: pageParam,
      };
    } catch (error) {
      console.error('Search API error:', error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          throw new Error('Network error: Please check your internet connection and try again.');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Request timeout: The search took too long to complete. Please try again.');
        }
        if (error.message.includes('404')) {
          throw new Error('Search service not found. Please try again later.');
        }
        if (error.message.includes('500')) {
          throw new Error('Server error: Our search service is temporarily unavailable. Please try again later.');
        }
        throw error;
      }
      
      throw new Error('Search failed: An unexpected error occurred. Please try again.');
    }
  };

  // Infinite query for search results
  const {
    data: searchData,
    isLoading: isSearching,
    error: searchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchSearch,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.SEARCH, searchTerm, category],
    queryFn: searchQueryFn,
    initialPageParam: 1,
    enabled: isSearchMode && !!searchTerm.trim(),
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Extract search results from infinite query data - memoized to prevent unnecessary rerenders
  const searchResults = React.useMemo(() => {
    return searchData?.pages?.flatMap(page => page?.posts || []) || [];
  }, [searchData?.pages]);

  const userResults = React.useMemo(() => {
    return searchData?.pages?.[0]?.users || [];
  }, [searchData?.pages]);

  const communityResults = React.useMemo(() => {
    return searchData?.pages?.[0]?.communities || [];
  }, [searchData?.pages]);
  

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) {
        throw new Error('You must be logged in to like posts');
      }
      
      try {
        return await likePost(postId);
      } catch (error) {
        console.error('Like post API error:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('Network request failed')) {
            throw new Error('Network error: Unable to like post. Please check your connection.');
          }
          if (error.message.includes('timeout')) {
            throw new Error('Request timeout: Like action timed out. Please try again.');
          }
          if (error.message.includes('401') || error.message.includes('unauthorized')) {
            throw new Error('Authentication error: Please log in again.');
          }
          if (error.message.includes('404')) {
            throw new Error('Post not found: This post may have been deleted.');
          }
          if (error.message.includes('500')) {
            throw new Error('Server error: Unable to like post right now. Please try again later.');
          }
          throw error;
        }
        
        throw new Error('Failed to like post: An unexpected error occurred.');
      }
    },
    onMutate: async (postId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.SEARCH] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData([QUERY_KEYS.SEARCH, searchTerm, category]);

      // Optimistically update
      queryClient.setQueryData([QUERY_KEYS.SEARCH, searchTerm, category], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) => {
              if (post.id === postId) {
                const newIsLiked = !post.isLiked;
                const likeDelta = newIsLiked ? 1 : -1;
                return {
                  ...post,
                  isLiked: newIsLiked,
                  likes: post.likes + likeDelta
                };
              }
              return post;
            })
          }))
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEYS.SEARCH, searchTerm, category], context.previousData);
      }
      console.error('Like post error:', err);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEARCH, searchTerm, category] });
    },
  });

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) {
        throw new Error('You must be logged in to save posts');
      }
      
      try {
        return await bookmarkedPost(postId);
      } catch (error) {
        console.error('Save post API error:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('Network request failed')) {
            throw new Error('Network error: Unable to save post. Please check your connection.');
          }
          if (error.message.includes('timeout')) {
            throw new Error('Request timeout: Save action timed out. Please try again.');
          }
          if (error.message.includes('401') || error.message.includes('unauthorized')) {
            throw new Error('Authentication error: Please log in again.');
          }
          if (error.message.includes('404')) {
            throw new Error('Post not found: This post may have been deleted.');
          }
          if (error.message.includes('500')) {
            throw new Error('Server error: Unable to save post right now. Please try again later.');
          }
          throw error;
        }
        
        throw new Error('Failed to save post: An unexpected error occurred.');
      }
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.SEARCH] });

      const previousData = queryClient.getQueryData([QUERY_KEYS.SEARCH, searchTerm, category]);

      queryClient.setQueryData([QUERY_KEYS.SEARCH, searchTerm, category], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  isSaved: !post.isSaved
                };
              }
              return post;
            })
          }))
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEYS.SEARCH, searchTerm, category], context.previousData);
      }
      console.error('Save post error:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEARCH, searchTerm, category] });
    },
  });

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchTerm(query);
    
    if (!query || !query.trim()) {
      setIsSearchMode(false);
      return Promise.resolve();
    }
    
    setIsSearchMode(true);
    
    // The query will automatically refetch due to the queryKey change
    return Promise.resolve();
  }, []);

  // Load more search results
  const loadMoreSearchResults = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    await fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle category change
  const handleCategoryChange = useCallback((newCategory: string) => {
    if (newCategory === category) return;
    
    setCategory(newCategory);
    
    // The query will automatically refetch due to the queryKey change
  }, [category]);

  // Exit search mode
  const exitSearchMode = useCallback(() => {
    setSearchTerm('');
    setIsSearchMode(false);
    
    // Clear search cache
    queryClient.removeQueries({ queryKey: [QUERY_KEYS.SEARCH] });
  }, [queryClient]);

  // Handle like post
  const handleLikePost = useCallback(async (postId: string) => {
    await likeMutation.mutateAsync(postId);
  }, [likeMutation]);

  // Handle save post
  const handleSavePost = useCallback(async (postId: string) => {
    await saveMutation.mutateAsync(postId);
  }, [saveMutation]);

  // Memoize computed values to prevent unnecessary rerenders
  const computedError = React.useMemo(() => {
    return searchError?.message || likeMutation.error?.message || saveMutation.error?.message || null;
  }, [searchError?.message, likeMutation.error?.message, saveMutation.error?.message]);

  const computedIsSearching = React.useMemo(() => {
    return isSearching || isFetchingNextPage;
  }, [isSearching, isFetchingNextPage]);

  const computedIsAuthenticated = React.useMemo(() => {
    return !!userId;
  }, [userId]);

  return {
    // Data
    searchResults,
    userResults,
    communityResults,
    
    // State
    isSearching: computedIsSearching,
    error: computedError,
    isSearchMode,
    hasMoreSearchResults: hasNextPage,
    category,
    searchTerm,
    isAuthenticated: computedIsAuthenticated,
    
    // Loading states
    isFetchingNextPage,
    isLiking: likeMutation.isPending,
    isSaving: saveMutation.isPending,
    
    // Actions
    handleSearch,
    loadMoreSearchResults,
    handleCategoryChange,
    exitSearchMode,
    setSearchTerm,
    likePost: handleLikePost,
    savePost: handleSavePost,
    
    // Additional React Query actions
    refetchSearch,
  };
};