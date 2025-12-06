import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "@/helpers/utils/request";
import { ExploreSection } from "@/helpers/types/explore/explore";

interface SearchPostsParams {
  searchTerm: string;
  category?: string;
  page?: number;
  limit?: number;
  section?: ExploreSection;
}

interface GetViralPostsParams {
  section?: ExploreSection;
  page?: number;
  limit?: number;
}

export const searchPosts = async ({
  searchTerm,
  category,
  page = 1,
  limit = 10,
  section
}: SearchPostsParams): Promise<GenericResponse> => {
  if (!searchTerm || searchTerm.trim() === '') {
    throw new Error('Search term is required');
  }
  
  return apiClient.get('/feeds/posts/search', {
    searchTerm: searchTerm.trim(),
    category: category !== 'All' ? category : undefined,
    section,
    page,
    limit
  });
};

export const getPopularPosts = async ({
  page = 1,
  limit = 10
}: Omit<GetViralPostsParams, 'section'> = {}): Promise<GenericResponse> => {
  return apiClient.get('/feeds/popular', { page, limit });
};

export const getTrendingPosts = async ({
  page = 1,
  limit = 10
}: Omit<GetViralPostsParams, 'section'> = {}): Promise<GenericResponse> => {
  return apiClient.get('/feeds/viral', { page, limit });
};

// export const getForYouPosts = async ({
//   page = 1,
//   limit = 10
// }: Omit<GetViralPostsParams, 'section'> = {}): Promise<GenericResponse> => {
//   return apiClient.get('/feeds/for-you', { page, limit });
// };