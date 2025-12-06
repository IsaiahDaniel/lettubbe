import { useState, useEffect } from "react";
import { Comment, DateRange } from "@/helpers/types/comments/Types";

export const useCommentSorting = (originalData: Comment[] | undefined) => {
  const [sortedData, setSortedData] = useState<Comment[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("Top");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [oldestCommentDate, setOldestCommentDate] = useState<Date>(new Date());

  useEffect(() => {
    if (originalData && originalData.length > 0) {
      // Find oldest comment date for date picker minimum
      const oldest = originalData.reduce((min: Date, comment: Comment) => {
        const commentDate = new Date(comment.createdAt);
        return commentDate < min ? commentDate : min;
      }, new Date());
      setOldestCommentDate(oldest);
      
      // Apply sorting
      sortComments();
    }
  }, [originalData, selectedSort, dateRange]);

  const sortComments = () => {
    if (!originalData) return;
    
    let sorted = [...originalData] as Comment[];
    
    switch (selectedSort) {
      case "Top":
        // Sort by number of replies (descending)
        sorted = sorted.sort((a, b) => b.replies.length - a.replies.length);
        break;
      
      case "Most Liked":
        // Sort by number of likes (descending)
        sorted = sorted.sort((a, b) => b.likes.length - a.likes.length);
        break;
      
      case "Newest":
        // Sort by creation date (newest first)
        sorted = sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      
      case "Timed":
        // Filter by date range if both from and to dates are set
        if (dateRange.from && dateRange.to) {
          sorted = sorted.filter(comment => {
            const commentDate = new Date(comment.createdAt);
            return commentDate >= (dateRange.from as Date) && commentDate <= (dateRange.to as Date);
          });
          // Then sort by date (newest first)
          sorted = sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        break;
      
      default:
        // Default to newest
        sorted = sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setSortedData(sorted);
  };

  return {
    sortedData,
    selectedSort,
    setSelectedSort,
    dateRange,
    setDateRange,
    oldestCommentDate,
  };
};