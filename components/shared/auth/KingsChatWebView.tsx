import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants';
import AppButton from '@/components/ui/AppButton';
import TextButton from '@/components/ui/TextButton';
import Typography from '@/components/ui/Typography/Typography';
import { getKingsChatAuthUrl } from '@/services/kingschat.service';

interface KingsChatWebViewProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: (code: string) => void;
  onAuthError: (error: string) => void;
  mode: 'login' | 'signup';
}

const KingsChatWebView: React.FC<KingsChatWebViewProps> = ({
  visible,
  onClose,
  onAuthSuccess,
  onAuthError,
  mode
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');

  useEffect(() => {
    if (visible) {
      fetchAuthUrl();
    }
  }, [visible, mode]);

  const fetchAuthUrl = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      const response = await getKingsChatAuthUrl({
        mode,
        redirectUri: 'lettubbe://auth/callback'
      });
      
      if (response.success && response.url) {
        setAuthUrl(response.url);
      } else {
        setHasError(true);
      }
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    if (url.includes('lettubbe://auth/callback')) {
      handleAuthCallback(url);
    }
  };

  const handleAuthCallback = (url: string) => {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');
    const state = urlObj.searchParams.get('state');

    if (error) {
      onAuthError(error);
      return;
    }

    if (code && state === mode) {
      onAuthSuccess(code);
    } else {
      onAuthError('Invalid authentication response');
    }
  };


  const handleWebViewError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    fetchAuthUrl();
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Typography size={16} style={styles.errorText}>
        Unable to load KingsChat authentication
      </Typography>
      <View style={styles.errorButtons}>
        <AppButton 
          title="Retry" 
          handlePress={handleRetry}
          style={styles.retryButton}
        />
        <AppButton 
          title="Cancel" 
          variant="secondary"
          handlePress={onClose}
          style={styles.cancelButton}
        />
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.general.primary} />
      <Typography size={14} style={styles.loadingText}>
        Loading KingsChat...
      </Typography>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Typography size={18} weight="600" color='#000'>
            {mode === 'login' ? 'Sign in' : 'Sign up'} with KingsChat
          </Typography>
          <TextButton
            title="Cancel"
            onPress={onClose}
            style={styles.cancelHeaderButton}
          />
        </View>

        {hasError ? renderError() : (
          <>
            {isLoading && renderLoading()}
            {authUrl && (
              <WebView
                source={{ uri: authUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onError={handleWebViewError}
                style={[styles.webview, isLoading && styles.hidden]}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )}
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor,
  },
  webview: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.light.tabIconDefault,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  errorText: {
    color: Colors.light.tabIconDefault,
    marginBottom: 8,
  },
  errorButtons: {
    gap: 12,
    width: '100%',
  },
  retryButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
  cancelHeaderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default KingsChatWebView;