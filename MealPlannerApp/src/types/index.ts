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
  createdAt?: Date;
  updatedAt?: Date;
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
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStartDate: Date;
  meals: Meal[];
  totalEstimatedCost: number;
  budgetStatus: 'under' | 'at' | 'over';
  createdAt: Date;
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
  name: string;
  quantity: string;
  purchaseDate: Date;
  expirationDate?: Date;
  category: string;
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
