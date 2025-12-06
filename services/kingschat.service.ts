import { apiClient } from "@/helpers/utils/request";
import { GenericResponse } from "@/helpers/types/general.types";

interface KingsChatUrlRequest {
  mode: 'login' | 'signup';
  redirectUri: string;
}

interface KingsChatUrlResponse {
  success: boolean;
  url: string;
  message?: string;
}

interface KingsChatExchangeRequest {
  code: string;
  mode: 'login' | 'signup';
}

interface KingsChatAuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
    fullName?: string;
  };
  message?: string;
}

export const getKingsChatAuthUrl = async (
  data: KingsChatUrlRequest
): Promise<KingsChatUrlResponse> => {
  const response = await apiClient.post<KingsChatUrlResponse>(
    "/auth/kingschat/url",
    data
  );
  return response;
};

export const exchangeKingsChatCode = async (
  data: KingsChatExchangeRequest
): Promise<KingsChatAuthResponse> => {
  const response = await apiClient.post<KingsChatAuthResponse>(
    "/auth/kingschat/exchange",
    data
  );
  return response;
};