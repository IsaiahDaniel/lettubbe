import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { AxiosError } from "axios";
import { handleError } from "../../helpers/utils/handleError";
import { useState } from "react";
// import useAuth from "../auth/useAuth";
import { addCategories, getCategories } from "@/services/personalization.service";
import { ICategories } from "@/helpers/types/personalization/personalization.types";
import showToast from "@/helpers/utils/showToast";

const useCateogoires = () => {
	// const { userDetails } = useAuth();
	const [categories, setCategories] = useState<string[]>([]);

	// Categories query
	const {
		data: categoriesData,
		isLoading: categoriesLoading,
		isError: categoriesError,
		error: categoriesErrorDetails,
		refetch: refetchSuggestions,
	} = useQuery({
		queryKey: ["categories"],
		queryFn: () => getCategories(),
	});

	const { mutate, isPending, isSuccess, isError, error } = useMutation({
		mutationFn: (formData: ICategories) => addCategories(formData),
		mutationKey: ["addCategories"],
		onSuccess: (data) => {
			// console.log("Successfully:", data);
			showToast("success", data.message);
			router.push("/(personalization)/Communities");
		},
		onError: (error: AxiosError) => {
			handleError(error);
			// router.push("/(auth)/EnterAge");
		},
	});

	const onSubmit = () => {
		const formData = {
			categories,
		};
		console.log("formData", JSON.stringify(formData));
		mutate(formData);
	};

	const selectCategoryHandler = (category: string) => {
		if (categories.includes(category)) {
			setCategories(categories.filter((item) => item !== category));
		} else {
			setCategories([...categories, category]);
		}
	};

	return {
		router,
		isPending,
		isError,
		error,
		isSuccess,
		onSubmit,
		categoriesData: categoriesData?.data || [],
		categoriesLoading,
		categoriesError,
		categoriesErrorDetails,
		refetchSuggestions,
		selectCategoryHandler,
		categories,
	};
};

export default useCateogoires;
