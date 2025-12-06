import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blockChannel, unblockChannel } from "@/services/profile.service";
import { handleError } from "@/helpers/utils/handleError";
import { useAlert } from "@/components/ui/AlertProvider";

interface UseBlockChannelProps {
  onBlockSuccess?: () => void;
  onUnblockSuccess?: () => void;
  onError?: (error: any) => void;
  userId?: string; // to properly invalidate the specific profile query
}

export const useBlockChannel = ({
  onBlockSuccess,
  onUnblockSuccess,
  onError,
  userId,
}: UseBlockChannelProps = {}) => {
  const queryClient = useQueryClient();
  const { showConfirm } = useAlert();

  const blockMutation = useMutation({
    mutationFn: (channelId: string) => blockChannel(channelId),
    onSuccess: async (data) => {
      console.log("Block API response:", data);

      // Specifically invalidate and refetch the public profile for this user
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: ["publicProfile", userId],
        });

        // Force refetch to ensure we get fresh data
        await queryClient.refetchQueries({
          queryKey: ["publicProfile", userId],
        });
      }

      // Invalidate other relevant queries
      queryClient.invalidateQueries({
        predicate: (query: any) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            (queryKey[0] === "userFeeds" || queryKey[0] === "feeds")
          );
        },
      });

      onBlockSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to block channel:", error);
      // onError?.(error);
      handleError(error);
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (channelId: string) => unblockChannel(channelId),
    onSuccess: async (data) => {
      console.log("Unblock API response:", data);

      // Specifically invalidate and refetch the public profile for this user
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: ["publicProfile", userId],
        });

        // Force refetch to ensure we get fresh data
        await queryClient.refetchQueries({
          queryKey: ["publicProfile", userId],
        });
      }

      // Invalidate other relevant queries
      queryClient.invalidateQueries({
        predicate: (query: any) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            (queryKey[0] === "userFeeds" || queryKey[0] === "feeds")
          );
        },
      });

      onUnblockSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to unblock channel:", error);
      onError?.(error);
    },
  });

  const handleBlockChannel = async (
    channelId: string,
    displayName?: string
  ) => {
    showConfirm(
      "Block Channel",
      `Are you sure you want to block ${
        displayName || "this channel"
      }? You won't see their content anymore.`,
      () => blockMutation.mutate(channelId),
      undefined,
      "Block",
      "Cancel",
      "danger"
    );
  };

  const handleUnblockChannel = async (
    channelId: string,
    displayName?: string
  ) => {
    showConfirm(
      "Unblock Channel",
      `Are you sure you want to unblock ${
        displayName || "this channel"
      }? You will start seeing their content again.`,
      () => unblockMutation.mutate(channelId),
      undefined,
      "Unblock",
      "Cancel",
      "primary"
    );
  };

  return {
    blockChannel: handleBlockChannel,
    unblockChannel: handleUnblockChannel,
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
    isLoading: blockMutation.isPending || unblockMutation.isPending,
    blockError: blockMutation.error,
    unblockError: unblockMutation.error,
    isBlockSuccess: blockMutation.isSuccess,
    isUnblockSuccess: unblockMutation.isSuccess,
  };
};