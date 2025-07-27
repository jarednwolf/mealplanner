import { Recipe, RecipeIngredient, NutritionInfo } from '../types';
import { config } from '../config/env';
import { auth } from '../config/firebase';

export interface RecipeSearchParams {
  query?: string;
  cuisine?: string[];
  diet?: string[];
  excludeIngredients?: string[];
  maxReadyTime?: number;
  number?: number;
  offset?: number;
  sort?: 'popularity' | 'time' | 'random';
  sortDirection?: 'asc' | 'desc';
}

// Cache for recipe data
const recipeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

class RecipeService {
  private functionsUrl: string;

  constructor() {
    this.functionsUrl = config.functionsUrl;
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
   * Search for recipes based on various parameters
   */
  async searchRecipes(params: RecipeSearchParams): Promise<Recipe[]> {
    const cacheKey = `search:${JSON.stringify(params)}`;
    const cached = this.getFromCache<Recipe[]>(cacheKey);
    if (cached) return cached;

    try {
      const authToken = await this.getAuthToken();
      
      const queryParams = new URLSearchParams({
        endpoint: 'recipes/complexSearch',
        number: String(params.number || 10),
        offset: String(params.offset || 0),
        ...(params.query && { query: params.query }),
        ...(params.cuisine && { cuisine: params.cuisine.join(',') }),
        ...(params.diet && { diet: params.diet.join(',') }),
        ...(params.excludeIngredients && { excludeIngredients: params.excludeIngredients.join(',') }),
        ...(params.maxReadyTime && { maxReadyTime: String(params.maxReadyTime) }),
        ...(params.sort && { sort: params.sort }),
        ...(params.sortDirection && { sortDirection: params.sortDirection }),
        addRecipeInformation: 'true',
        fillIngredients: 'true',
      });

      const response = await fetch(`${this.functionsUrl}/spoonacularProxy?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Recipe search failed: ${response.status} ${response.statusText}`);
      }

      const { data } = await response.json();
      const recipes = this.mapSearchResultsToRecipes(data.results);
      
      this.saveToCache(cacheKey, recipes);
      return recipes;
    } catch (error) {
      console.error('Error searching recipes:', error);
      
      // Fallback to mock data if API call fails
      return this.getMockRecipes(params);
    }
  }

  /**
   * Get detailed recipe information by ID
   */
  async getRecipeById(id: string): Promise<Recipe> {
    const cacheKey = `recipe:${id}`;
    const cached = this.getFromCache<Recipe>(cacheKey);
    if (cached) return cached;

    try {
      const authToken = await this.getAuthToken();
      
      const response = await fetch(
        `${this.functionsUrl}/spoonacularProxy?endpoint=recipes/${id}/information&includeNutrition=true`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recipe: ${response.status}`);
      }

      const { data } = await response.json();
      const recipe = this.mapApiResponseToRecipe(data);
      
      this.saveToCache(cacheKey, recipe);
      return recipe;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      
      // Return a mock recipe if the API call fails
      return this.getMockRecipe(id);
    }
  }

  /**
   * Get recipe instructions by ID
   */
  async getRecipeInstructions(id: string): Promise<string[]> {
    const cacheKey = `instructions:${id}`;
    const cached = this.getFromCache<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const authToken = await this.getAuthToken();
      
      const response = await fetch(
        `${this.functionsUrl}/spoonacularProxy?endpoint=recipes/${id}/analyzedInstructions`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Recipe instructions fetch failed: ${response.status} ${response.statusText}`);
      }

      const { data } = await response.json();
      const instructions = this.extractInstructions(data);
      
      this.saveToCache(cacheKey, instructions);
      return instructions;
    } catch (error) {
      console.error('Error fetching recipe instructions:', error);
      
      // Fallback to mock data if API call fails
      return this.getMockInstructions(id);
    }
  }

  /**
   * Get ingredient prices (mock implementation)
   */
  async getIngredientPrices(ingredients: string[]): Promise<Record<string, number>> {
    // This is a placeholder for a real price API integration
    // In a production app, this would connect to a grocery price API
    
    // Generate reasonable mock prices
    const prices: Record<string, number> = {};
    
    ingredients.forEach(ingredient => {
      // Generate a price between $0.50 and $10.00
      prices[ingredient] = +(Math.random() * 9.5 + 0.5).toFixed(2);
    });
    
    return prices;
  }

  /**
   * Map search results to Recipe objects
   */
  private mapSearchResultsToRecipes(results: any[]): Recipe[] {
    return results.map(item => this.mapApiResponseToRecipe(item));
  }

  /**
   * Map API response to Recipe object
   */
  private mapApiResponseToRecipe(data: any): Recipe {
    const ingredients: RecipeIngredient[] = (data.extendedIngredients || []).map((ing: any) => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: this.categorizeIngredient(ing.aisle),
      substitutions: [],
    }));

    return {
      id: String(data.id),
      name: data.title,
      description: data.summary ? this.stripHtml(data.summary) : '',
      prepTime: data.preparationMinutes > 0 ? data.preparationMinutes : Math.floor(data.readyInMinutes / 3),
      cookTime: data.cookingMinutes > 0 ? data.cookingMinutes : Math.floor(data.readyInMinutes * 2 / 3),
      servings: data.servings,
      difficulty: this.calculateDifficulty(data.readyInMinutes, ingredients.length),
      cuisine: data.cuisines || [],
      dietaryTags: [
        ...(data.vegetarian ? ['vegetarian'] : []),
        ...(data.vegan ? ['vegan'] : []),
        ...(data.glutenFree ? ['gluten-free'] : []),
        ...(data.dairyFree ? ['dairy-free'] : []),
      ],
      ingredients,
      instructions: data.analyzedInstructions ? 
        this.extractInstructions(data.analyzedInstructions) : 
        [data.instructions || ''].filter(Boolean),
      nutritionInfo: data.nutrition ? {
        calories: this.findNutrient(data.nutrition.nutrients, 'Calories'),
        protein: this.findNutrient(data.nutrition.nutrients, 'Protein'),
        carbs: this.findNutrient(data.nutrition.nutrients, 'Carbohydrates'),
        fat: this.findNutrient(data.nutrition.nutrients, 'Fat'),
        fiber: this.findNutrient(data.nutrition.nutrients, 'Fiber'),
        sugar: this.findNutrient(data.nutrition.nutrients, 'Sugar'),
      } : undefined,
      averageRating: data.spoonacularScore ? data.spoonacularScore / 20 : undefined, // Convert to 0-5 scale
      costEstimate: data.pricePerServing ? data.pricePerServing / 100 : undefined, // Convert cents to dollars
    };
  }

  /**
   * Extract instructions from analyzed instructions
   */
  private extractInstructions(analyzedInstructions: any[]): string[] {
    if (!analyzedInstructions || !analyzedInstructions.length) return [];
    
    return analyzedInstructions
      .flatMap(instruction => instruction.steps || [])
      .map((step: any) => step.step)
      .filter(Boolean);
  }

  /**
   * Find nutrient value in nutrients array
   */
  private findNutrient(nutrients: any[], name: string): number {
    const nutrient = nutrients?.find((n: any) => n.name === name);
    return nutrient ? nutrient.amount : 0;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html.replace(/<\/?[^>]+(>|$)/g, '');
  }

  /**
   * Calculate recipe difficulty based on time and ingredients
   */
  private calculateDifficulty(readyInMinutes: number, ingredientCount: number): 'easy' | 'medium' | 'hard' {
    const complexityScore = (readyInMinutes / 10) + (ingredientCount / 5);
    
    if (complexityScore < 8) return 'easy';
    if (complexityScore < 15) return 'medium';
    return 'hard';
  }

  /**
   * Categorize ingredient based on aisle
   */
  private categorizeIngredient(aisle: string): string {
    if (!aisle) return 'Other';
    
    const lowerAisle = aisle.toLowerCase();
    
    if (lowerAisle.includes('produce') || lowerAisle.includes('vegetables') || lowerAisle.includes('fruit')) {
      return 'Produce';
    }
    if (lowerAisle.includes('meat') || lowerAisle.includes('seafood')) {
      return 'Meat & Seafood';
    }
    if (lowerAisle.includes('dairy') || lowerAisle.includes('cheese') || lowerAisle.includes('eggs')) {
      return 'Dairy & Eggs';
    }
    if (lowerAisle.includes('baking') || lowerAisle.includes('spices') || lowerAisle.includes('condiments')) {
      return 'Pantry';
    }
    if (lowerAisle.includes('frozen')) {
      return 'Frozen';
    }
    if (lowerAisle.includes('bread') || lowerAisle.includes('bakery')) {
      return 'Bakery';
    }
    if (lowerAisle.includes('beverages') || lowerAisle.includes('drinks')) {
      return 'Beverages';
    }
    if (lowerAisle.includes('snacks') || lowerAisle.includes('chips')) {
      return 'Snacks';
    }
    
    return 'Other';
  }

  /**
   * Get item from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = recipeCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > CACHE_TTL) {
      recipeCache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Save item to cache
   */
  private saveToCache<T>(key: string, data: T): void {
    recipeCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    recipeCache.clear();
  }

  /**
   * Get mock recipes for testing or when API key is not available
   */
  private getMockRecipes(params: RecipeSearchParams): Recipe[] {
    const mockRecipes: Recipe[] = [
      {
        id: '1',
        name: 'Vegetable Pasta',
        description: 'A simple and delicious vegetable pasta dish',
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        cuisine: ['Italian'],
        dietaryTags: ['vegetarian'],
        ingredients: [
          {
            name: 'pasta',
            amount: 1,
            unit: 'lb',
            category: 'Pantry',
            substitutions: ['gluten-free pasta'],
          },
          {
            name: 'mixed vegetables',
            amount: 2,
            unit: 'cups',
            category: 'Produce',
            substitutions: [],
          },
          {
            name: 'olive oil',
            amount: 2,
            unit: 'tbsp',
            category: 'Pantry',
            substitutions: [],
          },
          {
            name: 'garlic',
            amount: 2,
            unit: 'cloves',
            category: 'Produce',
            substitutions: [],
          },
          {
            name: 'parmesan cheese',
            amount: 0.25,
            unit: 'cup',
            category: 'Dairy & Eggs',
            substitutions: ['nutritional yeast'],
          },
        ],
        instructions: [
          'Bring a large pot of salted water to a boil.',
          'Cook pasta according to package instructions until al dente.',
          'While pasta is cooking, sauté mixed vegetables in olive oil until tender.',
          'Add minced garlic and cook for another minute.',
          'Drain pasta and combine with vegetables.',
          'Top with grated parmesan cheese and serve.',
        ],
        nutritionInfo: {
          calories: 380,
          protein: 12,
          carbs: 65,
          fat: 8,
          fiber: 5,
          sugar: 3,
        },
        averageRating: 4.5,
        costEstimate: 2.50,
      },
      {
        id: '2',
        name: 'Chicken Stir Fry',
        description: 'Quick and easy chicken stir fry with vegetables',
        prepTime: 15,
        cookTime: 15,
        servings: 4,
        difficulty: 'medium',
        cuisine: ['Asian'],
        dietaryTags: ['dairy-free'],
        ingredients: [
          {
            name: 'chicken breast',
            amount: 1,
            unit: 'lb',
            category: 'Meat & Seafood',
            substitutions: ['tofu'],
          },
          {
            name: 'mixed vegetables',
            amount: 3,
            unit: 'cups',
            category: 'Produce',
            substitutions: [],
          },
          {
            name: 'soy sauce',
            amount: 3,
            unit: 'tbsp',
            category: 'Pantry',
            substitutions: ['tamari'],
          },
          {
            name: 'rice',
            amount: 2,
            unit: 'cups',
            category: 'Pantry',
            substitutions: [],
          },
        ],
        instructions: [
          'Cook rice according to package instructions.',
          'Cut chicken into bite-sized pieces.',
          'Heat oil in a wok or large skillet over high heat.',
          'Add chicken and cook until no longer pink.',
          'Add vegetables and stir-fry for 5 minutes.',
          'Add soy sauce and continue cooking for 2 minutes.',
          'Serve over rice.',
        ],
        nutritionInfo: {
          calories: 420,
          protein: 35,
          carbs: 45,
          fat: 10,
          fiber: 3,
          sugar: 2,
        },
        averageRating: 4.2,
        costEstimate: 3.75,
      },
      {
        id: '3',
        name: 'Vegetarian Chili',
        description: 'Hearty vegetarian chili with beans and vegetables',
        prepTime: 20,
        cookTime: 40,
        servings: 6,
        difficulty: 'easy',
        cuisine: ['Mexican', 'American'],
        dietaryTags: ['vegetarian', 'gluten-free'],
        ingredients: [
          {
            name: 'black beans',
            amount: 2,
            unit: 'cans',
            category: 'Pantry',
            substitutions: [],
          },
          {
            name: 'kidney beans',
            amount: 1,
            unit: 'can',
            category: 'Pantry',
            substitutions: [],
          },
          {
            name: 'diced tomatoes',
            amount: 1,
            unit: 'can',
            category: 'Pantry',
            substitutions: [],
          },
          {
            name: 'onion',
            amount: 1,
            unit: 'large',
            category: 'Produce',
            substitutions: [],
          },
          {
            name: 'bell pepper',
            amount: 1,
            unit: 'large',
            category: 'Produce',
            substitutions: [],
          },
          {
            name: 'chili powder',
            amount: 2,
            unit: 'tbsp',
            category: 'Pantry',
            substitutions: [],
          },
        ],
        instructions: [
          'Dice onion and bell pepper.',
          'In a large pot, sauté onion and bell pepper until soft.',
          'Add chili powder and stir for 1 minute.',
          'Add beans and tomatoes with their juices.',
          'Bring to a simmer and cook for 30 minutes.',
          'Season with salt and pepper to taste.',
        ],
        nutritionInfo: {
          calories: 280,
          protein: 15,
          carbs: 50,
          fat: 2,
          fiber: 15,
          sugar: 5,
        },
        averageRating: 4.7,
        costEstimate: 1.80,
      },
    ];

    // Filter based on search parameters
    let filteredRecipes = [...mockRecipes];
    
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.name.toLowerCase().includes(query) || 
        recipe.description.toLowerCase().includes(query)
      );
    }
    
    if (params.cuisine && params.cuisine.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.cuisine.some(cuisine => params.cuisine!.includes(cuisine))
      );
    }
    
    if (params.diet && params.diet.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        params.diet!.every(diet => recipe.dietaryTags.includes(diet))
      );
    }
    
    if (params.maxReadyTime) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        (recipe.prepTime + recipe.cookTime) <= params.maxReadyTime!
      );
    }
    
    if (params.excludeIngredients && params.excludeIngredients.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        !recipe.ingredients.some(ingredient => 
          params.excludeIngredients!.includes(ingredient.name)
        )
      );
    }
    
    // Apply sorting
    if (params.sort) {
      filteredRecipes.sort((a, b) => {
        let comparison = 0;
        
        switch (params.sort) {
          case 'popularity':
            comparison = (b.averageRating || 0) - (a.averageRating || 0);
            break;
          case 'time':
            comparison = (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
            break;
          case 'random':
            comparison = Math.random() - 0.5;
            break;
        }
        
        return params.sortDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    // Apply pagination
    const offset = params.offset || 0;
    const limit = params.number || 10;
    
    return filteredRecipes.slice(offset, offset + limit);
  }

  /**
   * Get mock recipe by ID
   */
  private getMockRecipe(id: string): Recipe {
    const mockRecipes = this.getMockRecipes({});
    const recipe = mockRecipes.find(r => r.id === id);
    
    if (!recipe) {
      throw new Error(`Recipe with ID ${id} not found`);
    }
    
    return recipe;
  }

  /**
   * Get mock instructions for a recipe
   */
  private getMockInstructions(id: string): string[] {
    const recipe = this.getMockRecipe(id);
    return recipe.instructions || [];
  }
}

export const recipeService = new RecipeService();
export default recipeService;