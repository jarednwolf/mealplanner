import { MealPlan, Meal, GroceryList, Recipe } from '../types';
import { config } from '../config/env';

export interface InstacartRecipeIngredient {
  name: string;
  display_text: string;
  measurements: Array<{
    quantity: number;
    unit: string;
  }>;
}

export interface InstacartRecipeRequest {
  title: string;
  image_url?: string;
  link_type: 'recipe' | 'shopping_list';
  instructions?: string[];
  ingredients: InstacartRecipeIngredient[];
  landing_page_configuration?: {
    partner_linkback_url?: string;
    enable_pantry_items?: boolean;
    preferred_retailer_key?: string;
  };
}

export interface InstacartRetailer {
  retailer_key: string;
  name: string;
  logo_url: string;
  address: {
    address_line_1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  distance_miles: number;
}

class InstacartService {
  private baseUrl: string;
  private apiKey: string | null;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = config.isDevelopment;
    this.baseUrl = this.isDevelopment 
      ? 'https://connect.dev.instacart.tools' 
      : 'https://connect.instacart.com';
    this.apiKey = import.meta.env.VITE_INSTACART_API_KEY || null;
  }

  /**
   * Check if Instacart integration is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Create a shoppable recipe page from a meal
   */
  async createRecipeFromMeal(meal: Meal, recipe?: Recipe): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Instacart API key not configured');
    }

    const ingredients = this.convertToInstacartIngredients(meal.ingredients);
    
    const request: InstacartRecipeRequest = {
      title: meal.recipeName,
      image_url: recipe?.image,
      link_type: 'recipe',
      instructions: recipe?.instructions || [],
      ingredients,
      landing_page_configuration: {
        partner_linkback_url: window.location.origin,
        enable_pantry_items: true
      }
    };

    const response = await this.makeRequest('/idp/v1/products/recipe', 'POST', request);
    return response.products_link_url;
  }

  /**
   * Create a shopping list from a meal plan
   */
  async createShoppingListFromMealPlan(mealPlan: MealPlan): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Instacart API key not configured');
    }

    // Aggregate all ingredients from the meal plan
    const allIngredients: InstacartRecipeIngredient[] = [];
    const ingredientMap = new Map<string, InstacartRecipeIngredient>();

    mealPlan.meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const key = ingredient.name.toLowerCase();
        
        if (ingredientMap.has(key)) {
          // Add to existing ingredient quantity
          const existing = ingredientMap.get(key)!;
          existing.measurements[0].quantity += ingredient.amount;
        } else {
          // Create new ingredient entry
          const instacartIngredient: InstacartRecipeIngredient = {
            name: ingredient.name,
            display_text: this.formatDisplayText(ingredient.name),
            measurements: [{
              quantity: ingredient.amount,
              unit: ingredient.unit
            }]
          };
          ingredientMap.set(key, instacartIngredient);
        }
      });
    });

    // Convert map to array
    ingredientMap.forEach(ingredient => allIngredients.push(ingredient));

    const request: InstacartRecipeRequest = {
      title: `Weekly Meal Plan - ${new Date(mealPlan.weekStartDate).toLocaleDateString()}`,
      link_type: 'shopping_list',
      ingredients: allIngredients,
      landing_page_configuration: {
        partner_linkback_url: window.location.origin + '/meal-plan',
        enable_pantry_items: true
      }
    };

    const response = await this.makeRequest('/idp/v1/products/recipe', 'POST', request);
    return response.products_link_url;
  }

  /**
   * Create a shopping list from a grocery list
   */
  async createShoppingListFromGroceryList(groceryList: GroceryList): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Instacart API key not configured');
    }

    const ingredients: InstacartRecipeIngredient[] = groceryList.items.map(item => {
      // Parse quantity and unit from the quantity string
      const [amount, ...unitParts] = item.quantity.split(' ');
      const quantity = parseFloat(amount) || 1;
      const unit = unitParts.join(' ') || 'each';

      return {
        name: item.name,
        display_text: this.formatDisplayText(item.name),
        measurements: [{
          quantity,
          unit
        }]
      };
    });

    const request: InstacartRecipeRequest = {
      title: 'Grocery Shopping List',
      link_type: 'shopping_list',
      ingredients,
      landing_page_configuration: {
        partner_linkback_url: window.location.origin + '/grocery-list',
        enable_pantry_items: true
      }
    };

    const response = await this.makeRequest('/idp/v1/products/recipe', 'POST', request);
    return response.products_link_url;
  }

  /**
   * Get nearby retailers for a zip code
   */
  async getNearbyRetailers(zipCode: string, countryCode: string = 'US'): Promise<InstacartRetailer[]> {
    if (!this.isConfigured()) {
      throw new Error('Instacart API key not configured');
    }

    const params = new URLSearchParams({
      postal_code: zipCode,
      country_code: countryCode
    });

    const response = await this.makeRequest(`/idp/v1/retailers?${params}`, 'GET');
    return response.retailers || [];
  }

  /**
   * Add preferred retailer to a recipe/list URL
   */
  addPreferredRetailer(url: string, retailerKey: string): string {
    const urlObj = new URL(url);
    urlObj.searchParams.set('retailer_key', retailerKey);
    return urlObj.toString();
  }

  /**
   * Convert meal ingredients to Instacart format
   */
  private convertToInstacartIngredients(ingredients: any[]): InstacartRecipeIngredient[] {
    return ingredients.map(ingredient => ({
      name: ingredient.name,
      display_text: this.formatDisplayText(ingredient.name),
      measurements: [{
        quantity: ingredient.amount,
        unit: ingredient.unit
      }]
    }));
  }

  /**
   * Format ingredient name for display
   */
  private formatDisplayText(name: string): string {
    // Capitalize first letter of each word
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Make API request to Instacart
   */
  private async makeRequest(
    endpoint: string, 
    method: string, 
    data?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Instacart API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Instacart API request failed:', error);
      throw error;
    }
  }
}

// Mock implementation for development/testing
class MockInstacartService extends InstacartService {
  async createRecipeFromMeal(meal: Meal, recipe?: Recipe): Promise<string> {
    console.log('Mock: Creating Instacart recipe from meal', meal);
    // Return a mock Instacart URL
    return `https://www.instacart.com/store/recipes/mock-${Date.now()}?aff_id=meal_planner`;
  }

  async createShoppingListFromMealPlan(mealPlan: MealPlan): Promise<string> {
    console.log('Mock: Creating Instacart shopping list from meal plan', mealPlan);
    return `https://www.instacart.com/store/shopping-lists/mock-${Date.now()}?aff_id=meal_planner`;
  }

  async createShoppingListFromGroceryList(groceryList: GroceryList): Promise<string> {
    console.log('Mock: Creating Instacart shopping list from grocery list', groceryList);
    return `https://www.instacart.com/store/shopping-lists/mock-${Date.now()}?aff_id=meal_planner`;
  }

  async getNearbyRetailers(zipCode: string): Promise<InstacartRetailer[]> {
    console.log('Mock: Getting nearby retailers for', zipCode);
    return [
      {
        retailer_key: 'whole_foods',
        name: 'Whole Foods Market',
        logo_url: 'https://www.instacart.com/assets/domains/warehouse/logo/5/65f2304b-908e-4cd0-981d-0d4e4effa8de.png',
        address: {
          address_line_1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: zipCode
        },
        distance_miles: 1.2
      },
      {
        retailer_key: 'kroger',
        name: 'Kroger',
        logo_url: 'https://www.instacart.com/assets/domains/warehouse/logo/270/b7fd3a50-65f4-4a5a-ad97-08128bab7f78.png',
        address: {
          address_line_1: '456 Oak Ave',
          city: 'San Francisco',
          state: 'CA',
          postal_code: zipCode
        },
        distance_miles: 2.5
      },
      {
        retailer_key: 'safeway',
        name: 'Safeway',
        logo_url: 'https://www.instacart.com/assets/domains/warehouse/logo/53/c1cc3e30-7ab5-474f-9b75-3c12c0ad29f2.png',
        address: {
          address_line_1: '789 Pine Blvd',
          city: 'San Francisco',
          state: 'CA',
          postal_code: zipCode
        },
        distance_miles: 3.0
      }
    ];
  }
}

// Export the appropriate service based on configuration
export const instacartService = import.meta.env.VITE_USE_MOCK_INSTACART === 'true' 
  ? new MockInstacartService() 
  : new InstacartService(); 