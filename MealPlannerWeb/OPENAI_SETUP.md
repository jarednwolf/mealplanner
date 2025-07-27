# OpenAI Integration Setup Guide

This guide will help you connect your Meal Planner app to OpenAI for intelligent meal plan generation.

## Prerequisites

1. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Firebase Project**: Your existing Firebase project
3. **Firebase CLI**: Install with `npm install -g firebase-tools`

## Step 1: Set OpenAI API Key in Firebase Functions

```bash
# Navigate to the project root
cd meal-plan

# Set the OpenAI API key in Firebase Functions config
firebase functions:config:set openai.api_key="your-openai-api-key-here"
```

## Step 2: Deploy Firebase Functions

```bash
# Navigate to the functions directory
cd MealPlannerApp/functions

# Install dependencies
npm install

# Build the TypeScript functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

## Step 3: Update Environment Variables

Create or update your `.env` file in `MealPlannerWeb/`:

```env
# Existing Firebase config
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Add this line with your deployed functions URL
VITE_FUNCTIONS_URL=https://us-central1-your-project-id.cloudfunctions.net
```

## Step 4: Test the Integration

1. Start the development server:
   ```bash
   cd MealPlannerWeb
   npm run dev
   ```

2. Sign in to your account
3. Go to Profile and set up household members
4. Navigate to "Generate Meal Plan" from the dashboard
5. The AI should now generate personalized meal plans based on:
   - Household dietary restrictions
   - Individual member preferences
   - Budget constraints
   - Nutrition requirements
   - Cooking time preferences

## Troubleshooting

### "Configuration error" or API key issues
- Verify the API key is set correctly: `firebase functions:config:get`
- Redeploy functions after setting config: `firebase deploy --only functions`

### Rate limiting errors
- OpenAI has rate limits. The app includes retry logic, but you may need to upgrade your OpenAI plan

### Function timeout errors
- Meal plan generation can take 10-30 seconds
- Ensure Firebase Functions timeout is set appropriately (default is 60s)

### CORS errors
- The functions already include CORS handling
- Ensure your frontend URL is allowed in Firebase Console

## Cost Considerations

- **OpenAI API**: ~$0.002-0.01 per meal plan generation (GPT-3.5)
- **Firebase Functions**: Free tier includes 2M invocations/month
- **Recommendation**: Monitor usage in both OpenAI and Firebase dashboards

## Testing Locally (Optional)

To test functions locally before deploying:

```bash
# In MealPlannerApp/functions directory
npm run serve

# Update .env in MealPlannerWeb
VITE_FUNCTIONS_URL=http://localhost:5001/your-project-id/us-central1
```

## Security Notes

1. **Never commit API keys** to version control
2. The Firebase Functions act as a **secure proxy** - your OpenAI key stays server-side
3. **Authentication required** - only logged-in users can generate meal plans
4. Consider implementing **rate limiting** per user to prevent abuse

## Next Steps

After setting up OpenAI:
1. Consider adding **Spoonacular API** for real recipe data and pricing
2. Implement **feedback loop** to improve meal suggestions over time
3. Add **recipe image generation** using DALL-E API
4. Create **shopping list optimization** with local store APIs

## Need Help?

- OpenAI API docs: https://platform.openai.com/docs
- Firebase Functions docs: https://firebase.google.com/docs/functions
- Check the app logs in Firebase Console for debugging 