import * as functions from 'firebase-functions';
import cors from 'cors';
import OpenAI from 'openai';

const corsHandler = cors({ origin: true });

// Initialize OpenAI with API key from Firebase config
const getOpenAIClient = () => {
  const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY || 'dummy-key-for-deployment';
  return new OpenAI({ apiKey });
};

export const openAIProxy = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    // Only allow POST requests
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Validate user authentication
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Extract request parameters
      const { 
        model, 
        messages, 
        temperature, 
        max_tokens, 
        top_p, 
        frequency_penalty, 
        presence_penalty 
      } = request.body;

      // Validate required parameters
      if (!model || !messages) {
        response.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      // Make OpenAI API request
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2000,
        top_p: top_p || 1,
        frequency_penalty: frequency_penalty || 0,
        presence_penalty: presence_penalty || 0,
      });

      // Return the response
      response.status(200).json({
        success: true,
        data: completion.choices[0]?.message?.content || '',
        usage: completion.usage,
      });

    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Handle specific OpenAI errors
      if (error.status === 429) {
        response.status(429).json({ 
          error: 'Rate limit exceeded', 
          message: 'Please try again later' 
        });
      } else if (error.status === 401) {
        response.status(500).json({ 
          error: 'Configuration error', 
          message: 'API key configuration issue' 
        });
      } else {
        response.status(500).json({ 
          error: 'Internal server error', 
          message: 'Failed to process request' 
        });
      }
    }
  });
}); 