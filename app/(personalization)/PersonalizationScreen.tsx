import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import Wrapper from "@/components/utilities/Wrapper";
import useCategories from "@/hooks/personalization/useCategories";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";

const PersonalizationScreen = () => {
	const { theme } = useCustomTheme();
	const borderColor = theme === "light" ? "#667085" : "#fff";
	const { categoriesData, selectCategoryHandler, categories, onSubmit, isPending, categoriesLoading } = useCategories();
	return (
		<Wrapper>
			<ScrollView style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					Let’s personalize your Lettubbe+ experience.
				</Typography>
				<Typography style={{ marginTop: 16 }}>Pick what excites you. We’ll show content you’ll love.</Typography>

				<ActivityIndicator animating={categoriesLoading} size="large" color={Colors.general.primary} style={{ marginTop: 12 }} />

				<View style={{ flexWrap: "wrap", gap: 18, flexDirection: "row" }}>
					{Array.isArray(categoriesData) &&
						categoriesData.map((category: any) => (
							<Pressable
								onPress={() => selectCategoryHandler(category.name)}
								key={category.name}
								style={{
									justifyContent: "center",
									alignItems: "center",
									paddingVertical: 9,
									paddingHorizontal: 20,
									borderWidth: 1.5,
									borderColor: categories.includes(category.name) ? Colors.general.primary : borderColor,
									borderRadius: 1000,
								}}>
								<Typography textType="textBold" weight="600" size={16} lineHeight={22}>
									{category.name}
								</Typography>
							</Pressable>
						))}
				</View>
			</ScrollView>
			<AppButton title="Continue" handlePress={onSubmit} style={{ marginBottom: 16 }} isLoading={isPending} />
		</Wrapper>
	);
};

export default PersonalizationScreen;
