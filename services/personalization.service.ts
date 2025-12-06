import { apiClient } from "@/helpers/utils/request";
import { ICategories, IContacts } from "@/helpers/types/personalization/personalization.types";
import { GenericResponse } from "@/helpers/types/general.types";

/**
 * Get categories for user's feed
 */
export const getCategories = (): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/category`);
};

/**
 * Add categories to user's feed
 */
export const addCategories = (categories: ICategories): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/feeds/category", categories);
};

export const sendContacts = (contacts: IContacts): Promise<GenericResponse> => {
	return apiClient.post<GenericResponse>("/feeds/contacts", contacts);
};
