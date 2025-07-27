import { budgetService } from '../budget';
import { recipeService } from '../recipe';
import { MealPlan, Meal, UserProfile } from '../../types';

// Mock recipe service
jest.mock('../recipe', () => ({
  recipeService: {
    getIngredientPrices: jest.fn(),
  },
}));

describe('BudgetService', () => {
  const mockUserProfile: UserProfile = {
    userId: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    householdSize: 4,
    dietaryRestrictions: ['vegetarian'],
    cuisinePreferences: ['Italian', 'Mexican'],
    cookingSkillLevel: 'intermediate',
    weeklyBudget: 150,
    cookingTimePreference: {
      weekday: 30,
      weekend: 60,
    },
  };

  const mockMeal: Meal = {
    id: 'meal_123',
    recipeId: 'recipe_vegetable_pasta',
    dayOfWeek: 1,
    mealType: 'dinner',
    recipeName: 'Vegetable Pasta',
    description: 'A simple vegetable pasta dish',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    estimatedCost: 12.50,
    ingredients: [
      {
        name: 'pasta',
        amount: 1,
        unit: 'lb',
        category: 'Pantry',
        estimatedPrice: 2.50,
      },
      {
        name: 'mixed vegetables',
        amount: 2,
        unit: 'cups',
        category: 'Produce',
        estimatedPrice: 4.00,
      },
      {
        name: 'olive oil',
        amount: 2,
        unit: 'tbsp',
        category: 'Pantry',
        estimatedPrice: 1.00,
      },
    ],
  };

  const mockBreakfastMeal: Meal = {
    id: 'meal_456',
    recipeId: 'recipe_scrambled_eggs',
    dayOfWeek: 1,
    mealType: 'breakfast',
    recipeName: 'Scrambled Eggs',
    description: 'Simple scrambled eggs',
    prepTime: 5,
    cookTime: 10,
    servings: 4,
    estimatedCost: 8.00,
    ingredients: [
      {
        name: 'eggs',
        amount: 8,
        unit: 'large',
        category: 'Dairy & Eggs',
        estimatedPrice: 3.00,
      },
      {
        name: 'butter',
        amount: 2,
        unit: 'tbsp',
        category: 'Dairy & Eggs',
        estimatedPrice: 1.50,
      },
    ],
  };

  const mockMealPlan: MealPlan = {
    id: 'plan_123',
    userId: 'test-user-id',
    weekStartDate: new Date('2023-01-01'),
    meals: [mockMeal, mockBreakfastMeal],
    totalEstimatedCost: 20.50,
    budgetStatus: 'under',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    budgetService.clearPriceCache();
    
    (recipeService.getIngredientPrices as jest.Mock).mockResolvedValue({
      pasta: 2.50,
      'mixed vegetables': 4.00,
      'olive oil': 1.00,
      eggs: 3.00,
      butter: 1.50,
    });
  });

  describe('analyzeBudget', () => {
    it('should analyze budget correctly for under-budget meal plan', async () => {
      const analysis = await budgetService.analyzeBudget(mockMealPlan, mockUserProfile);

      expect(analysis.totalCost).toBe(20.50);
      expect(analysis.budgetStatus).toBe('under');
      expect(analysis.budgetPercentage).toBe(14); // 20.50 / 150 * 100 = 13.67, rounded to 14
      expect(analysis.dailyAverage).toBeCloseTo(2.93); // 20.50 / 7
      expect(analysis.costBreakdown.breakfast).toBe(8.00);
      expect(analysis.costBreakdown.dinner).toBe(12.50);
      expect(analysis.costBreakdown.lunch).toBe(0);
    });

    it('should analyze budget correctly for over-budget meal plan', async () => {
      const overBudgetMealPlan = {
        ...mockMealPlan,
        totalEstimatedCost: 200,
        budgetStatus: 'over' as const,
      };

      const analysis = await budgetService.analyzeBudget(overBudgetMealPlan, mockUserProfile);

      expect(analysis.budgetStatus).toBe('over');
      expect(analysis.budgetPercentage).toBe(133); // 200 / 150 * 100
      expect(analysis.savingsOpportunities.length).toBeGreaterThan(0);
    });

    it('should calculate category breakdown correctly', async () => {
      const analysis = await budgetService.analyzeBudget(mockMealPlan, mockUserProfile);

      expect(analysis.categoryBreakdown['Pantry']).toBe(3.50); // pasta + olive oil
      expect(analysis.categoryBreakdown['Produce']).toBe(4.00); // mixed vegetables
      expect(analysis.categoryBreakdown['Dairy & Eggs']).toBe(4.50); // eggs + butter
    });

    it('should identify savings opportunities for over-budget plans', async () => {
      const overBudgetMealPlan = {
        ...mockMealPlan,
        totalEstimatedCost: 200,
        budgetStatus: 'over' as const,
      };

      const analysis = await budgetService.analyzeBudget(overBudgetMealPlan, mockUserProfile);

      expect(analysis.savingsOpportunities.length).toBeGreaterThan(0);
      expect(analysis.savingsOpportunities[0].type).toBe('meal_swap');
      expect(analysis.savingsOpportunities[0].potentialSavings).toBeGreaterThan(0);
    });
  });

  describe('updateIngredientPrices', () => {
    it('should update ingredient prices from external service', async () => {
      const ingredients = mockMeal.ingredients;
      const updatedIngredients = await budgetService.updateIngredientPrices(ingredients);

      expect(recipeService.getIngredientPrices).toHaveBeenCalledWith(['pasta']);
      expect(updatedIngredients[0].estimatedPrice).toBe(2.50);
    });

    it('should use cached prices when available', async () => {
      const ingredients = mockMeal.ingredients;
      
      // First call should fetch from service
      await budgetService.updateIngredientPrices(ingredients);
      expect(recipeService.getIngredientPrices).toHaveBeenCalledTimes(3);

      // Second call should use cache
      await budgetService.updateIngredientPrices(ingredients);
      expect(recipeService.getIngredientPrices).toHaveBeenCalledTimes(3); // No additional calls
    });

    it('should handle price service failures gracefully', async () => {
      (recipeService.getIngredientPrices as jest.Mock).mockRejectedValue(
        new Error('Price service unavailable')
      );

      const ingredients = mockMeal.ingredients;
      const updatedIngredients = await budgetService.updateIngredientPrices(ingredients);

      // Should return original ingredients when service fails
      expect(updatedIngredients).toEqual(ingredients);
    });
  });

  describe('compareIngredientPrices', () => {
    it('should compare ingredient prices and suggest alternatives', async () => {
      const ingredients = mockMeal.ingredients;
      const comparisons = await budgetService.compareIngredientPrices(ingredients);

      expect(comparisons.length).toBe(3);
      expect(comparisons[0]).toHaveProperty('ingredient');
      expect(comparisons[0]).toHaveProperty('currentPrice');
      expect(comparisons[0]).toHaveProperty('averagePrice');
      expect(comparisons[0]).toHaveProperty('isExpensive');
      expect(comparisons[0]).toHaveProperty('alternatives');
    });

    it('should identify expensive ingredients correctly', async () => {
      (recipeService.getIngredientPrices as jest.Mock).mockResolvedValue({
        pasta: 10.00, // Expensive
      });

      const ingredients = [mockMeal.ingredients[0]]; // Just pasta
      const comparisons = await budgetService.compareIngredientPrices(ingredients);

      expect(comparisons[0].isExpensive).toBe(true);
      expect(comparisons[0].currentPrice).toBe(10.00);
    });
  });

  describe('calculateCostPerServing', () => {
    it('should calculate cost per serving correctly', () => {
      const costPerServing = budgetService.calculateCostPerServing(mockMeal);
      expect(costPerServing).toBe(3.125); // 12.50 / 4
    });
  });

  describe('calculateWeeklyCostProjection', () => {
    it('should calculate weekly cost projection based on completed days', () => {
      const meals = mockMealPlan.meals;
      const projection = budgetService.calculateWeeklyCostProjection(meals, 2);
      
      // Both meals are on day 1, so completed cost is 20.50
      // Projection: (20.50 / 2) * 7 = 71.75
      expect(projection).toBeCloseTo(71.75);
    });

    it('should return 0 for 0 completed days', () => {
      const meals = mockMealPlan.meals;
      const projection = budgetService.calculateWeeklyCostProjection(meals, 0);
      expect(projection).toBe(0);
    });
  });

  describe('getBudgetRecommendations', () => {
    it('should provide recommendations for over-budget meal plans', () => {
      const overBudgetMealPlan = {
        ...mockMealPlan,
        totalEstimatedCost: 200,
        budgetStatus: 'over' as const,
      };

      const recommendations = budgetService.getBudgetRecommendations(
        overBudgetMealPlan, 
        mockUserProfile
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('over budget');
    });

    it('should provide recommendations for under-budget meal plans', () => {
      const recommendations = budgetService.getBudgetRecommendations(
        mockMealPlan, 
        mockUserProfile
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('under budget');
    });

    it('should provide skill-level specific recommendations', () => {
      const beginnerProfile = {
        ...mockUserProfile,
        cookingSkillLevel: 'beginner' as const,
      };

      const recommendations = budgetService.getBudgetRecommendations(
        mockMealPlan, 
        beginnerProfile
      );

      expect(recommendations.some(rec => rec.includes('Simple ingredients'))).toBe(true);
    });

    it('should provide advanced cook recommendations', () => {
      const advancedProfile = {
        ...mockUserProfile,
        cookingSkillLevel: 'advanced' as const,
      };

      const recommendations = budgetService.getBudgetRecommendations(
        mockMealPlan, 
        advancedProfile
      );

      expect(recommendations.some(rec => rec.includes('whole ingredients'))).toBe(true);
    });
  });

  describe('price caching', () => {
    it('should cache prices correctly', async () => {
      const ingredients = [mockMeal.ingredients[0]]; // Just pasta
      
      // First call
      await budgetService.updateIngredientPrices(ingredients);
      expect(recipeService.getIngredientPrices).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await budgetService.updateIngredientPrices(ingredients);
      expect(recipeService.getIngredientPrices).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', async () => {
      const ingredients = [mockMeal.ingredients[0]];
      
      // First call
      await budgetService.updateIngredientPrices(ingredients);
      expect(recipeService.getIngredientPrices).toHaveBeenCalledTimes(1);

      // Clear cache
      budgetService.clearPriceCache();

      // Next call should fetch from service again
      await budgetService.updateIngredientPrices(ingredients);
      expect(recipeService.getIngredientPrices).toHaveBeenCalledTimes(2);
    });
  });
});