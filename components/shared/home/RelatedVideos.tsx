import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import VideoCard from "./VideoCard";
import { Images } from "@/constants";

const relatedVideo = {
	id: "1",
	username: "Star_boy",
	profilePic: Images.avatar,
	thumbnail: Images.postImage,
	title: "Beach music video",
	timePosted: "30 minutes ago",
	duration: "12:40",
	likes: 243,
	comments: 34,
};

const RelatedVideos = () => {
	return (
		<View>
			<Typography size={14} weight="700" lineHeight={16} style={{ marginVertical: 16, paddingHorizontal: 16 }}>
				Relatated
			</Typography>

			<VideoCard video={relatedVideo} onPress={() => console.log("Video pressed")} />
		</View>
	);
};

export default RelatedVideos;
