export type IUsersOnlineStore = {
    usersOnline: string[],
    setUsersOnline: (val: any) => void,
}

export type IUsersIdStore = {
    userId: string | null,
    setUserId: (val: any) => void,
}