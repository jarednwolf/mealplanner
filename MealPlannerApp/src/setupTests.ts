// Setup file for Jest tests
import '@testing-library/jest-native/extend-expect';

// Mock the firebase modules
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    app: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    firestore: jest.fn(),
  })),
}));

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
}));

// Mock environment variables
process.env = {
  ...process.env,
  REACT_APP_FIREBASE_API_KEY: 'test-api-key',
  REACT_APP_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
  REACT_APP_OPENAI_API_KEY: 'test-openai-key',
  REACT_APP_SPOONACULAR_API_KEY: 'test-spoonacular-key',
  REACT_APP_ENVIRONMENT: 'test',
};

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;