import { getData, storeData, removeData } from './storage';

export interface SignupState {
  step: 'email' | 'verify-otp' | 'create-password' | 'full-name' | 'username' | 'age' | 'photo' | 'completed';
  email?: string;
  phone?: string;
  type: 'email' | 'phone';
  timestamp: number;
  otpSent?: boolean;
  nextRoute?: string;
}

const SIGNUP_STATE_KEY = 'signup_state';
const STATE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const saveSignupState = async (state: Partial<SignupState>): Promise<void> => {
  try {
    const currentState = await getSignupState();
    const newState: SignupState = {
      step: 'email',
      type: 'email',
      ...currentState,
      ...state,
      timestamp: Date.now(),
    };
    await storeData(SIGNUP_STATE_KEY, newState);
    console.log('Signup state saved:', newState);
  } catch (error) {
    console.error('Error saving signup state:', error);
  }
};

export const getSignupState = async (): Promise<SignupState | null> => {
  try {
    const state = await getData<SignupState>(SIGNUP_STATE_KEY);
    if (!state) return null;

    // Check if state has expired
    const now = Date.now();
    if (now - state.timestamp > STATE_EXPIRY_TIME) {
      console.log('Signup state expired, clearing...');
      await clearSignupState();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Error getting signup state:', error);
    return null;
  }
};

export const clearSignupState = async (): Promise<void> => {
  try {
    await removeData(SIGNUP_STATE_KEY);
    console.log('Signup state cleared');
  } catch (error) {
    console.error('Error clearing signup state:', error);
  }
};

export const updateSignupStep = async (step: SignupState['step']): Promise<void> => {
  await saveSignupState({ step });
};

export const getSignupNavigationPath = (state: SignupState): string => {
  switch (state.step) {
    case 'email':
      return '/(auth)/EmailSignup';
    case 'verify-otp':
      return '/(auth)/VerifyOtp';
    case 'create-password':
      return '/(auth)/CreatePassword';
    case 'full-name':
      return '/(auth)/FullName';
    case 'username':
      return '/(auth)/ChangeUsername';
    case 'age':
      return '/(auth)/EnterAge';
    case 'photo':
      return '/(auth)/AddPhoto';
    case 'completed':
      return '/(personalization)/PersonalizationScreen';
    default:
      return '/(auth)/EmailSignup';
  }
};

export const getSignupNavigationParams = (state: SignupState): any => {
  if (state.step === 'verify-otp') {
    return {
      type: state.type,
      [state.type]: state.type === 'email' ? state.email : state.phone,
      nextRoute: state.nextRoute || '/(auth)/CreatePassword',
    };
  }
  return {};
};