import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeMemberFromCommunity } from '@/services/community.service';
import showToast from '@/helpers/utils/showToast';
import { handleError } from '@/helpers/utils/handleError';

interface RemoveMemberParams {
  communityId: string;
  userId: string;
}

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, userId }: RemoveMemberParams) => 
      removeMemberFromCommunity(communityId, userId),
    onSuccess: () => {
      showToast('success', 'Member removed successfully');
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['community'] });
      queryClient.invalidateQueries({ queryKey: ['communityMembers'] });
    },
    onError: (error) => {
      console.error('Failed to remove member:', error);
      showToast('error', 'Failed to remove member');
    },
  });
};