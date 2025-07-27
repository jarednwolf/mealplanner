# Pricing API Setup Guide

This guide explains how to set up real grocery pricing APIs for the Meal Planner application.

## Available Pricing Providers

The application supports multiple pricing providers that can be used simultaneously:

1. **Kroger API** - One of the largest US grocery chains
2. **Walmart API** - Walmart's developer API
3. **Spoonacular API** - Already integrated, provides average market prices
4. **Mock Provider** - Fallback with realistic pricing

## Kroger API Setup

### 1. Register for Kroger Developer Account
1. Go to [developer.kroger.com](https://developer.kroger.com)
2. Click "Sign Up" and create a developer account
3. Verify your email address

### 2. Create an Application
1. Log into the developer portal
2. Click "Create App"
3. Fill in:
   - App Name: "Meal Planner"
   - Description: "AI-powered meal planning application"
   - Redirect URI: `http://localhost:3000/callback` (for development)
4. Save your Client ID and Client Secret

### 3. Add to Environment Variables
```env
VITE_KROGER_CLIENT_ID=your_client_id_here
VITE_KROGER_CLIENT_SECRET=your_client_secret_here
```

### 4. Available Endpoints
- Product Search: `/v1/products`
- Store Locations: `/v1/locations`
- Product Details: `/v1/products/{id}`

## Walmart API Setup

### 1. Register for Walmart Developer Account
1. Go to [developer.walmart.com](https://developer.walmart.com)
2. Create an account and verify email
3. Apply for API access (may take 1-2 business days)

### 2. Get API Credentials
1. Once approved, go to "My Apps"
2. Create a new app
3. Copy your API Key

### 3. Add to Environment Variables
```env
VITE_WALMART_API_KEY=your_api_key_here
```

### 4. Available Endpoints
- Product Search: `/v2/search`
- Product Lookup: `/v2/items/{id}`
- Store Locator: `/v1/stores`

## Firebase Functions Setup (Recommended)

For production, we recommend proxying these API calls through Firebase Functions to keep your API keys secure.

### 1. Create Proxy Functions

Add to `MealPlannerApp/functions/src/index.ts`:

```typescript
export const krogerProxy = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { endpoint, params } = data;
  
  // Get Kroger access token
  const accessToken = await getKrogerAccessToken();
  
  // Make API call
  const response = await fetch(`https://api.kroger.com${endpoint}?${new URLSearchParams(params)}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  return await response.json();
});
```

### 2. Set Firebase Functions Config
```bash
firebase functions:config:set kroger.client_id="your_client_id"
firebase functions:config:set kroger.client_secret="your_client_secret"
firebase functions:config:set walmart.api_key="your_api_key"
```

### 3. Deploy Functions
```bash
cd MealPlannerApp/functions
npm run build
firebase deploy --only functions
```

## Testing Your Setup

### 1. Test Kroger API
```javascript
import { pricingService } from './services/pricing';

// Test search
const prices = await pricingService.getIngredientPrices(
  'chicken breast',
  1,
  'lb',
  '45202' // Cincinnati zip code
);
console.log(prices);
```

### 2. Test Walmart API
```javascript
// Should automatically use Walmart if configured
const prices = await pricingService.getIngredientPrices(
  'organic milk',
  1,
  'gallon',
  '90210' // Beverly Hills zip code
);
console.log(prices);
```

## Troubleshooting

### Kroger API Issues
- **401 Unauthorized**: Check that your credentials are correct
- **Rate Limiting**: Kroger allows 10,000 requests per day
- **No Results**: Some zip codes may not have Kroger stores

### Walmart API Issues
- **403 Forbidden**: Your API key may not be activated yet
- **Rate Limiting**: Walmart allows 5,000 requests per day
- **Product Matching**: Walmart's search can be less precise than Kroger's

### General Issues
- **CORS Errors**: Make sure you're using Firebase Functions in production
- **Timeout Errors**: API calls may take longer during peak hours
- **Missing Prices**: Not all products have pricing data available

## Fallback Behavior

If no real pricing APIs are configured or available:
1. Spoonacular API provides average market prices
2. Mock provider generates realistic prices based on ingredient type
3. Original meal plan estimates are used as last resort

## Cost Considerations

- **Kroger API**: Free tier includes 10,000 requests/day
- **Walmart API**: Free tier includes 5,000 requests/day
- **Spoonacular API**: 150 requests/day on free tier (already configured)

## Security Best Practices

1. **Never expose API keys in client code**
2. **Always use Firebase Functions for production**
3. **Implement rate limiting in your proxy functions**
4. **Monitor API usage to avoid overages**
5. **Rotate API keys periodically**

## Next Steps

1. Start with one provider (recommend Kroger for best coverage)
2. Test thoroughly with your local zip codes
3. Monitor pricing accuracy and API reliability
4. Add more providers as needed for better coverage

For questions or issues, refer to the provider's documentation:
- [Kroger API Docs](https://developer.kroger.com/api-documentation)
- [Walmart API Docs](https://developer.walmart.com/doc)
- [Spoonacular API Docs](https://spoonacular.com/food-api/docs) 