import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "@/helpers/utils/request";

interface NotInterestedResponse extends GenericResponse {
  status: "added" | "removed";
  notInterested?: {
    category: string;
    reason: string;
    timestamp: string;
  };
}

export const createReport = (data: {
  postId: string;
  category: "spam" | "violence" | "harassment" | "hate_speech" | "sexual_content" | "copyright" | "other";
  reason: string;
}): Promise<GenericResponse> => {
  return apiClient.post<GenericResponse>(`/reports`, data);
};

export const toggleNotInterested = (
  postId: string, 
  data?: {
    category: string;
    reason: string;
  }
): Promise<NotInterestedResponse> => {
  return apiClient.patch(`/feeds/posts/${postId}/not-interested`, data || {});
};

export const markAsNotInterested = (
  postId: string,
  category: string,
  reason: string
): Promise<NotInterestedResponse> => {
  return toggleNotInterested(postId, { category, reason });
};

export const removeNotInterestedStatus = (
  postId: string
): Promise<NotInterestedResponse> => {
  return toggleNotInterested(postId);
};