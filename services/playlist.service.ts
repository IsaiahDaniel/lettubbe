import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "@/helpers/utils/request";

export interface AddPostToPlaylistParams {
  playlistId: string;
  postId: string;
}

export interface RemovePostFromPlaylistParams {
  playlistId: string;
  postId: string;
}

export const createPlaylist = (data: any): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>(`/playlist`, data);
};

export const getPlaylists = (params: { pageParam?: number } = {}): Promise<GenericResponse> => {
  const { pageParam = 1 } = params;
  return apiClient.get<GenericResponse>(`/playlist?page=${pageParam}&limit=10`);
};

export const getUserPublicPlaylists = (userId: string, params: { pageParam?: number } = {}): Promise<GenericResponse> => {
  const { pageParam = 1 } = params;
  return apiClient.get<GenericResponse>(`/playlist/${userId}/public?page=${pageParam}&limit=10`);
};

export const getPlaylistById = (id: string): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/playlist/${id}`);
};

export const updatePlaylist = (id: string, data: any): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>(`/playlist/${id}`, data);
};

export const updatePlaylistCoverPhoto = (id: string, data: any): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>(`/playlist/playlistCoverPhoto/${id}`, data);
};

export const getPlaylistVideos = (id: string): Promise<GenericResponse> => {
	// Debug logging for API service
	const invalidIds = ['video', 'photo', 'community', 'streaming', ''];
	const isInvalidId = id && invalidIds.includes(id);
	
	if (isInvalidId) {
		console.error('🚨 SERVICE DEBUG: getPlaylistVideos called with invalid ID!', {
			id,
			typeof_id: typeof id,
			invalidIds,
			stackTrace: new Error().stack
		});
	}
	
	console.log('🎵 SERVICE DEBUG: getPlaylistVideos called with:', {
		id,
		typeof_id: typeof id,
		trimmed: id?.trim(),
		isInvalid: isInvalidId,
		url: `/playlist/${id}/video`
	});

	if (!id || id.trim() === '') {
		const error = new Error('Playlist ID is required');
		console.error('🚨 SERVICE DEBUG: Throwing error for empty ID:', error);
		throw error;
	}
	
	if (isInvalidId) {
		const error = new Error(`Invalid playlist ID: "${id}". Cannot use content type as playlist ID.`);
		console.error('🚨 SERVICE DEBUG: Throwing error for invalid ID:', error);
		throw error;
	}
	
	return apiClient.get<GenericResponse>(`/playlist/${id}/video`);
};

export const addPostToPlaylist = ({ playlistId, postId }: AddPostToPlaylistParams): Promise<GenericResponse> => {
  return apiClient.patch<GenericResponse>(`/feeds/posts/${postId}/playlist/${playlistId}`);
};

export const removePostFromPlaylist = ({ playlistId, postId }: RemovePostFromPlaylistParams): Promise<GenericResponse> => {
  return apiClient.delete<GenericResponse>(`/feeds/posts/${postId}/playlist/${playlistId}`);
};
