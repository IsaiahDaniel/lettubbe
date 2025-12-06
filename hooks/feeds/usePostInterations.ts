// import { handleError } from "@/helpers/utils/handleError";
// import { likePost } from "@/services/feed.service";
// import { useMutation } from "@tanstack/react-query";
// import useGetUserFeeds from "./useGetUserFeeds";

// const usePostInterations = (postId: string) => {
// 	const { refetch } = useGetUserFeeds();
// 	const { mutate, isPending, error, isError } = useMutation({
// 		mutationFn: () => likePost(postId),
// 		mutationKey: ["likePost", postId],
// 		onSuccess: (data) => {
// 			refetch();
// 		},
// 		onError: (error: any) => {
// 			handleError(error);
// 		},
// 	});

// 	const handleLikePost = () => {
// 		mutate();
// 	};

// 	return {
// 		handleLikePost,
// 		isPending,
// 	};
// };

// export default usePostInterations;

import { handleError } from "@/helpers/utils/handleError";
import { likePost, likeComment, likePostReply } from "@/services/feed.service";
import { useMutation } from "@tanstack/react-query";
import useGetUserFeeds from "./useGetUserFeeds";
import useGetComments from "./useGetComments";
import { useState, useEffect } from "react";

type InteractionType =
	| { type: "post"; postId: string }
	| { type: "comment"; postId: string; commentId: string }
	| { type: "reply"; postId: string; commentId: string; replyId: string };

const usePostInteractions = (_id: string, galleryRefetch?: () => Promise<any>) => {
	const [postId, setPostId] = useState<string>(_id || "");
	const { refetch: refetchFeeds } = useGetUserFeeds();
	const { refetchCommment } = useGetComments(postId);

	// Update postId if _id changes
	useEffect(() => {
		if (_id) {
			setPostId(_id);
		}
	}, [_id]);

	const { mutate, isPending } = useMutation({
		mutationFn: async (interaction: InteractionType) => {
			switch (interaction.type) {
				case "post":
					return await likePost(interaction.postId);
				case "comment":
					return await likeComment(interaction.postId, interaction.commentId);
				case "reply":
					return await likePostReply(interaction.postId, interaction.commentId, interaction.replyId);
			}
		},
		onSuccess: async (data, variables) => {
			// Create an array of promises to wait for
			const refetchPromises = [];

			// Add gallery refetch if provided
			if (galleryRefetch) {
				refetchPromises.push(galleryRefetch());
			}
			
			// Always refetch feeds to keep home view in sync
			refetchPromises.push(refetchFeeds());
			
			// Refetch comments if we're working with a post
			if (postId) {
				refetchPromises.push(refetchCommment());
			}

			// Wait for all refetch operations to complete
			try {
				await Promise.all(refetchPromises);
			} catch (error) {
				console.error("Error during refetch operations:", error);
			}
		},
		onError: (error: any) => {
			handleError(error);
		},
	});

	const handleInteraction = (interaction: InteractionType) => {
		if (interaction.postId) {
			setPostId(interaction.postId);
		}
		mutate(interaction);
	};

	return {
		handleInteraction,
		isPending,
	};
};

export default usePostInteractions;