import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendJoinRequest, getCommunity } from '@/services/community.service';
import showToast from '@/helpers/utils/showToast';

export const useSendJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => {
      console.log('📤 Sending join request for community:', communityId);
      return sendJoinRequest(communityId);
    },
    onSuccess: (data, communityId) => {
      console.log('✅ Join request sent successfully:', data);
      
      // Show success toast
      showToast('success', 'Your join request has been sent to the community admin', 'Request Sent');
      
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['joinedCommunities'] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'all', 'infinite'] });
      // Invalidate search queries that might contain communities
      queryClient.invalidateQueries({ queryKey: ['search'] });
      
      console.log('🔄 Invalidated queries for community:', communityId);
      
      // Force refetch after a short delay to ensure data is updated
      setTimeout(() => {
        console.log('🔄 Force refetching community data...');
        queryClient.refetchQueries({ queryKey: ['community', communityId] });
        
        // Also try removing from cache and refetching
        queryClient.removeQueries({ queryKey: ['community', communityId] });
        queryClient.prefetchQuery({ 
          queryKey: ['community', communityId],
          queryFn: () => {
            console.log('🔄 Manual refetch for community:', communityId);
            return getCommunity(communityId);
          }
        });
      }, 1000);
    },
    onError: (error) => {
      console.error('❌ Failed to send join request:', error);
      showToast('error', 'Failed to send join request. Please try again.', 'Request Failed');
    },
  });
};