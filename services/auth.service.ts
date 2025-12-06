import { GenericResponse, VerifyOtpResponse } from "@/helpers/types/general.types";
import {
	ICreatePassword,
	IForgotPassword,
	ILogin,
	IRegister,
	IResendOtp,
	IResetPassword,
	IUpdateFullName,
	IUpdateUsername,
	IVerifyOtp,
} from "../helpers/types/auth/auth.types";
import { apiClient } from "../helpers/utils/request";

/**
 * Verifies OTP code
 */
export const register = (data: IRegister): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse, IRegister>("/auth/verify", data);
};

/**
 * Verifies OTP code
 */
export const verifyOTP = (verifyData: IVerifyOtp): Promise<VerifyOtpResponse> => {
	return apiClient.post<VerifyOtpResponse, IVerifyOtp>("/auth/verify-otp", verifyData);
};

/**
 * Resends OTP code to the user's email or phone
 */
export const resendOTP = (resendData: IResendOtp): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse, IResendOtp>("/auth/verify/resend", resendData);
};

/**
 * Creates a password for a new user account
 */
export const createPassword = (passwordData: ICreatePassword): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse, ICreatePassword>("/auth/password-create", passwordData);
};

/**
 * Saves full name for a user
 */
export const saveFullName = (fullName: IUpdateFullName): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/auth/userDetails-create", fullName);
};

/**
 * Get username suggestions
 */
export const getUsernameSuggestions = (phone?: string, email?: string): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/auth/sugguest/username?${phone ? `phoneNumber=${phone}` : `email=${email}`}`);
};

/**
 * Saves user's username
 */
export const updateUsername = (username: IUpdateUsername): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/auth/userDetails-create", username);
};

/**
 * Saves user's date of birth
 */
export const saveDob = (dob: IUpdateUsername): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/auth/userDetails-create", dob);
};

/**
 * Logs in a user
 */
export const loginUser = (loginData: ILogin): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/auth/login", loginData);
};

/**
 * Initiates password reset flow
 */
export const forgotPassword = (data: IForgotPassword): Promise<GenericResponse> => {
	return apiClient.post("/auth/forgotPassword", data);
};

/**
 * Resets password with token
 */
export const resetPassword = (data: IResetPassword): Promise<GenericResponse> => {
	return apiClient.post("/auth/resetPassword", data);
};

// /**
//  * Changes password for authenticated user
//  */
// export const changePassword = (data: IChangePassword): Promise<GenericResponse> => {
// 	return apiClient.post("/auth/change-password", data);
// };

/**
 * Requests OTP for account deletion
 */
export const deleteAccountOTP = (type: 'email' | 'phone' = 'email'): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/auth/deleteAccountOTP?type=${type}`);
};

/**
 * Deletes user account with reason
 */
export const deleteAccount = (deleteReason: string): Promise<GenericResponse> => {
	// Using query params for DELETE request
	return apiClient.delete<GenericResponse>(`/auth/deleteAccount`, { reasonText: deleteReason });
};

/**
 * Deactivates a pending account deletion
 */
export const deactivateAccountDeletion = (): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>("/auth/deactivateDeletion/");
};

/**
 * Refreshes access token using refresh token
 */
export const refreshToken = (): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/auth/refreshToken");
};

/**
 * Logs out user and invalidates tokens
 */
export const logoutUser = (): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/auth/logout");
};
