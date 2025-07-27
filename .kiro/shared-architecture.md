# Meal Planner - Shared Architecture

## Overview
The Meal Planner consists of two client applications that share the same Firebase backend:
- **MealPlannerApp**: React Native mobile app (iOS/Android)
- **MealPlannerWeb**: React web app (Desktop/Mobile Web)

## Shared Backend Infrastructure

### 1. Firebase Authentication
- **Same user accounts** work on both platforms
- Users can sign in on mobile, then access their account on web (and vice versa)
- Authentication state syncs in real-time

### 2. Firestore Database
- **Same database instance** for both apps
- Collections:
  - `users`: User profiles and preferences
  - `mealPlans`: Weekly meal plans
  - `groceryLists`: Generated grocery lists
  - `pantryItems`: User's pantry inventory
  - `feedback`: Meal ratings and preferences

### 3. Firebase Functions (API)
- **Same API endpoints** for both apps:
  - `/openAIProxy`: Secure OpenAI API calls for meal generation
  - `/spoonacularProxy`: Recipe database API calls
  - `/healthCheck`: Service status monitoring

## Shared Code

### Services (Business Logic)
Both apps use identical service files:
- `ai.ts`: AI meal plan generation
- `recipe.ts`: Recipe search and details
- `grocery.ts`: Grocery list generation
- `mealPlan.ts`: Meal plan CRUD operations
- `auth.ts`: Authentication logic
- `budget.ts`: Budget tracking
- `costOptimizer.ts`: Cost-saving suggestions

### Types
Shared TypeScript interfaces ensure data consistency:
- `UserProfile`
- `MealPlan`
- `Meal`
- `GroceryList`
- `Recipe`
- etc.

## User Experience Flow

1. **Mobile User Journey**:
   - User creates account on mobile app
   - Sets up preferences and dietary restrictions
   - Generates a meal plan for the week
   - Creates grocery list
   - Goes to store with phone

2. **Web Continuation**:
   - Same user logs into web app at home
   - Sees the same meal plan on larger screen
   - Can print grocery list
   - Updates pantry after shopping
   - Changes sync back to mobile instantly

## Data Synchronization

### Real-time Sync
- Firestore provides real-time listeners
- Changes on one platform appear instantly on the other
- Offline support with automatic sync when reconnected

### Example Scenario
```
Mobile App                    Firebase                    Web App
    |                            |                           |
    |-- Generate Meal Plan ----->|                           |
    |                            |<-- Real-time Update -------|
    |                            |                           |
    |                            |-- Meal Plan Data -------->|
    |                            |                           |
    |<-- Grocery List Update ----|                           |
    |                            |<-- Mark Item Purchased ---|
```

## Development Benefits

1. **Code Reuse**: Services and business logic work on both platforms
2. **Consistent Data**: Same TypeScript types ensure compatibility
3. **Single Backend**: One Firebase project to maintain
4. **Cost Efficiency**: Shared infrastructure reduces costs
5. **Feature Parity**: New features can be added to both apps

## Deployment

### Mobile App (React Native)
- iOS: App Store
- Android: Google Play Store

### Web App (React)
- Serverless hosting options:
  - Firebase Hosting
  - Vercel
  - Netlify
  - AWS Amplify

### Backend (Firebase)
- Automatically managed by Google
- Scales based on usage
- Pay-per-use pricing

## Security

Both apps use the same security model:
- Firebase Auth for user authentication
- API keys stored in Firebase Functions (server-side)
- Firestore security rules apply to both platforms
- User data isolation enforced at database level 