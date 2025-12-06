import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import axios from 'axios';
import { baseURL } from '@/config/axiosInstance';
import { getData } from '@/helpers/utils/storage';
import useAuth from '@/hooks/auth/useAuth';
import { useGetUserIdState } from '@/store/UserStore';

export interface VerificationBadgeData {
  _id: string;
  user: string;
  level: 'gold' | 'platinum';
  isVerified: boolean;
  verifiedAt: string;
  __v: number;
}

export interface VerificationBadgeResponse {
  success: boolean;
  message: string;
  data: VerificationBadgeData | null;
}

const useVerificationBadge = () => {
  const { userDetails } = useAuth();
  const { userId: storeUserId } = useGetUserIdState();
  
  // Memoize userId to prevent re-renders when userDetails object reference changes
  const userId = useMemo(() => {
    return storeUserId || 
           userDetails?._id || 
           userDetails?.data?._id ||
           userDetails?.id;
  }, [storeUserId, userDetails?._id, userDetails?.data?._id, userDetails?.id]);
  
  return useQuery({
    queryKey: ['verificationBadge', userId],
    queryFn: async (): Promise<VerificationBadgeResponse> => {
      if (!userId) {
        throw new Error('User ID not available');
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
    enabled: !!userId, // Only fetch when userId is available
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export default useVerificationBadge;