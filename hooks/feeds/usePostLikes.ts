import { useQuery } from "@tanstack/react-query";
import { getPostLikes } from "@/services/feed.service";
import { GenericResponse } from "@/helpers/types/general.types";

export const usePostLikes = (postId: string, enabled: boolean = false) => {
  return useQuery<GenericResponse>({
    queryKey: ["postLikes", postId],
    queryFn: () => getPostLikes(postId, 1, 50),
    enabled: enabled && !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};