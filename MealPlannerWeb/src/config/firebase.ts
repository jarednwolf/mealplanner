import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { config, validateConfig } from './env';

// Validate configuration on startup
validateConfig();

// Initialize Firebase
const firebaseConfig = config.firebase;

console.log('🔥 Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  appId: firebaseConfig.appId ? '***' : 'missing',
  apiKey: firebaseConfig.apiKey ? '***' : 'missing'
});

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('✅ Firebase initialized successfully');
console.log('📚 Firestore instance:', db ? 'created' : 'failed');

// Export Firebase services for use throughout the app
export { auth as firebaseAuth, db as firestore };
export default app;
