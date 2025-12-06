import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import React from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useCustomTheme } from "@/hooks/useCustomTheme";

const categories = [
	{ id: "1", name: "All" },
	{ id: "2", name: "Anime" },
	{ id: "3", name: "Music" },
	{ id: "4", name: "Manga" },
	{ id: "5", name: "Tech" },
	{ id: "6", name: "Gaming" },
];

interface ICategoryProps {
	selectedCategory: string;
	onSelectCategory: (category: string) => void;
}

const CategoryList: React.FC<ICategoryProps> = ({ selectedCategory, onSelectCategory }) => {
	const { theme } = useCustomTheme();
	
	// Create styles with the current theme
	const getStyles = () => StyleSheet.create({
		categoryList: {
			maxHeight: 27,
		},
		categoryButton: {
			height: 27,
			paddingHorizontal: 10,
			borderRadius: 12,
			backgroundColor: theme === 'dark' ? Colors.dark.cardBackground : Colors.light.cardBackground,
			marginRight: 14,
			alignItems: "center",
			justifyContent: "center",
		},
		selectedCategory: {
			backgroundColor: Colors.general.primary,
		},
		selectedCategoryText: {
			color: "white",
		},
	});
	
	// Get the current styles based on theme
	const styles = getStyles();
	
	const renderCategory = ({ item }: any) => (
		<TouchableOpacity
			style={[styles.categoryButton, selectedCategory === item.name && styles.selectedCategory]}
			onPress={() => onSelectCategory(item.name)}>
			<Typography weight="400" size={12} lineHeight={14} style={[selectedCategory === item.name && styles.selectedCategoryText]}>
				{item.name}
			</Typography>
		</TouchableOpacity>
	);

	return (
		<FlatList
			data={categories}
			renderItem={renderCategory}
			keyExtractor={(item) => item.id}
			horizontal
			showsHorizontalScrollIndicator={false}
			style={styles.categoryList}
		/>
	);
};

export default CategoryList;