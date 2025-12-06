import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCommunity } from '@/services/community.service';

export const useGetCommunity = (communityId: string) => {
  const result = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => {
      console.log('🔄 Fetching community data for:', communityId);
      return getCommunity(communityId);
    },
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache data for reasonable time
    refetchOnMount: false, // Don't automatically refetch on mount if data exists
    refetchOnWindowFocus: false,
  });

  // Use useEffect for logging instead of deprecated callbacks
  React.useEffect(() => {
    if (result.data) {
      console.log('✅ Community data fetched successfully:', {
        communityId,
        approvals: result.data?.data?.approvals,
        name: result.data?.data?.name
      });
    }
    if (result.error) {
      console.log('❌ Failed to fetch community data:', result.error);
    }
  }, [result.data, result.error, communityId]);

  return result;
};