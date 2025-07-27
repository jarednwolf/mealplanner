import { config } from '../config/env';
import { Recipe, RecipeIngredient, NutritionInfo } from '../types';

interface SpoonacularRecipe {
  id: number;
  title: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  image?: string;
  summary?: string;
  dishTypes?: string[];
  diets?: string[];
  cuisines?: string[];
  pricePerServing?: number;
  nutrition?: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  extendedIngredients?: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
    aisle?: string;
  }>;
  analyzedInstructions?: Array<{
    steps: Array<{
      number: number;
      step: string;
    }>;
  }>;
}

interface RecipeSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  maxReadyTime?: number;
  minProtein?: number;
  maxCalories?: number;
  includeIngredients?: string[];
  excludeIngredients?: string[];
  number?: number;
}

class RecipeApiService {
  private baseUrl = 'https://api.spoonacular.com/recipes';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 1000 * 60 * 60; // 1 hour

  private getApiKey(): string {
    return config.spoonacularApiKey;
  }

  private getCacheKey(endpoint: string, params: Record<string, any>): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private async fetchFromApi<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // Add API key to params
    params.apiKey = this.getApiKey();

    // Build URL
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Spoonacular API quota exceeded');
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Recipe API error:', error);
      throw error;
    }
  }

  /**
   * Search for recipes based on various criteria
   */
  async searchRecipes(params: RecipeSearchParams): Promise<Recipe[]> {
    try {
      const searchParams: Record<string, any> = {
        number: params.number || 10,
        addRecipeInformation: true,
        addRecipeNutrition: true,
        fillIngredients: true,
      };

      if (params.query) searchParams.query = params.query;
      if (params.cuisine) searchParams.cuisine = params.cuisine;
      if (params.diet) searchParams.diet = params.diet;
      if (params.maxReadyTime) searchParams.maxReadyTime = params.maxReadyTime;
      if (params.minProtein) searchParams.minProtein = params.minProtein;
      if (params.maxCalories) searchParams.maxCalories = params.maxCalories;
      if (params.includeIngredients?.length) {
        searchParams.includeIngredients = params.includeIngredients.join(',');
      }
      if (params.excludeIngredients?.length) {
        searchParams.excludeIngredients = params.excludeIngredients.join(',');
      }

      const response = await this.fetchFromApi<{ results: SpoonacularRecipe[] }>(
        '/complexSearch',
        searchParams
      );

      return response.results.map(recipe => this.convertToRecipe(recipe));
    } catch (error) {
      console.error('Error searching recipes:', error);
      // Return empty array instead of throwing to allow graceful fallback
      return [];
    }
  }

  /**
   * Get detailed recipe information by ID
   */
  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const recipe = await this.fetchFromApi<SpoonacularRecipe>(
        `/${id}/information`,
        { includeNutrition: true }
      );

      return this.convertToRecipe(recipe);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  }

  /**
   * Get random recipes based on criteria
   */
  async getRandomRecipes(params: {
    number?: number;
    tags?: string[];
  } = {}): Promise<Recipe[]> {
    try {
      const searchParams: Record<string, any> = {
        number: params.number || 5,
      };

      if (params.tags?.length) {
        searchParams.tags = params.tags.join(',');
      }

      const response = await this.fetchFromApi<{ recipes: SpoonacularRecipe[] }>(
        '/random',
        searchParams
      );

      return response.recipes.map(recipe => this.convertToRecipe(recipe));
    } catch (error) {
      console.error('Error getting random recipes:', error);
      return [];
    }
  }

  /**
   * Convert Spoonacular recipe to our Recipe type
   */
  private convertToRecipe(spoonacularRecipe: SpoonacularRecipe): Recipe {
    const { 
      id, 
      title, 
      readyInMinutes = 30, 
      servings = 4,
      summary = '',
      dishTypes = [],
      diets = [],
      cuisines = [],
      pricePerServing = 0,
      image,
      extendedIngredients = [],
      analyzedInstructions = [],
      nutrition
    } = spoonacularRecipe;

    // Extract cooking instructions
    const instructions: string[] = [];
    analyzedInstructions.forEach(instruction => {
      instruction.steps?.forEach(step => {
        instructions.push(step.step);
      });
    });

    // Convert ingredients
    const ingredients: RecipeIngredient[] = extendedIngredients.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: this.mapAisleToCategory(ing.aisle || ''),
      substitutions: [] // Could be enhanced with substitution API
    }));

    // Extract nutrition info
    const nutritionInfo = this.extractNutrition(nutrition);

    // Determine difficulty based on time and steps
    const difficulty = this.calculateDifficulty(readyInMinutes, instructions.length);

    return {
      id: String(id),
      name: title,
      description: this.cleanDescription(summary),
      prepTime: Math.floor(readyInMinutes * 0.3), // Estimate 30% prep time
      cookTime: Math.floor(readyInMinutes * 0.7), // Estimate 70% cook time
      servings,
      difficulty,
      cuisine: cuisines,
      dietaryTags: diets,
      ingredients,
      instructions: instructions.length > 0 ? instructions : ['No instructions available'],
      nutritionInfo,
      costEstimate: pricePerServing * servings / 100, // Convert cents to dollars
      image
    };
  }

  /**
   * Map Spoonacular aisle to our category system
   */
  private mapAisleToCategory(aisle: string): string {
    const aisleMap: Record<string, string> = {
      'produce': 'Produce',
      'meat': 'Meat & Seafood',
      'seafood': 'Meat & Seafood',
      'dairy': 'Dairy & Eggs',
      'cheese': 'Dairy & Eggs',
      'bakery': 'Bakery',
      'bread': 'Bakery',
      'frozen': 'Frozen',
      'canned goods': 'Pantry',
      'pasta and rice': 'Pantry',
      'baking': 'Pantry',
      'spices and seasonings': 'Pantry',
      'beverages': 'Beverages',
      'snacks': 'Snacks'
    };

    const lowerAisle = aisle.toLowerCase();
    for (const [key, value] of Object.entries(aisleMap)) {
      if (lowerAisle.includes(key)) {
        return value;
      }
    }
    
    return 'Other';
  }

  /**
   * Extract nutrition information
   */
  private extractNutrition(nutrition?: SpoonacularRecipe['nutrition']): NutritionInfo {
    const defaultNutrition: NutritionInfo = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0
    };

    if (!nutrition?.nutrients) {
      return defaultNutrition;
    }

    const nutrientMap: Record<string, keyof NutritionInfo> = {
      'calories': 'calories',
      'protein': 'protein',
      'carbohydrates': 'carbs',
      'fat': 'fat',
      'fiber': 'fiber',
      'sugar': 'sugar'
    };

    nutrition.nutrients.forEach(nutrient => {
      const key = nutrientMap[nutrient.name.toLowerCase()];
      if (key) {
        defaultNutrition[key] = Math.round(nutrient.amount);
      }
    });

    return defaultNutrition;
  }

  /**
   * Calculate recipe difficulty
   */
  private calculateDifficulty(time: number, steps: number): 'easy' | 'medium' | 'hard' {
    if (time <= 20 && steps <= 5) return 'easy';
    if (time >= 60 || steps >= 15) return 'hard';
    return 'medium';
  }

  /**
   * Clean HTML from description
   */
  private cleanDescription(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .replace(/&#39;/g, "'") // Replace &#39;
      .trim();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const recipeApiService = new RecipeApiService();
export default recipeApiService; 