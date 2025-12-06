import * as SecureStore from "expo-secure-store";
import { devLog } from "@/config/dev";

export const storeSecureData = async (key: string, value: any): Promise<void> => {
	try {
		const stringValue = JSON.stringify(value);
		devLog('SECURITY', `SecureStore: Attempting to store key '${key}', length: ${stringValue.length}`);
		
		await SecureStore.setItemAsync(key, stringValue, {
			keychainService: 'lettubbe-app', // consistent service name for all keys
		});
		
		devLog('SECURITY', `SecureStore: Successfully stored key '${key}'`);
		
		// Verify the data was actually stored
		const verification = await SecureStore.getItemAsync(key, {
			keychainService: 'lettubbe-app',
		});
		devLog('SECURITY', `SecureStore: Verification read for '${key}': ${!!verification ? 'SUCCESS' : 'FAILED'}`);
	} catch (error) {
		devLog('SECURITY', `SecureStore: Error storing key '${key}':`, error);
		throw error;
	}
};

export const getSecureData = async <T>(key: string): Promise<T | null> => {
	try {
		devLog('SECURITY', `SecureStore: Attempting to read key '${key}'`);
		const stringValue = await SecureStore.getItemAsync(key, {
			keychainService: 'lettubbe-app',
		});
		const hasData = stringValue != null;
		devLog('SECURITY', `SecureStore: Read key '${key}': ${hasData ? 'FOUND' : 'NOT_FOUND'}, length: ${hasData ? stringValue?.length : 0}`);
		
		return hasData ? JSON.parse(stringValue) : null;
	} catch (error) {
		devLog('SECURITY', `SecureStore: Error reading key '${key}':`, error);
		throw error;
	}
};

export const removeSecureData = async (key: string): Promise<void> => {
	try {
		devLog('SECURITY', `SecureStore: Attempting to remove key '${key}'`);
		await SecureStore.deleteItemAsync(key, {
			keychainService: 'lettubbe-app',
		});
		devLog('SECURITY', `SecureStore: Successfully removed key '${key}'`);
	} catch (error) {
		devLog('SECURITY', `SecureStore: Error removing key '${key}':`, error);
		throw error;
	}
};