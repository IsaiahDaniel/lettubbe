import { GenericResponse } from "@/helpers/types/general.types";
import { apiClient } from "../helpers/utils/request";

export const getPresignedUrl = (): Promise<GenericResponse> => {
    return apiClient.get<GenericResponse>(`/aws/presignedUrl`);
};