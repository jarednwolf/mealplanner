import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

// Export API functions
export { openAIProxy } from './api/openai';
export { spoonacularProxy } from './api/spoonacular';

// Health check endpoint
export const healthCheck = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'meal-planner-functions'
    });
  });
}); 