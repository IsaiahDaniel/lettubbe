import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { baseURL } from '@/config/axiosInstance';
import { getData } from '@/helpers/utils/storage';

export interface UserVerificationBadgeData {
  _id: string;
  user: string;
  level: 'gold' | 'platinum';
  isVerified: boolean;
  verifiedAt: string;
  __v: number;
}

export interface UserVerificationBadgeResponse {
  success: boolean;
  message: string;
  data: UserVerificationBadgeData | null;
}

const useUserVerificationBadge = (userId?: string) => {
  return useQuery({
    queryKey: ['userVerificationBadge', userId],
    queryFn: async (): Promise<UserVerificationBadgeResponse> => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const token = await getData('token');
      
      const response = await axios.get(
        `${baseURL}/profile/verification/badge?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data;
    },
    enabled: !!userId, // Only fetch when userId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export default useUserVerificationBadge;