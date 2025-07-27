import { UserProfile, MealPlan, Meal, PantryItem } from '../types';
import { aiService } from './ai';
import { recipeService } from './recipe';
import { mealPlanService } from './mealPlan';
import { calculateBudgetStatus } from '../utils';

export interface MealPlanGenerationOptions {
  excludeRecipes?: string[];
  pantryItems?: PantryItem[];
  preferredCuisines?: string[];
  weekStartDate?: Date;
  maxRetries?: number;
  budgetOptimization?: boolean;
}

export interface MealSwapOptions {
  excludeRecipes?: string[];
  preferredCuisines?: string[];
  maxCost?: number;
  maxPrepTime?: number;
}

/**
 * Orchestrates the meal plan generation process by coordinating
 * between AI service, recipe service, and meal plan storage
 */
class MealPlanOrchestratorService {
  /**
   * Generate a complete meal plan with enhanced recipe data
   */
  async generateMealPlan(
    userProfile: UserProfile,
    options: MealPlanGenerationOptions = {}
  ): Promise<MealPlan> {
    try {
      const {
        excludeRecipes = [],
        pantryItems = [],
        preferredCuisines = [],
        weekStartDate = new Date(),
        maxRetries = 3,
        budgetOptimization = true,
      } = options;

      // Convert pantry items to string array for AI service
      const pantryItemNames = pantryItems.map(item => item.name);

      // First attempt to generate a meal plan
      let mealPlanResponse = await aiService.generateMealPlan({
        userProfile,
        excludeRecipes,
        pantryItems: pantryItemNames,
        preferredCuisines,
        weekStartDate,
      });

      // If budget optimization is enabled and we're over budget, try to optimize
      let retries = 0;
      while (
        budgetOptimization &&
        mealPlanResponse.budgetStatus === 'over' &&
        retries < maxRetries
      ) {
        console.log(`Meal plan over budget, attempting optimization (retry ${retries + 1}/${maxRetries})`);
        
        // Try again with stricter budget constraints
        mealPlanResponse = await aiService.generateMealPlan({
          userProfile: {
            ...userProfile,
            // Reduce the budget target by 10% to aim for a lower cost plan
            weeklyBudget: userProfile.weeklyBudget * 0.9,
          },
          excludeRecipes,
          pantryItems: pantryItemNames,
          preferredCuisines,
          weekStartDate,
        });
        
        retries++;
      }

      // Enhance meal data with additional recipe information
      const enhancedMeals = await this.enhanceMealsWithRecipeData(mealPlanResponse.meals);

      // Recalculate total cost with enhanced data
      const totalEstimatedCost = enhancedMeals.reduce(
        (sum, meal) => sum + meal.estimatedCost,
        0
      );

      // Create the final meal plan
      const mealPlan: MealPlan = {
        id: `plan_${Date.now()}`,
        userId: userProfile.userId,
        weekStartDate,
        meals: enhancedMeals,
        totalEstimatedCost,
        budgetStatus: calculateBudgetStatus(totalEstimatedCost, userProfile.weeklyBudget),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save the meal plan to storage
      await mealPlanService.saveMealPlan(mealPlan);

      return mealPlan;
    } catch (error) {
      console.error('Error in meal plan orchestration:', error);
      throw new Error('Failed to generate meal plan. Please try again.');
    }
  }

  /**
   * Swap a meal in an existing plan with enhanced recipe data
   */
  async swapMeal(
    mealId: string,
    userProfile: UserProfile,
    options: MealSwapOptions = {}
  ): Promise<Meal> {
    try {
      const {
        excludeRecipes = [],
        preferredCuisines = [],
        maxCost,
        maxPrepTime,
      } = options;

      // Get the new meal suggestion from the AI service
      const newMeal = await mealPlanService.swapMeal(mealId, userProfile);

      // Enhance the meal with additional recipe data
      const enhancedMeal = await this.enhanceMealWithRecipeData(newMeal);

      return enhancedMeal;
    } catch (error) {
      console.error('Error swapping meal:', error);
      throw new Error('Failed to swap meal. Please try again.');
    }
  }

  /**
   * Get cooking instructions for a specific meal
   */
  async getMealInstructions(meal: Meal): Promise<string[]> {
    try {
      // Try to get instructions from recipe service first
      try {
        return await recipeService.getRecipeInstructions(meal.recipeId);
      } catch (error) {
        console.log('Failed to get instructions from recipe service, falling back to AI');
        // Fall back to AI-generated instructions
        return await aiService.generateRecipeInstructions(meal);
      }
    } catch (error) {
      console.error('Error getting meal instructions:', error);
      throw new Error('Failed to get cooking instructions. Please try again.');
    }
  }

  /**
   * Get cooking tips for a specific meal
   */
  async getMealCookingTips(meal: Meal, userProfile: UserProfile): Promise<string[]> {
    try {
      return await aiService.generateCookingTips(meal, userProfile);
    } catch (error) {
      console.error('Error getting cooking tips:', error);
      throw new Error('Failed to get cooking tips. Please try again.');
    }
  }

  /**
   * Enhance meals with additional recipe data
   */
  private async enhanceMealsWithRecipeData(meals: Meal[]): Promise<Meal[]> {
    return Promise.all(meals.map(meal => this.enhanceMealWithRecipeData(meal)));
  }

  /**
   * Enhance a single meal with additional recipe data
   */
  private async enhanceMealWithRecipeData(meal: Meal): Promise<Meal> {
    try {
      // Try to get additional recipe data from the recipe service
      try {
        const recipeId = meal.recipeId.replace('recipe_', '');
        const recipe = await recipeService.getRecipeById(recipeId);
        
        // Merge recipe data with meal data
        return {
          ...meal,
          description: meal.description || recipe.description,
          prepTime: meal.prepTime || recipe.prepTime,
          cookTime: meal.cookTime || recipe.cookTime,
          ingredients: meal.ingredients.length > 0 ? meal.ingredients : recipe.ingredients,
          // Keep other meal-specific properties
        };
      } catch (error) {
        console.log('Failed to enhance meal with recipe data, using original meal data');
        // If recipe service fails, just return the original meal
        return meal;
      }
    } catch (error) {
      console.error('Error enhancing meal with recipe data:', error);
      return meal;
    }
  }
}

export const mealPlanOrchestratorService = new MealPlanOrchestratorService();
export default mealPlanOrchestratorService;