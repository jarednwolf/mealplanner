import { UserProfile, MealPlan, Meal, PantryItem, GroceryList, CalendarEvent } from '../types';
import { aiService } from './ai';
import { recipeService } from './recipe';
import { mealPlanService } from './mealPlan';
import { groceryService } from './grocery';
import { calendarService } from './calendar';
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

      // Get calendar events for the week
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      const calendarEvents = await calendarService.getEvents(weekStartDate, weekEndDate);

      // Get meal plan preferences
      const preferences = await calendarService.getPreferences();

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

      // Filter out meals for days when we have calendar events
      const filteredMeals = await this.filterMealsByCalendarEvents(
        mealPlanResponse.meals,
        calendarEvents,
        weekStartDate
      );

      // If we're using freshness preferences, optimize meal order
      let optimizedMeals = filteredMeals;
      if (preferences) {
        const mealSchedule = calendarService.calculateOptimalMealSchedule(
          filteredMeals,
          weekStartDate,
          preferences
        );
        // Convert schedule back to meals array with updated day assignments
        optimizedMeals = this.scheduledMealsToArray(mealSchedule, weekStartDate);
      }

      // Enhance meal data with additional recipe information
      const enhancedMeals = await this.enhanceMealsWithRecipeData(optimizedMeals);

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

      // Generate grocery list for the meal plan
      try {
        // Fetch user's pantry items if not provided
        let pantryItemsToUse: PantryItem[] = [];
        if (!pantryItems || pantryItems.length === 0) {
          // Fetch actual pantry items from service
          try {
            const { pantryService } = await import('./pantry');
            pantryItemsToUse = await pantryService.getUserPantryItems(userProfile.userId);
          } catch (error) {
            console.log('Pantry service not available, continuing without pantry items');
          }
        }
        
        const groceryList = await groceryService.generateGroceryList(
          mealPlan,
          pantryItemsToUse
        );
        
        // Update meal plan with grocery list ID
        mealPlan.groceryListId = groceryList.id;
        // Save the updated meal plan
        await mealPlanService.saveMealPlan(mealPlan);
      } catch (error) {
        console.error('Error generating grocery list:', error);
        // Continue without grocery list if generation fails
      }

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
      // Options are passed to mealPlanService.swapMeal, but not used directly here

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
          ingredients: meal.ingredients.length > 0 
            ? meal.ingredients 
            : recipe.ingredients.map(ing => ({
                ...ing,
                estimatedPrice: 0 // Will be calculated by budget service
              })),
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

  /**
   * Filter meals based on calendar events
   */
  private async filterMealsByCalendarEvents(
    meals: Meal[],
    calendarEvents: CalendarEvent[],
    weekStartDate: Date
  ): Promise<Meal[]> {
    const filteredMeals: Meal[] = [];
    
    for (const meal of meals) {
      const mealDate = new Date(weekStartDate);
      mealDate.setDate(mealDate.getDate() + meal.dayOfWeek);
      
      // Check if we should skip this meal due to calendar events
      const shouldSkip = await calendarService.shouldSkipMeal(
        mealDate,
        meal.mealType
      );
      
      if (!shouldSkip) {
        // Check for meal modifications
        const modifications = await calendarService.getMealModifications(mealDate);
        
        // Apply modifications if needed
        if (modifications.kidsOnly) {
          // Could modify meal to be kid-friendly
          meal.recipeName = `${meal.recipeName} (Kids Version)`;
        } else if (modifications.adultsOnly) {
          // Could adjust portion sizes
          meal.servings = 2; // Assume 2 adults
        }
        
        if (modifications.busyDay) {
          // Prefer meals with shorter prep time
          if (meal.prepTime + meal.cookTime > 30) {
            continue; // Skip this meal if it takes too long
          }
        }
        
        filteredMeals.push(meal);
      }
    }
    
    return filteredMeals;
  }

  /**
   * Convert scheduled meals map back to array
   */
  private scheduledMealsToArray(
    schedule: Map<string, Meal[]>,
    weekStartDate: Date
  ): Meal[] {
    const meals: Meal[] = [];
    
    schedule.forEach((dayMeals, dateKey) => {
      const date = new Date(dateKey);
      const dayOfWeek = Math.floor((date.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      dayMeals.forEach((meal, index) => {
        meals.push({
          ...meal,
          dayOfWeek,
          // Ensure proper meal type assignment
          mealType: index === 0 ? 'breakfast' : index === 1 ? 'lunch' : 'dinner'
        });
      });
    });
    
    return meals;
  }
}

export const mealPlanOrchestratorService = new MealPlanOrchestratorService();
export default mealPlanOrchestratorService;