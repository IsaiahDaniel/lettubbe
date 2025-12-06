import { useCallback } from "react";
import { useInteractionStore } from "@/hooks/interactions/useInteractionStore";
import { useQueryClient } from "@tanstack/react-query";

interface RefetchOptions {
  feedsQueryKey?: string[];
  commentsQueryKey?: string[];
  galleryRefetch?: () => Promise<any>;
}

export const useGlobalInteractions = (
  postId: string,
  options?: RefetchOptions
) => {
  const queryClient = useQueryClient();
  const { 
    toggleLikePost, 
    toggleBookmarkPost, 
    isPostLiked, 
    isPostBookmarked,
  } = useInteractionStore();

  // refetch. ensuring all related queries are updated
  const handleRefetch = useCallback(async () => {
    const refetchPromises = [];

    // Add gallery refetch if provided
    if (options?.galleryRefetch) {
      refetchPromises.push(options.galleryRefetch());
    }

    // Invalidate all feed-related queries more aggressively
    queryClient.invalidateQueries({
      predicate: (query: any) => {
        const queryKey = query.queryKey;
        return (
          Array.isArray(queryKey) &&
          (queryKey[0] === "userFeeds" ||
            queryKey[0] === "feeds" ||
            queryKey[0] === "userUploads" ||
            queryKey[0] === "posts" ||
            queryKey.includes("feed") ||
            queryKey.includes("post"))
        );
      },
    });

    // Also invalidate specific queries
    if (options?.feedsQueryKey) {
      queryClient.invalidateQueries({
        queryKey: options.feedsQueryKey,
      });
    }

    // Invalidate comments queries if needed
    if (options?.commentsQueryKey) {
      queryClient.invalidateQueries({
        queryKey: options.commentsQueryKey,
      });
    }

    // Wait for all refetch operations to complete
    try {
      await Promise.all(refetchPromises);
      
      // Small delay to ensure queries have time to refetch
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error("Error during refetch operations:", error);
    }
  }, [queryClient, options]);

  // like
  const handleLikePost = useCallback(
    async (likeCount = 0) => {
      try {
        console.log(`Attempting to like post ${postId}, current like count: ${likeCount}`);
        
        // Call the store action
        const response = await toggleLikePost(postId, likeCount);
        
        console.log(`Like response for post ${postId}:`, response);

        // Force immediate refetch to sync state
        await handleRefetch();
        
        // manually sync the store if we have the updated post data
        // helps ensure consistency between store and server state
        
      } catch (error) {
        console.error("Error liking post:", error);
        throw error;
      }
    },
    [postId, toggleLikePost, handleRefetch]
  );

  // Handle bookmarking a post
  const handleBookmarkPost = useCallback(async () => {
    try {
      console.log(`Attempting to bookmark post ${postId}`);
      
      // Call the store action
      await toggleBookmarkPost(postId);

      // Refetch data to keep UI in sync
      await handleRefetch();
    } catch (error) {
      console.error("Error bookmarking post:", error);
      throw error;
    }
  }, [postId, toggleBookmarkPost, handleRefetch]);

  return {
    handleLikePost,
    handleBookmarkPost,
    isLiked: isPostLiked(postId),
    isBookmarked: isPostBookmarked(postId),
  };
};