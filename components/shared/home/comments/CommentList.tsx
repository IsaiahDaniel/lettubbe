import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import CommentItem from "@/components/shared/home/CommentItem";
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";
import { Comment } from "@/helpers/types/comments/Types";
import UserProfileBottomSheet from "@/components/ui/Modals/UserProfileBottomSheet";

interface CommentListProps {
  comments: Comment[];
  isPending: boolean;
  isSuccess: boolean;
  onReply: (commentId: string, username: string) => void;
  postId: string;
  isPersonalVideo: boolean;
  onCommentsUpdated?: (updatedComments: Comment[]) => void;
  onAvatarPress?: () => void;
  disableAvatarPress?: boolean;
  onNavigateToReplies?: (comment: Comment, autoFocusReply: boolean) => void;
}

export interface CommentListRef {
  scrollToTop: () => void;
  addOptimisticComment: (comment: Comment) => void;
  addOptimisticReply: (commentId: string, reply: any) => void;
  removeOptimisticComment: (commentId: string) => void;
}

const CommentList = forwardRef<CommentListRef, CommentListProps>(({
  comments,
  isPending,
  isSuccess,
  onReply,
  postId,
  isPersonalVideo,
  onCommentsUpdated,
  onAvatarPress,
  disableAvatarPress = false,
  onNavigateToReplies,
}, ref) => {
  // Simple optimistic comments state
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);
  
  // Track optimistic replies per comment
  const [optimisticReplies, setOptimisticReplies] = useState<{[commentId: string]: any[]}>({});

  // State for user profile bottom sheet
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Ref for FlatList
  const flatListRef = useRef<FlatList>(null);

  // Combine optimistic and real comments, with optimistic replies merged in
  const displayComments = useMemo(() => {
    // Filter out any optimistic comments from real data
    const realComments = comments.filter(comment => !comment.isOptimistic);
    
    // Merge optimistic replies into real comments
    const commentsWithOptimisticReplies = realComments.map(comment => {
      const optimisticRepliesForComment = optimisticReplies[comment._id] || [];
      if (optimisticRepliesForComment.length > 0) {
        return {
          ...comment,
          replies: [...optimisticRepliesForComment, ...(comment.replies || [])]
        };
      }
      return comment;
    });
    
    // Combine optimistic comments at top with real comments (with optimistic replies)
    return [...optimisticComments, ...commentsWithOptimisticReplies];
  }, [optimisticComments, optimisticReplies, comments]);

  // Method to add optimistic comment
  const addOptimisticComment = useCallback((comment: Comment) => {
    setOptimisticComments(prev => [comment, ...prev]);
  }, []);

  // Method to add optimistic reply to a specific comment
  const addOptimisticReply = useCallback((commentId: string, reply: any) => {
    setOptimisticReplies(prev => ({
      ...prev,
      [commentId]: [reply, ...(prev[commentId] || [])]
    }));
  }, []);

  // Method to remove optimistic comment
  const removeOptimisticComment = useCallback((commentId: string) => {
    setOptimisticComments(prev => prev.filter(comment => comment._id !== commentId));
  }, []);

  // Clean up optimistic comments and replies when they appear in real data
  React.useEffect(() => {
    // Clean up optimistic comments
    if (comments.length > 0 && optimisticComments.length > 0) {
      setOptimisticComments(prev => 
        prev.filter(optimistic => {
          // Check if any real comment matches this optimistic comment
          const hasMatch = comments.some(realComment => {
            // Same user check
            const sameUser = realComment.user?._id === optimistic.user?._id;
            
            // Text similarity check (handles mention processing differences)
            const textMatch = realComment.text === optimistic.text ||
              realComment.text.replace(/\s+/g, ' ').trim() === optimistic.text.replace(/\s+/g, ' ').trim();
            
            // Time proximity check (within 30 seconds)
            const optimisticTime = new Date(optimistic.createdAt).getTime();
            const realTime = new Date(realComment.createdAt).getTime();
            const timeProximity = Math.abs(realTime - optimisticTime) < 30000;
            
            return sameUser && textMatch && timeProximity;
          });
          
          return !hasMatch; // Keep optimistic comment only if no match found
        })
      );
    }

    // Clean up optimistic replies
    if (comments.length > 0 && Object.keys(optimisticReplies).length > 0) {
      setOptimisticReplies(prev => {
        const cleaned = { ...prev };
        
        comments.forEach(comment => {
          if (comment.replies && comment.replies.length > 0 && cleaned[comment._id]) {
            // Remove optimistic replies that now exist in real data
            cleaned[comment._id] = cleaned[comment._id].filter(optimisticReply => {
              const hasMatch = comment.replies!.some(realReply => {
                const sameUser = realReply.user?._id === optimisticReply.user?._id;
                const textMatch = realReply.text === optimisticReply.text ||
                  realReply.text.replace(/\s+/g, ' ').trim() === optimisticReply.text.replace(/\s+/g, ' ').trim();
                const optimisticTime = new Date(optimisticReply.createdAt).getTime();
                const realTime = new Date(realReply.createdAt).getTime();
                const timeProximity = Math.abs(realTime - optimisticTime) < 30000;
                
                return sameUser && textMatch && timeProximity;
              });
              
              return !hasMatch;
            });
            
            // Remove empty arrays
            if (cleaned[comment._id].length === 0) {
              delete cleaned[comment._id];
            }
          }
        });
        
        return cleaned;
      });
    }
  }, [comments.length, optimisticComments.length, Object.keys(optimisticReplies).length]); // Only depend on lengths to avoid loops

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    },
    addOptimisticComment,
    addOptimisticReply,
    removeOptimisticComment,
  }), [addOptimisticComment, addOptimisticReply, removeOptimisticComment]);

  const handleCommentDeleted = useCallback((
    commentId: string,
    updatedComments?: Comment[]
  ) => {
    // If the API returns updated comments list, use it
    if (updatedComments && updatedComments.length > 0) {
      if (onCommentsUpdated) {
        onCommentsUpdated(updatedComments);
      }
    } else {
      // Otherwise notify parent to filter out the deleted comment
      if (onCommentsUpdated) {
        const filteredComments = comments.filter(
          (comment) => comment._id !== commentId
        );
        onCommentsUpdated(filteredComments);
      }
    }
  }, [onCommentsUpdated, comments]);

  // Handle showing user profile bottom sheet
  const handleShowUserProfile = useCallback((shouldShow: boolean, userId?: string) => {
    if (shouldShow) {
      setSelectedUserId(userId || null);
      setShowUserProfile(true);
    } else {
      setShowUserProfile(false);
      setSelectedUserId(null);
    }
  }, []);

  // Handle closing user profile bottom sheet
  const handleCloseUserProfile = useCallback(() => {
    setShowUserProfile(false);
    // small delay before clearing the userId to prevent flashing
    setTimeout(() => {
      setSelectedUserId(null);
    }, 300);
  }, []);

  // Render item function with useCallback
  const renderItem = useCallback(({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      onReply={onReply}
      postId={postId}
      isPersonalVideo={isPersonalVideo}
      onCommentDeleted={handleCommentDeleted}
      onAvatarPress={onAvatarPress}
      disableAvatarPress={disableAvatarPress}
      setShowUserProfile={handleShowUserProfile}
      onNavigateToReplies={onNavigateToReplies}
    />
  ), [onReply, postId, isPersonalVideo, handleCommentDeleted, onAvatarPress, disableAvatarPress, handleShowUserProfile, onNavigateToReplies]);

  // Key extractor with useCallback
  const keyExtractor = useCallback((item: Comment) => item._id.toString(), []);

  if (isPending) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.general.primary} />
      </View>
    );
  }

  if (isSuccess && displayComments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Typography>No Comments on this post</Typography>
      </View>
    );
  }

  return (
    <View style={styles.scrollableContent}>
      <FlatList
        ref={flatListRef}
        data={displayComments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<ScrollBottomSpace />}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={100}
        initialNumToRender={10}
        windowSize={8}
        getItemLayout={(data, index) => ({
          length: 140, // More accurate comment height with replies
          offset: 140 * index,
          index,
        })}
        // Additional performance optimizations
        disableVirtualization={false}
        legacyImplementation={false}
      />

      {/* User Profile Bottom Sheet */}
      <UserProfileBottomSheet
        isVisible={showUserProfile}
        onClose={handleCloseUserProfile}
        userId={selectedUserId || undefined}
      />
    </View>
  );
});

CommentList.displayName = 'CommentList';

const styles = StyleSheet.create({
  scrollableContent: {
    flex: 1,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
});

export default CommentList;