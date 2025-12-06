import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { resendOTP, verifyOTP } from "@/services/auth.service";
import { IResendOtp, IVerifyOtp } from "@/helpers/types/auth/auth.types";
import { handleError } from "@/helpers/utils/handleError";
import showToast from "@/helpers/utils/showToast";
import { updateSignupStep } from "@/helpers/utils/signupState";

// Define types
type VerificationType = "email" | "phone";

const useVerifyOtp = (type: VerificationType, contactInfo: string, nextRoute: string) => {
	const router = useRouter();
	const [otp, setOtp] = useState("");
	const [countDownSeconds, setCountDownSeconds] = useState(300);
	const [verifyError, setVerifyError] = useState<{
		show: boolean;
		msg: string;
	}>({ show: false, msg: "" });
	const [timerActive, setTimerActive] = useState(true);

	// Start countdown with dependency on timerActive
	useEffect(() => {
		let timer: NodeJS.Timeout;

		if (timerActive && countDownSeconds > 0) {
			timer = setInterval(() => {
				setCountDownSeconds((prev) => {
					if (prev <= 1) {
						clearInterval(timer);
						setTimerActive(false);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (timer) clearInterval(timer);
		};
	}, [timerActive, countDownSeconds]);

	// Verify OTP mutation
	const verifyMutation = useMutation({
		mutationFn: (formData: IVerifyOtp) => verifyOTP(formData),
		mutationKey: ["verifyOtp", type],
		onSuccess: async (data) => {
			// Clear any existing errors
			setVerifyError({ show: false, msg: "" });

			// Update signup state - OTP verified, moving to next step
			await updateSignupStep('create-password');

			// Navigate to next route on success
			router.push(nextRoute as any);
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			handleError(error);
		},
	});

	// Resend OTP mutation
	const resendMutation = useMutation({
		mutationFn: (formData: IResendOtp) => resendOTP(formData),
		mutationKey: ["resendOtp", type],
		onSuccess: (data) => {
			// Reset countdown on successful resend
			setCountDownSeconds(300);
			setTimerActive(true); // Restart the timer
			showToast("success", data.message || "Code resent successfully");
		},
		onError: (error: AxiosError<{ message?: string }>) => {
			handleError(error);
		},
	});

	// Verify OTP function
	const verifyOtp = () => {
		if (otp.length !== 5) {
			setVerifyError({
				show: true,
				msg: "Please enter a valid 5-digit code",
			});
			return;
		}

		// Construct params object with dynamic key based on type
		const params: IVerifyOtp = {
			[type]: contactInfo,
			token: otp,
			type: type,
		};

		verifyMutation.mutate(params);
	};

	// Resend OTP function
	const resendOtp = () => {
		if (countDownSeconds > 0 || resendMutation.isPending) return;

		// Construct params object with dynamic key based on type
		const params: IResendOtp = {
			[type]: contactInfo,
		};

		resendMutation.mutate(params);
	};

	return {
		otp,
		setOtp,
		countDownSeconds,
		isVerifying: verifyMutation.isPending,
		isResending: resendMutation.isPending,
		verifyError,
		setVerifyError,
		verifyOtp,
		resendOtp,
	};
};

export default useVerifyOtp;
