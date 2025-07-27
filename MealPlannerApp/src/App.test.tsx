import React from 'react';
import { render } from '@testing-library/react-native';
import App from './App';

// Mock the navigation and context providers
jest.mock('./navigation', () => {
  const MockNavigation = () => <></>;
  return {
    __esModule: true,
    default: MockNavigation,
  };
});

jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    userProfile: null,
    updateUserProfile: jest.fn(),
    error: null,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeDefined();
  });
});