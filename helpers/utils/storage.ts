import AsyncStorage from "@react-native-async-storage/async-storage";
import { storeSecureData, getSecureData, removeSecureData } from "@/store/SecureStore";
import { devLog } from "@/config/dev";

// Sensitive keys that should use SecureStore (encrypted)
const SENSITIVE_KEYS = ['token', 'refreshToken', 'userInfo'];

// Import cache invalidation to clear token cache when tokens are stored
let invalidateTokenCacheFunc: (() => void) | null = null;

// Allow axios instance to register its cache invalidation function
export const registerTokenCacheInvalidator = (fn: () => void) => {
	invalidateTokenCacheFunc = fn;
};

// Check if a key contains sensitive data
const isSensitiveKey = (key: string): boolean => {
	return SENSITIVE_KEYS.some(sensitiveKey => key.includes(sensitiveKey));
};

export const storeData = async (key: string, value: any): Promise<void> => {
	try {
		// Use SecureStore for sensitive data, AsyncStorage for others
		if (isSensitiveKey(key)) {
			devLog('SECURITY', `Storing sensitive key '${key}' in SecureStore (encrypted)`);
			await storeSecureData(key, value);
			
			// Invalidate token cache when token-related data is stored
			if ((key === 'token' || key === 'refreshToken') && invalidateTokenCacheFunc) {
				invalidateTokenCacheFunc();
				devLog('SECURITY', `Token cache invalidated after storing '${key}'`);
			}
		} else {
			const jsonValue = JSON.stringify(value);
			await AsyncStorage.setItem(key, jsonValue);
		}
	} catch (error) {
		console.error("Error storing data:", error);
		throw error;
	}
};

export const getData = async <T>(key: string): Promise<T | null> => {
	try {
		// Use SecureStore for sensitive data, AsyncStorage for others
		if (isSensitiveKey(key)) {
			return await getSecureData<T>(key);
		} else {
			const jsonValue = await AsyncStorage.getItem(key);
			return jsonValue != null ? JSON.parse(jsonValue) : null;
		}
	} catch (error) {
		console.error("Error getting data:", error);
		throw error;
	}
};

export const removeData = async (key: string): Promise<void> => {
	try {
		// Use SecureStore for sensitive data, AsyncStorage for others
		if (isSensitiveKey(key)) {
			devLog('SECURITY', `Removing sensitive key '${key}' from SecureStore`);
			await removeSecureData(key);
		} else {
			await AsyncStorage.removeItem(key);
			devLog('GENERAL', `Removed data with key: ${key}`);
		}
	} catch (error) {
		console.error("Error removing data:", error);
		throw error;
	}
};
