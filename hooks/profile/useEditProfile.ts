import { handleError } from "@/helpers/utils/handleError";
import showToast from "@/helpers/utils/showToast";
import { updateProfile } from "@/services/profile.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { router } from "expo-router";

const useEditProfile = () => {
	const queryClient = useQueryClient();

	const { mutate, isPending, isSuccess, isError, error } = useMutation({
		mutationFn: (formData) => updateProfile(formData),
		mutationKey: ["updateProfile"],
		onSuccess: (data) => {
			// Show success message
			showToast("success", data.message || "Profile updated successfully");

			// Invalidate and refetch user data to show updated profile
			queryClient.invalidateQueries({ queryKey: ["userData"] });

			// Navigate back or to profile page
			router.replace("/(tabs)/profile");
		},
		onError: (error: AxiosError) => {
			handleError(error);
		},
	});

	const onSubmit = (formData: any) => {
		// console.log("Submitting profile update:", JSON.stringify(formData));
		mutate(formData);
	};

	return {
		onSubmit,
		isPending,
		isSuccess,
		isError,
	};
};

export default useEditProfile;
