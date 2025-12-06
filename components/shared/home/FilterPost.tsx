import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";

const tags = ["Anime", "Music", "Manga", "Tech", "Art", "Business", "Cosplay", "AI", "Cats", "Nostalgia", "Colors", "Apple"];

const excludedTags = ["Anime", "Music", "Manga", "Tech", "Art"];

const selectedTags = ["Linux", "Coding", "Lifestyle"];

const FilterPost = () => {
	const { theme } = useCustomTheme();
	const [activeTags, setActiveTags] = useState(tags);
	const [excluded, setExcluded] = useState(excludedTags);
	const [selected, setSelected] = useState(selectedTags);

	const removeTag = (tag: string, setTags: React.Dispatch<React.SetStateAction<string[]>>) => {
		setTags((prevTags) => prevTags.filter((item) => item !== tag));
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
			<Typography style={{ fontSize: 14, fontWeight: "600", marginBottom: 16 }}>Your Tags</Typography>
			<Typography style={{ marginBottom: 16 }}>
				These tags will be used to build your custom feed. You can also filter out content using these tags.
			</Typography>

			<View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.general.gray, borderRadius: 8, padding: 10 }}>
				<TextInput placeholder="Search for tags" style={{ flex: 1, color: Colors[theme].text }} />
				<Ionicons name="arrow-forward" size={20} color="gray" />
			</View>

			<View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16 }}>
				{activeTags.map((tag, index) => (
					<View
						key={index}
						style={{
							backgroundColor: Colors.general.primary,
							paddingHorizontal: 10,
							height: 27,
							borderRadius: 12,
							margin: 5,
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Typography style={{ color: "#fff", marginRight: 5 }}>{tag}</Typography>
						<TouchableOpacity onPress={() => removeTag(tag, setActiveTags)}>
							<Ionicons name="close" size={16} color="white" />
						</TouchableOpacity>
					</View>
				))}
			</View>

			<View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
				{selected.map((tag, index) => (
					<View
						key={index}
						style={{
							backgroundColor: "#F2F2F7",
							paddingHorizontal: 10,
							height: 27,
							borderRadius: 12,
							margin: 5,
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Ionicons name="checkmark" size={16} color="green" style={{ marginRight: 5 }} />
						<Typography color="#000">{tag}</Typography>
						<TouchableOpacity onPress={() => removeTag(tag, setSelected)}>
							<Ionicons name="close" size={16} color="red" style={{ marginLeft: 5 }} />
						</TouchableOpacity>
					</View>
				))}
			</View>

			<Typography weight="600" size={14} textType="textBold" style={{ marginVertical: 20 }}>
				Excluded Content
			</Typography>
			<Typography style={{ marginBottom: 16 }}>Prevent certain content from appearing in your feed.</Typography>

			<View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.general.gray, borderRadius: 8, padding: 10 }}>
				<TextInput placeholder="Search for tags" style={{ flex: 1, color: Colors[theme].text }} />
				<Ionicons name="arrow-forward" size={20} color="gray" />
			</View>

			<View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
				{excluded.map((tag, index) => (
					<View
						key={index}
						style={{
							backgroundColor: "#EAEAEA",
							paddingHorizontal: 10,
							height: 27,
							borderRadius: 12,
							margin: 5,
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Typography color="#000">{tag}</Typography>
						<TouchableOpacity onPress={() => removeTag(tag, setExcluded)}>
							<Ionicons name="close" size={16} color="black" style={{ marginLeft: 5 }} />
						</TouchableOpacity>
					</View>
				))}
			</View>
			<ScrollBottomSpace />
		</ScrollView>
	);
};

export default FilterPost;
