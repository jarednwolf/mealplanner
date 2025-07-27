# Recipe API Setup Guide

This guide explains how to integrate real recipe data using the Spoonacular API.

## Getting Started

### 1. Get a Spoonacular API Key

1. Visit [Spoonacular API](https://spoonacular.com/food-api)
2. Sign up for a free account
3. Navigate to your profile/console to get your API key
4. The free tier includes:
   - 150 points per day
   - Recipe search, information, and nutrition data
   - Ingredient prices and substitutions

### 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Recipe API Configuration
VITE_SPOONACULAR_API_KEY=your_api_key_here
VITE_USE_REAL_RECIPES=true
```

### 3. API Features Available

The integration supports:

- **Recipe Search**: Find recipes by query, cuisine, diet, ingredients, and more
- **Recipe Details**: Get full recipe information including:
  - Ingredients with amounts and categories
  - Step-by-step instructions
  - Nutrition information
  - Recipe images
  - Estimated costs
- **Random Recipes**: Get random recipe suggestions
- **Caching**: Results are cached for 1 hour to minimize API usage

## Usage Modes

The app supports three modes for recipe data:

### 1. Direct API Mode (Recommended for Development)
- Uses Spoonacular API directly from the frontend
- Requires `VITE_SPOONACULAR_API_KEY` and `VITE_USE_REAL_RECIPES=true`
- Best performance, real-time data

### 2. Firebase Proxy Mode (Production)
- Routes API calls through Firebase Functions
- Keeps API key secure on server
- Slightly slower but more secure

### 3. Mock Data Mode (Fallback)
- Uses built-in mock recipes
- No API key required
- Limited recipe variety

## API Rate Limits

Spoonacular uses a point system:
- Recipe search: 1 point + 0.01 per result
- Recipe information: 1 point
- Recipe nutrition: 1 point

With 150 points/day free tier:
- ~100-120 recipe searches
- Or ~75 full recipe details with nutrition

## Troubleshooting

### No recipes showing up
1. Check if `VITE_USE_REAL_RECIPES=true` in `.env.local`
2. Verify your API key is valid
3. Check browser console for API errors
4. Ensure you haven't exceeded rate limits

### Images not loading
- Recipe images are hosted by Spoonacular
- Some recipes may not have images
- The app gracefully handles missing images

### API quota exceeded
- The app will automatically fall back to mock data
- Consider upgrading your Spoonacular plan
- Or wait until the next day for quota reset

## Upgrading API Plan

For production use, consider upgrading to a paid Spoonacular plan:
- $9.99/month: 500 points/day
- $29.99/month: 1,500 points/day
- $99.99/month: 5,000 points/day

This enables serving more users with real recipe data. 