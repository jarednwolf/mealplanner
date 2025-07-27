# Instacart Integration Setup Guide

This guide explains how to integrate Instacart's Developer Platform API to enable users to send their grocery lists directly to Instacart for checkout.

## Overview

The Meal Planner app integrates with Instacart's Developer Platform API to:
- Create shoppable recipe pages from individual meals
- Convert entire meal plans into shopping lists
- Send grocery lists to Instacart for easy checkout
- Allow users to select their preferred retailer

## How It Works

Unlike direct cart integration, Instacart's Developer Platform API works by:
1. Creating a recipe/shopping list page on Instacart's servers
2. Returning a URL to that page
3. Users click the link to view their list on Instacart.com
4. Users can then add items to their cart and checkout on Instacart

## Setup Instructions

### 1. Register for Developer Access

1. Go to [Instacart Developer Platform](https://www.instacart.com/developer)
2. Click "Sign up" and request development access
3. Once approved, create your account
4. Invite team members if needed

### 2. Create an API Key

1. Log into your developer dashboard
2. Navigate to API Keys section
3. Create a development API key
4. Save the key securely

### 3. Configure Environment Variables

Add your Instacart API key to your `.env.local` file:

```env
# Instacart Developer Platform API
VITE_INSTACART_API_KEY=your_api_key_here

# Use mock service for development (optional)
VITE_USE_MOCK_INSTACART=false
```

### 4. Test Your Integration

The integration is already implemented in the codebase. To test:

1. Generate a meal plan
2. Go to the Grocery List page
3. Click "Order Groceries" → "Order on Instacart"
4. Your list will be created and you'll be redirected to Instacart

## API Endpoints Used

### Create Recipe/Shopping List
- **Endpoint**: `/idp/v1/products/recipe`
- **Method**: POST
- **Purpose**: Creates a shoppable page on Instacart

### Get Nearby Retailers
- **Endpoint**: `/idp/v1/retailers`
- **Method**: GET
- **Purpose**: Find available stores near a zip code

## Features Implemented

### 1. Shopping List from Grocery List
Converts the aggregated grocery list into an Instacart shopping list:
```javascript
await instacartService.createShoppingListFromGroceryList(groceryList)
```

### 2. Recipe from Individual Meal
Creates a recipe page for a single meal:
```javascript
await instacartService.createRecipeFromMeal(meal, recipe)
```

### 3. Shopping List from Meal Plan
Converts entire weekly meal plan into shopping list:
```javascript
await instacartService.createShoppingListFromMealPlan(mealPlan)
```

### 4. Retailer Selection
Get nearby retailers for user's location:
```javascript
await instacartService.getNearbyRetailers(zipCode)
```

## User Experience Flow

1. **User generates meal plan** in the app
2. **Creates grocery list** from meal plan
3. **Clicks "Order on Instacart"** button
4. **App creates shopping list** via API
5. **User redirected to Instacart** with pre-filled list
6. **User selects store** and adds items to cart
7. **User completes checkout** on Instacart

## Development Mode

For development without an API key, set:
```env
VITE_USE_MOCK_INSTACART=true
```

This will use the mock service that simulates API responses.

## Production Considerations

### 1. API Key Security
- Never expose API key in client code
- Consider proxying through Firebase Functions

### 2. Affiliate Program
- Apply for Instacart's affiliate program
- Track conversions and earn commissions
- Add affiliate parameters to URLs

### 3. Error Handling
The service includes comprehensive error handling:
- API key not configured
- Network failures
- Invalid responses
- Rate limiting

### 4. User Privacy
- Link-back URLs only include necessary context
- No personal data is sent to Instacart
- Users must authenticate on Instacart separately

## Limitations

1. **No Direct Cart API**: Cannot add items directly to cart
2. **User Redirection**: Users must leave your app
3. **Limited Customization**: Recipe/list pages have fixed format
4. **Store Availability**: Not all stores may be available

## Future Enhancements

1. **Preferred Retailer**: Save user's preferred store
2. **Price Comparison**: Show estimated prices by store
3. **Order History**: Track which lists were sent
4. **Analytics**: Monitor conversion rates

## Support

- [Instacart API Documentation](https://docs.instacart.com/developer_platform_api/)
- [API Reference](https://docs.instacart.com/developer_platform_api/api/overview/)
- [Enterprise Service Desk](https://instacart.atlassian.net/servicedesk/)

## Troubleshooting

### API Key Issues
- Verify key is active in developer dashboard
- Check you're using correct environment (dev/prod)
- Ensure key has proper permissions

### CORS Errors
- API calls must be made from backend
- Consider Firebase Functions proxy

### Empty Responses
- Check ingredient format matches API requirements
- Verify all required fields are included
- Test with simpler payloads first 