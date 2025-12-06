import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "@/helpers/utils/request";
import { ICreateStream } from "@/helpers/types/streaming/streaming.types";

/**
 * Creates a new stream
 */
export const createStream = (streamData: ICreateStream): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse, ICreateStream>("/streaming", streamData);
};

/**
 * Gets all streams
 */
export const getAllStreams = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming");
};

/**
 * Gets Popular stream Categories
 */

export const getPopularStreamCategories = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/most/streams");
};

/**
 * Gets Popular stream Categories
 */

export const getPopularStreamers = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/streams/popular");
};

/**
 * Gets Recommended streams
 */

export const getRecommendedStreamers = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/streams/recommendations");
};

/**
 * Gets Recommended streams
 */

export const subscribeToAStreamCategory = (categoryId: string): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>(`/streaming/streams/category/subscribe/${categoryId}`);
};

/**
 * Gets current user's streams
 */
export const getMyStreams = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/me");
};

/**
 * Gets a specific stream by ID
 */
export const getStreamById = (streamId: string): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/streaming/${streamId}`);
};

/**
 * Generates a streamer key
 */
export const generateStreamerKey = (): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/streaming/streamer/key", {});
};

/**
 * Returns Streaming Category
 */
export const getStreamingCategories = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/streams/categories");
};

/**
 * Returns Streaming Category
 */
export const getStreamerProfile = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/streams/me");
};

/**
 * Returns Streaming Category
 */
export const getSubscribedStreamers = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/streams/subscribers");
};

/**
 * Gets Stream token for video SDK authentication
 */
export const getStreamToken = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/token");
};


/**
 * Gets Stream token for video SDK authentication
 */
export const generateStreamToken = (): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/streaming/streamer/key");
};

/**
 * Gets Stream token for video SDK authentication
 */

export const getUpcomingStreams = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/upcoming/scheduled");
}

/**
 * Gets streaming chat messages for a specific stream
 */
export const getStreamChatMessages = ({ 
  streamId, 
  page = 1, 
  limit = 20 
}: { 
  streamId: string; 
  page?: number; 
  limit?: number; 
}): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/streaming/streams/${streamId}/chats?page=${page}&limit=${limit}`);
}

/**
 * Sends a chat message to a stream
 */
export const sendStreamChatMessage = ({ 
  streamId, 
  message 
}: { 
  streamId: string; 
  message: string; 
}): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>(`/streaming/${streamId}/messages`, { message });
}

/**
 * Gets all currently live streams
 */
export const getLiveStreams = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>("/streaming/streams/current/live");
}
