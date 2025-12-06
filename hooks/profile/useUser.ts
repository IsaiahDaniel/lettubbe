import { getProfile } from "@/services/profile.service";
import { useQuery } from "@tanstack/react-query";

const useUser = () => {
	const {
		data: profileData,
		isLoading: profileLoading,
		isError: profileError,
		error: profileErrorDetails,
		refetch: refetchProfile,
	} = useQuery({
		queryKey: ["profile"],
		queryFn: () => getProfile(),
		networkMode: "always",
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 1, // Reduce retries for faster failure - don't block app startup
	});

	return {
		profileData,
		profileLoading,
		profileError,
		profileErrorDetails,
		refetchProfile,
	};
};

export default useUser;
