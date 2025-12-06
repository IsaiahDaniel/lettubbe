const TIME_PROXIMITY_THRESHOLD_MS = 30 * 1000; // 30 seconds in milliseconds

interface Reply {
  user?: { _id: string };
  text: string;
  createdAt: string;
}

const normalizeText = (text: string): string => 
  text.replace(/\s+/g, ' ').trim();

const isSameUser = (reply1: Reply, reply2: Reply): boolean =>
  reply1.user?._id === reply2.user?._id;

const isTextMatch = (reply1: Reply, reply2: Reply): boolean => {
  const text1 = reply1.text;
  const text2 = reply2.text;
  
  return text1 === text2 || 
         normalizeText(text1) === normalizeText(text2);
};

const isWithinTimeProximity = (reply1: Reply, reply2: Reply): boolean => {
  const time1 = new Date(reply1.createdAt).getTime();
  const time2 = new Date(reply2.createdAt).getTime();
  
  return Math.abs(time1 - time2) < TIME_PROXIMITY_THRESHOLD_MS;
};

export const isMatchingReply = (
  optimisticReply: Reply, 
  realReply: Reply
): boolean => {
  return isSameUser(optimisticReply, realReply) &&
         isTextMatch(optimisticReply, realReply) &&
         isWithinTimeProximity(optimisticReply, realReply);
};

export const filterOutMatchedOptimisticReplies = <T extends Reply>(
  optimisticReplies: T[],
  realReplies: Reply[]
): T[] => {
  return optimisticReplies.filter(optimisticReply => {
    const hasMatch = realReplies.some(realReply => 
      isMatchingReply(optimisticReply, realReply)
    );
    return !hasMatch;
  });
};