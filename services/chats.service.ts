import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "../helpers/utils/request";

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: Date;
  };
  updatedAt: Date;
  unreadCount?: number;
}


export interface SearchConversationsParams {
  search: string;
  limit?: number;
  page?: number;
}

export interface SearchConversationsResponse {
  success: boolean;
  data: {
    conversations: any[];
    totalResults: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Sends a GET request to the `/chats/conversations` endpoint to retrieve
 * all chat sessions that include the authenticated user.
 */
export const getUserConversations = (): Promise<GenericResponse> => {
    return apiClient.get<GenericResponse>("/chats/conversations");
};

/**
 * Sends a GET request to the `/chats/conversations` endpoint with pagination support
 * to retrieve chat sessions that include the authenticated user.
 */
export const getUserConversationsPaginated = ({ pageParam = 1 }): Promise<GenericResponse> => {
    // Increasing initial page size to avoid dah pagination sorting issues
    const limit = pageParam === 1 ? 20 : 10;
    // console.log(`Fetching paginated conversations: page=${pageParam}, limit=${limit}`);
    return apiClient.get<GenericResponse>(`/chats/conversations?page=${pageParam}&limit=${limit}`)
        .then(response => {
            // console.log(`Paginated conversations response structure:`, {
            //     success: response.success,
            //     dataType: typeof response.data,
            //     isDataArray: Array.isArray(response.data),
            //     dataLength: response.data?.length,
            //     hasMessages: response.data?.[0]?.messages?.length,
            //     sampleData: response.data?.[0]
            // });
            return response;
        })
        .catch(error => {
            console.error(`Error fetching paginated conversations:`, error);
            // Fallback to regular endpoint if anything goes wrong
            // console.log('Falling back to regular conversations endpoint');
            return getUserConversations();
        });
};

/**
 * Search through conversations
 */
export const searchConversations = async ({ 
  search, 
  limit = 20, 
  page = 1 
}: SearchConversationsParams): Promise<SearchConversationsResponse> => {
  try {
    const response = await apiClient.get<SearchConversationsResponse>(
      `/chats/search?search=${encodeURIComponent(search)}&limit=${limit}&page=${page}`
    );
    return response;
  } catch (error) {
    console.error('Error searching conversations:', error);
    throw error;
  }
};


// Search conversation messages (specific conversation)
export const searchConversationMessages = async (conversationId: string, searchTerm: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/chats/${conversationId}/search`, { searchTerm });
    return response;
  } catch (error) {
    console.warn('Conversation message search API not available');
    return { success: false, data: [] };
  }
};

/**
 * Marks messages in a conversation as read/seen
 * @param conversationId - The ID of the conversation to mark as read
 * @returns Promise<GenericResponse> - The response with updated conversation data
 */
export const markConversationAsRead = (conversationId: string): Promise<GenericResponse> => {
  return apiClient.get<GenericResponse>(`/chats/conversations/${conversationId}/markMessageStatus`);
};


export const deleteCommunityChatMessage = async (messageId: any) => {
    return apiClient.delete<GenericResponse>(`/chats/community/messages/${messageId}`);
};

export const deleteConversationMessage = async (conversationId: string, messageId: string, userId?: string) => {
    const url = `/chats/chat/messages/${messageId}`;
    return apiClient.delete<GenericResponse>(url);
};

export const toggleConversationFavorite = (conversationId: string): Promise<GenericResponse> => {
    return apiClient.patch<GenericResponse>(`/chats/conversations/${conversationId}/favorite`);
};

export const toggleConversationArchive = (conversationId: string): Promise<GenericResponse> => {
    return apiClient.patch<GenericResponse>(`/chats/conversations/${conversationId}/archive`);
};