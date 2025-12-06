import { apiClient } from "@/helpers/utils/request";
import { GenericResponse } from "@/helpers/types/general.types";

export const getFeeds = async ({ pageParam = 1 }) => {
	const response = await apiClient.get(`/feeds?page=${pageParam}&limit=10`);
	return response.data;
};

export const getFeedComments = async (postId: string) => {
	const response = await apiClient.get(`/feeds/posts/${postId}/comments`);
	return response.data;
};

export const likePost = (postId: string): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>(`/feeds/posts/${postId}/like`);
};

export const addCommentToPost = (postId: string, text: string, usernames?: string[]): Promise<GenericResponse> => {
	const payload: any = { text };
	if (usernames && usernames.length > 0) {
		payload.usernames = usernames;
	}
	return apiClient.patch<GenericResponse>(`/feeds/posts/${postId}/comments`, payload);
};

export const likeComment = (postId: string, commentId: string): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>(`/feeds/posts/${postId}/comments/${commentId}/like`);
};

export const addReplyToComment = async (postId: string, commentId: any, replyText: string, usernames?: string[]) => {
	const payload: any = { text: replyText };
	if (usernames && usernames.length > 0) {
		payload.usernames = usernames;
	}
	return apiClient.patch<GenericResponse>(`/feeds/posts/${postId}/comments/${commentId}/replies`, payload);
};

export const likePostReply = (postId: string, commentId: any, replyId: string): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>(`/feeds/posts/${postId}/comments/${commentId}/replies/${replyId}/like`);
};

export const bookmarkedPost = (postId: string): Promise<GenericResponse> => {
	return apiClient.patch<GenericResponse>(`/feeds/posts/${postId}/bookmark`);
};

export const getBookmarkedPosts = async (): Promise<GenericResponse> => {
	const response = await apiClient.get(`/feeds/bookmarks`);
	return response.data;
};

export const deletePost = (postId: string): Promise<GenericResponse> => {
	return apiClient.delete<GenericResponse>(`/feeds/posts/${postId}`);
};

export const getFeedNotifications = (type: string): Promise<GenericResponse> => {
	const url = type && type !== "All activity" ? `/feeds/notifications?type=${type}` : `/feeds/notifications`;
	return apiClient.get<GenericResponse>(url);
};

export const editPost = (postData: any): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/feeds/posts/`, postData);
}

export const getPost = (postId: any): Promise<GenericResponse>  => {
	// console.log({ postId });
	return apiClient.get<GenericResponse>(`/feeds/upload/posts/${postId}`);
}
export const deleteComment = (postId: string, commentId: string): Promise<GenericResponse> => {
  return apiClient.delete<GenericResponse>(`/feeds/posts/${postId}/comments/${commentId}/`);
};

// export const deleteReply = (postId: string, commentId: string, replyId: string): Promise<GenericResponse> => {
//   return apiClient.delete<GenericResponse>(`/feeds/posts/${postId}/comments/${commentId}/replies/${replyId}`);
// };

export const trackVideoPlay = async (postId: string): Promise<GenericResponse> => {
	const response = await apiClient.get(`/feeds/posts/${postId}/views`);
	// console.log('Raw API response for trackVideoPlay:', response);
	
	return response;
};

export const trackPostScrollView = async (postId: string): Promise<GenericResponse> => {
	const response = await apiClient.get(`/feeds/posts/${postId}/postScrollViews`);
	// console.log('Raw API response for trackPostScrollView:', response);
	
	return response;
};

// Optimized individual scroll view tracking with staggered calls
export const trackMultipleScrollViews = async (postIds: string[]): Promise<GenericResponse> => {
	if (postIds.length === 0) {
		return { 
			success: true, 
			message: 'No posts to track',
			data: null,
			hasNextPage: false
		};
	}
	
	// console.log(`Tracking scroll views for ${postIds.length} posts individually with staggered calls...`);
	
	// Process posts with staggered timing to avoid server overload
	const results = await Promise.allSettled(
		postIds.map((postId, index) => 
			new Promise(resolve => 
				setTimeout(() => 
					trackPostScrollView(postId).then(resolve).catch(resolve), 
					index * 150 // 150ms stagger between calls
				)
			)
		)
	);
	
	const successCount = results.filter(r => r.status === 'fulfilled').length;
	// console.log(`Staggered scroll view tracking completed: ${successCount}/${postIds.length} successful`);
	
	return { 
		success: successCount > 0, 
		message: `Tracked ${successCount}/${postIds.length} posts with staggered calls`,
		data: { successCount, totalCount: postIds.length },
		hasNextPage: false
	};
};

export const getPostLikes = async (postId: string, page: number = 1, limit: number = 10): Promise<GenericResponse> => {
  const response = await apiClient.get(`/feeds/posts/${postId}/likes?page=${page}&limit=${limit}`);
  return response;
};

export const getUserProfileFeeds = async ({ userId, pageParam = 1 }: { userId: string; pageParam?: number }) => {
	// console.log('getUserProfileFeeds called with:', { userId, pageParam });
	try {
		// Use the same endpoint as the original but with 10 limit to match HomeScreen
		const response = await apiClient.get(`/feeds/uploads/public?userId=${userId}&page=${pageParam}&limit=10`);
		// console.log('getUserProfileFeeds response:', response.data);
		return response.data;
	} catch (error) {
		// console.error('getUserProfileFeeds error:', error);
		throw error;
	}
};

export const getPinnedPosts = async (): Promise<GenericResponse> => {
	const response = await apiClient.get('/feeds/posts/marked/pinned/');
	return response.data;
};