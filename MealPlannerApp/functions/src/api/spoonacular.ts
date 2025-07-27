import * as functions from 'firebase-functions';
import cors from 'cors';
import axios from 'axios';

const corsHandler = cors({ origin: true });

// Get API key from Firebase config
const SPOONACULAR_API_KEY = functions.config().spoonacular?.api_key || process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

export const spoonacularProxy = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    // Validate authentication
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // Extract endpoint and query parameters
      const { endpoint, ...queryParams } = request.query;
      
      if (!endpoint) {
        response.status(400).json({ error: 'Missing endpoint parameter' });
        return;
      }

      // Allowed endpoints for security
      const allowedEndpoints = [
        'recipes/complexSearch',
        'recipes/information',
        'recipes/bulk',
        'recipes/findByIngredients',
        'recipes/random',
        'food/ingredients/search'
      ];

      const endpointStr = String(endpoint);
      if (!allowedEndpoints.some(allowed => endpointStr.startsWith(allowed))) {
        response.status(403).json({ error: 'Endpoint not allowed' });
        return;
      }

      // Make request to Spoonacular API
      const apiResponse = await axios({
        method: request.method,
        url: `${SPOONACULAR_BASE_URL}/${endpointStr}`,
        params: {
          ...queryParams,
          apiKey: SPOONACULAR_API_KEY
        },
        data: request.body,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Return the response
      response.status(200).json({
        success: true,
        data: apiResponse.data
      });

    } catch (error: any) {
      console.error('Spoonacular API error:', error);
      
      if (error.response?.status === 402) {
        response.status(402).json({ 
          error: 'API limit reached', 
          message: 'Daily quota exceeded' 
        });
      } else if (error.response?.status === 401) {
        response.status(500).json({ 
          error: 'Configuration error', 
          message: 'API key configuration issue' 
        });
      } else {
        response.status(500).json({ 
          error: 'Internal server error', 
          message: 'Failed to fetch recipe data' 
        });
      }
    }
  });
}); 