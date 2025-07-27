// AI service for meal plan generation using OpenAI via Firebase Functions
import { config } from '../config/env';
import { UserProfile, Meal } from '../types';
import { calculateBudgetStatus } from '../utils';
import { auth } from '../config/firebase';
import { mockAIService } from './mockAI';

export interface MealPlanRequest {
  userProfile: UserProfile;
  excludeRecipes?: string[];
  pantryItems?: string[];
  preferredCuisines?: string[];
  weekStartDate?: Date;
  householdPreferences?: {
    allDietaryRestrictions: string[];
    allAllergens: string[];
    allDislikedIngredients: string[];
    cuisinePreferences: { [cuisine: string]: number };
    nutritionRequirements: Array<{
      name: string;
      dailyCalories?: number;
      macros?: {
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
      };
    }>;
  };
}

export interface MealPlanResponse {
  meals: Meal[];
  totalEstimatedCost: number;
  budgetStatus: 'under' | 'at' | 'over';
}

export interface AIServiceOptions {
  maxRetries?: number;
  retryDelay?: number;
  rateLimitPerMinute?: number;
  useCache?: boolean;
  cacheTTL?: number; // in milliseconds
}

interface RequestQueueItem {
  timestamp: number;
}

class AIService {
  private functionsUrl: string;
  private options: AIServiceOptions;
  private requestQueue: RequestQueueItem[] = [];
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(options: AIServiceOptions = {}) {
    this.functionsUrl = config.functionsUrl;
    
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      rateLimitPerMinute: 10,
      useCache: true,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      ...options
    };
  }

  /**
   * Generate a complete meal plan based on user profile and preferences
   */
  async generateMealPlan(request: MealPlanRequest): Promise<MealPlanResponse> {
    // Use mock service if configured
    if (config.useMockAI) {
      console.log('Using mock AI service for meal plan generation');
      return mockAIService.generateMealPlan(request);
    }

    const cacheKey = `mealplan:${JSON.stringify(request)}`;
    
    // Check cache first if enabled
    if (this.options.useCache) {
      const cachedResult = this.getFromCache<MealPlanResponse>(cacheKey);
      if (cachedResult) {
        console.log('Using cached meal plan');
        return cachedResult;
      }
    }

    try {
      await this.checkRateLimit();
      
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildMealPlanPrompt(request);
      
      const response = await this.makeOpenAIRequest('gpt-4', systemPrompt, userPrompt, {
        temperature: 0.7,
        max_tokens: 3000,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0.1,
      });

      const result = this.parseMealPlanResponse(response, request.userProfile);
      
      // Cache the result if caching is enabled
      if (this.options.useCache) {
        this.saveToCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw this.handleError(error, 'Failed to generate meal plan');
    }
  }

  /**
   * Suggest an alternative meal to replace an existing one
   */
  async suggestMealSwap(
    originalMeal: Meal,
    userProfile: UserProfile,
    excludeRecipes: string[] = [],
    householdPreferences?: {
      allDietaryRestrictions: string[];
      allAllergens: string[];
      allDislikedIngredients: string[];
      cuisinePreferences: { [cuisine: string]: number };
      nutritionRequirements: Array<{
        name: string;
        dailyCalories?: number;
        macros?: {
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
        };
      }>;
    }
  ): Promise<Meal> {
    // Use mock service if configured
    if (config.useMockAI) {
      console.log('Using mock AI service for meal swap');
      return mockAIService.suggestMealSwap(originalMeal, userProfile, excludeRecipes);
    }

    const cacheKey = `mealswap:${originalMeal.id}:${JSON.stringify(excludeRecipes)}`;
    
    // Check cache first if enabled
    if (this.options.useCache) {
      const cachedResult = this.getFromCache<Meal>(cacheKey);
      if (cachedResult) {
        console.log('Using cached meal swap');
        return cachedResult;
      }
    }

    try {
      await this.checkRateLimit();
      
      const systemPrompt = 'You are a meal planning assistant that suggests alternative recipes based on user preferences. You provide creative, delicious alternatives that match dietary restrictions and budget constraints.';
      const userPrompt = this.buildMealSwapPrompt(originalMeal, userProfile, excludeRecipes, householdPreferences);
      
      const response = await this.makeOpenAIRequest('gpt-3.5-turbo', systemPrompt, userPrompt, {
        temperature: 0.8,
        max_tokens: 800,
        top_p: 1,
      });

      const result = this.parseMealSwapResponse(response, originalMeal);
      
      // Cache the result if caching is enabled
      if (this.options.useCache) {
        this.saveToCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('Error suggesting meal swap:', error);
      throw this.handleError(error, 'Failed to suggest meal alternative');
    }
  }

  /**
   * Generate recipe instructions for a specific meal
   */
  async generateRecipeInstructions(meal: Meal): Promise<string[]> {
    const cacheKey = `recipe:${meal.recipeId}`;
    
    // Check cache first if enabled
    if (this.options.useCache) {
      const cachedResult = this.getFromCache<string[]>(cacheKey);
      if (cachedResult) {
        console.log('Using cached recipe instructions');
        return cachedResult;
      }
    }

    try {
      await this.checkRateLimit();
      
      const systemPrompt = 'You are a professional chef providing clear, step-by-step cooking instructions. Your instructions are concise, practical, and easy to follow.';
      const userPrompt = `
Please provide detailed cooking instructions for "${meal.recipeName}".

Recipe details:
- Description: ${meal.description}
- Preparation time: ${meal.prepTime} minutes
- Cooking time: ${meal.cookTime} minutes
- Servings: ${meal.servings}

Ingredients:
${meal.ingredients.map(ing => `- ${ing.amount} ${ing.unit} ${ing.name}`).join('\n')}

Provide step-by-step instructions in a JSON array format like this:
["Step 1: Preheat oven to 350°F.", "Step 2: Mix ingredients in a bowl.", "..."]

Make sure the instructions are clear, detailed, and easy to follow.
      `.trim();
      
      const response = await this.makeOpenAIRequest('gpt-3.5-turbo', systemPrompt, userPrompt, {
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Parse the response to extract the instructions array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const instructions = JSON.parse(jsonMatch[0]);
      
      // Cache the result if caching is enabled
      if (this.options.useCache) {
        this.saveToCache(cacheKey, instructions);
      }
      
      return instructions;
    } catch (error) {
      console.error('Error generating recipe instructions:', error);
      throw this.handleError(error, 'Failed to generate recipe instructions');
    }
  }

  /**
   * Generate personalized cooking tips based on user profile and meal
   */
  async generateCookingTips(meal: Meal, userProfile: UserProfile): Promise<string[]> {
    // Use mock service if configured
    if (config.useMockAI) {
      console.log('Using mock AI service for cooking tips');
      return mockAIService.generateCookingTips(meal, userProfile);
    }

    try {
      await this.checkRateLimit();
      
      const systemPrompt = 'You are a helpful cooking assistant providing personalized tips to make cooking easier and more enjoyable.';
      const userPrompt = `
Please provide 3-5 helpful cooking tips for "${meal.recipeName}" tailored to a ${userProfile.cookingSkillLevel} cook.

Recipe details:
- Description: ${meal.description}
- Preparation time: ${meal.prepTime} minutes
- Cooking time: ${meal.cookTime} minutes
- Main ingredients: ${meal.ingredients.slice(0, 5).map(ing => ing.name).join(', ')}

User cooking skill level: ${userProfile.cookingSkillLevel}
Available cooking time: ${userProfile.cookingTimePreference.weekday} minutes on weekdays, ${userProfile.cookingTimePreference.weekend} minutes on weekends

Provide tips in a JSON array format like this:
["Tip 1: Prep all ingredients before starting to save time.", "Tip 2: Use a sharp knife for cleaner cuts.", "..."]

Focus on practical tips that will help this ${userProfile.cookingSkillLevel} cook succeed with this recipe.
      `.trim();
      
      const response = await this.makeOpenAIRequest('gpt-3.5-turbo', systemPrompt, userPrompt, {
        temperature: 0.7,
        max_tokens: 800,
      });

      // Parse the response to extract the tips array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating cooking tips:', error);
      throw this.handleError(error, 'Failed to generate cooking tips');
    }
  }

  /**
   * Build the system prompt for meal planning
   */
  private buildSystemPrompt(): string {
    return `
You are a professional meal planning assistant that creates personalized weekly meal plans based on user preferences, dietary restrictions, and budget constraints.

Your meal plans are:
1. Nutritionally balanced and varied
2. Respectful of all dietary restrictions
3. Budget-conscious and cost-effective
4. Appropriate for the user's cooking skill level
5. Realistic for the user's available cooking time
6. Designed to minimize food waste by reusing ingredients across meals

You provide creative, delicious meal ideas that match the user's preferences while staying within their budget. You are knowledgeable about nutrition, cooking techniques, and ingredient substitutions.

Always respond with properly formatted JSON that can be parsed by JavaScript's JSON.parse().
    `.trim();
  }

  /**
   * Build the user prompt for meal plan generation
   */
  private buildMealPlanPrompt(request: MealPlanRequest): string {
    const { userProfile, excludeRecipes = [], pantryItems = [], preferredCuisines = [], householdPreferences } = request;
    
    // Determine which cuisines to prioritize
    const cuisines = preferredCuisines.length > 0 ? preferredCuisines : userProfile.cuisinePreferences;
    
    // Calculate daily budget
    const dailyBudget = userProfile.weeklyBudget / 7;
    
    // Combine dietary restrictions from user profile and household members
    const allDietaryRestrictions = householdPreferences 
      ? [...new Set([...userProfile.dietaryRestrictions, ...householdPreferences.allDietaryRestrictions])]
      : userProfile.dietaryRestrictions;
    
    // Get allergens from household members
    const allergens = householdPreferences?.allAllergens || [];
    
    // Get disliked ingredients from household members
    const dislikedIngredients = householdPreferences?.allDislikedIngredients || [];
    
    // Sort cuisines by preference count if available
    let cuisineInfo = '';
    if (householdPreferences?.cuisinePreferences) {
      const sortedCuisines = Object.entries(householdPreferences.cuisinePreferences)
        .sort(([, a], [, b]) => b - a)
        .map(([cuisine, count]) => `${cuisine} (${count} people like it)`);
      cuisineInfo = sortedCuisines.length > 0 ? sortedCuisines.join(', ') : 'Any';
    } else {
      cuisineInfo = cuisines.join(', ') || 'Any';
    }
    
    // Format nutrition requirements if available
    let nutritionInfo = '';
    if (householdPreferences?.nutritionRequirements && householdPreferences.nutritionRequirements.length > 0) {
      nutritionInfo = '\n\nNUTRITION REQUIREMENTS (IMPORTANT):\n';
      householdPreferences.nutritionRequirements.forEach(req => {
        nutritionInfo += `- ${req.name}: `;
        if (req.dailyCalories) {
          nutritionInfo += `${req.dailyCalories} calories/day`;
        }
        if (req.macros) {
          nutritionInfo += ` (${req.macros.protein}g protein, ${req.macros.carbs}g carbs, ${req.macros.fat}g fat`;
          if (req.macros.fiber) {
            nutritionInfo += `, ${req.macros.fiber}g fiber`;
          }
          nutritionInfo += ')';
        }
        nutritionInfo += '\n';
      });
    }
    
    return `
Create a 7-day meal plan with the following requirements:

User Profile:
- Household size: ${userProfile.householdSize} people
- Dietary restrictions: ${allDietaryRestrictions.join(', ') || 'None'}
${allergens.length > 0 ? `- ALLERGENS (MUST AVOID): ${allergens.join(', ')}` : ''}
${dislikedIngredients.length > 0 ? `- Disliked ingredients (avoid when possible): ${dislikedIngredients.join(', ')}` : ''}
- Cuisine preferences: ${cuisineInfo}
- Cooking skill level: ${userProfile.cookingSkillLevel}
- Weekly budget: $${userProfile.weeklyBudget.toFixed(2)} (about $${dailyBudget.toFixed(2)} per day)
- Cooking time preference: ${userProfile.cookingTimePreference.weekday} min weekdays, ${userProfile.cookingTimePreference.weekend} min weekends
${nutritionInfo}
${pantryItems.length > 0 ? `Available pantry items to use: ${pantryItems.join(', ')}` : ''}
${excludeRecipes.length > 0 ? `Exclude these recipes: ${excludeRecipes.join(', ')}` : ''}

Planning Guidelines:
1. CRITICAL: Absolutely NO meals should contain any of the listed allergens
2. Create meals that respect ALL dietary restrictions
3. Avoid disliked ingredients when possible, but they are not as critical as allergens
4. Stay within the weekly budget of $${userProfile.weeklyBudget.toFixed(2)}
5. Weekday meals should take no more than ${userProfile.cookingTimePreference.weekday} minutes to prepare
6. Weekend meals can be more elaborate (up to ${userProfile.cookingTimePreference.weekend} minutes)
7. Include a variety of cuisines with emphasis on the household's preferences
8. Create a balanced plan with appropriate portion sizes for ${userProfile.householdSize} people
9. Reuse ingredients across meals when possible to reduce waste
10. Adjust complexity based on the user's cooking skill level
${householdPreferences?.nutritionRequirements && householdPreferences.nutritionRequirements.length > 0 ? 
`11. IMPORTANT: Ensure meals meet the specified nutrition requirements for each household member
12. Consider portion sizes and nutritional content to help members reach their daily targets` : ''}

Please provide a JSON response with 21 meals (7 days × 3 meals) in this exact format:
{
  "meals": [
    {
      "dayOfWeek": 1,
      "mealType": "breakfast",
      "recipeName": "Recipe Name",
      "description": "Brief description",
      "prepTime": 15,
      "cookTime": 10,
      "servings": ${userProfile.householdSize},
      "estimatedCost": 8.50,
      "ingredients": [
        {
          "name": "ingredient name",
          "amount": 2,
          "unit": "cups",
          "category": "produce",
          "estimatedPrice": 3.00
        }
      ]
    }
  ]
}

Ensure the total estimated cost stays within the budget and all meals respect dietary restrictions. Be realistic with portion sizes and ingredient costs.
    `.trim();
  }

  /**
   * Build the user prompt for meal swap suggestions
   */
  private buildMealSwapPrompt(
    originalMeal: Meal,
    userProfile: UserProfile,
    excludeRecipes: string[],
    householdPreferences?: {
      allDietaryRestrictions: string[];
      allAllergens: string[];
      allDislikedIngredients: string[];
      cuisinePreferences: { [cuisine: string]: number };
      nutritionRequirements: Array<{
        name: string;
        dailyCalories?: number;
        macros?: {
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
        };
      }>;
    }
  ): string {
    // Combine dietary restrictions from user profile and household members
    const allDietaryRestrictions = householdPreferences 
      ? [...new Set([...userProfile.dietaryRestrictions, ...householdPreferences.allDietaryRestrictions])]
      : userProfile.dietaryRestrictions;
    
    // Get allergens from household members
    const allergens = householdPreferences?.allAllergens || [];
    
    // Get disliked ingredients from household members
    const dislikedIngredients = householdPreferences?.allDislikedIngredients || [];
    
    return `
Suggest an alternative ${originalMeal.mealType} recipe to replace "${originalMeal.recipeName}".

Original Recipe:
- Name: ${originalMeal.recipeName}
- Description: ${originalMeal.description}
- Meal type: ${originalMeal.mealType}
- Prep time: ${originalMeal.prepTime} minutes
- Cook time: ${originalMeal.cookTime} minutes
- Estimated cost: $${originalMeal.estimatedCost.toFixed(2)}
- Main ingredients: ${originalMeal.ingredients.slice(0, 5).map(ing => ing.name).join(', ')}

Requirements:
- Similar meal type: ${originalMeal.mealType}
- Dietary restrictions: ${allDietaryRestrictions.join(', ') || 'None'}
${allergens.length > 0 ? `- ALLERGENS (MUST AVOID): ${allergens.join(', ')}` : ''}
${dislikedIngredients.length > 0 ? `- Disliked ingredients (avoid when possible): ${dislikedIngredients.join(', ')}` : ''}
- Cuisine preferences: ${userProfile.cuisinePreferences.join(', ') || 'Any'}
- Cooking skill level: ${userProfile.cookingSkillLevel}
- Target cost: around $${originalMeal.estimatedCost.toFixed(2)}
- Servings: ${userProfile.householdSize}
- Maximum prep time: ${userProfile.cookingTimePreference.weekday} minutes

Do not suggest: ${excludeRecipes.join(', ')}

Provide a JSON response in this format:
{
  "recipeName": "New Recipe Name",
  "description": "Brief description",
  "prepTime": 20,
  "cookTime": 15,
  "estimatedCost": 9.00,
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 1,
      "unit": "lb",
      "category": "meat",
      "estimatedPrice": 5.00
    }
  ]
}

Make sure the alternative recipe is different enough from the original but still satisfies the same meal need. Be creative but practical.
    `.trim();
  }

  /**
   * Get the current user's auth token
   */
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.getIdToken();
  }

  /**
   * Make a request to the OpenAI API with retry logic
   */
  private async makeOpenAIRequest(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
    } = {}
  ): Promise<string> {
    let retries = 0;
    let lastError: any;

    while (retries <= this.options.maxRetries!) {
      try {
        const authToken = await this.getAuthToken();
        
        const response = await fetch(`${this.functionsUrl}/openAIProxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 2000,
            top_p: options.top_p || 1,
            frequency_penalty: options.frequency_penalty || 0,
            presence_penalty: options.presence_penalty || 0,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Firebase Functions error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.data) {
          throw new Error('Invalid response from Firebase Functions');
        }

        return data.data;
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (this.shouldRetry(error) && retries < this.options.maxRetries!) {
          retries++;
          console.log(`Retrying OpenAI request (${retries}/${this.options.maxRetries})...`);
          await this.delay(this.options.retryDelay! * retries);
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse the meal plan response from OpenAI
   */
  private parseMealPlanResponse(content: string, userProfile: UserProfile): MealPlanResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const meals: Meal[] = parsed.meals.map((meal: any, index: number) => ({
        id: `meal_${Date.now()}_${index}`,
        recipeId: `recipe_${meal.recipeName.toLowerCase().replace(/\s+/g, '_')}`,
        ...meal,
      }));

      const totalCost = meals.reduce((sum, meal) => sum + meal.estimatedCost, 0);
      const budgetStatus = calculateBudgetStatus(totalCost, userProfile.weeklyBudget);

      return {
        meals,
        totalEstimatedCost: totalCost,
        budgetStatus,
      };
    } catch (error) {
      console.error('Error parsing meal plan response:', error);
      throw new Error('Failed to parse meal plan response. The AI returned an invalid format.');
    }
  }

  /**
   * Parse the meal swap response from OpenAI
   */
  private parseMealSwapResponse(content: string, originalMeal: Meal): Meal {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: `meal_${Date.now()}_swap`,
        dayOfWeek: originalMeal.dayOfWeek,
        mealType: originalMeal.mealType,
        servings: originalMeal.servings,
        recipeId: `recipe_${parsed.recipeName.toLowerCase().replace(/\s+/g, '_')}`,
        ...parsed,
      };
    } catch (error) {
      console.error('Error parsing meal swap response:', error);
      throw new Error('Failed to parse meal swap response. The AI returned an invalid format.');
    }
  }

  /**
   * Check if we should retry the request based on the error
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors or rate limiting
    if (!error.message) return true;
    
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('503')
    );
  }

  /**
   * Check if we're within rate limits
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove requests older than 1 minute
    this.requestQueue = this.requestQueue.filter(req => req.timestamp > oneMinuteAgo);
    
    // Check if we're at the rate limit
    if (this.requestQueue.length >= this.options.rateLimitPerMinute!) {
      const oldestRequest = this.requestQueue[0];
      const timeToWait = 60000 - (now - oldestRequest.timestamp);
      
      if (timeToWait > 0) {
        console.log(`Rate limit reached. Waiting ${timeToWait}ms before next request.`);
        await this.delay(timeToWait);
      }
    }
    
    // Add this request to the queue
    this.requestQueue.push({ timestamp: Date.now() });
  }

  /**
   * Simple delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle errors from the OpenAI API
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error.message.includes('rate limit')) {
      return new Error('You have reached the rate limit. Please try again in a minute.');
    }
    
    if (error.message.includes('429')) {
      return new Error('The AI service is currently busy. Please try again in a few minutes.');
    }
    
    if (error.message.includes('500') || error.message.includes('503')) {
      return new Error('The AI service is temporarily unavailable. Please try again later.');
    }
    
    return new Error(defaultMessage);
  }

  /**
   * Get an item from the cache
   */
  private getFromCache<T>(key: string): T | null {
    if (!this.options.useCache) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.options.cacheTTL!) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Save an item to the cache
   */
  private saveToCache<T>(key: string, data: T): void {
    if (!this.options.useCache) return;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export const aiService = new AIService();
export default aiService;