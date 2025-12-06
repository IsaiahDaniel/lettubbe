import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { storeData } from '@/helpers/utils/storage';
import { exchangeKingsChatCode } from '@/services/kingschat.service';
import showToast from '@/helpers/utils/showToast';

export const useKingsChatExchange = () => {
  return useMutation({
    mutationFn: exchangeKingsChatCode,
    onSuccess: async (data) => {
      await storeData('userInfo', data.user);
      await storeData('token', data.token);
      
      showToast('success', 'Successfully authenticated with KingsChat');
      
      // Navigate to index page which will handle authentication state checking
      router.replace('/');
    },
  });
};