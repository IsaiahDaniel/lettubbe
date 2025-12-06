import { create } from "zustand";

interface CommunityState {
  pendingCommunityIds: Set<string>;
  addPendingCommunity: (communityId: string) => void;
  removePendingCommunity: (communityId: string) => void;
  isPendingCommunity: (communityId: string) => boolean;
  clearPendingCommunities: () => void;
  syncWithJoinedCommunities: (joinedCommunityIds: string[]) => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  pendingCommunityIds: new Set<string>(),
  
  addPendingCommunity: (communityId: string) => 
    set((state) => ({
      pendingCommunityIds: new Set(state.pendingCommunityIds).add(communityId)
    })),
  
  removePendingCommunity: (communityId: string) => 
    set((state) => {
      const newSet = new Set(state.pendingCommunityIds);
      newSet.delete(communityId);
      return { pendingCommunityIds: newSet };
    }),
  
  isPendingCommunity: (communityId: string) => 
    get().pendingCommunityIds.has(communityId),
  
  clearPendingCommunities: () => 
    set({ pendingCommunityIds: new Set<string>() }),
  
  syncWithJoinedCommunities: (joinedCommunityIds: string[]) => 
    set((state) => {
      const newPendingIds = new Set(state.pendingCommunityIds);
      // Remove any communities that the user has now joined
      joinedCommunityIds.forEach(id => newPendingIds.delete(id));
      return { pendingCommunityIds: newPendingIds };
    }),
}));