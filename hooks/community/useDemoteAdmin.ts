import { useMutation, useQueryClient } from '@tanstack/react-query';
import { demoteAdmin } from '@/services/community.service';
import showToast from '@/helpers/utils/showToast';
import { handleError } from '@/helpers/utils/handleError';

interface DemoteAdminParams {
  communityId: string;
  adminId: string;
}

export const useDemoteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, adminId }: DemoteAdminParams) => 
      demoteAdmin(communityId, adminId),
    onSuccess: () => {
      showToast('success', 'Admin demoted successfully');
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['community'] });
      queryClient.invalidateQueries({ queryKey: ['communityMembers'] });
    },
    onError: (error) => {
      console.error('Failed to demote admin:', error);
      showToast('error', 'Failed to demote admin');
    },
  });
};