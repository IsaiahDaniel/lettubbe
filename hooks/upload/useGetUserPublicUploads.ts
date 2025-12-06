import { getUserPublicUploadedVideos } from "@/services/videoUpload.service";
import { useInfiniteQuery } from "@tanstack/react-query";

const useGetUserPublicUploads = (userId: string, options?: { enabled?: boolean; type?: string }) => {

    // console.log("user public uploads hook called for userId:", userId);
    
    const isEnabled = options?.enabled ?? !!userId;
    const type = options?.type;

    const { 
        data, 
        isPending, 
        isSuccess, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage,
        refetch 
    } = useInfiniteQuery({
        queryKey: ["userPublicUploads", userId, type],
        queryFn: ({ pageParam = 1 }) => getUserPublicUploadedVideos(userId, { pageParam, type }),
        initialPageParam: 1,
        enabled: isEnabled,
        staleTime: 3 * 60 * 1000, // 3 minutes - user uploads don't change very frequently
        gcTime: 8 * 60 * 1000, // 8 minutes cache time
        getNextPageParam: (lastPage, allPages) => {
            // Check if there are more pages
            const totalItems = lastPage?.data?.data?.length || 0;
            if (totalItems < 5) {
                return undefined; // No more pages
            }
            return allPages.length + 1;
        },
    });

    // Flatten the paginated data
    const flatData = data?.pages?.flatMap(page => page?.data?.data || []) || [];
    
    // Get totalDocs from the first page (this represents the total count across all pages)
    const totalDocs = data?.pages?.[0]?.data?.totalDocs || 0;

    return {
        isPending,
        isSuccess,
        data: {
            data: {
                data: flatData,
                totalDocs
            }
        },
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    };
};

export default useGetUserPublicUploads;