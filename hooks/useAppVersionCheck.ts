import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { getLatestAppVersion } from "@/services/app.service";
import Constants from "expo-constants";

interface UseAppVersionCheckReturn {
	isUpdateAvailable: boolean;
	isLoading: boolean;
	error: string | null;
	latestVersion: string | null;
	currentVersion: string;
	releaseNotes: string | null;
	isForced: boolean;
	checkForUpdates: () => Promise<void>;
	showUpdateModal: boolean;
	setShowUpdateModal: (show: boolean) => void;
}

const compareVersions = (current: string, latest: string): boolean => {
	const parseVersion = (version: string) => {
		return version.split('.').map(num => parseInt(num, 10) || 0);
	};

	const currentParts = parseVersion(current);
	const latestParts = parseVersion(latest);
	
	// Ensure both arrays have same length
	const maxLength = Math.max(currentParts.length, latestParts.length);
	while (currentParts.length < maxLength) currentParts.push(0);
	while (latestParts.length < maxLength) latestParts.push(0);
	
	for (let i = 0; i < maxLength; i++) {
		if (latestParts[i] > currentParts[i]) {
			return true; // Update available
		} else if (latestParts[i] < currentParts[i]) {
			return false; // Current is newer (shouldn't happen)
		}
	}
	
	return false; // Versions are equal
};

/**
 * Hook to manage app version checking and update notifications
 */
export const useAppVersionCheck = (): UseAppVersionCheckReturn => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [latestVersion, setLatestVersion] = useState<string | null>(null);
	const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
	const [isForced, setIsForced] = useState(false);
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	
	// Get current app version from expo constants
	const currentVersion = Constants.expoConfig?.version || "1.0.0";
	
	// Determine if update is available by comparing versions
	const isUpdateAvailable = latestVersion ? compareVersions(currentVersion, latestVersion) : false;

	/**
	 * Check for app updates from the backend
	 */
	const checkForUpdates = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			
			// Determine platform
			const platform = Platform.OS === "ios" ? "ios" : "android";
			
			// Fetch latest version from backend
			const response = await getLatestAppVersion(platform);
			
			if (response.success && response.data) {
				const { version, releaseNotes: notes } = response.data;
				
				setLatestVersion(version);
				setReleaseNotes(notes);
				
				// Check if update is available using client-side comparison
				const updateAvailable = compareVersions(currentVersion, version);
				
				if (updateAvailable) {
					// Determine if it's a forced update based on major version difference
					const currentMajor = parseInt(currentVersion.split('.')[0]);
					const latestMajor = parseInt(version.split('.')[0]);
					setIsForced(latestMajor > currentMajor);
					
					// Show update modal
					setShowUpdateModal(true);
				}
			}
		} catch (err: any) {
			console.error("Error checking for updates:", err);
			setError(err.message || "Failed to check for updates");
		} finally {
			setIsLoading(false);
		}
	}, [currentVersion]);

	/**
	 * Auto-check for updates on app start
	 */
	useEffect(() => {
		// Only auto-check in production builds
		if (true) {
			// small delay to avoid blocking app startup
			const timer = setTimeout(() => {
				checkForUpdates();
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [checkForUpdates]);

	return {
		isUpdateAvailable,
		isLoading,
		error,
		latestVersion,
		currentVersion,
		releaseNotes,
		isForced,
		checkForUpdates,
		showUpdateModal,
		setShowUpdateModal,
	};
};