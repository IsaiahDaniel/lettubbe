import { Images } from "@/constants";
import { getPublicProfile, getUserFeeds } from "@/services/profile.service";
import { useQuery } from "@tanstack/react-query";

const useGetPublicProfile = (userId: string, options?: { enabled?: boolean }) => {
	const isEnabled = options?.enabled ?? !!userId;
	
	const { data, isPending, isSuccess, refetch } = useQuery({
		queryKey: ["publicProfile", userId],
		queryFn: () => getPublicProfile(userId),
		enabled: isEnabled,
		staleTime: 5 * 60 * 1000, // 5 minutes - profile data doesn't change frequently
		gcTime: 10 * 60 * 1000, // 10 minutes cache time
	});

	const {
		data: userVideos,
		isPending: vidosIsPending,
		isSuccess: vidoeIsSuccess,
	} = useQuery({
		queryKey: ["publicVidoes", userId],
		queryFn: () => getUserFeeds(userId),
		enabled: isEnabled,
		staleTime: 2 * 60 * 1000, // 2 minutes - videos change more frequently
		gcTime: 5 * 60 * 1000, // 5 minutes cache time
	});

	const coverPic = data?.data?.coverPhoto ? { uri: data.data.coverPhoto } : Images.defaultCoverPhoto;
	const profilePic = data?.data?.profilePicture ? { uri: data.data.profilePicture } : Images.avatar;

	return {
		data: data?.data,
		isPending,
		isSuccess,
		userVideos: userVideos?.data,
		vidoeIsSuccess,
		vidosIsPending,
		coverPic,
		profilePic,
		refetch
	};
};

export default useGetPublicProfile;
