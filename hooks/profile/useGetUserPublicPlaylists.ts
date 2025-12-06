import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserPublicPlaylists } from "@/services/playlist.service";
import useAuth from "@/hooks/auth/useAuth";

interface PlaylistItem {
  _id: string;
  visibility: 'public' | 'private';
  [key: string]: any;
}

const useGetUserPublicPlaylists = (userId: string, options?: { enabled?: boolean }) => {
  const { userDetails } = useAuth();
  const isCurrentUser = userDetails?._id === userId;
  const isEnabled = options?.enabled ?? !!userId;

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["userPublicPlaylists", userId],
    queryFn: ({ pageParam = 1 }) => getUserPublicPlaylists(userId, { pageParam }),
    initialPageParam: 1,
    enabled: isEnabled,
    staleTime: 4 * 60 * 1000, // 4 minutes - playlists don't change very often
    gcTime: 8 * 60 * 1000, // 8 minutes cache time
    getNextPageParam: (lastPage, allPages) => {
      // Check if there are more pages
      const totalItems = lastPage?.data?.data?.length || 0;
      if (totalItems < 10) {
        return undefined; // No more pages
      }
      return allPages.length + 1;
    },
    select: (data) => {
      if (!data?.pages) return data;
      
      // Flatten and filter playlists from all pages
      const allPlaylists = data.pages.flatMap(page => page?.data?.data || []);
      const filteredPlaylists = allPlaylists.filter((playlist: PlaylistItem) => {
        if (isCurrentUser) {
          return true;
        }
        
        return playlist.visibility === 'public';
      });

      return {
        pages: [{
          data: {
            data: filteredPlaylists
          }
        }]
      };
    }
  });

  // Flatten the paginated data
  const flatData = data?.pages?.[0]?.data?.data || [];

  return {
    data: {
      data: {
        data: flatData
      }
    },
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
};

export default useGetUserPublicPlaylists;