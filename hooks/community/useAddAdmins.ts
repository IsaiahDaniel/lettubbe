import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addSubAdmins } from '@/services/community.service';

export const useAddAdmins = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, memberIds }: { 
      communityId: string; 
      memberIds: string[] 
    }) => addSubAdmins(communityId, memberIds),
    onSuccess: (data, variables) => {
      console.log('Successfully added admins:', data);
      // Invalidate relevant queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['community', variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ['communityMembers', variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ['joinedCommunities'] });
    },
    onError: (error) => {
      console.error('Failed to add admins:', error);
      console.error('Error details:', error.response?.data || error.message);
    },
  });
};