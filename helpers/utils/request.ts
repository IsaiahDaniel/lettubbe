import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getInstance } from "../../config/axiosInstance";

// Define the HTTP methods we support
type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

// Type for successful response
interface ApiResponse<T> {
	data: T;
	status: number;
	statusText: string;
}

// Type for error response
interface ApiError {
	message: string;
	status: number;
	data?: any;
}

/**
 * Makes an API request with proper typing
 * @param method - HTTP method (get, post, put, delete, patch)
 * @param url - API endpoint
 * @param data - Request payload (for POST, PUT, PATCH)
 * @param config - Additional axios config
 * @returns Promise with response data of type T
 */
export const makeRequest = async <TResponse = any, TRequest = any>(
	method: HttpMethod,
	url: string,
	data?: TRequest,
	config?: Omit<AxiosRequestConfig, "url" | "method" | "data">
): Promise<TResponse> => {
	try {
		const axiosInstance: AxiosInstance = await getInstance();

		let response: AxiosResponse;

		// Handle different HTTP methods appropriately
		if (method === "get" || method === "delete") {
			// For GET and DELETE, data should be passed as params
			response = await axiosInstance[method](url, {
				params: data,
				...config,
			});
		} else {
			// For POST, PUT, PATCH, data goes in the request body
			response = await axiosInstance[method](url, data, config);
		}

		return response.data;
	} catch (error: any) {
		// console.log("API request error:", JSON.stringify(error), null, 2);
		// Enhanced error handling
		// Check if it's an axios error (more robust than instanceof)
		if (error?.response || error?.isAxiosError || error?.config) {
			const apiError: ApiError = {
				message: error.message || 'Request failed',
				status: error.response?.status || 0,
				data: error.response?.data,
			};

			// console.error(`Error in ${method.toUpperCase()} request to ${url}:`, apiError);

			// Rethrow with better structure
			throw apiError;
		}

		// For non-axios errors
		// console.error(`Unexpected error in ${method.toUpperCase()} request to ${url}:`, error);
		throw error;
	}
};

/**
 * Convenience methods for common HTTP verbs
 */
export const apiClient = {
	get: <TResponse = any, TParams = any>(url: string, params?: TParams, config?: AxiosRequestConfig) =>
		makeRequest<TResponse, TParams>("get", url, params, config),

	post: <TResponse = any, TRequest = any>(url: string, data?: TRequest, config?: AxiosRequestConfig) =>
		makeRequest<TResponse, TRequest>("post", url, data, config),

	put: <TResponse = any, TRequest = any>(url: string, data?: TRequest, config?: AxiosRequestConfig) =>
		makeRequest<TResponse, TRequest>("put", url, data, config),

	patch: <TResponse = any, TRequest = any>(url: string, data?: TRequest, config?: AxiosRequestConfig) =>
		makeRequest<TResponse, TRequest>("patch", url, data, config),

	delete: <TResponse = any, TParams = any>(url: string, params?: TParams, config?: AxiosRequestConfig) =>
		makeRequest<TResponse, TParams>("delete", url, params, config),
};
