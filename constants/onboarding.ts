import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Calculating the logo sizes based on screen dimensions for better responsiveness
export const INITIAL_LOGO_SIZE = Math.min(width, height) * 0.25;
export const FINAL_LOGO_SIZE = INITIAL_LOGO_SIZE * 10;
export const AUTH_LOGO_SIZE = 150;
export const SCREEN_TWO_LOGO_SIZE = 2000;
export const SCREEN_THREE_LOGO_SIZE = 2147.57;

// Animation duration constants
export const TEXT_FADE_DURATION = 500;
export const LOGO_TRANSITION_DURATION = 300;
export const SCALE_ROTATE_DURATION = 600;
export const CONTENT_FADE_DURATION = 300;
export const CONTENT_APPEAR_DURATION = 400;

// Screen dimensions
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Logo positions
export const LOGO_CENTER_TOP = height * 0.5 - FINAL_LOGO_SIZE / 2;
export const LOGO_CENTER_LEFT = width * 0.5 - FINAL_LOGO_SIZE / 2;
export const SMALL_LOGO_TOP = height * 0.5 - INITIAL_LOGO_SIZE / 2;

// Text positions
export const APP_NAME_TOP = height * 0.5 + INITIAL_LOGO_SIZE / 2 + 20;
