import { getPost } from "@/services/feed.service";
import { useQuery } from "@tanstack/react-query";

const useGetPost = (postId: string) => {

    const { data, isPending, error, isSuccess } = useQuery({
        queryKey: ["getPostFeed", postId],
        queryFn: () => getPost(postId),
        enabled: !!postId
    });


    return {
        data,
        isPending,
        error,
        isSuccess
    }

}

export default useGetPost;