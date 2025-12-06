import { IUsersIdStore, IUsersOnlineStore } from "@/helpers/types/user/users.interface";
import { create } from "zustand";

export const useGetOnlineUsersState = create<IUsersOnlineStore>((set) => ({
    usersOnline: [],
    setUsersOnline: (val) => set({ usersOnline: val })
}));

export const useGetUserIdState = create<IUsersIdStore>((set) => ({
    userId: null,
    setUserId: (val) => set({ userId: val })
}));