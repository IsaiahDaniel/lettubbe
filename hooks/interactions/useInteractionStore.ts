import { create } from "zustand";
import { GenericResponse } from "@/helpers/types/general.types";
import {
  likePost,
  bookmarkedPost,
  likeComment,
  likePostReply,
  trackVideoPlay,
} from "@/services/feed.service";

interface InteractionState {
  // Current user ID for checking interactions
  currentUserId: string | null;

  // Track liked posts/comments/replies
  likedPosts: Set<string>;
  likedComments: Map<string, Set<string>>;
  likedReplies: Map<string, Map<string, Set<string>>>;

  // Track bookmarked posts
  bookmarkedPosts: Set<string>;

  // Track plays count for posts
  playsCount: Map<string, number>;

  // Track if we've synced for this user session
  hasSyncedForUser: string | null;

  // Set current user ID
  setCurrentUserId: (userId: string | null) => void;

  // Methods to update state optimistically and sync with backend
  toggleLikePost: (
    postId: string,
    initialLikeCount: number
  ) => Promise<GenericResponse>;
  toggleLikeComment: (
    postId: string,
    commentId: string
  ) => Promise<GenericResponse>;
  toggleLikeReply: (
    postId: string,
    commentId: string,
    replyId: string
  ) => Promise<GenericResponse>;
  toggleBookmarkPost: (postId: string) => Promise<GenericResponse>;
  trackVideoPlay: (postId: string) => Promise<GenericResponse>;

  // Helpers to check status
  isPostLiked: (postId: string) => boolean;
  isCommentLiked: (postId: string, commentId: string) => boolean;
  isReplyLiked: (postId: string, commentId: string, replyId: string) => boolean;
  isPostBookmarked: (postId: string) => boolean;
  getPlaysCount: (postId: string) => number;

  // Sync state with fetched data
  syncLikedPosts: (posts: any[]) => void;
  syncBookmarkedPosts: (posts: any[]) => void;
  syncPlaysCount: (posts: any[]) => void;

  // Update individual post plays count
  updatePostPlaysCount: (postId: string, count: number) => void;

  // Reset store state
  resetStore: () => void;
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  currentUserId: null,
  likedPosts: new Set<string>(),
  likedComments: new Map<string, Set<string>>(),
  likedReplies: new Map<string, Map<string, Set<string>>>(),
  bookmarkedPosts: new Set<string>(),
  playsCount: new Map<string, number>(),
  hasSyncedForUser: null,

  // Set current user ID and reset state only if switching between different users
  setCurrentUserId: (userId) => {
    const { currentUserId, resetStore } = get();

    // If user changed, reset the store
    if (currentUserId !== userId) {
      if (userId === null) {
        // Logging out - reset everything
        console.log('🔧 INTERACTION_STORE: User logging out, resetting store');
        resetStore();
      } else if (currentUserId === null) {
        // Initial login - just set the user ID without resetting data
        console.log('🔧 INTERACTION_STORE: Initial login, preserving existing data');
        set({ currentUserId: userId });
      } else {
        // Switching between different user IDs - reset everything
        console.log('🔧 INTERACTION_STORE: Switching users, resetting store', { from: currentUserId, to: userId });
        set({
          currentUserId: userId,
          likedPosts: new Set<string>(),
          likedComments: new Map<string, Set<string>>(),
          likedReplies: new Map<string, Map<string, Set<string>>>(),
          bookmarkedPosts: new Set<string>(),
          playsCount: new Map<string, number>(),
          hasSyncedForUser: null,
        });
      }
    } else {
      set({ currentUserId: userId });
    }
  },

  // Reset store to initial state
  resetStore: () =>
    set({
      currentUserId: null,
      likedPosts: new Set<string>(),
      likedComments: new Map<string, Set<string>>(),
      likedReplies: new Map<string, Map<string, Set<string>>>(),
      bookmarkedPosts: new Set<string>(),
      playsCount: new Map<string, number>(),
      hasSyncedForUser: null,
    }),

  // Check methods
  isPostLiked: (postId: string) => {
    const { likedPosts } = get();
    // Check for the original ID and both possible prefixed versions
    return likedPosts.has(postId) || 
           likedPosts.has(`pinned-${postId}`) || 
           likedPosts.has(`regular-${postId}`);
  },
  isCommentLiked: (postId: string, commentId: string) =>
    get().likedComments.get(postId)?.has(commentId) || false,
  isReplyLiked: (postId: string, commentId: string, replyId: string) =>
    get().likedReplies.get(postId)?.get(commentId)?.has(replyId) || false,
  isPostBookmarked: (postId: string) => get().bookmarkedPosts.has(postId),
  getPlaysCount: (postId: string) => get().playsCount.get(postId) || 0,

  // Sync with fetched data
  syncLikedPosts: (posts) => {
    const { currentUserId, likedPosts: existingLikedPosts } = get();
    if (!currentUserId) {
      console.log('⚠️  SYNC_SKIPPED: No currentUserId available for sync');
      return;
    }

    // console.log(
    //   `🔄 SYNCING liked posts for user ${currentUserId}`,
    //   `Posts count: ${posts.length}`,
    //   `Existing likes:`, Array.from(existingLikedPosts)
    // );

    const newLikedPostIds = new Set<string>(existingLikedPosts);

    posts.forEach((post) => {
      if (!post?._id) return;

      const userLikedPost =
        Array.isArray(post.reactions?.likes) &&
        post.reactions.likes.some((id: string) => id === currentUserId);

      // Generate the correct prefixed ID that matches what's used in the UI
      const prefixedId = post.isPinned ? `pinned-${post._id}` : `regular-${post._id}`;

      if (userLikedPost) {
        newLikedPostIds.add(prefixedId);
      } else {
        // Only remove if we're sure it's not liked
        // prevents removing optimistic updates
        if (!existingLikedPosts.has(prefixedId)) {
          newLikedPostIds.delete(prefixedId);
        }
      }
    });

    // Check if the state actually changed before triggering update
    const existingSize = existingLikedPosts.size;
    const newSize = newLikedPostIds.size;
    
    // Compare sets to see if there are actual changes
    let hasChanges = existingSize !== newSize;
    if (!hasChanges) {
      // Check if the content is different
      for (const id of newLikedPostIds) {
        if (!existingLikedPosts.has(id)) {
          hasChanges = true;
          break;
        }
      }
    }

    if (!hasChanges) {
      // console.log('🔍 SYNC_SKIPPED: No changes detected in liked posts, skipping state update');
      return;
    }

    // console.log('🔍 SYNC_STATE_CHANGE: Updating liked posts state with changes');
    
    set({
      likedPosts: newLikedPostIds,
      hasSyncedForUser: currentUserId,
    });
  },

  syncBookmarkedPosts: (posts) => {
    const { currentUserId, bookmarkedPosts: existingBookmarks } = get();
    if (!currentUserId) return;

    // console.log(`Syncing bookmarked posts for user ${currentUserId}`);

    const newBookmarkedPostIds = new Set<string>(existingBookmarks);

    posts.forEach((post) => {
      if (!post?._id) return;

      if (post.isBookmarked) {
        newBookmarkedPostIds.add(post._id);
      } else {
        newBookmarkedPostIds.delete(post._id);
      }
    });

    // Check if the state actually changed before triggering update
    const existingSize = existingBookmarks.size;
    const newSize = newBookmarkedPostIds.size;
    
    // Compare sets to see if there are actual changes
    let hasChanges = existingSize !== newSize;
    if (!hasChanges) {
      // Check if the content is different
      for (const id of newBookmarkedPostIds) {
        if (!existingBookmarks.has(id)) {
          hasChanges = true;
          break;
        }
      }
    }

    if (!hasChanges) {
      // console.log('🔍 BOOKMARK_SYNC_SKIPPED: No changes detected in bookmarked posts, skipping state update');
      return;
    }

    set({ bookmarkedPosts: newBookmarkedPostIds });
  },

  // sync plays count from fetched data
  syncPlaysCount: (posts) => {
    const { playsCount: existingPlaysCount } = get();

    // console.log(`Syncing plays count for ${posts.length} posts`);

    const newPlaysCount = new Map<string, number>(existingPlaysCount);
    let hasChanges = false;

    posts.forEach((post) => {
      if (!post?._id) return;

      // Get the actual views count - prefer top-level 'totalViews' field over reactions.totalViews
      let apiCount = 0;

      // First check if there's a top-level totalViews field
      if (typeof post.totalViews === "number") {
        apiCount = post.totalViews;
      }
      // Fallback to reactions.totalViews if top-level totalViews doesn't exist
      else if (Array.isArray(post.reactions?.totalViews)) {
        apiCount = post.reactions.totalViews.length;
      } else if (typeof post.reactions?.totalViews === "number") {
        apiCount = post.reactions.totalViews;
      }

      // Check if this is actually a change
      const existingCount = existingPlaysCount.get(post._id);
      if (existingCount !== apiCount) {
        hasChanges = true;
        newPlaysCount.set(post._id, apiCount);
        // console.log(`Post ${post._id}: setting views count to ${apiCount}`);
      }
    });

    if (!hasChanges) {
      // console.log('🔍 PLAYS_SYNC_SKIPPED: No changes detected in plays count, skipping state update');
      return;
    }

    set({ playsCount: newPlaysCount });
    // console.log(`Synced plays count for ${newPlaysCount.size} posts`);
  },

  // Update individual post plays count
  updatePostPlaysCount: (postId: string, count: number) => {
    const { playsCount: existingPlaysCount } = get();
    const newPlaysCount = new Map(existingPlaysCount);
    newPlaysCount.set(postId, count);
    set({ playsCount: newPlaysCount });
  },

  // Existing toggle methods...
  toggleLikePost: async (postId, initialLikeCount) => {
    const { likedPosts, currentUserId } = get();

    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    // Check if currently liked using the same logic as isPostLiked
    const isCurrentlyLiked = likedPosts.has(postId) || 
                            likedPosts.has(`pinned-${postId}`) || 
                            likedPosts.has(`regular-${postId}`);

    // Optimistic update - handle all possible ID formats
    const newLikedPosts = new Set(likedPosts);
    
    if (isCurrentlyLiked) {
      // Remove all possible variants of the ID
      newLikedPosts.delete(postId);
      newLikedPosts.delete(`pinned-${postId}`);
      newLikedPosts.delete(`regular-${postId}`);
      
      // Also handle case where postId is already prefixed
      if (postId.startsWith('pinned-') || postId.startsWith('regular-')) {
        const baseId = postId.replace(/^(pinned-|regular-)/, '');
        newLikedPosts.delete(baseId);
        newLikedPosts.delete(`pinned-${baseId}`);
        newLikedPosts.delete(`regular-${baseId}`);
      }
    } else {
      // Add the exact postId format that was passed in
      newLikedPosts.add(postId);
    }

    set({ likedPosts: newLikedPosts });

    try {
      // Extract the actual post ID for API call
      const actualPostId = postId.replace(/^(pinned-|regular-)/, '');
      const response = await likePost(actualPostId);

      // Ensure the optimistic update stays in place
      // actual sync will happen when data is refetched
      // console.log(`Like action completed for post ${postId} (API ID: ${actualPostId}):`, response);

      return response;
    } catch (error) {
      // console.error("Failed to like post:", error);
      // Revert optimistic update on error
      set({ likedPosts });
      throw error;
    }
  },

  toggleLikeComment: async (postId, commentId) => {
    const { likedComments, currentUserId } = get();

    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    const postComments = likedComments.get(postId) || new Set<string>();
    const isCurrentlyLiked = postComments.has(commentId);

    const newPostComments = new Set(postComments);
    if (isCurrentlyLiked) {
      newPostComments.delete(commentId);
    } else {
      newPostComments.add(commentId);
    }

    const newLikedComments = new Map(likedComments);
    newLikedComments.set(postId, newPostComments);

    set({ likedComments: newLikedComments });

    try {
      const response = await likeComment(postId, commentId);
      return response;
    } catch (error) {
      set({ likedComments });
      throw error;
    }
  },

  toggleLikeReply: async (postId, commentId, replyId) => {
    const { likedReplies, currentUserId } = get();

    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    const postReplies =
      likedReplies.get(postId) || new Map<string, Set<string>>();
    const commentReplies = postReplies.get(commentId) || new Set<string>();
    const isCurrentlyLiked = commentReplies.has(replyId);

    const newCommentReplies = new Set(commentReplies);
    if (isCurrentlyLiked) {
      newCommentReplies.delete(replyId);
    } else {
      newCommentReplies.add(replyId);
    }

    const newPostReplies = new Map(postReplies);
    newPostReplies.set(commentId, newCommentReplies);

    const newLikedReplies = new Map(likedReplies);
    newLikedReplies.set(postId, newPostReplies);

    set({ likedReplies: newLikedReplies });

    try {
      const response = await likePostReply(postId, commentId, replyId);
      return response;
    } catch (error) {
      set({ likedReplies });
      throw error;
    }
  },

  toggleBookmarkPost: async (postId) => {
    const { bookmarkedPosts, currentUserId } = get();

    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    const isCurrentlyBookmarked = bookmarkedPosts.has(postId);

    const newBookmarkedPosts = new Set(bookmarkedPosts);
    if (isCurrentlyBookmarked) {
      newBookmarkedPosts.delete(postId);
    } else {
      newBookmarkedPosts.add(postId);
    }

    set({ bookmarkedPosts: newBookmarkedPosts });

    try {
      const response = await bookmarkedPost(postId);
      return response;
    } catch (error) {
      set({ bookmarkedPosts });
      throw error;
    }
  },

  // Track video play
  trackVideoPlay: async (postId: string) => {
    const { currentUserId } = get();

    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    try {
      const response = await trackVideoPlay(postId);

      // console.log("Store track play response:", response);

      // Check for success properly
      if (response && response.success === true) {
        // console.log(`Video play tracked via store for post ${postId}`);

        // Update with the actual count from API response
        if (response.data && Array.isArray(response.data.totalViews)) {
          const actualCount = response.data.totalViews.length;
          const { playsCount: existingPlaysCount } = get();
          const updatedPlaysCount = new Map(existingPlaysCount);
          updatedPlaysCount.set(postId, actualCount);
          set({ playsCount: updatedPlaysCount });
          // console.log(`Updated plays count from API response: ${actualCount}`);
        }

        return response;
      } else {
        // console.warn(
        //   `API returned failure for post ${postId}:`,
        //   response?.message
        // );
        throw new Error(response?.message || "Failed to track play");
      }
    } catch (error) {
      // console.error("Failed to track video play:", error);
      throw error;
    }
  },
}));
