import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { handleError } from "@/helpers/utils/handleError";
import axios from "axios";
import { baseURL } from "@/config/axiosInstance";
import showToast from "@/helpers/utils/showToast";
import useAuth from "./useAuth";
import useUser from "../profile/useUser";
import { Images } from "@/constants";
import { clearSignupState, updateSignupStep } from "@/helpers/utils/signupState";

export const useProfilePic = () => {
	const { profileData, refetchProfile } = useUser();
	const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
	const [coverImage, setCoverImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const { token } = useAuth();

	useEffect(() => {
		(async () => {
			// Request media library permissions
			if (Platform.OS !== "web") {
				const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (status !== "granted") {
					Alert.alert("Permission required", "Please allow access to your photo library to upload a profile photo.");
				}
			}
		})();
	}, []);

	const pickImage = async () => {
		try {
			// Launch image gallery with the updated API
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 1,
				allowsMultipleSelection: false,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				setImage(result.assets[0]);
				setIsEditing(true);
				return result.assets[0];
			}
			return null;
		} catch (error) {
			console.error("Error picking image:", error);
			return null;
		}
	};

	const pickCoverImage = async () => {
		try {
			// Launch image gallery with the updated API
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [16, 9],
				quality: 1,
				allowsMultipleSelection: false,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				setCoverImage(result.assets[0]);
				setIsEditing(true);
				return result.assets[0];
			}
			return null;
		} catch (error) {
			console.error("Error picking image:", error);
			return null;
		}
	};

	const uploadProfilePicture = async (selectedImage: ImagePicker.ImagePickerAsset) => {
		setIsUploading(true);

		const formData = new FormData();
		const imageData = {
			name: selectedImage.fileName ? selectedImage.fileName.split(".")[0] : "unknown",
			uri: selectedImage.uri,
			type: selectedImage.mimeType,
			size: selectedImage.fileSize,
		};

		formData.append("profilePicture", imageData as any);

		try {
			const { data } = await axios.post(`${baseURL}/profile/upload/profilePicture`, formData, {
				headers: {
					Accept: "application/json",
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${token}`,
				},
			});

			setIsUploading(false);

			if (data) {
				showToast("success", "Picture uploaded successfully");
				return true;
			}
			return false;
		} catch (error) {
			setIsUploading(false);
			handleError(error);
			return false;
		}
	};

	const uploadCoverPhoto = async (selectedCoverImage: ImagePicker.ImagePickerAsset) => {
		setIsUploading(true);

		const formData = new FormData();
		const imageData = {
			name: selectedCoverImage.fileName ? selectedCoverImage.fileName.split(".")[0] : "unknown",
			uri: selectedCoverImage.uri,
			type: selectedCoverImage.mimeType,
			size: selectedCoverImage.fileSize,
		};

		formData.append("coverPhoto", imageData as any);

		try {
			const { data } = await axios.post(`${baseURL}/profile/upload/coverPhoto`, formData, {
				headers: {
					Accept: "application/json",
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${token}`,
				},
			});

			setIsUploading(false);

			if (data) {
				showToast("success", "Cover photo uploaded successfully");
				return true;
			}
			return false;
		} catch (error) {
			setIsUploading(false);
			handleError(error);
			return false;
		}
	};

	const handleNext = async () => {
		// Mark signup as completed and clear state
		await updateSignupStep('completed');
		await clearSignupState();
		
		if (image) {
			const success = await uploadProfilePicture(image);
			if (success) {
				router.replace("/(personalization)/PersonalizationScreen");
			}
		} else {
			router.replace("/(personalization)/PersonalizationScreen");
		}
	};

	const updateProfilePic = async () => {
		const selectedImage = await pickImage();
		if (selectedImage) {
			await uploadProfilePicture(selectedImage);
			refetchProfile();
		}
	};

	const updateCoverPic = async () => {
		const selectedCoverImage = await pickCoverImage();
		if (selectedCoverImage) {
			await uploadCoverPhoto(selectedCoverImage);
			refetchProfile();
		}
	};

	const coverPic = coverImage?.uri
		? { uri: coverImage.uri }
		: profileData?.data?.coverPhoto
		? { uri: profileData.data.coverPhoto }
		: Images.defaultCoverPhoto;
	const profilePic = image?.uri ? { uri: image.uri } : profileData?.data?.profilePicture ? { uri: profileData.data.profilePicture } : Images.avatar;

	return {
		image,
		coverImage,
		isEditing,
		pickImage,
		setIsEditing,
		handleNext,
		updateProfilePic,
		isUploading,
		updateCoverPic,
		coverPic,
		profilePic,
	};
};
