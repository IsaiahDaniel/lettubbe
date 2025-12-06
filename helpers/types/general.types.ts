// Define response types for better type checking
export interface VerifyOtpResponse {
	success: boolean;
	message: string;
	token?: string;
}

export interface GenericResponse {
  hasNextPage: any;
	success: boolean;
	message: string;
	data: any;
}