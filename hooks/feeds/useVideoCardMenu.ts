import { useState, useCallback, useMemo } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter, usePathname } from "expo-router";
import { deletePost } from "@/services/feed.service";
import { useAlert } from "@/components/ui/AlertProvider";

// Define the menu option interface
interface MenuOption {
  name: string;
  available: boolean;
  info?: string;
  textStyle?: {
    color: string;
  };
}

// Define the hook parameters interface
interface VideoCardMenuProps {
  videoId: string;
  isCurrentUserVideo: boolean;
  isPhotoPost?: boolean;
  onDeleteSuccess?: () => void;
  onEditPress?: (videoId: string) => void;
  onReportPress?: (videoId: string) => void;
  onNotInterestedPress?: (videoId: string) => void;
  onSaveToPlaylistPress?: (videoId: string) => void;
}

// Define the hook return type
interface VideoCardMenuReturn {
  menuOptions: MenuOption[];
  handleMenuSelect: (option: string) => void;
  isDeleting: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  isReporting: boolean;
  setIsReporting: (value: boolean) => void;
  isNotInterested: boolean;
  setIsNotInterested: (value: boolean) => void;
  isSavingToPlaylist: boolean;
  setIsSavingToPlaylist: (value: boolean) => void;
  deleteError: Error | null;
}

const useVideoCardMenu = ({
  videoId,
  isCurrentUserVideo,
  isPhotoPost = false,
  onDeleteSuccess,
  onEditPress,
  onReportPress,
  onNotInterestedPress,
  onSaveToPlaylistPress,
}: VideoCardMenuProps): VideoCardMenuReturn => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const { showAlert, showInfoOnly, showError, showConfirm } = useAlert();

  // State for other actions
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [isNotInterested, setIsNotInterested] = useState<boolean>(false);
  const [isSavingToPlaylist, setIsSavingToPlaylist] = useState<boolean>(false);

  const redTextStyle = { color: "#F5222D" };

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (response) => {
      console.log("Post deleted successfully:", response);

      // Invalidate all relevant queries using predicate
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            (queryKey[0] === "userFeeds" ||
              queryKey[0] === "feeds" ||
              queryKey[0] === "userPublicUploads" ||
              queryKey[0] === "userUploads")
          );
        },
        refetchType: 'all'
      });

      // Call the optional success callback if provided
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }

      // Show success message
      showInfoOnly("Success", "Your post has been deleted.");
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      showError(
        "Error",
        "Something went wrong while deleting your post. Please try again."
      );
    },
  });

  // Define menu options based on whether it's the current user's video and if it's a photo post
  const menuOptions = useMemo<MenuOption[]>(() => {
    if (isCurrentUserVideo) {
      const options = [];
      
      // Only add "Save to playlist" for video posts, not photo posts
      if (!isPhotoPost) {
        options.push({ name: "Save to playlist", available: true });
      }
      
      options.push(
        // { name: "Turn off commenting", available: true },
        // { name: "View insights", available: true },
        { name: "Edit Post", available: true },
        {
          name: "Delete",
          available: true,
          info: "danger",
          textStyle: redTextStyle,
        }
      );
      
      return options;
    } else {
      const options = [];
      
      // Only add "Save to playlist" for video posts, not photo posts
      if (!isPhotoPost) {
        options.push({ name: "Save to playlist", available: true });
      }
      
      options.push(
        // { name: "Not interested", available: true },
        // { name: "Don't recommend channel", available: true },
        // {
        //   name: "Report",
        //   available: true,
        //   info: "danger",
        //   textStyle: redTextStyle,
        // }
      );
      
      return options;
    }
  }, [isCurrentUserVideo, isPhotoPost]);

  // Handle post deletion with confirmation
  const handleDeletePost = useCallback((): void => {
    deletePostMutation.mutate(videoId);
  }, [videoId, deletePostMutation]);

  // Show confirmation dialog for delete action
  const confirmDelete = useCallback((): void => {
    showConfirm(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      handleDeletePost,
      undefined, // onCancel - will use default behavior
      "Delete",
      "Cancel",
      "danger"
    );
  }, [handleDeletePost, showConfirm]);

  // Handle edit post action
  const handleEditPost = useCallback((): void => {
    setIsEditing(true);
    if (onEditPress) {
      onEditPress(videoId);
    }
  }, [videoId, onEditPress]);

  // Handle report post action
  const handleReportPost = useCallback((): void => {
    setIsReporting(true);
    if (onReportPress) {
      onReportPress(videoId);
    }
  }, [videoId, onReportPress]);

  // Handle not interested action
  const handleNotInterested = useCallback((): void => {
    setIsNotInterested(true);
    if (onNotInterestedPress) {
      onNotInterestedPress(videoId);
    }
  }, [videoId, onNotInterestedPress]);

  // Handle save to playlist action
  const handleSaveToPlaylist = useCallback((): void => {
    setIsSavingToPlaylist(true);
    if (onSaveToPlaylistPress) {
      onSaveToPlaylistPress(videoId);
    } else {
      // Navigate to playlist screen if no handler is provided
      router.push({
        pathname: "/(profile)/SaveToPlaylist",
        params: { videoId, returnTo: pathname },
      });
    }
  }, [videoId, onSaveToPlaylistPress, router, pathname]);

  // Handle menu option selection
  const handleMenuSelect = useCallback(
    (option: string): void => {
      console.log("Selected option:", option);

      switch (option) {
        case "Save to playlist":
          console.log("Save to playlist selected");
          handleSaveToPlaylist();
          break;
        case "Not interested":
          console.log("Not interested selected");
          handleNotInterested();
          break;
        case "Don't recommend channel":
          console.log("Don't recommend channel selected");
          break;
        case "Report":
          console.log("Report selected");
          handleReportPost();
          break;
        case "Turn off commenting":
          console.log("Turn off commenting selected");
          break;
        case "View insights":
          console.log("View insights selected");
          break;
        case "Edit Post":
          console.log("Edit Post selected");
          handleEditPost();
          break;
        case "Delete":
          confirmDelete(); // Call the confirm delete function
          break;
        default:
          break;
      }
    },
    [
      confirmDelete,
      handleEditPost,
      handleReportPost,
      handleNotInterested,
      handleSaveToPlaylist,
      router,
      videoId,
    ]
  );

  return {
    menuOptions,
    handleMenuSelect,
    isDeleting: deletePostMutation.isPending,
    isEditing,
    setIsEditing,
    isReporting,
    setIsReporting,
    isNotInterested,
    setIsNotInterested,
    isSavingToPlaylist,
    setIsSavingToPlaylist,
    deleteError: deletePostMutation.error,
  };
};

export default useVideoCardMenu;
