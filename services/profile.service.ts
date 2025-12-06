import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "@/helpers/utils/request";

export const getProfile = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/profile/me`);
};

export const updateProfile = (data: any): Promise<GenericResponse> => {
	// console.log("Updating profile with data:", data);
	return apiClient.patch<GenericResponse>(`/profile/profileDetails`, data);
};

export const updateProfileImage = (data: any): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>(`/profile/upload/profilePicture`, data);
};

export const getPublicProfile = (userId: string): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/profile/${userId}/userProfile`);
};

export const getUserFeeds = (userId: string): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/feeds/uploads?userId=${userId}`);
};

export const subscribeToUser = (userId: string): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>(`/subscription/subscribe/${userId}`, { userId });
};
  
export const unsubscribeFromUser = (userId: string): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>(`/subscription/unsubscribe/${userId}`, { userId });
};

export const getUserSubscribers = (userId?: string, page = 1, limit = 10): Promise<GenericResponse> => {
	const baseEndpoint = userId 
		? `/subscription/subscribers?userId=${userId}`
		: `/subscription/subscribers`;
	const endpoint = `${baseEndpoint}${userId ? '&' : '?'}page=${page}&limit=${limit}&populate=subscriber`;
	return apiClient.get<GenericResponse>(endpoint);
};

export const getUserSubscriptions = (userId?: string, page = 1, limit = 10): Promise<GenericResponse> => {
	const baseEndpoint = userId 
		? `/subscription/subscribedTo?userId=${userId}`
		: `/subscription/subscribedTo`;
	const endpoint = `${baseEndpoint}${userId ? '&' : '?'}page=${page}&limit=${limit}&populate=subscribedTo`;
	return apiClient.get<GenericResponse>(endpoint);
};

export const blockChannel = (channelId: string): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>(`/feeds/channels/${channelId}/block`);
};

export const unblockChannel = (channelId: string): Promise<GenericResponse> => {
	return apiClient.delete<GenericResponse>(`/feeds/channels/${channelId}/block`);
};
