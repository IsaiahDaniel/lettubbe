import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createPasswordSchema } from "@/helpers/validators/Auth.validator";
import { createPassword, resetPassword } from "@/services/auth.service";
import { getData } from "@/helpers/utils/storage";
import { ICreatePassword } from "@/helpers/types/auth/auth.types";
import { handleError } from "@/helpers/utils/handleError";
import { router } from "expo-router";
import showToast from "@/helpers/utils/showToast";
import { updateSignupStep } from "@/helpers/utils/signupState";

// Type for the password data
type PasswordData = z.infer<typeof createPasswordSchema>;

export const useCreatePassword = (type: "reset" | "create") => {
	// Password requirements state
	const [requirements, setRequirements] = useState({
		minChars: false,
		hasNumber: false,
		hasSymbol: false,
	});
	const [registerData, setRegisterData] = useState<any>(null);

	// Configure form with zodResolver
	const {
		control,
		watch,
		formState: { errors, isValid },
		handleSubmit,
	} = useForm({
		resolver: zodResolver(createPasswordSchema),
		mode: "onChange",
		defaultValues: {
			password: "",
		},
	});

	// Watch for password changes
	const password = watch("password");

	// Check password requirements on every change
	useEffect(() => {
		if (password) {
			setRequirements({
				minChars: password.length >= 8,
				hasNumber: /\d/.test(password),
				hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
			});
		} else {
			setRequirements({
				minChars: false,
				hasNumber: false,
				hasSymbol: false,
			});
		}
	}, [password]);

	// Get the email from local storage
	useEffect(() => {
		getData<any>("registerData").then((data) => {
			setRegisterData(data);
		});
	}, []);

	// Create unified mutation
	const mutation = useMutation({
		mutationFn: (data: ICreatePassword) => (type === "reset" ? resetPassword(data) : createPassword(data)),
		mutationKey: [type === "reset" ? "resetPassword" : "createPassword"],
		onSuccess: async (data) => {
			if (type === "reset") {
				router.push("/(auth)/PasswordResetSuccess");
			} else {
				await updateSignupStep('full-name');
				showToast("success", data.message);
				router.push("/(auth)/FullName");
			}
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			handleError(error);
		},
	});

	// console.log("registerData", registerData);

	// Handle form submission
	const onSubmit = (data: PasswordData) => {
		if (!registerData) {
			showToast("error", "User data not found");
			return;
		}

		const formData = {
			password: data.password,
			email: registerData?.email,
			phoneNumber: registerData?.phone,
			// otp: registerData.otp,
		};

		mutation.mutate(formData);
	};

	return {
		control,
		errors,
		isValid,
		handleSubmit,
		onSubmit,
		requirements,
		isPending: mutation.isPending,
		isSuccess: mutation.isSuccess,
		error: mutation.error,
	};
};
