// Core type definitions for the meal planner app

export interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  householdSize: number;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  cookingSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyBudget: number;
  cookingTimePreference: {
    weekday: number; // minutes
    weekend: number; // minutes
  };
  goals?: ('save-money' | 'save-time' | 'lower-stress' | 'improve-health' | 'lose-weight' | 'simplify-cooking' | 'shop-less' | 'waste-less')[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HouseholdMember {
  id: string;
  userId: string; // Reference to the main user account
  name: string;
  age?: number;
  relationship: 'self' | 'spouse' | 'partner' | 'child' | 'parent' | 'roommate' | 'other';
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  allergens: string[]; // Separate from dietary restrictions for safety
  dislikedIngredients: string[];
  favoriteIngredients: string[];
  mealPreferences: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
  };
  portionSize: 'small' | 'regular' | 'large';
  spicePreference: 'none' | 'mild' | 'medium' | 'hot';
  advancedNutrition?: {
    enabled: boolean;
    dailyCalories?: number;
    macros?: {
      protein: number; // grams
      carbs: number; // grams
      fat: number; // grams
      fiber?: number; // grams
    };
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodPreferenceFeedback {
  id: string;
  memberId: string;
  recipeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  likedIngredients: string[];
  dislikedIngredients: string[];
  wouldEatAgain: boolean;
  notes?: string;
  createdAt: Date;
}

export interface Meal {
  id: string;
  dayOfWeek: number;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  recipeName: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  estimatedCost: number;
  ingredients: Ingredient[];
  recipeId: string;
  image?: string;
  nutritionInfo?: NutritionInfo;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStartDate: Date;
  meals: Meal[];
  totalEstimatedCost: number;
  budgetStatus: 'under' | 'at' | 'over';
  groceryList?: GroceryItem[];
  groceryListId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyBudget {
  userId: string;
  weekStartDate: Date;
  budget: number;
  spent: number;
  remaining: number;
  updatedAt: Date;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
  estimatedPrice: number;
}

export interface GroceryItem {
  name: string;
  quantity: string;
  category: string;
  estimatedPrice: number;
  isInPantry: boolean;
  pantryQuantity?: string;
}

export interface GroceryList {
  id: string;
  mealPlanId: string;
  items: GroceryItem[];
  totalCost: number;
  budgetComparison: number;
  suggestedSwaps?: CostSavingSwap[];
}

export interface CostSavingSwap {
  originalItem: string;
  suggestedItem: string;
  savings: number;
  reason: string;
}

export interface PantryItem {
  id?: string;
  name: string;
  quantity: string;
  purchaseDate: Date;
  expirationDate?: Date;
  category: string;
  userId?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string[];
  dietaryTags: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutritionInfo?: NutritionInfo;
  averageRating?: number;
  costEstimate?: number;
  image?: string;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
  substitutions?: string[];
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface MealFeedback {
  mealId: string;
  rating: 'positive' | 'negative';
  reasons: string[];
  comment?: string;
  timestamp: Date;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  type: CalendarEventType;
  date: Date;
  mealType?: 'breakfast' | 'lunch' | 'dinner'; // Which meal is affected
  allDay?: boolean;
  startTime?: string; // HH:MM format
  endTime?: string;
  recurring?: RecurrenceRule;
  notes?: string;
  externalCalendarId?: string; // ID from Google/Apple/Microsoft calendar
  externalCalendarType?: 'google' | 'apple' | 'microsoft' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

export type CalendarEventType = 
  | 'eating_out'
  | 'date_night'
  | 'ordering_in'
  | 'travel'
  | 'party'
  | 'leftovers'
  | 'meal_prep'
  | 'busy_day'
  | 'kids_only'
  | 'adults_only'
  | 'custom';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  endDate?: Date;
  occurrences?: number; // Number of occurrences
}

export interface MealPlanPreferences {
  userId: string;
  defaultMealTimes: {
    breakfast: string; // HH:MM
    lunch: string;
    dinner: string;
  };
  mealPrepDays?: number[]; // Days of week for meal prep (0-6)
  recurringEvents?: CalendarEvent[]; // e.g., Pizza Friday
  freshnessPreferences: {
    maxDaysForSeafood: number;
    maxDaysForPoultry: number;
    maxDaysForGroundMeat: number;
    maxDaysForProduce: number;
    preferFrozenForLaterDays: boolean;
  };
}
