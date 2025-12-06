import { getUserUploadedVideos } from "@/services/videoUpload.service";
import { useInfiniteQuery } from "@tanstack/react-query";

const useGetUserUploads = (type?: string) => {

    const { 
        data, 
        isPending, 
        isSuccess, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage,
        refetch 
    } = useInfiniteQuery({
        queryKey: ["getUserUploads", type],
        queryFn: ({ pageParam = 1 }) => getUserUploadedVideos({ pageParam, type }),
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
    }

}

export default useGetUserUploads;