import { create } from "zustand";
import { IUsersIdStore, IUsersOnlineStore } from "@/helpers/types/user/users.interface";

interface UserState {
	firstName: string;
	lastName: string;
	dob: string; // Store DOB as string (ISO format) for consistency
	setUserInfo: (info: Partial<UserState>) => void;
	resetUserInfo: () => void;
}

export const UserStore = create<UserState>((set) => ({
	firstName: "",
	lastName: "",
	dob: "",
	setUserInfo: (info) => set((state) => ({ ...state, ...info })),
	resetUserInfo: () => set({ firstName: "", lastName: "", dob: "" }),
}));

export const useGetOnlineUsersState = create<IUsersOnlineStore>((set) => ({
    usersOnline: [],
    setUsersOnline: (val) => set({ usersOnline: val })
}));

export const useGetUserIdState = create<IUsersIdStore>((set) => ({
    userId: null,
    setUserId: (val) => set({ userId: val })
}));