import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import BackButton from "@/components/utilities/BackButton";
import Wrapper from "@/components/utilities/Wrapper";
import Center from "@/components/utilities/Center";
import { Images } from "@/constants";
import { MaterialIcons } from "@expo/vector-icons";
import { useProfilePic } from "@/hooks/auth/useProfilePic";

const AddPhoto = () => {
	const { image, isEditing, pickImage, setIsEditing, handleNext, isUploading } = useProfilePic();

	return (
		<Wrapper>
			{!isEditing && <BackButton />}
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					{isEditing ? "" : "Add a photo"}
				</Typography>
				<View style={{ flex: 1, justifyContent: "center" }}>
					<Center>
						{isEditing ? (
							<View style={{ width: "100%", alignItems: "center" }}>
								<View
									style={{
										width: 300,
										height: 300,
										borderWidth: 1,
										borderColor: "#ccc",
										overflow: "hidden",
										position: "relative",
										borderRadius: 30,
									}}>
									{image && <Image source={{ uri: image.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />}
								</View>

								<View style={{ flexDirection: "row", marginTop: 20, justifyContent: "space-around", width: "80%" }}>
									<TouchableOpacity
										onPress={pickImage}
										style={{
											padding: 10,
											backgroundColor: "#f0f0f0",
											borderRadius: 25,
											width: 50,
											height: 50,
											justifyContent: "center",
											alignItems: "center",
										}}>
										<MaterialIcons name="close" size={24} color="black" />
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => setIsEditing(false)}
										style={{
											padding: 10,
											backgroundColor: "#4CAF50",
											borderRadius: 25,
											width: 50,
											height: 50,
											justifyContent: "center",
											alignItems: "center",
										}}>
										<MaterialIcons name="check" size={24} color="white" />
									</TouchableOpacity>
								</View>
							</View>
						) : (
							<TouchableOpacity onPress={pickImage}>
								{image ? (
									<View style={{ alignItems: "center" }}>
										<Image
											source={{ uri: image.uri }}
											style={{
												width: 200,
												height: 200,
												borderRadius: 30,
												marginBottom: 10,
											}}
										/>
										<Typography size={16} color="#666">
											Tap to change photo
										</Typography>
									</View>
								) : (
									<Image source={Images.addPhotoImg} style={{ width: 200, height: 200 }} />
								)}
							</TouchableOpacity>
						)}
					</Center>
				</View>
			</View>

			{!isEditing && (
				<AppButton title={image ? "You're Done!" : "Skip for now"} handlePress={handleNext} isLoading={isUploading} style={{ marginBottom: 16 }} />
			)}
		</Wrapper>
	);
};

export default AddPhoto;
