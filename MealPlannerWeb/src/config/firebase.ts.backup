import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { config, validateConfig } from './env';

// Validate configuration on startup
validateConfig();

// Initialize Firebase
const firebaseConfig = config.firebase;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Firebase services for use throughout the app
export { auth as firebaseAuth, db as firestore };
export default app;
