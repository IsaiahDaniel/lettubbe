import { getPlaylistById } from "@/services/playlist.service";
import { useQuery } from "@tanstack/react-query";

const useSinglePlaylist = (id: string) => {
	const {
		data: playlistData,
		isLoading: playlistLoading,
		isError: playlistError,
		error: playlistErrorDetails,
		refetch: refetchPlaylist,
	} = useQuery({
		queryKey: ["playlist", id],
		queryFn: () => getPlaylistById(id),
		networkMode: "always",
	});

	return {
		playlistData,
		playlistLoading,
		playlistError,
		playlistErrorDetails,
		refetchPlaylist,
	};
};

export default useSinglePlaylist;
