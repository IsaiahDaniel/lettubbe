import { getFeedComments } from "@/services/feed.service";
import { useQuery } from "@tanstack/react-query";

const useGetComments = (postId: string, options?: { enabled: boolean; }) => {
	const {
		isPending,
		data,
		isSuccess,
		refetch: refetchCommment,
	} = useQuery({
		queryKey: ["postComments", postId],
		queryFn: () => getFeedComments(postId),
		enabled: (options?.enabled ?? true) && !!postId, // Default to true if not specified, but respect false
	});

	// Sort the comments by createdAt in descending order
	const sortedComments = data?.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	return {
		isSuccess,
		isPending,
		data: sortedComments,
		refetchCommment,
	};
};

export default useGetComments;
