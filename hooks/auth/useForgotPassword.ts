import { router } from "expo-router";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerWithEmailSchema, registerWithPhoneSchema } from "@/helpers/validators/Auth.validator";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { IForgotPassword } from "@/helpers/types/auth/auth.types";
import { forgotPassword } from "@/services/auth.service";
import { handleError } from "@/helpers/utils/handleError";
import showToast from "@/helpers/utils/showToast";
import { storeData } from "@/helpers/utils/storage";

const useForgotPassword = (method: "email" | "phone") => {
	// Define types based on schemas
	type IEmailFormData = z.infer<typeof registerWithEmailSchema>;
	type IPhoneFormData = z.infer<typeof registerWithPhoneSchema>;

	// Initialize email form
	const emailForm = useForm<IEmailFormData>({
		resolver: zodResolver(registerWithEmailSchema),
		mode: "onTouched",
		reValidateMode: "onBlur",
	});

	// Initialize phone form
	const phoneForm = useForm<IPhoneFormData>({
		resolver: zodResolver(registerWithPhoneSchema),
		mode: "onTouched",
		reValidateMode: "onBlur",
	});

	const { mutate, isPending, isSuccess, error } = useMutation({
		mutationKey: ["forgotPassword", method],
		mutationFn: (formData: IForgotPassword) => forgotPassword(formData),
		onSuccess: (data) => {
			// console.log("successful:", JSON.stringify(data, null, 2));
			router.push({
				pathname: "/(auth)/VerifyOtp",
				params: {
					type: method,
					[method]: method === "email" ? emailForm.getValues().email : phoneForm.getValues().phone,
					nextRoute: "/(auth)/ChangeNewPassword",
				},
			});
			showToast("success", data.message);
			storeData("registerData", {
				phone: phoneForm.getValues().phone,
				email: emailForm.getValues().email,
				// otp: data.data.verificationCode,
			});
		},
		onError: (error: unknown) => {
			handleError(error);
		},
	});

	// Handle email submission
	const onEmailSubmit = (data: IEmailFormData) => {
		// Create proper registration payload for email
		const formData: IForgotPassword = {
			type: "email",
			email: data.email.toLowerCase(),
		};
		mutate(formData);
	};

	// Handle phone submission
	const onPhoneSubmit = (data: IPhoneFormData) => {
		// Create proper registration payload for phone
		const formData: IForgotPassword = {
			type: "phone",
			phoneNumber: data.phone,
		};
		mutate(formData);
	};

	// Return appropriate controls based on method
	if (method === "email") {
		return {
			control: emailForm.control,
			handleSubmit: emailForm.handleSubmit(onEmailSubmit),
			isValid: emailForm.formState.isValid,
			errors: emailForm.formState.errors as FieldErrors<IEmailFormData>,
			router,
			isPending,
			isSuccess,
			reset: emailForm.reset,
		};
	} else {
		return {
			control: phoneForm.control,
			handleSubmit: phoneForm.handleSubmit(onPhoneSubmit),
			isValid: phoneForm.formState.isValid,
			errors: phoneForm.formState.errors as FieldErrors<IPhoneFormData>,
			router,
			isPending,
			isSuccess,
			reset: phoneForm.reset,
		};
	}
};

export default useForgotPassword;
