import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import useAuth from "@/hooks/auth/useAuth";
import useGetComments from "@/hooks/feeds/useGetComments";
import useAddComment from "@/hooks/feeds/useAddComment";
import { SortOption } from "@/helpers/types/comments/Types";
import { useCommentSorting } from "@/hooks/feeds/useCommentSorting";
import CommentSectionHeader from "../home/comments/CommentSectionHeader";
import DateRangeIndicator from "../home/comments/DateRangeIndicator";
import CommentList, { CommentListRef } from "../home/comments/CommentList";
import CommentInput from "../home/comments/CommentInput";
import DateRangePicker from "../home/comments/DateRangePicker";
import CommentRepliesPage from "../home/comments/CommentRepliesPage";
import { MentionUser } from "@/store/videoUploadStore";
import { Comment } from "@/helpers/types/comments/Types";

// Define sort options
const sortOptions: SortOption[] = [
  { id: "1", name: "Top", selected: true },
  { id: "2", name: "Most Liked", selected: false },
  { id: "3", name: "Newest", selected: false },
  // { id: "4", name: "Timed", selected: false },
];

interface CommentSectionProps {
  postId: string;
  authorId: string; // Required prop - the author ID of the video
  isPersonalVideo?: boolean; // Optional prop to explicitly override the calculated value
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  authorId, 
  isPersonalVideo: propIsPersonalVideo 
}) => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const { data: originalData, isPending, isSuccess, refetchCommment } = useGetComments(postId);
  const [dateRangeVisible, setDateRangeVisible] = useState<boolean>(false);
  
  // States for tracking reply mode
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyToUsername, setReplyToUsername] = useState<string>("");
  
  // State for tracking mentions
  const [currentMentions, setCurrentMentions] = useState<MentionUser[]>([]);

  // States for replies page navigation
  const [showRepliesPage, setShowRepliesPage] = useState<boolean>(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [autoFocusReply, setAutoFocusReply] = useState<boolean>(false);

  // Ref for CommentList to scroll to top
  const commentListRef = useRef<CommentListRef>(null);

  // console.log("CommentSection - Received authorId:", authorId);
  // console.log("CommentSection - Current userDetails._id:", userDetails?._id);

  // accounting for async loading
  const isPersonalVideo = useMemo(() => {
    // Check if explicitly set via prop
    if (propIsPersonalVideo !== undefined) {
      return propIsPersonalVideo;
    }
    
    // Validation checks for required data
    if (!userDetails?._id) {
      return false;
    }
    
    if (!authorId) {
      return false;
    }
    
    // Compare user ID with author ID
    return userDetails._id === authorId;
    
  }, [propIsPersonalVideo, userDetails?._id, authorId]);

  // useEffect(() => {
  //   console.log("CommentSection - State updated:");
  //   console.log("- isPersonalVideo:", isPersonalVideo);
  //   console.log("- authorId:", authorId);
  //   console.log("- userDetails?._id:", userDetails?._id);
  // }, [userDetails?._id, authorId, isPersonalVideo]);

  // comment sorting
  const {
    sortedData,
    selectedSort,
    setSelectedSort,
    dateRange,
    setDateRange,
    oldestCommentDate,
  } = useCommentSorting(originalData);

  // Callback for after successful comment submission
  const onCommentSuccess = useCallback(() => {
    // Clear reply state and mentions
    setReplyTo(null);
    setReplyToUsername("");
    setCurrentMentions([]);
    
    // Scroll to top immediately after data refetch
    setTimeout(() => {
      commentListRef.current?.scrollToTop();
    }, 100); // Shorter delay
  }, []);

  // Memoize user data to prevent unnecessary optimistic comment recreation
  const memoizedUserData = useMemo(() => ({
    _id: userDetails?._id || '',
    username: userDetails?.username || '',
    firstName: userDetails?.firstName || '',
    lastName: userDetails?.lastName || '',
    profilePicture: userDetails?.profilePicture || '',
  }), [userDetails?._id, userDetails?.username, userDetails?.firstName, userDetails?.lastName, userDetails?.profilePicture]);

  // Callback for when user starts typing/submitting comment or reply
  const onCommentSubmit = useCallback((commentText: string) => {
    if (!userDetails) return;

    if (replyTo) {
      // This is a reply - handle it differently
      const optimisticReply = {
        _id: `temp-reply-${Date.now()}`,
        text: commentText,
        user: memoizedUserData,
        createdAt: new Date().toISOString(),
        likes: [],
        isOptimistic: true,
      };

      // Add optimistic reply to the specific comment
      commentListRef.current?.addOptimisticReply(replyTo, optimisticReply);
      return optimisticReply._id;
    } else {
      // This is a top-level comment
      const optimisticComment = {
        _id: `temp-comment-${Date.now()}`,
        text: commentText,
        user: memoizedUserData,
        createdAt: new Date().toISOString(),
        likes: [],
        replies: [],
        isOptimistic: true,
      };

      // Add optimistic comment at the top and scroll immediately
      commentListRef.current?.addOptimisticComment(optimisticComment);
      setTimeout(() => {
        commentListRef.current?.scrollToTop();
      }, 50);

      return optimisticComment._id;
    }
  }, [userDetails, memoizedUserData, replyTo]);

  const {
    handleAddComment,
    isPending: commentIsPending,
    control,
    commentText,
    setCommentText,
    handleSubmit,
  } = useAddComment(postId, refetchCommment, replyTo, onCommentSuccess, currentMentions);

  const handleCommentSubmit = useCallback(() => {
    if (!commentText.trim() || commentIsPending) {
      return;
    }
    
    // Add optimistic comment immediately before sending to API
    const tempId = onCommentSubmit(commentText.trim());
    
    handleAddComment();
  }, [handleAddComment, commentText, commentIsPending, onCommentSubmit]);

  const handleSortChange = useCallback((option: SortOption) => {
    setSelectedSort(option.name);
    if (option.name === "Timed") {
      setDateRangeVisible(true);
    }
  }, [setSelectedSort]);

  const handleDateRangeApply = useCallback((from: Date, to: Date) => {
    setDateRange({ from, to });
  }, [setDateRange]);

  const handleReply = useCallback((commentId: string, username: string) => {
    setReplyTo(commentId);
    setReplyToUsername(username);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyTo(null);
    setReplyToUsername("");
  }, []);

  // Handle navigation to replies page
  const handleNavigateToReplies = useCallback((comment: Comment, shouldAutoFocusReply: boolean) => {
    setSelectedComment(comment);
    setAutoFocusReply(shouldAutoFocusReply);
    setShowRepliesPage(true);
  }, []);

  // Handle closing replies page
  const handleCloseRepliesPage = useCallback(() => {
    setShowRepliesPage(false);
    setSelectedComment(null);
    setAutoFocusReply(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <CommentSectionHeader 
        sortOptions={sortOptions} 
        selectedSort={selectedSort} 
        onSortChange={handleSortChange} 
      />

      {/* Date Range Picker */}
      <DateRangePicker
        visible={dateRangeVisible}
        onClose={() => setDateRangeVisible(false)}
        onApply={handleDateRangeApply}
        minDate={oldestCommentDate}
      />

      {/* Timed Filter Indicator */}
      {selectedSort === "Timed" && (
        <DateRangeIndicator 
          dateRange={dateRange} 
          openDateRangePicker={() => setDateRangeVisible(true)} 
        />
      )}

      {/* Comments List */}
      <CommentList 
        ref={commentListRef}
        comments={sortedData}
        isPending={isPending}
        isSuccess={isSuccess}
        onReply={handleReply}
        postId={postId}
        isPersonalVideo={isPersonalVideo}
        onNavigateToReplies={handleNavigateToReplies}
      />

      {/* Comment Input */}
      <View style={{ marginTop: "auto" }}>
        <CommentInput 
          commentText={commentText}
          setCommentText={setCommentText}
          handleAddComment={handleCommentSubmit}
          replyTo={replyTo}
          replyToUsername={replyToUsername}
          cancelReply={cancelReply}
          theme={theme}
          isSubmitting={commentIsPending}
          onMentionsChange={setCurrentMentions}
        />
      </View>

      {/* Replies Page Modal */}
      {showRepliesPage && selectedComment && (
        <View style={StyleSheet.absoluteFill}>
          <CommentRepliesPage
            comment={selectedComment}
            postId={postId}
            isPersonalVideo={isPersonalVideo}
            onClose={handleCloseRepliesPage}
            autoFocusReply={autoFocusReply}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
});

export default CommentSection;