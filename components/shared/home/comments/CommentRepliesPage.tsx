import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import useAuth from '@/hooks/auth/useAuth';
import TopHeader from '@/components/ui/TopHeader';
import CommentInput from './CommentInput';
import OriginalCommentDisplay from './OriginalCommentDisplay';
import ReplyItem from '../ReplyItem';
import useAddComment from '@/hooks/feeds/useAddComment';
import useGetComments from '@/hooks/feeds/useGetComments';
import { useOptimisticReplies } from '@/hooks/feeds/useOptimisticReplies';
import { Comment } from '@/helpers/types/comments/Types';
import { MentionUser } from '@/store/videoUploadStore';
import Typography from '@/components/ui/Typography/Typography';
import { TextInput } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

interface CommentRepliesPageProps {
  comment: Comment;
  postId: string;
  isPersonalVideo: boolean;
  onClose: () => void;
  autoFocusReply?: boolean;
}

const CommentRepliesPage: React.FC<CommentRepliesPageProps> = ({
  comment,
  postId,
  isPersonalVideo,
  onClose,
  autoFocusReply = false,
}) => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const queryClient = useQueryClient();

  const [currentMentions, setCurrentMentions] = useState<MentionUser[]>([]);
  
  const memoizedUserData = useMemo(() => ({
    _id: userDetails?._id || '',
    username: userDetails?.username || '',
    firstName: userDetails?.firstName || '',
    lastName: userDetails?.lastName || '',
    profilePicture: userDetails?.profilePicture || '',
  }), [userDetails?._id, userDetails?.username, userDetails?.firstName, userDetails?.lastName, userDetails?.profilePicture]);

  // Ref for auto-focusing input
  const inputRef = useRef<TextInput>(null);

  const { data: sortedComments, refetchCommment: refetchComments } = useGetComments(postId);
  const commentsData = { data: sortedComments };
  const currentComment = commentsData?.data?.find((c: Comment) => c._id === comment._id) || comment;
  
  const { allReplies, addOptimisticReply } = useOptimisticReplies(currentComment.replies || []);

  const {
    handleAddComment,
    isPending: replyIsPending,
    commentText,
    setCommentText,
  } = useAddComment(
    postId,
    refetchComments,
    comment._id,
    () => {
      setCurrentMentions([]);
      queryClient.invalidateQueries({
        queryKey: ["postComments", postId]
      });
      refetchComments();
    },
    currentMentions
  );


  const handleReplySubmit = useCallback(() => {
    if (!commentText.trim() || replyIsPending) return;
    
    const textToSend = commentText.trim();
    addOptimisticReply(textToSend, memoizedUserData);
    handleAddComment();
    
    setTimeout(() => {
      setCommentText('');
    }, 0);
  }, [commentText, replyIsPending, addOptimisticReply, memoizedUserData, handleAddComment, setCommentText]);

  // Render reply item
  const renderReply = useCallback(({ item }: { item: any }) => (
    <ReplyItem
      reply={item}
      postId={postId}
      commentId={comment._id}
      parentUsername={comment.user?.username}
      disableAvatarPress={false}
    />
  ), [postId, comment._id, comment.user?.username]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      {/* Header */}
      <TopHeader
        title="Replies"
        routeTo={onClose}
      />

      {/* Main Content */}
      <View style={styles.content}>
        <OriginalCommentDisplay
          comment={currentComment}
          theme={theme}
          currentUserId={userDetails?._id}
        />

        {/* Replies List */}
        <FlatList
          data={allReplies}
          renderItem={renderReply}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.repliesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Typography size={14} color={Colors[theme].textLight}>
                No replies yet. Be the first to reply!
              </Typography>
            </View>
          }
        />
      </View>

      {/* Reply Input */}
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <CommentInput
          commentText={commentText}
          setCommentText={setCommentText}
          handleAddComment={handleReplySubmit}
          replyTo={null}
          replyToUsername={""}
          cancelReply={() => {}} // Not needed
          theme={theme}
          isSubmitting={replyIsPending}
          onMentionsChange={setCurrentMentions}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  repliesList: {
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  inputContainer: {
  },
});

export default CommentRepliesPage;