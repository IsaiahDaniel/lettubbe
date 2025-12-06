import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { AxiosError } from "axios";
import { handleError } from "../../helpers/utils/handleError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuth from "./useAuth";
import { updateUsernameSchema } from "@/helpers/validators/Auth.validator";
import { IUpdateUsername } from "@/helpers/types/auth/auth.types";
import { updateUsername, getUsernameSuggestions } from "@/services/auth.service"; // Make sure this function exists
import { useEffect, useState } from "react";
import { getData } from "@/helpers/utils/storage";

const useUpdateUsername = () => {
	const { userDetails } = useAuth();
	const [registerData, setRegisterData] = useState<any>(null);

	// Get the registration data from local storage
	useEffect(() => {
		getData<any>("registerData").then((data) => {
			setRegisterData(data);
		});
	}, []);

	// Username suggestions query
	const {
		data: suggestionsData,
		isLoading: suggestionsLoading,
		isError: suggestionsError,
		error: suggestionsErrorDetails,
		refetch: refetchSuggestions,
	} = useQuery({
		queryKey: ["usernameSuggestions", registerData?.phone, registerData?.email],
		queryFn: () => {
			// Check if at least one parameter is available
			if (!registerData?.phone && !registerData?.email) {
				throw new Error("Either phone or email is required for username suggestions");
			}
			return getUsernameSuggestions(registerData.phone, registerData.email);
		},
		enabled: !!registerData && (!!registerData.phone || !!registerData.email),
	});

	const {
		control,
		handleSubmit,
		setValue, // Added to update form with a suggestion if needed
		formState: { errors, isValid },
	} = useForm<IUpdateUsername>({
		mode: "onChange",
		resolver: zodResolver(updateUsernameSchema),
		defaultValues: {
			username: suggestionsData?.data || "",
		},
	});

	//Set a suggested username from the API response if available
	useEffect(() => {
		// console.log("Suggestions data:", JSON.stringify(suggestionsData, null, 2));
		if (suggestionsData?.data) {
			// Find the first available suggestion
			// const availableSuggestion = suggestionsData.suggestions.find((suggestion) => suggestion.available);

			// if (availableSuggestion) {
			// 	setValue("username", availableSuggestion.username);
			// }
			setValue("username", suggestionsData?.data.suggestedUsername);
		}
	}, [suggestionsData, setValue]);

	// console.log("Suggestions data:", suggestionsData);

	const { mutate, isPending, isSuccess, isError, error } = useMutation({
		mutationFn: (formData: IUpdateUsername) => updateUsername(formData),
		mutationKey: ["updateUsername"],
		onSuccess: (data) => {
			// console.log("Username updated successfully:", data);
			router.push("/(auth)/EnterAge");
		},
		onError: (error: AxiosError) => {
			handleError(error);
			// router.push("/(auth)/EnterAge");
		},
	});

	const onSubmit = (data: IUpdateUsername) => {
		const formData = {
			username: data.username || suggestionsData?.data.suggestedUsername,
			email: registerData.email,
			phoneNumber: registerData.phone,
		};
		mutate(formData);
	};

	const selectSuggestion = (username: string) => {
		setValue("username", username);
	};

	return {
		router,
		control,
		isPending,
		isError,
		error,
		isSuccess,
		handleSubmit,
		onSubmit,
		isValid,
		errors,
		// Username suggestions related props
		suggestions: suggestionsData?.data || "",
		suggestionsData,
		suggestionsLoading,
		suggestionsError,
		suggestionsErrorDetails,
		refetchSuggestions,
		selectSuggestion,
	};
};

export default useUpdateUsername;
