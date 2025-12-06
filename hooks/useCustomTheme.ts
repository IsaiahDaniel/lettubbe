import { useThemeStore } from "@/store/ThemeStore";

export const useCustomTheme = () => {
	const { selectedTheme, resolvedTheme, toggleTheme, setTheme } = useThemeStore();

	return { 
		selectedTheme, // What user has selected (light/dark/system)
		theme: resolvedTheme, // What's actually being applied (light/dark)
		toggleTheme, 
		setTheme 
	};
};