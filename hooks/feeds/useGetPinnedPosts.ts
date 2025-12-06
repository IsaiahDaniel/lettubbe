import { useQuery } from "@tanstack/react-query";
import { getPinnedPosts } from "@/services/feed.service";
import { ensureArray } from "@/helpers/utils/util";

const useGetPinnedPosts = (enabled: boolean = true) => {
  const {
    data,
    isPending,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["pinnedPosts"],
    queryFn: getPinnedPosts,
    enabled, // Allow external control of when to fetch
    staleTime: 10 * 60 * 1000, // 10 minutes - pinned posts don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: 2, // Retry failed requests twice
  });

  // Normalize data to ensure it's always an array
  const pinnedPosts = ensureArray(data?.data || data || []);

  return {
    pinnedPosts,
    isPending,
    isError,
    error,
    refetch,
    hasPinnedPosts: pinnedPosts.length > 0,
  };
};

export default useGetPinnedPosts;