/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
	light: {
		text: "#27252E",
		textLight: "#6E6E6E",
		secondary: "#6E6E6E",
		textBold: "#0F0F19",
		background: "#fff",
		inputBackground: "#0000000A",
		borderColor: "#E2E8F0",
		cardBackground: "#F2F2F7",
		sheetBackground: "#fff",
		avatar: "#F2F2F7",
		danger: "#DC2626",
		warning: "#D97706",
		warningBackground: "#FEF3C7",

		tint: tintColorLight,
		icon: "#687076",
		tabIconDefault: "#687076",
		tabIconSelected: tintColorLight,

		// Chat bubbles
		chatSender: "#D2F7E8",
		chatReceiver: "#FFFFFF",
		chatSenderText: "#0A0A0A",
		chatReceiverText: "#0A0A0A",
	},

	dark: {
		text: "#fff",
		textLight: "#AFAFAF",
		textBold: "#fff",
		secondary: "#AFAFAF",
		background: "#0F0F0F",
		inputBackground: "#0000000A",
		borderColor: "#1B2537",
		cardBackground: "#1A1F2B",
		sheetBackground: "#0F0F0F",
		avatar: "#AFAFAF",
		danger: "#EF4444",
		warning: "#F59E0B",
		warningBackground: "#451A03",

		tint: tintColorDark,
		icon: "#9BA1A6",
		tabIconDefault: "#9BA1A6",
		tabIconSelected: tintColorDark,

		// Chat bubbles
		chatSender: "#1F5A47", 
		chatReceiver: "#1E1E1E",
		chatSenderText: "#FFFFFF",
		chatReceiverText: "#FFFFFF",
	},

	general: {
		primary: "#00D47B",
		blue: "#0390C1",
		blueBrand: "#00BEFF",
		purple: "#AF4DFF",
		error: "#B3261E",
		success: "#498200",
		gray: "#808080",
		live: "#E0005A"
	},
};
