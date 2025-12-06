import useAuth from '@/hooks/auth/useAuth';

// Simple function to check if user has pending request using existing community data
export const useCheckPendingJoinRequest = (communityData: any) => {
  const { userDetails } = useAuth();
  const currentUserId = userDetails?._id;
  
  if (!communityData || !currentUserId) {
    return { hasPendingRequest: false };
  }
  
  const approvals = communityData.approvals || [];
  const hasPendingRequest = approvals.includes(currentUserId);
  
  return { hasPendingRequest };
};