import { getNotificationsCount } from "@/services/notifications.service";
import { useQuery } from "@tanstack/react-query";

const useGetNotificationsCount = (enabled: boolean = true) => {

    const { data, isSuccess, isError, error, isPending } = useQuery({
        queryKey: ["getNotificationsCount"],
        queryFn: getNotificationsCount,
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Only log errors for debugging
    if (isError) {
        console.error("❌ Notification Count API Error:", error);
    }

    return {
        data: data?.data, // Return the API response data
        isSuccess,
        isError,
        isPending
    }

}

export default useGetNotificationsCount;