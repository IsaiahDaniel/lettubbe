import { router } from "expo-router";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerWithEmailSchema, registerWithPhoneSchema } from "@/helpers/validators/Auth.validator";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { IRegister } from "@/helpers/types/auth/auth.types";
import { register } from "@/services/auth.service";
import { handleError } from "@/helpers/utils/handleError";
import showToast from "@/helpers/utils/showToast";
import { storeData } from "@/helpers/utils/storage";
import { saveSignupState, updateSignupStep } from "@/helpers/utils/signupState";

const useRegister = (method: "email" | "phone") => {
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
		mutationKey: ["register", method],
		mutationFn: (formData: IRegister) => register(formData),
		onSuccess: async (data) => {
			// console.log("Registration successful:", JSON.stringify(data, null, 2));
			
			// Save current signup state
			const email = method === "email" ? emailForm.getValues().email : undefined;
			const phone = method === "phone" ? phoneForm.getValues().phone : undefined;
			
			if ((data?.data && method === "phone" && data?.data?.isPhoneVerified) || (data?.data && method === "email" && data?.data?.isEmailVerified)) {
				// User is already verified, determine next step
				if (!data?.data?.isPasswordSet) {
					await saveSignupState({ step: 'create-password', type: method, email, phone });
					router.push("/(auth)/CreatePassword");
				} else if (!data?.data?.isUserDetailsSet) {
					await saveSignupState({ step: 'full-name', type: method, email, phone });
					router.push("/(auth)/FullName");
				} else if (!data?.data?.isUsernameSet) {
					await saveSignupState({ step: 'username', type: method, email, phone });
					router.push("/(auth)/ChangeUsername");
				} else if (!data?.data?.isDOBSet) {
					await saveSignupState({ step: 'age', type: method, email, phone });
					router.push("/(auth)/EnterAge");
				} else if (!data?.data?.isCategorySet) {
					await saveSignupState({ step: 'completed', type: method, email, phone });
					router.push("/(personalization)/PersonalizationScreen");
				} else {
					// Signup fully completed
					router.push("/(auth)/Login");
				}
			} else {
				// User needs to verify OTP
				await saveSignupState({ 
					step: 'verify-otp', 
					type: method, 
					email, 
					phone, 
					otpSent: true,
					nextRoute: "/(auth)/CreatePassword"
				});
				
				router.push({
					pathname: "/(auth)/VerifyOtp",
					params: {
						type: method,
						[method]: method === "email" ? emailForm.getValues().email : phoneForm.getValues().phone,
						nextRoute: "/(auth)/CreatePassword",
					},
				});
				showToast("success", data.message);
			}
			
			// Keep legacy storage for backward compatibility
			storeData("registerData", {
				phone: phoneForm.getValues().phone,
				email: emailForm.getValues().email,
			});
		},
		onError: (error: unknown) => {
			// console.log("register email", error);
			handleError(error);
		},
	});

	// Handle email submission
	const onEmailSubmit = (data: IEmailFormData) => {
		// Create proper registration payload for email
		const formData: IRegister = {
			type: "email",
			email: data.email.toLowerCase(),
		};
		mutate(formData);
	};

	// Handle phone submission
	const onPhoneSubmit = (data: IPhoneFormData) => {
		// Create proper registration payload for phone
		const formData: IRegister = {
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

export default useRegister;
