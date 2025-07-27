// Environment configuration management
export const config = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  },
  functionsUrl: import.meta.env.VITE_FUNCTIONS_URL || 'http://localhost:5001/your-project-id/us-central1',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  isDevelopment: import.meta.env.VITE_ENVIRONMENT === 'development' || import.meta.env.DEV,
  isProduction: import.meta.env.VITE_ENVIRONMENT === 'production' || import.meta.env.PROD,
  useMockAI: import.meta.env.VITE_USE_MOCK_AI === 'true' || false,
  spoonacularApiKey: import.meta.env.VITE_SPOONACULAR_API_KEY || '',
  useRealRecipes: import.meta.env.VITE_USE_REAL_RECIPES === 'true' || false,
  instacartApiKey: import.meta.env.VITE_INSTACART_API_KEY || '',
  useMockInstacart: import.meta.env.VITE_USE_MOCK_INSTACART === 'true' || true,
};

// Validate required environment variables
export const validateConfig = (): void => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};