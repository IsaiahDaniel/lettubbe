import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMembersToCommunity } from '@/services/community.service';

export const useAddMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, userIds }: { communityId: string; userIds: string[] }) => 
      addMembersToCommunity(communityId, userIds),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['community', variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ['communityMembers'] });
      queryClient.invalidateQueries({ queryKey: ['joinedCommunities'] });
    },
    onError: (error) => {
      console.error('Failed to add members:', error);
    },
  });
};