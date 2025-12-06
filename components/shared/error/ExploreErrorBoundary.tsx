import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import AppButton from '@/components/ui/AppButton';
import { Colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ExploreErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Explore Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons 
              name="alert-circle-outline" 
              size={64} 
              color={Colors.general.error} 
              style={styles.icon}
            />
            <Typography 
              size={18} 
              weight="600" 
              color={Colors.general.error}
              style={styles.title}
            >
              Something went wrong
            </Typography>
            <Typography 
              size={14} 
              color="#666"
              style={styles.message}
            >
              An unexpected error occurred while loading content. Please try again.
            </Typography>
            {this.props.onRetry && (
              <AppButton
                title="Try Again"
                handlePress={this.handleRetry}
                style={styles.retryButton}
              />
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExploreErrorBoundary;