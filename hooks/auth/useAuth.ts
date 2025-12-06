import { useAuthContext } from "@/contexts/AuthProvider";
import { UserStore, useGetOnlineUsersState, useGetUserIdState } from "@/store/UserStore";
import { useGetVideoItemStore, useGetPostItemStore } from "@/store/feedStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { useSearchStore } from "@/store/searchStore";
import useContactStore from "@/store/contactStore";
import useVideoUploadStore from "@/store/videoUploadStore";

/**
 * Legacy useAuth hook that now delegates to AuthProvider
 * This maintains backward compatibility while using the centralized auth system
 */
const useAuth = () => {
	// Get auth data from the centralized AuthProvider
	const { userDetails, token, logout: contextLogout } = useAuthContext();

	// Enhanced logout that also resets all stores
	const logout = async () => {
		try {
			console.log("Starting logout process...");

			// Reset all Zustand stores
			UserStore.getState().resetUserInfo();
			useGetOnlineUsersState.getState().setUsersOnline([]);
			useGetUserIdState.getState().setUserId(null);
			useGetVideoItemStore.getState().reset();
			useGetPostItemStore.getState().reset();
			usePlaylistStore.getState().clearPlaylist();
			useSearchStore.getState().reset();
			useContactStore.getState().reset();
			useVideoUploadStore.getState().reset();
			console.log("All stores reset");

			// Call the centralized logout
			await contextLogout();
			console.log("Logout completed successfully");
		} catch (error) {
			console.error("Error during logout:", error);
			// Fallback to centralized logout even if store reset fails
			await contextLogout();
		}
	};

	return {
		userDetails,
		token,
		logout,
	};
};

export default useAuth;
