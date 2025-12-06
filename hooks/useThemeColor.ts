/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/Colors";
import { useCustomTheme } from "./useCustomTheme";

export function useThemeColor(props: { light?: string; dark?: string }, colorName: keyof typeof Colors.light & keyof typeof Colors.dark) {
	const { theme } = useCustomTheme();

	const colorFromProps = theme === "light" || theme === "dark" ? props[theme] : undefined;
	if (colorFromProps) {
		return colorFromProps;
	} else {
		return Colors[theme as "light" | "dark"][colorName];
	}
}
