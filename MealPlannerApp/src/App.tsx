import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './navigation';
import { validateConfig } from './config/env';
import { ErrorBoundary } from './components/ErrorBoundary';

// Validate environment configuration on app startup
try {
  validateConfig();
} catch (error) {
  console.error('Environment configuration error:', error);
  // In a production app, we might want to show a user-friendly error screen
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
