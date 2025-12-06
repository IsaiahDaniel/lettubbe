import { useQueries } from '@tanstack/react-query';
import { getPublicProfile } from '@/services/profile.service';

interface CommunityMemberBasic {
  _id: string;
}

export const useCommunityMembers = (memberIds: string[]) => {
  // Remove duplicate member IDs to prevent duplicate queries
  const uniqueMemberIds = [...new Set(memberIds.filter(Boolean))];
  
  const memberQueries = useQueries({
    queries: uniqueMemberIds.map((memberId) => ({
      queryKey: ['publicProfile', memberId],
      queryFn: () => getPublicProfile(memberId),
      enabled: !!memberId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })),
  });

  const isLoading = memberQueries.some(query => query.isLoading);
  const isError = memberQueries.some(query => query.isError);
  
  const members = memberQueries
    .map((query, index) => ({
      _id: uniqueMemberIds[index],
      ...query.data?.data,
      isLoading: query.isLoading,
      isError: query.isError,
    }))
    .filter(member => !member.isError); // Filter out failed requests

  return {
    members,
    isLoading,
    isError,
  };
};