import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeType = "light" | "dark" | "system";

interface ThemeState {
	selectedTheme: ThemeType; // What user selected (light/dark/system)
	resolvedTheme: "light" | "dark"; // What's actually being used
	toggleTheme: () => void;
	setTheme: (newTheme: ThemeType) => void;
	updateResolvedTheme: () => void;
	initializeTheme: () => void;
	_resolveTheme: (selectedTheme: ThemeType) => "light" | "dark";
}

const themeStore = (set: any, get: any) => ({
	selectedTheme: "system" as ThemeType,
	resolvedTheme: "light" as "light" | "dark",

	toggleTheme: () => {
		const current = get().selectedTheme;
		const newTheme = current === "dark" ? "light" : current === "light" ? "system" : "dark";
		get().setTheme(newTheme);
	},

	setTheme: (newTheme: ThemeType) => {
		const systemTheme = Appearance.getColorScheme() || "light";
		const resolvedTheme = newTheme === "system" ? systemTheme : newTheme;
		
		set({
			selectedTheme: newTheme,
			resolvedTheme,
		});
	},

	updateResolvedTheme: () => {
		const { selectedTheme } = get();
		if (selectedTheme === "system") {
			const systemTheme = Appearance.getColorScheme() || "light";
			set({ resolvedTheme: systemTheme });
		}
	},

	initializeTheme: () => {
		const { selectedTheme } = get();
		const systemTheme = Appearance.getColorScheme() || "light";
		const resolvedTheme = selectedTheme === "system" ? systemTheme : selectedTheme;
		
		set({ resolvedTheme });
	},

	// Method to resolve theme from selectedTheme (used internally)
	_resolveTheme: (selectedTheme: ThemeType) => {
		const systemTheme = Appearance.getColorScheme() || "light";
		return selectedTheme === "system" ? systemTheme : selectedTheme;
	},
});

export const useThemeStore = create<ThemeState>()(
	persist(themeStore, {
		name: "theme-storage",
		storage: createJSONStorage(() => AsyncStorage),
		partialize: (state) => ({ selectedTheme: state.selectedTheme }),
		onRehydrateStorage: () => (state, error) => {
			if (!error && state) {
				// Recalculate resolved theme after rehydration
				state.resolvedTheme = state._resolveTheme(state.selectedTheme);
			}
		},
	})
);