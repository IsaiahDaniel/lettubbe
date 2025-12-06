import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "../helpers/utils/request";

export const getLatestAppVersion = (platform: "android" | "ios"): Promise<GenericResponse> => {
	return apiClient.get<GenericResponse>(`/admin/versions?platform=${platform}`);
};