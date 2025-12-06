import { Images } from "@/constants";
import { getPlaylists } from "@/services/playlist.service";
import { useInfiniteQuery } from "@tanstack/react-query";

const usePlaylist = () => {
	// Categories query
	const {
		data,
		isLoading: playlistLoading,
		isError: playlistError,
		error: playlistErrorDetails,
		refetch: refetchPlaylist,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["playlist"],
		queryFn: ({ pageParam = 1 }) => getPlaylists({ pageParam }),
		initialPageParam: 1,
		staleTime: 3 * 60 * 1000, // 3 minutes
		gcTime: 5 * 60 * 1000, // 5 minutes  
		retry: 1,
		getNextPageParam: (lastPage, allPages) => {
			// Check if there are more pages
			const totalItems = lastPage?.data?.data?.length || 0;
			if (totalItems < 10) {
				return undefined; // No more pages
			}
			return allPages.length + 1;
		},
	});

	// Flatten the paginated data
	const flatData = data?.pages?.flatMap(page => page?.data?.data || []) || [];
	const allPlaylists = {
		data: {
			data: flatData
		}
	};

	return {
		allPlaylists,
		playlistLoading,
		playlistError,
		playlistErrorDetails,
		refetchPlaylist,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	};
};

export default usePlaylist;
