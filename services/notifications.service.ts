import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "@/helpers/utils/request";

export const sendPushToken = async (pushToken: string) => {
	return apiClient.get<GenericResponse>(`/notifications/device/${pushToken}`);
};

export const getNotificationsCount = async () => {
	return apiClient.get<GenericResponse>(`/feeds/notifications/count`);
}