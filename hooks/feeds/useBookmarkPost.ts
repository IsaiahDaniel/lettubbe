import { handleError } from "@/helpers/utils/handleError";
import { bookmarkedPost, getBookmarkedPosts } from "@/services/feed.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import useGetUserFeeds from "./useGetUserFeeds";

const useBookmarkPost = (postId: string) => {
	const { refetch } = useGetUserFeeds();

	// Query for fetching all bookmarked posts
	const {
		isPending: isPendingBookmark,
		data: bookmarkedPostsResponse,
		isSuccess,
		isError: isBookmarkQueryError,
		error: bookmarkQueryError,
		refetch: refetchBookmark,
	} = useQuery({
		queryKey: ["bookmarkedPosts"],
		queryFn: () => getBookmarkedPosts(),
		// Initialize with a default value to avoid undefined errors
		// initialData: { data: [] },
	});

	// Create a safe reference to the bookmarked posts that will never be undefined
	const bookmarkedPosts = bookmarkedPostsResponse || { data: [] };

	// Mutation for bookmarking/unbookmarking a specific post
	const { mutate, isPending, error, isError } = useMutation({
		mutationFn: () => bookmarkedPost(postId),
		mutationKey: ["bookmarkedPost", postId],
		onSuccess: (data) => {
			// Refetch both the user feeds and bookmarked posts to keep everything in sync
			refetch();
			refetchBookmark();
		},
		onError: (error: any) => {
			handleError(error);
		},
	});

	const handleBookmarkPost = () => {
		// Only try to bookmark if we have a postId
		if (postId) {
			mutate();
		}
	};

	return {
		handleBookmarkPost,
		isPending,
		isPendingBookmark,
		refetchBookmark,
		bookmarkedPosts,
		isError: isBookmarkQueryError,
		error: bookmarkQueryError,
	};
};

export default useBookmarkPost;