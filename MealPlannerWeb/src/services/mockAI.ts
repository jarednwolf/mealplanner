import { Meal, UserProfile } from '../types';
import { MealPlanRequest, MealPlanResponse } from './ai';

// Mock meal database organized by dietary restrictions
const mealDatabase: Record<string, Meal[]> = {
  regular: [
    {
      id: 'meal_1',
      dayOfWeek: 0,
      mealType: 'breakfast',
      recipeName: 'Scrambled Eggs with Toast',
      description: 'Fluffy scrambled eggs with whole wheat toast and fresh fruit',
      prepTime: 10,
      cookTime: 10,
      servings: 4,
      estimatedCost: 8.50,
      recipeId: 'recipe_scrambled_eggs',
      ingredients: [
        { name: 'Eggs', amount: 8, unit: 'large', category: 'dairy', estimatedPrice: 3.00 },
        { name: 'Whole wheat bread', amount: 8, unit: 'slices', category: 'grains', estimatedPrice: 2.50 },
        { name: 'Butter', amount: 2, unit: 'tbsp', category: 'dairy', estimatedPrice: 0.50 },
        { name: 'Mixed berries', amount: 2, unit: 'cups', category: 'produce', estimatedPrice: 2.50 }
      ]
    },
    {
      id: 'meal_2',
      dayOfWeek: 0,
      mealType: 'lunch',
      recipeName: 'Chicken Caesar Salad',
      description: 'Classic Caesar salad with grilled chicken breast',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      estimatedCost: 14.00,
      recipeId: 'recipe_chicken_caesar',
      ingredients: [
        { name: 'Chicken breast', amount: 1.5, unit: 'lbs', category: 'meat', estimatedPrice: 7.00 },
        { name: 'Romaine lettuce', amount: 2, unit: 'heads', category: 'produce', estimatedPrice: 3.00 },
        { name: 'Caesar dressing', amount: 1, unit: 'cup', category: 'condiments', estimatedPrice: 2.00 },
        { name: 'Parmesan cheese', amount: 0.5, unit: 'cup', category: 'dairy', estimatedPrice: 2.00 }
      ]
    },
    {
      id: 'meal_3',
      dayOfWeek: 0,
      mealType: 'dinner',
      recipeName: 'Spaghetti Bolognese',
      description: 'Traditional Italian pasta with meat sauce',
      prepTime: 20,
      cookTime: 40,
      servings: 4,
      estimatedCost: 16.00,
      recipeId: 'recipe_spaghetti_bolognese',
      ingredients: [
        { name: 'Ground beef', amount: 1, unit: 'lb', category: 'meat', estimatedPrice: 6.00 },
        { name: 'Spaghetti', amount: 1, unit: 'lb', category: 'grains', estimatedPrice: 2.00 },
        { name: 'Tomato sauce', amount: 24, unit: 'oz', category: 'canned', estimatedPrice: 3.00 },
        { name: 'Onion', amount: 1, unit: 'large', category: 'produce', estimatedPrice: 1.00 },
        { name: 'Garlic', amount: 4, unit: 'cloves', category: 'produce', estimatedPrice: 0.50 }
      ]
    }
  ],
  vegetarian: [
    {
      id: 'meal_v1',
      dayOfWeek: 0,
      mealType: 'breakfast',
      recipeName: 'Vegetable Omelette',
      description: 'Fluffy omelette with mushrooms, peppers, and cheese',
      prepTime: 10,
      cookTime: 15,
      servings: 4,
      estimatedCost: 9.00,
      recipeId: 'recipe_veg_omelette',
      ingredients: [
        { name: 'Eggs', amount: 8, unit: 'large', category: 'dairy', estimatedPrice: 3.00 },
        { name: 'Bell peppers', amount: 2, unit: 'medium', category: 'produce', estimatedPrice: 2.00 },
        { name: 'Mushrooms', amount: 8, unit: 'oz', category: 'produce', estimatedPrice: 2.50 },
        { name: 'Cheddar cheese', amount: 1, unit: 'cup', category: 'dairy', estimatedPrice: 1.50 }
      ]
    },
    {
      id: 'meal_v2',
      dayOfWeek: 0,
      mealType: 'lunch',
      recipeName: 'Caprese Sandwich',
      description: 'Fresh mozzarella, tomato, and basil on ciabatta',
      prepTime: 10,
      cookTime: 5,
      servings: 4,
      estimatedCost: 12.00,
      recipeId: 'recipe_caprese_sandwich',
      ingredients: [
        { name: 'Fresh mozzarella', amount: 1, unit: 'lb', category: 'dairy', estimatedPrice: 5.00 },
        { name: 'Tomatoes', amount: 3, unit: 'large', category: 'produce', estimatedPrice: 2.50 },
        { name: 'Fresh basil', amount: 1, unit: 'bunch', category: 'produce', estimatedPrice: 2.00 },
        { name: 'Ciabatta bread', amount: 4, unit: 'rolls', category: 'grains', estimatedPrice: 2.50 }
      ]
    },
    {
      id: 'meal_v3',
      dayOfWeek: 0,
      mealType: 'dinner',
      recipeName: 'Mushroom Risotto',
      description: 'Creamy Italian rice with wild mushrooms',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      estimatedCost: 14.00,
      recipeId: 'recipe_mushroom_risotto',
      ingredients: [
        { name: 'Arborio rice', amount: 2, unit: 'cups', category: 'grains', estimatedPrice: 4.00 },
        { name: 'Mixed mushrooms', amount: 1, unit: 'lb', category: 'produce', estimatedPrice: 5.00 },
        { name: 'Vegetable broth', amount: 6, unit: 'cups', category: 'canned', estimatedPrice: 3.00 },
        { name: 'Parmesan cheese', amount: 1, unit: 'cup', category: 'dairy', estimatedPrice: 2.00 }
      ]
    }
  ],
  vegan: [
    {
      id: 'meal_vg1',
      dayOfWeek: 0,
      mealType: 'breakfast',
      recipeName: 'Avocado Toast with Chickpeas',
      description: 'Whole grain toast topped with mashed avocado and spiced chickpeas',
      prepTime: 10,
      cookTime: 5,
      servings: 4,
      estimatedCost: 8.00,
      recipeId: 'recipe_avocado_toast',
      ingredients: [
        { name: 'Avocados', amount: 4, unit: 'medium', category: 'produce', estimatedPrice: 4.00 },
        { name: 'Whole grain bread', amount: 8, unit: 'slices', category: 'grains', estimatedPrice: 2.50 },
        { name: 'Chickpeas', amount: 1, unit: 'can', category: 'canned', estimatedPrice: 1.50 }
      ]
    },
    {
      id: 'meal_vg2',
      dayOfWeek: 0,
      mealType: 'lunch',
      recipeName: 'Buddha Bowl',
      description: 'Quinoa bowl with roasted vegetables and tahini dressing',
      prepTime: 20,
      cookTime: 25,
      servings: 4,
      estimatedCost: 11.00,
      recipeId: 'recipe_buddha_bowl',
      ingredients: [
        { name: 'Quinoa', amount: 2, unit: 'cups', category: 'grains', estimatedPrice: 3.00 },
        { name: 'Sweet potato', amount: 2, unit: 'large', category: 'produce', estimatedPrice: 2.00 },
        { name: 'Broccoli', amount: 1, unit: 'head', category: 'produce', estimatedPrice: 2.50 },
        { name: 'Tahini', amount: 0.5, unit: 'cup', category: 'condiments', estimatedPrice: 3.50 }
      ]
    },
    {
      id: 'meal_vg3',
      dayOfWeek: 0,
      mealType: 'dinner',
      recipeName: 'Thai Red Curry',
      description: 'Spicy coconut curry with tofu and vegetables',
      prepTime: 20,
      cookTime: 25,
      servings: 4,
      estimatedCost: 13.00,
      recipeId: 'recipe_thai_curry',
      ingredients: [
        { name: 'Firm tofu', amount: 1, unit: 'lb', category: 'protein', estimatedPrice: 3.50 },
        { name: 'Coconut milk', amount: 2, unit: 'cans', category: 'canned', estimatedPrice: 4.00 },
        { name: 'Mixed vegetables', amount: 2, unit: 'lbs', category: 'produce', estimatedPrice: 4.00 },
        { name: 'Red curry paste', amount: 3, unit: 'tbsp', category: 'condiments', estimatedPrice: 1.50 }
      ]
    }
  ]
};

class MockAIService {
  /**
   * Generate a mock meal plan
   */
  async generateMealPlan(request: MealPlanRequest): Promise<MealPlanResponse> {
    // Simulate API delay
    await this.delay(1000 + Math.random() * 2000);

    const { userProfile, householdPreferences } = request;
    
    // Determine which meal set to use based on dietary restrictions
    const restrictions = householdPreferences?.allDietaryRestrictions || userProfile.dietaryRestrictions;
    let mealSet = 'regular';
    
    if (restrictions.includes('Vegan')) {
      mealSet = 'vegan';
    } else if (restrictions.includes('Vegetarian')) {
      mealSet = 'vegetarian';
    }
    
    // Get base meals
    const baseMeals = mealDatabase[mealSet] || mealDatabase.regular;
    
    // Generate 7 days of meals (3 meals per day)
    const meals: Meal[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (const mealType of ['breakfast', 'lunch', 'dinner'] as const) {
        const baseMeal = baseMeals.find(m => m.mealType === mealType) || baseMeals[0];
        
        // Create a variation of the base meal
        const meal: Meal = {
          ...baseMeal,
          id: `meal_${Date.now()}_${day}_${mealType}`,
          dayOfWeek: day,
          mealType,
          recipeName: this.generateVariation(baseMeal.recipeName, day),
          estimatedCost: this.adjustCostForBudget(baseMeal.estimatedCost, userProfile.weeklyBudget),
          prepTime: this.adjustTimeForSkillLevel(baseMeal.prepTime, userProfile.cookingSkillLevel),
          cookTime: this.adjustTimeForSkillLevel(baseMeal.cookTime, userProfile.cookingSkillLevel),
        };
        
        meals.push(meal);
      }
    }
    
    // Calculate total cost
    const totalEstimatedCost = meals.reduce((sum, meal) => sum + meal.estimatedCost, 0);
    
    // Determine budget status
    let budgetStatus: 'under' | 'at' | 'over' = 'under';
    if (totalEstimatedCost > userProfile.weeklyBudget * 1.1) {
      budgetStatus = 'over';
    } else if (totalEstimatedCost > userProfile.weeklyBudget * 0.95) {
      budgetStatus = 'at';
    }
    
    return {
      meals,
      totalEstimatedCost,
      budgetStatus
    };
  }

  /**
   * Generate a meal swap suggestion
   */
  async suggestMealSwap(
    originalMeal: Meal,
    userProfile: UserProfile,
    excludeRecipes: string[] = []
  ): Promise<Meal> {
    // Simulate API delay
    await this.delay(500 + Math.random() * 1000);
    
    // Get a different meal of the same type
    const allMeals = Object.values(mealDatabase).flat();
    const alternatives = allMeals.filter(m => 
      m.mealType === originalMeal.mealType && 
      m.recipeName !== originalMeal.recipeName &&
      !excludeRecipes.includes(m.recipeName)
    );
    
    const newMeal = alternatives[Math.floor(Math.random() * alternatives.length)] || originalMeal;
    
    return {
      ...newMeal,
      id: `meal_${Date.now()}_swap`,
      dayOfWeek: originalMeal.dayOfWeek,
      estimatedCost: this.adjustCostForBudget(newMeal.estimatedCost, userProfile.weeklyBudget)
    };
  }

  /**
   * Generate cooking tips
   */
  async generateCookingTips(meal: Meal, userProfile: UserProfile): Promise<string[]> {
    await this.delay(300);
    
    const skillLevel = userProfile.cookingSkillLevel;
    const tips: Record<string, string[]> = {
      beginner: [
        'Prep all ingredients before you start cooking',
        'Read the entire recipe before beginning',
        'Use a timer to avoid overcooking',
        'Taste as you go and adjust seasoning',
        'Clean as you cook to save time later'
      ],
      intermediate: [
        'Try substituting ingredients based on what you have',
        'Experiment with different herbs and spices',
        'Use high heat for searing, medium for sautéing',
        'Let meat rest after cooking for better flavor',
        'Prep vegetables uniformly for even cooking'
      ],
      advanced: [
        'Try making your own pasta or bread from scratch',
        'Experiment with different cooking techniques',
        'Create your own spice blends',
        'Try plating techniques for presentation',
        'Consider wine pairings with your meals'
      ]
    };
    
    return tips[skillLevel] || tips.intermediate;
  }

  private generateVariation(baseName: string, day: number): string {
    const variations: Record<number, string> = {
      0: baseName,
      1: baseName.replace('with', 'and'),
      2: 'Quick ' + baseName,
      3: 'Homemade ' + baseName,
      4: baseName + ' Deluxe',
      5: 'Weekend ' + baseName,
      6: 'Simple ' + baseName
    };
    
    return variations[day] || baseName;
  }

  private adjustCostForBudget(baseCost: number, weeklyBudget: number): number {
    const dailyBudget = weeklyBudget / 7;
    const mealBudget = dailyBudget / 3;
    
    if (baseCost > mealBudget * 1.2) {
      return mealBudget * (0.9 + Math.random() * 0.2);
    }
    
    return baseCost * (0.9 + Math.random() * 0.2);
  }

  private adjustTimeForSkillLevel(baseTime: number, skillLevel: string): number {
    const multipliers: Record<string, number> = {
      beginner: 1.3,
      intermediate: 1.0,
      advanced: 0.8
    };
    
    return Math.round(baseTime * (multipliers[skillLevel] || 1.0));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockAIService = new MockAIService(); 