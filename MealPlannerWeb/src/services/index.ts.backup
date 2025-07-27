// Service exports
export { AuthService } from './auth';
export { aiService } from './ai';
export { recipeService } from './recipe';
export { mealPlanService } from './mealPlan';
export { mealPlanOrchestratorService } from './mealPlanOrchestrator';

// Service interfaces
import { UserProfile, MealPlan, Meal, GroceryList, PantryItem, Recipe } from '../types';
import { RecipeSearchParams } from './recipe';

export interface MealPlanService {
  generateWeeklyPlan(userProfile: UserProfile): Promise<MealPlan>;
  swapMeal(mealId: string, userProfile: UserProfile): Promise<Meal>;
  getMealPlan(id: string): Promise<MealPlan>;
  getUserMealPlans(userId: string): Promise<MealPlan[]>;
  saveMealPlan(mealPlan: MealPlan): Promise<string>;
}

export interface RecipeServiceInterface {
  searchRecipes(params: RecipeSearchParams): Promise<Recipe[]>;
  getRecipeById(id: string): Promise<Recipe>;
  getRecipeInstructions(id: string): Promise<string[]>;
  getIngredientPrices(ingredients: string[]): Promise<Record<string, number>>;
  clearCache(): void;
}

export interface GroceryService {
  generateGroceryList(mealPlan: MealPlan): Promise<GroceryList>;
  optimizeBudget(groceryList: GroceryList, budget: number): Promise<GroceryList>;
  saveGroceryList(groceryList: GroceryList): Promise<string>;
  getGroceryList(id: string): Promise<GroceryList>;
  getUserGroceryLists(userId: string): Promise<GroceryList[]>;
}

export interface PantryService {
  addItems(userId: string, items: PantryItem[]): Promise<void>;
  getItems(userId: string): Promise<PantryItem[]>;
  updateItem(userId: string, itemId: string, updates: Partial<PantryItem>): Promise<void>;
  removeItem(userId: string, itemId: string): Promise<void>;
  getExpiringItems(userId: string, daysThreshold: number): Promise<PantryItem[]>;
}
