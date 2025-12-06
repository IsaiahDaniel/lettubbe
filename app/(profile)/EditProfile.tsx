// import React, { useEffect } from "react";
// import { View, Image, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, ActivityIndicator, Pressable } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { Colors, Icons, Images } from "@/constants";
// import Typography from "@/components/ui/Typography/Typography";
// import { useCustomTheme } from "@/hooks/useCustomTheme";
// import AppButton from "@/components/ui/AppButton";
// import { router } from "expo-router";
// import Wrapper from "@/components/utilities/Wrapper";
// import BackButton from "@/components/utilities/BackButton";
// import Input from "@/components/ui/inputs/Input";
// import { useForm } from "react-hook-form";
// import { useProfilePic } from "@/hooks/auth/useProfilePic";
// import useUser from "@/hooks/profile/useUser";
// import useEditProfile from "@/hooks/profile/useEditProfile"; // Import the hook

// const EditProfile = () => {
// 	const { theme } = useCustomTheme();
// 	const { control, handleSubmit, setValue } = useForm();
// 	const { isUploading, updateProfilePic, updateCoverPic, coverPic, profilePic } = useProfilePic();
// 	const { profileData, refetchProfile } = useUser();
// 	const { onSubmit, isPending } = useEditProfile();

// 	// Set form default values from profile data when available
// 	useEffect(() => {
// 		if (profileData?.data) {
// 			setValue("displayName", profileData.data.displayName || "");
// 			setValue("username", profileData.data.username || "");
// 			setValue("description", profileData.data.description || "");
// 			setValue("websiteLink", profileData.data.websiteLink || "");
// 		}
// 	}, [profileData, setValue]);

// 	// Handle form submission
// 	const handleFormSubmit = (data: any) => {
// 		// console.log("data", data);
// 		onSubmit({
// 			displayName: data.displayName,
// 			username: data.username,
// 			description: data.description,
// 			websiteLink: data.websiteLink,
// 		});
// 		refetchProfile();
// 	};

// 	return (
// 		<Wrapper noPadding>
// 			<View style={styles.header}>
// 				<Pressable onPress={() => router.replace("/(tabs)/profile")}>
// 					<View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 }}>
// 						<BackButton handlePress={() => router.replace("/(tabs)/profile")} />
// 						<Typography weight="700" size={18} textType="textBold">
// 							Edit Profile
// 						</Typography>
// 					</View>
// 				</Pressable>
// 				<Ionicons name="settings-outline" size={24} color={Colors[theme].textBold} onPress={() => router.push("/(profile)/Settings")} />
// 			</View>
// 			<ImageBackground source={coverPic} style={styles.backgroundImage} />
// 			<TouchableOpacity
// 				onPress={updateCoverPic}
// 				style={{ marginTop: -50, marginLeft: "auto", backgroundColor: "#F2F2F7", padding: 5, borderRadius: 100, marginRight: 15 }}>
// 				<Image source={Icons.pencil} style={{ width: 24, height: 24 }} />
// 			</TouchableOpacity>
// 			{isUploading && <ActivityIndicator size="large" color={Colors[theme].textBold} style={{ position: "absolute", left: "45%", top: "45%" }} />}

// 			<View
// 				style={{
// 					padding: 15,
// 					flexDirection: "row",
// 					marginTop: -50,
// 					gap: 16,
// 				}}>
// 				<View style={styles.profileImageContainer}>
// 					<Image source={profilePic} style={styles.profileImage} />
// 					<TouchableOpacity
// 						onPress={updateProfilePic}
// 						style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "#F2F2F7", padding: 5, borderRadius: 100 }}>
// 						<Image source={Icons.pencil} style={{ width: 24, height: 24 }} />
// 					</TouchableOpacity>
// 				</View>
// 			</View>

// 			<ScrollView style={{ flex: 1 }}>
// 				<View style={{ paddingHorizontal: 16, marginTop: 24 }}>
// 					{/* Form */}
// 					<View style={styles.formSection}>
// 						<Typography weight="600" textType="textBold">
// 							Display name
// 						</Typography>
// 						<Input control={control} name="displayName" placeholder="Enter name" />
// 					</View>

// 					<View style={styles.formSection}>
// 						<Typography weight="600" textType="textBold">
// 							Username
// 						</Typography>
// 						<Input control={control} name="username" placeholder="Enter username" />
// 					</View>

// 					<View style={styles.formSection}>
// 						<Typography weight="600" textType="textBold">
// 							Bio
// 						</Typography>
// 						<Input control={control} name="description" placeholder="Enter bio" multiline />
// 					</View>

// 					<View style={styles.formSection}>
// 						<Typography weight="600" textType="textBold">
// 							Link
// 						</Typography>
// 						<Input control={control} name="websiteLink" placeholder="Enter link" />
// 					</View>

// 					{/* <TouchableOpacity style={[styles.dropdownButton, { borderColor, backgroundColor: Colors[theme].inputBackground }]}>
// 						<Typography>Link</Typography>
// 						<Ionicons name="chevron-forward-outline" size={22} color="black" />
// 					</TouchableOpacity> */}
// 				</View>
// 			</ScrollView>
// 			<View style={{ padding: 16 }}>
// 				<AppButton title={isPending ? "Saving..." : "Save"} handlePress={handleSubmit(handleFormSubmit)} disabled={isPending} isLoading={isPending} />
// 			</View>
// 		</Wrapper>
// 	);
// };

// const styles = StyleSheet.create({
// 	header: {
// 		flexDirection: "row",
// 		justifyContent: "space-between",
// 		alignItems: "center",
// 		paddingHorizontal: 15,
// 	},

// 	headerIcons: {
// 		flexDirection: "row",
// 		alignItems: "center",
// 		gap: 15,
// 	},
// 	backgroundImage: {
// 		width: "100%",
// 		height: 100,
// 	},

// 	profileImageContainer: {
// 		width: 100,
// 		height: 100,
// 		borderRadius: 100,
// 		// overflow: "hidden",
// 	},
// 	profileImage: {
// 		width: "100%",
// 		height: "100%",
// 		borderRadius: 100,
// 	},

// 	formSection: {
// 		marginBottom: 24,
// 		gap: 12,
// 	},

// 	dropdownButton: {
// 		borderWidth: 1,
// 		borderRadius: 8,
// 		paddingHorizontal: 16,
// 		paddingVertical: 12,
// 		flexDirection: "row",
// 		justifyContent: "space-between",
// 		alignItems: "center",
// 	},
// });

// export default EditProfile;

import React, { useEffect } from "react";
import { View, Image, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, ActivityIndicator, Pressable, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Icons, Images } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import AppButton from "@/components/ui/AppButton";
import { router } from "expo-router";
import Wrapper from "@/components/utilities/Wrapper";
import BackButton from "@/components/utilities/BackButton";
import Input from "@/components/ui/inputs/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfilePic } from "@/hooks/auth/useProfilePic";
import useUser from "@/hooks/profile/useUser";
import useEditProfile from "@/hooks/profile/useEditProfile";

// Define Zod schema for form validation
const formSchema = z.object({
	// displayName: z.string().min(1, "Display name is required"),
	username: z.string().min(1, "Username is required"),
	description: z.string().optional(),
	websiteLink: z
		.string()
		.url("Please enter a valid URL")
		.optional()
		.or(z.literal(""))

		.transform((val) => (val === "" ? undefined : val)),
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

const EditProfile = () => {
	const { theme } = useCustomTheme();
	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			// displayName: "",
			username: "",
			description: "",
			websiteLink: "",
		},
	});

	const { isUploading, updateProfilePic, updateCoverPic, coverPic, profilePic } = useProfilePic();
	const { profileData, refetchProfile } = useUser();
	const { onSubmit, isPending } = useEditProfile();

	// Set form default values from profile data when available
	useEffect(() => {
		if (profileData?.data) {
			// setValue("displayName", profileData.data.displayName || "");
			setValue("username", profileData.data.username || "");
			setValue("description", profileData.data.description || "");
			setValue("websiteLink", profileData.data.websiteLink || "");
		}
	}, [profileData, setValue]);

	// Handle form submission
	const handleFormSubmit = (data: FormValues) => {
		onSubmit({
			// displayName: data.displayName,
			username: data.username,
			description: data.description || "",
			websiteLink: data.websiteLink?.toLowerCase() || "",
		});
		refetchProfile();
	};

	return (
		<Wrapper noPadding>
			<View style={styles.header}>
				<Pressable onPress={() => router.replace("/(tabs)/profile")}>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 }}>
						<BackButton handlePress={() => router.replace("/(tabs)/profile")} />
						<Typography weight="700" size={18} textType="textBold">
							Edit Profile
						</Typography>
					</View>
				</Pressable>
				<Ionicons name="settings-outline" size={24} color={Colors[theme].textBold} onPress={() => router.push("/(profile)/Settings")} />
			</View>
			<ImageBackground source={coverPic} style={styles.backgroundImage} />
			<TouchableOpacity
				onPress={updateCoverPic}
				style={{ marginTop: -50, marginLeft: "auto", backgroundColor: "#F2F2F7", padding: 5, borderRadius: 100, marginRight: 15 }}>
				<Image source={Icons.pencil} style={{ width: 24, height: 24 }} />
			</TouchableOpacity>
			{isUploading && <ActivityIndicator size="large" color={Colors[theme].textBold} style={{ position: "absolute", left: "45%", top: "45%" }} />}

			<View
				style={{
					padding: 15,
					flexDirection: "row",
					marginTop: -50,
					gap: 16,
				}}>
				<View style={styles.profileImageContainer}>
					<Image source={profilePic} style={styles.profileImage} />
					<TouchableOpacity
						onPress={updateProfilePic}
						style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "#F2F2F7", padding: 5, borderRadius: 100 }}>
						<Image source={Icons.pencil} style={{ width: 24, height: 24 }} />
					</TouchableOpacity>
				</View>
			</View>

			<ScrollView style={{ flex: 1 }}>
				<View style={{ paddingHorizontal: 16, marginTop: 24 }}>
					{/* Form */}
					{/* <View style={styles.formSection}>
						<Typography weight="600" textType="textBold">
							Display name
						</Typography>
						<Input control={control} name="displayName" placeholder="Enter name" error={errors.displayName?.message} />
					</View> */}

					<View style={styles.formSection}>
						<Typography weight="600" textType="textBold">
							Username
						</Typography>
						<Input control={control} name="username" placeholder="Enter username" error={errors.username?.message} />
					</View>

					<View style={styles.formSection}>
						<Typography weight="600" textType="textBold">
							Bio
						</Typography>
						<Input control={control} name="description" placeholder="Enter bio" multiline error={errors.description?.message} />
					</View>

					<View style={styles.formSection}>
						<Typography weight="600" textType="textBold">
							Link
						</Typography>
						<Input control={control} name="websiteLink" placeholder="Enter link - eg: https://.." error={errors.websiteLink?.message} />
					</View>
				</View>
			</ScrollView>
			<View style={{ padding: 16 }}>
				<AppButton title={isPending ? "Saving..." : "Save"} handlePress={handleSubmit(handleFormSubmit)} disabled={isPending} isLoading={isPending} />
			</View>
		</Wrapper>
	);
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = SCREEN_WIDTH / 3; // 3:1 aspect ratio
const AVATAR_SIZE = Math.round((SCREEN_WIDTH / 390) * 100); // 100px on 390px screen, proportional on others

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 15,
	},
	headerIcons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 15,
	},
	backgroundImage: {
		width: "100%",
		height: COVER_HEIGHT,
	},
	profileImageContainer: {
		width: AVATAR_SIZE,
		height: AVATAR_SIZE,
		borderRadius: AVATAR_SIZE / 2,
	},
	profileImage: {
		width: "100%",
		height: "100%",
		borderRadius: AVATAR_SIZE / 2,
	},
	formSection: {
		marginBottom: 24,
		gap: 12,
	},
	dropdownButton: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
});

export default EditProfile;
