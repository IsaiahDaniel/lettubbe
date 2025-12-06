import { apiClient } from "@/helpers/utils/request";
import { GenericResponse } from "@/helpers/types/general.types";

export const createCommunity = async (data: { name: string; description: string }) => {
  return apiClient.post("/communities", data);
};

export const updateCommunityPhoto = async (communityId: string, photo: string) => {
  console.log('updateCommunityPhoto service - Called with communityId:', communityId);
  
  const formData = new FormData();
  formData.append('communityPhoto', {
    uri: photo,
    type: 'image/jpeg',
    name: 'community-photo.jpg',
  } as any);
  
  // Include communityId in FormData
  formData.append('communityId', communityId);

  console.log('updateCommunityPhoto service - Making API call with communityId in path:', { communityId });
  
  return apiClient.patch(`/communities/photo/${communityId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
};

export const updateCommunityTopics = async (communityId: string, topics: string[]) => {
  return apiClient.patch(`/communities/categories/${communityId}`, { categories: topics });
};

export const finalizeCommunity = async (communityId: string, type: 'public' | 'private' | 'hidden') => {
  return apiClient.patch(`/communities/finalize/${communityId}`, { type });
};

export const getCommunity = async (communityId: string) => {
  return apiClient.get(`/communities/community/${communityId}`);
};

export const getJoinedCommunities = async (page = 1, limit = 10) => {
  const response = await apiClient.get(`/communities/me?page=${page}&limit=${limit}`);
  const communities = response.data?.data?.length || 0;
  const hasNext = response.data?.hasNextPage;
  const totalDocs = response.data?.totalDocs;
  const totalPages = response.data?.totalPages;
  console.log(`📄 Page ${page}: ${communities} communities, hasNext: ${hasNext}, totalDocs: ${totalDocs}, limit: ${limit}, totalPages: ${totalPages}`);
  return response;
};

export const getAllCommunities = async (pageParam = 1) => {
  return apiClient.get(`/communities/?page=${pageParam}&limit=100`);
};

export const joinCommunity = async (communityId: string) => {
  return apiClient.post(`/communities/community/${communityId}/join`);
};

export const leaveCommunity = async (communityId: string) => {
  return apiClient.delete(`/communities/community/${communityId}/leave`);
};

export const editCommunity = async (communityId: string, data: {
  name?: string;
  description?: string;
  type?: 'public' | 'private' | 'hidden';
  photoUrl?: string;
  categories?: string[];
}) => {
  return apiClient.patch(`/communities/community/${communityId}`, data);
};

export const addMembersToCommunity = async (communityId: string, userIds: string[]) => {
  return apiClient.patch(`/communities/community/${communityId}/addMembers`, { members: userIds });
};

export const sendJoinRequest = async (communityId: string) => {
  return apiClient.post(`/communities/community/${communityId}/request`);
};

export const getCommunityRequests = async (communityId: string) => {
  return apiClient.get(`/communities/community/${communityId}/request`);
};

export const updateRequestStatus = async (communityId: string, memberId: string, status: 'approve' | 'deny') => {
  return apiClient.patch(`/communities/community/${communityId}/approvalStatus`, { 
    memberId,
    status 
  });
};

export const addSubAdmins = async (communityId: string, memberIds: string[]) => {
  return apiClient.patch(`/communities/community/${communityId}/addSubAdmins`, { 
    members: memberIds 
  });
};

export const removeMemberFromCommunity = async (communityId: string, userId: string) => {
  return apiClient.patch(`/communities/community/${communityId}/removeUser`, { 
    userId 
  });
};

export const demoteAdmin = async (communityId: string, adminId: string) => {
  return apiClient.patch(`/communities/community/${communityId}/removeAdmin`, { 
    userId: adminId 
  });
};

// Search communities
export interface SearchCommunitiesParams {
  searchTerm: string;
  page?: number;
  limit?: number;
}

export interface SearchCommunitiesResponse {
  success: boolean;
  data: {
    communities: any[];
    totalResults: number;
    page: number;
    hasMore: boolean;
  };
}

export const searchCommunities = async ({ 
  searchTerm, 
  page = 1, 
}: SearchCommunitiesParams) => {
  return apiClient.get(`/communities/search?page=${page}&searchTerm=${encodeURIComponent(searchTerm)}`);
};
