import { getPlaylistVideos } from "@/services/playlist.service";
import { useQuery } from "@tanstack/react-query";

const useGetPlaylistVideos = (id: string) => {
	// Debug logging for playlist ID
	const invalidIds = ['video', 'photo', 'community', 'streaming', ''];
	const isInvalidId = id && invalidIds.includes(id);
	
	if (isInvalidId) {
		console.error('🚨 HOOK DEBUG: useGetPlaylistVideos called with invalid ID!', {
			id,
			invalidIds,
			stackTrace: new Error().stack
		});
	}
	
	console.log('🎵 HOOK DEBUG: useGetPlaylistVideos called with:', {
		id,
		isEnabled: !!id,
		isInvalid: isInvalidId,
		callerStack: new Error().stack?.split('\n').slice(1, 4).join('\n')
	});

	const {
		data: playlistVideos,
		isLoading: videosLoading,
		isError,
		error,
		refetch: refetchVideos,
	} = useQuery({
		queryKey: ["playlistVideos", id],
		queryFn: () => {
			console.log('🎵 API DEBUG: getPlaylistVideos queryFn called with id:', id);
			return getPlaylistVideos(id);
		},
		networkMode: "always",
		staleTime: 30 * 1000, // 30 seconds - shorter for frequent updates
		gcTime: 2 * 60 * 1000, // 2 minutes
		enabled: !!id, // Only run if id exists
	});

	// if (playlistVideos) {
	// 	console.log("playlist videos", JSON.stringify(playlistVideos, null, 2));
	// }

	return {
		playlistVideos,
		videosLoading,
		isError,
		error,
		refetchVideos,
	};
};

export default useGetPlaylistVideos;
