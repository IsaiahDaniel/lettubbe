import { useState } from "react";
import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPostToPlaylist as apiAddPostToPlaylist, removePostFromPlaylist as apiRemovePostFromPlaylist } from "@/services/playlist.service";

interface PlaylistActionParams {
  playlistId: string;
  postId: string;
}

interface UseVideoPlaylistActionsProps {
  onSuccess?: (postId: string, playlistId: string) => void;
  onError?: (error: any, postId: string, playlistId: string) => void;
  onRemoveSuccess?: (postId: string, playlistId: string) => void;
  onRemoveError?: (error: any, postId: string, playlistId: string) => void;
}

export const useVideoPlaylistActions = (props?: UseVideoPlaylistActionsProps) => {
  const { onSuccess, onError, onRemoveSuccess, onRemoveError } = props || {};
  const [addedPosts, setAddedPosts] = useState<Record<string, string[]>>({});
  const queryClient = useQueryClient();

  const addToPlaylistMutation = useMutation<any, Error, PlaylistActionParams>({
    mutationFn: async ({ playlistId, postId }) => {
      console.log(`Calling API to add post ${postId} to playlist ${playlistId}`);
      const response = await apiAddPostToPlaylist({ playlistId, postId });
      console.log("API response:", response);
      return response;
    },
    onSuccess: (data, variables) => {
      // Update the addedPosts state
      const { postId, playlistId } = variables;
      console.log(`Mutation successful for post ${postId} to playlist ${playlistId}`);
      
      setAddedPosts(prev => {
        const playlistPosts = prev[playlistId] || [];
        if (!playlistPosts.includes(postId)) {
          return {
            ...prev,
            [playlistId]: [...playlistPosts, postId]
          };
        }
        return prev;
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlistVideos', playlistId] });

      if (onSuccess) {
        onSuccess(postId, playlistId);
      }
    },
    onError: (error, variables) => {
      console.error("Error adding post to playlist:", error);
      
      // Call the error callback if provided
      if (onError && variables) {
        onError(error, variables.postId, variables.playlistId);
      } else {
        Alert.alert("Error", "Failed to add post to playlist. Please try again.");
      }
    }
  });

  const removeFromPlaylistMutation = useMutation<any, Error, PlaylistActionParams>({
    mutationFn: async ({ playlistId, postId }) => {
      console.log(`Calling API to remove post ${postId} from playlist ${playlistId}`);
      const response = await apiRemovePostFromPlaylist({ playlistId, postId });
      console.log("API response:", response);
      return response;
    },
    onSuccess: (data, variables) => {
      // Update the addedPosts state
      const { postId, playlistId } = variables;
      console.log(`Mutation successful for removing post ${postId} from playlist ${playlistId}`);
      
      setAddedPosts(prev => {
        const playlistPosts = prev[playlistId] || [];
        return {
          ...prev,
          [playlistId]: playlistPosts.filter(id => id !== postId)
        };
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlistVideos', playlistId] });

      if (onRemoveSuccess) {
        onRemoveSuccess(postId, playlistId);
      }
    },
    onError: (error, variables) => {
      console.error("Error removing post from playlist:", error);
      
      // Call the error callback if provided
      if (onRemoveError && variables) {
        onRemoveError(error, variables.postId, variables.playlistId);
      } else {
        Alert.alert("Error", "Failed to remove post from playlist. Please try again.");
      }
    }
  });

  // Check if a post is already added to a playlist
  const isPostAddedToPlaylist = (postId: string, playlistId: string): boolean => {
    const playlistPosts = addedPosts[playlistId] || [];
    return playlistPosts.includes(postId);
  };

  // Add a post to a playlist
  const addPostToPlaylist = async (postId: string, playlistId: string): Promise<any> => {
    if (!playlistId) {
      console.error("Playlist ID is missing");
      return Promise.reject("Playlist ID is missing");
    }
    
    if (isPostAddedToPlaylist(postId, playlistId)) {
      console.log(`Post ${postId} is already in playlist ${playlistId}`);
      return Promise.resolve(); // Return a resolved promise for consistent behavior
    }
    
    console.log(`Adding post ${postId} to playlist ${playlistId}`);
    try {
      const result = await addToPlaylistMutation.mutateAsync({ playlistId, postId });
      console.log(`Successfully added post ${postId} to playlist ${playlistId}`, result);
      return result;
    } catch (error) {
      console.error(`Failed to add post ${postId} to playlist ${playlistId}:`, error);
      throw error;
    }
  };

  // Remove a post from a playlist
  const removePostFromPlaylist = async (postId: string, playlistId: string): Promise<any> => {
    if (!playlistId) {
      console.error("Playlist ID is missing");
      return Promise.reject("Playlist ID is missing");
    }
    
    console.log(`Removing post ${postId} from playlist ${playlistId}`);
    try {
      const result = await removeFromPlaylistMutation.mutateAsync({ playlistId, postId });
      console.log(`Successfully removed post ${postId} from playlist ${playlistId}`, result);
      return result;
    } catch (error) {
      console.error(`Failed to remove post ${postId} from playlist ${playlistId}:`, error);
      throw error;
    }
  };

  return {
    addedPosts,
    isPostAddedToPlaylist,
    isPending: addToPlaylistMutation.isPending || removeFromPlaylistMutation.isPending,
    pendingPostId: addToPlaylistMutation.variables?.postId || removeFromPlaylistMutation.variables?.postId,
    pendingPlaylistId: addToPlaylistMutation.variables?.playlistId || removeFromPlaylistMutation.variables?.playlistId,
    addPostToPlaylist,
    removePostFromPlaylist,
    isRemoving: removeFromPlaylistMutation.isPending,
    removingPostId: removeFromPlaylistMutation.variables?.postId,
    removingPlaylistId: removeFromPlaylistMutation.variables?.playlistId,
  };
};

export default useVideoPlaylistActions;