import { useEffect } from 'react';
import usePermissions from './usePermissions';
import useContactStore from '@/store/contactStore';

/**
 * This custom hook connects the usePermissions hook with the contact store.
 * It should be used in a parent component that has access to the React context.
 */
const useContactPermissionsAdapter = () => {
  const permissions = usePermissions();
  const setPermissionsHandler = useContactStore(state => state.setPermissionsHandler);
  
  useEffect(() => {
    // Create a handler that uses the permissions hook
    const permissionsHandler = {
      requestContactsPermission: async () => {
        // We're using the camera permission verification as a template
        // Replace with a specific contact permission method if available in your usePermissions hook
        return await permissions.verifyCameraPermission();
      }
    };
    
    // Set the handler in the store
    setPermissionsHandler(permissionsHandler);
    
    // Cleanup function not strictly necessary here, but good practice
    return () => {
      // If you need to clean up any listeners or subscriptions
    };
  }, [permissions, setPermissionsHandler]);
  
  return {
    // Return any values that might be useful for the component using this hook
    isReady: true
  };
};

export default useContactPermissionsAdapter;