import { getFeedNotifications } from "@/services/feed.service";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const useGetNotifications = () => {

  const [selectedFilter, setSelectedFilter] = useState("All activity");
  const filters = [
    "All activity",
    "Likes",
    "Comments",
    "Replies",
    "Mentions",
    "Subscriptions",
  ];

  const getFilterType = (filter: string) => {
    switch (filter) {
      case "All activity":
        return "";
      case "Likes":
        return "like";
      case "Comments":
        return "comment";
      case "Replies":
        return "reply";
      case "Mentions":
        return "mention";
      case "Subscriptions":
        return "subscription";
      default:
        return "";
    }
  };

  const { data, isPending, isError, error, isSuccess, refetch } = useQuery({
    queryKey: ["getUserNotifications", selectedFilter],
    queryFn: () => getFeedNotifications(getFilterType(selectedFilter)),
  });

  return {
    isPending,
    isError,
    isSuccess,
    error,
    data,
    // currentIndex,
    selectedFilter, 
    filters,
    setSelectedFilter,
    // setCurrentIndex,
    refetch,
  };
};

export default useGetNotifications;
