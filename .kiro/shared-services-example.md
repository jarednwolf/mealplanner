# Shared Services Example: Recommendation Feature

## How It Works: One Service, Two UIs

### 1. Backend Service (Shared by Both Apps)
**Location**: `services/recommendation.ts` (copied to both apps)

```typescript
// This service works for BOTH mobile and web!
class RecommendationService {
  async getPersonalizedRecommendations(userId, userProfile, count) {
    // Business logic here - written ONCE
    // - Fetch from Firestore
    // - Analyze preferences
    // - Call AI service
    // - Return recommendations
  }
}
```

### 2. Mobile UI (React Native)
**Location**: `MealPlannerApp/src/components/RecommendationCard.tsx`

```typescript
// Mobile-specific UI
<FlatList
  data={recommendations}  // ← Same data from service
  horizontal
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.mealCard}>
      <Text>{item.recipeName}</Text>
    </TouchableOpacity>
  )}
/>
```

### 3. Web UI (React)
**Location**: `MealPlannerWeb/src/components/RecommendationCard.tsx`

```typescript
// Web-specific UI
<div className="grid grid-cols-5 gap-4">
  {recommendations.map((meal) => (  // ← Same data from service
    <div className="bg-gray-50 rounded-lg p-4">
      <h3>{meal.recipeName}</h3>
    </div>
  ))}
</div>
```

## Benefits Illustrated

### When You Add a New Feature:

1. **Write Service Once** ✅
   - Add to `/services/` directory
   - Implement business logic
   - Test it

2. **Copy to Both Apps** ✅
   ```bash
   cp MealPlannerApp/src/services/newFeature.ts MealPlannerWeb/src/services/
   ```

3. **Create Platform-Specific UIs** ✅
   - Mobile: Use React Native components
   - Web: Use React + Tailwind CSS

### When You Update Business Logic:

1. **Update in One Place** ✅
   - Modify the service file
   - Copy to other app
   - Both apps get the update!

### Real Example - Adding "Favorite Meals" Feature:

```typescript
// 1. Create service (ONCE)
// services/favorites.ts
class FavoritesService {
  async addToFavorites(userId: string, mealId: string) {
    // Add to Firestore
  }
  
  async getFavorites(userId: string) {
    // Get from Firestore
  }
}

// 2. Mobile UI
// React Native TouchableOpacity with heart icon

// 3. Web UI  
// React button with heart SVG icon

// Both use the SAME FavoritesService!
```

## What's Shared vs What's Different

### ✅ Shared (Write Once)
- Services (business logic)
- Types/Interfaces
- Utilities
- Firebase configuration
- API endpoints

### 🎨 Platform-Specific (Write Twice)
- UI Components
- Navigation
- Styling
- Platform-specific features
- App configuration

## Database Impact

When either app uses the service:
```
Mobile App → RecommendationService → Firestore ← RecommendationService ← Web App
                                           ↓
                                    Same User Data
                                    Same Meal Plans
                                    Same Preferences
```

## Cost Savings

Instead of:
- 2 separate backends
- 2 databases
- 2 sets of API keys
- Duplicate business logic

You have:
- 1 Firebase project
- 1 database
- 1 set of API endpoints
- Shared business logic
- Half the maintenance! 