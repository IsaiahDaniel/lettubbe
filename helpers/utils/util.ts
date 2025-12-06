import { format, parseISO, isValid } from "date-fns";
import { formatDistanceToNow } from "date-fns";

export const formatTime = (time: string) => {
	// const time = "14:00:00";

	// Split the time string into hours and minutes
	const [hours, minutes] = time.split(":");

	// Convert hours to 12-hour format
	let formattedHours = parseInt(hours, 10) % 12;
	formattedHours = formattedHours === 0 ? 12 : formattedHours; // Handle midnight (0) as 12

	// Determine if it's AM or PM
	const period = parseInt(hours, 10) >= 12 ? "PM" : "AM";

	// Concatenate the formatted time
	const formattedTime = `${formattedHours}:${minutes} ${period}`;

	return formattedTime; // Output: "02:00 PM"
};

export const truncateText = (text: string | undefined | null, maxLength: number) => {
	if (!text) {
		return "";
	}
	if (text.length <= maxLength) {
		return text;
	}
	return text.substring(0, maxLength) + "...";
};

export const timer = (time: number) => {
	const mins = Math.floor(time / 60);
	const secs = time % 60;
	return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const formatDate = (date: Date, p0: string): string => {
	if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
		return "Invalid date";
	}

	const day = date.getDate();
	const month = date.toLocaleString("default", { month: "long" });
	const year = date.getFullYear();

	return `${day} ${month} ${year}`;
};

export function formatTimePost(createdAt: string): string {
	if (!createdAt) {
		return "";
	}
	return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
}

export const getCommunityTypeIcon = (type: string): string => {
	switch (type?.toLowerCase()) {
		case 'private':
			return 'lock-closed-outline';
		case 'hidden':
			return 'eye-off-outline';
		case 'public':
		default:
			return 'globe-outline';
	}
};

// Array validation utilities to prevent crashes
export const safeArrayLength = (arr: any): number => {
	return Array.isArray(arr) ? arr.length : 0;
};

export const safeArrayIncludes = (arr: any, item: any): boolean => {
	return Array.isArray(arr) ? arr.includes(item) : false;
};

export const safeArrayMap = <T, R>(arr: any, callback: (item: T, index: number) => R): R[] => {
	return Array.isArray(arr) ? arr.map(callback) : [];
};

export const safeArrayFilter = <T>(arr: any, callback: (item: T, index: number) => boolean): T[] => {
	return Array.isArray(arr) ? arr.filter(callback) : [];
};

export const ensureArray = (value: any): any[] => {
	if (Array.isArray(value)) return value;
	if (value === null || value === undefined) return [];
	return [value];
};