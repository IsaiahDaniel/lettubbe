import { removeData } from '@/helpers/utils/storage';
import { invalidate } from './token-cache.service';

let globalLogoutCallback: (() => Promise<void>) | null = null;

export const setGlobalLogoutCallback = (callback: (() => Promise<void>) | null): void => {
  globalLogoutCallback = callback;
};

export const handleLogout = async (): Promise<void> => {
  if (globalLogoutCallback) {
    await globalLogoutCallback();
  } else {
    await Promise.all([removeData("token"), removeData("refreshToken"), removeData("userInfo")]);
    invalidate();
  }
};