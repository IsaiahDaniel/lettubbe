import useVideoUploadStore from "@/store/videoUploadStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import * as VideoThumbnails from "expo-video-thumbnails";
import Toast from "react-native-toast-message";
import * as FileSystem from "expo-file-system";
import { useSimpleUpload } from './useSimpleUpload';
import useAuth from '@/hooks/auth/useAuth';

const useUploadVideo = () => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showModalSuccess, setShowModalSuccess] = useState(false);
	const { userDetails } = useAuth();
	const {
		startVideoUpload,
		startPhotoUpload,
		cancelUpload,
		isUploading: isSimpleUploading
	} = useSimpleUpload();

	const {
		uploadMode,
		selectedVideo,
		selectedPhotos,
		editedVideoUri,
		videoDetails,
		postDetails,
		isUploading: storeUploading,
		setVideoDetails,
		setPostDetails,
		closeDetailsScreen,
		resetUpload,
	} = useVideoUploadStore();

	const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
	const isUploading = storeUploading || isSimpleUploading;

	// Removed mutation wrappers - direct calls to simple upload service

	useEffect(() => {
		if (uploadMode === 'video' && !selectedVideo && !editedVideoUri) {
			router.back();
		} else if (uploadMode === 'photo' && selectedPhotos.length === 0) {
			router.back();
		}

		if (uploadMode === 'video') {
			generateThumbnail();
		}
	}, []);

	// Upload completion is now handled by useSimpleUpload notifications


	// Check if video needs memory optimization
	const checkVideoMemoryRequirements = async (videoUri: string) => {
		try {
			const fileInfo = await FileSystem.getInfoAsync(videoUri);
			const fileSizeMB = (fileInfo.exists && 'size' in fileInfo && fileInfo.size) ? fileInfo.size / (1024 * 1024) : 0;
			
			console.log(`Video file size: ${fileSizeMB.toFixed(2)}MB`);
			
			// Consider large if over 100MB or if it caused issues before
			const isLarge = fileSizeMB > 100;
			
			return {
				fileSizeMB,
				isLarge,
				requiresOptimization: isLarge
			};
		} catch (error: unknown) {
			console.error('Error checking video requirements:', error);
			return { fileSizeMB: 0, isLarge: false, requiresOptimization: false };
		}
	};

	const thumbnailMutation = useMutation({
		mutationFn: async (videoUri: string) => {
			const memoryInfo = await checkVideoMemoryRequirements(videoUri);
			const quality = memoryInfo.isLarge ? 0.3 : 0.5;
			const time = memoryInfo.isLarge ? 0 : 1000;
			
			console.log(`Generating thumbnail with quality ${quality} at time ${time}ms for ${memoryInfo.fileSizeMB.toFixed(2)}MB video`);
			
			const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
				time,
				quality,
			});
			
			return uri;
		},
		onSuccess: (uri) => {
			setThumbnailImage(uri);
			setVideoDetails({ thumbnailUri: uri });
		},
		onError: async (error: unknown) => {
			console.error("Error generating thumbnail:", error);
			
			// Progressive fallback for problematic videos
			const videoUri = editedVideoUri || (selectedVideo ? selectedVideo.uri : null);
			if (videoUri) {
				try {
					console.log("Attempting emergency thumbnail generation...");
					const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
						time: 0,
						quality: 0.1,
					});
					
					console.log("Emergency thumbnail generation successful");
					setThumbnailImage(uri);
					setVideoDetails({ thumbnailUri: uri });
				} catch (emergencyError: unknown) {
					console.error("All thumbnail generation failed:", emergencyError);
					setThumbnailImage(null);
					setVideoDetails({ thumbnailUri: "" });
				}
			}
		},
	});

	const generateThumbnail = async () => {
		const videoUri = editedVideoUri || (selectedVideo ? selectedVideo.uri : null);
		if (!videoUri) return;
		
		thumbnailMutation.mutate(videoUri);
	};

	const handlePickThumbnail = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: false,
			quality: 1.0,
		});

		if (!result.canceled && result.assets && result.assets.length > 0) {
			const selectedAsset = result.assets[0];
			setThumbnailImage(selectedAsset.uri);
			setVideoDetails({ thumbnailUri: selectedAsset.uri });
		}
	};

	const handlePhotoUpload = async () => {
		// Navigate back immediately when upload starts
		closeDetailsScreen();
		router.push("/(tabs)");

		if (selectedPhotos.length === 0) {
			Alert.alert("Error", "No photos selected for upload");
			return;
		}

		if (!userDetails?._id) {
			Alert.alert("Error", "User not authenticated");
			return;
		}

		const imageUris = selectedPhotos.map(photo => photo.uri);
		startPhotoUpload(imageUris, postDetails, userDetails._id);
	};

	const handleUpload = async () => {
		// Validate tags for both photo and video uploads
		const currentTags = uploadMode === 'video' ? videoDetails.tags : postDetails.tags;
		if (!currentTags || currentTags.length === 0) {
			Alert.alert(
				"Tags Required", 
				"Please add at least one tag to help viewers discover your content.",
				[{ text: "OK" }]
			);
			return;
		}

		if (uploadMode === 'photo') {
			return handlePhotoUpload();
		}

		// Navigate back immediately when upload starts
		closeDetailsScreen();
		router.push("/(tabs)");

		const videoUri = editedVideoUri || (selectedVideo ? selectedVideo.uri : null);

		if (!videoUri) {
			Alert.alert("Error", "No video selected for upload");
			return;
		}

		if (!userDetails?._id) {
			Alert.alert("Error", "User not authenticated");
			return;
		}

		// Make sure we have a proper thumbnail before uploading
		if (!videoDetails.thumbnailUri || videoDetails.thumbnailUri.endsWith(".mp4")) {
			await generateThumbnail();

			if (!videoDetails.thumbnailUri || videoDetails.thumbnailUri.endsWith(".mp4")) {
				Alert.alert("Error", "Unable to generate thumbnail. Please try again.");
				return;
			}
		}

		startVideoUpload(videoUri, videoDetails, userDetails._id);
	};

	const navigateToDetailsPage = (page: string) => {
		router.push(`/(videoUploader)/videoDetails/${page}` as any);
	};

	return {
		navigateToDetailsPage,
		handleUpload,
		handlePickThumbnail,
		thumbnailImage,
		isUploading,
		setThumbnailImage,
		uploadMode,
		selectedPhotos,
		videoDetails,
		postDetails,
		setVideoDetails,
		setPostDetails,
		closeDetailsScreen,
		selectedVideo,
		editedVideoUri,
		videoUri: editedVideoUri || (selectedVideo ? selectedVideo.uri : null),
		generateThumbnail,
		showModalSuccess, 
		setShowModalSuccess,
		// Simple upload functions
		cancelUpload
	};
};

export default useUploadVideo;