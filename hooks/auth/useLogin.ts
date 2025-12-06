import { useMutation } from "@tanstack/react-query";
import { ILogin } from "../../helpers/types/auth/auth.types";
import { loginUser } from "../../services/auth.service";
import { handleError } from "../../helpers/utils/handleError";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, phoneLoginSchema } from "../../helpers/validators/Auth.validator";
import { storeData } from "../../helpers/utils/storage";
import { useAuthContext } from "@/contexts/AuthProvider";
import { devLog } from "@/config/dev";

const useLogin = (method: "phone" | "email") => {
	const [loginError, setShowLoginError] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });
	const [showLogin, setShowLogin] = useState(true);
	const router = useRouter();
	const { refreshAuthData } = useAuthContext();

	const validationSchema = method === "email" ? loginSchema : phoneLoginSchema;

	const { mutate, isPending, error, isError } = useMutation({
		mutationFn: (formData: ILogin) => loginUser(formData),
		mutationKey: ["loginUser"],
		onSuccess: async (data) => {
			devLog('AUTH', "Login response received:", {
				hasUserData: !!data?.data?.userData,
				hasToken: !!data?.data?.token,
				hasRefreshToken: !!data?.data?.refreshToken,
				tokenLength: data?.data?.token?.length,
				refreshTokenLength: data?.data?.refreshToken?.length,
				fullResponse: JSON.stringify(data, null, 2)
			});
			
			// Store login response data
			await storeData("userInfo", data?.data.userData);
			await storeData("token", data.data.token);
			
			// Store refresh token if provided
			if (data.data.refreshToken) {
				await storeData("refreshToken", data.data.refreshToken);
				devLog('AUTH', "Refresh token stored successfully");
			} else {
				devLog('AUTH', "⚠️ No refresh token in login response!");
			}
			
			// Cache invalidation now happens automatically in storeData for token keys
			
			// Store login timestamp to prevent unnecessary refresh
			await storeData("lastLoginTime", Date.now());
			devLog('AUTH', "Login timestamp stored to prevent immediate refresh");
			
			// Wait for SecureStore writes to complete
			await new Promise(resolve => setTimeout(resolve, 500));
			devLog('AUTH', "Storage delay completed, now refreshing auth");
			
			// Refresh AuthProvider to pick up the new auth data
			await refreshAuthData();
			
			// Navigate to index page which will handle deletion status checking
			router.replace("/");
		},
		onError: (error: any) => {
			devLog('AUTH', "Login error:", error);
			handleError(error);
		},
	});

	const {
		control,
		handleSubmit,
		formState: { isValid, errors },
	} = useForm<ILogin>({
		mode: "onTouched",
		reValidateMode: "onBlur",
		resolver: zodResolver(validationSchema as any),
	});

	const handleLogin = (data: ILogin) => {
		mutate(data);
	};

	return {
		isPending,
		error,
		isError,
		handleSubmit,
		handleLogin,
		setShowLoginError,
		showLogin,
		setShowLogin,
		loginError,
		control,
		isValid,
	};
};

export default useLogin;
