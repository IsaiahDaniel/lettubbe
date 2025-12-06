import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommunityRequests, updateRequestStatus } from '@/services/community.service';
import { ITEM_STATUS } from '@/helpers/enums/itemEnums';

export const useCommunityRequests = (communityId: string) => {
  return useQuery({
    queryKey: ['communityRequests', communityId],
    queryFn: () => getCommunityRequests(communityId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, memberId, status }: { 
      communityId: string; 
      memberId: string; 
      status: 'approve' | 'deny' 
    }) => updateRequestStatus(communityId, memberId, status),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['communityRequests', variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ['communityMembers', variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ['playlist'] });
    },
    onError: (error) => {
      console.error('Failed to update request status:', error);
    },
  });
};

// Helper hooks for approve and deny actions
export const useApproveRequest = () => {
  const updateRequestStatus = useUpdateRequestStatus();
  
  return {
    approveRequest: (communityId: string, memberId: string) => 
      updateRequestStatus.mutateAsync({ 
        communityId, 
        memberId, 
        status: ITEM_STATUS.APPROVE as 'approve'
      }),
    isLoading: updateRequestStatus.isPending,
    error: updateRequestStatus.error
  };
};

export const useDenyRequest = () => {
  const updateRequestStatus = useUpdateRequestStatus();
  
  return {
    denyRequest: (communityId: string, memberId: string) => 
      updateRequestStatus.mutateAsync({ 
        communityId, 
        memberId, 
        status: ITEM_STATUS.DENY as 'deny'
      }),
    isLoading: updateRequestStatus.isPending,
    error: updateRequestStatus.error
  };
};