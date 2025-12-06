import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { AxiosError } from "axios";
import { updateFullNameSchema } from "@/helpers/validators/Auth.validator";
import { saveFullName } from "@/services/auth.service";
import { UserStore } from "@/store/UserStore";
import { handleError } from "@/helpers/utils/handleError";
import { useEffect, useState } from "react";
import { getData } from "@/helpers/utils/storage";

// Type for the password data
type FullNameData = z.infer<typeof updateFullNameSchema>;

export const useFullName = () => {
	const { firstName, lastName, setUserInfo } = UserStore();
	const [registerData, setRegisterData] = useState<any>();

	// get the email from local storage
	useEffect(() => {
		getData<any>("registerData").then((data) => {
			setRegisterData(data);
		});
	}, []);

	const {
		control,
		formState: { errors, isValid },
		handleSubmit,
	} = useForm({
		resolver: zodResolver(updateFullNameSchema),
		mode: "onChange",
		defaultValues: {
			firstName: "",
			lastName: "",
		},
	});

	const { mutate, isPending, isSuccess, error } = useMutation({
		mutationFn: (data: FullNameData) => saveFullName(data),
		mutationKey: ["saveFullName"],
		onSuccess: (data) => {
			// console.log("Full name saved successfully:", data);
			router.push("/(auth)/PreviewUsername");
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			handleError(error);
			// console.error("Error updating full name:", error.response?.data?.message || error.message);
		},
	});

	// Handle form submission
	const onSubmit = (data: FullNameData) => {
		const formData = {
			firstName: data.firstName,
			lastName: data.lastName,
			email: registerData.email,
			phoneNumber: registerData.phone,
		};

		mutate(formData);
		// setUserInfo({ firstName: data.firstName });
		// setUserInfo({ lastName: data.lastName });
		// router.push("/(auth)/EnterAge");
	};

	return {
		control,
		errors,
		isValid,
		handleSubmit,
		onSubmit,
		isPending,
		error,
	};
};
