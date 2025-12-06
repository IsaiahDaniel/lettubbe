import { handleError } from "@/helpers/utils/handleError";
import { commentFeedSchema } from "@/helpers/validators/Feed.validator";
import { addCommentToPost, addReplyToComment } from "@/services/feed.service";
import { useGetVideoItemStore } from "@/store/feedStore"; // Add this import
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { MentionUser } from "@/store/videoUploadStore";
import { prepareMentionsForBackend } from "@/helpers/utils/mentionUtils";

const useAddComment = (postId: string, refetchCommment: any, replyToId: string | null = null, onSuccess?: () => void, mentions: MentionUser[] = []) => {
	const [commentText, setCommentText] = useState("");
	const queryClient = useQueryClient();
	const { updatePostCommentCount } = useGetVideoItemStore();

	const {
		control,
		watch,
		formState: { errors, isValid },
		handleSubmit,
	} = useForm({
		resolver: zodResolver(commentFeedSchema),
		mode: "onChange",
	});

	// Helper function to handle successful comment/reply submission
	const handleMutationSuccess = useCallback(async () => {
		setCommentText("");
		
		// Invalidate all comment queries for this post to ensure all components update
		await queryClient.invalidateQueries({
			queryKey: ["postComments", postId]
		});
		
		refetchCommment();
		
		// Update the comment count in the selected item store
		updatePostCommentCount(postId, 1); // Increment by 1
		
		// Invalidate feed queries to update comment counts in the main feed
		await queryClient.invalidateQueries({
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
		
		// Call the onSuccess callback if provided
		if (onSuccess) {
			onSuccess();
		}
	}, [postId, queryClient, refetchCommment, updatePostCommentCount, onSuccess]);

	// Define mutations for both commenting and replying
	const commentMutation = useMutation({
		onSuccess: handleMutationSuccess,
		onError: (error) => {
			handleError(error);
		},
		mutationFn: () => {
			const mentionData = prepareMentionsForBackend(commentText, mentions);
			return addCommentToPost(postId, mentionData.description, mentionData.mentions);
		},
		mutationKey: ["commentOnPost"],
	});

	const replyMutation = useMutation({
		onSuccess: handleMutationSuccess,
		onError: (error) => {
			handleError(error);
		},
		mutationFn: () => {
			const mentionData = prepareMentionsForBackend(commentText, mentions);
			return addReplyToComment(postId, replyToId as string, mentionData.description, mentionData.mentions);
		},
		mutationKey: ["replyToComment"],
	});

	const handleAddComment = useCallback(() => {
		// Trim the comment text
		const trimmedText = commentText.trim();
		
		// Early return if no text or if already submitting
		if (!trimmedText) return;
		
		// Check if either mutation is already pending
		if (commentMutation.isPending || replyMutation.isPending) {
			return;
		}

		if (replyToId) {
			// If replyToId exists, we're replying to a comment
			replyMutation.mutate();
		} else {
			// Otherwise, we're adding a new comment
			commentMutation.mutate();
		}
	}, [commentText, replyToId, commentMutation, replyMutation]);

	// Determine which mutation state to use for isPending
	const isPending = replyToId ? replyMutation.isPending : commentMutation.isPending;
	
	// Also check if the other mutation is pending to prevent switching between reply/comment modes
	const isAnyPending = commentMutation.isPending || replyMutation.isPending;
	
	// Determine which mutation data to use
	const data = replyToId ? replyMutation.data : commentMutation.data;

	return {
		handleAddComment,
		commentText,
		handleSubmit,
		setCommentText,
		control,
		watch,
		isPending: isAnyPending,
		data,
	};
};

export default useAddComment;