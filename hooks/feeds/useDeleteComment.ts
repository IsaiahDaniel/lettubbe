import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteComment } from '@/services/feed.service';
import { GenericResponse } from '@/helpers/types/general.types';
import { useAlert } from '@/components/ui/AlertProvider';

interface DeleteCommentParams {
  postId: string;
  commentId: string;
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { showInfo, showError } = useAlert();

  return useMutation<GenericResponse, Error, DeleteCommentParams>({
    mutationFn: ({ postId, commentId }) => deleteComment(postId, commentId),
    
    onSuccess: (data, { postId, commentId }) => {
      // Update the comments cache by removing the deleted comment
      queryClient.setQueryData(['comments', postId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            comments: oldData.data.comments.filter((comment: any) => comment._id !== commentId)
          }
        };
      });

      // Also update any feeds cache that might contain this post
      queryClient.setQueriesData(
        { queryKey: ['feeds'] }, 
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages?.map((page: any) => ({
              ...page,
              data: {
                ...page.data,
                posts: page.data.posts?.map((post: any) => {
                  if (post._id === postId) {
                    return {
                      ...post,
                      comments: post.comments?.filter((comment: any) => comment._id !== commentId) || []
                    };
                  }
                  return post;
                })
              }
            }))
          };
        }
      );

      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      
      showInfo('Success', 'Comment deleted successfully');
    },
    
    onError: (error) => {
      console.error('Error deleting comment:', error);
      showError(
        'Error',
        'Failed to delete the comment. Please try again.'
      );
    },
  });
};