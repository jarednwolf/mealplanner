import { costOptimizerService } from '../costOptimizer';
import { MealPlan, Meal, UserProfile, Ingredient } from '../../types';
import { aiService } from '../ai';

// Mock dependencies
jest.mock('../ai', () => ({
  aiService: {
    suggestMealSwap: jest.fn(),
    generateContent: jest.fn(),
  },
}));

describe('CostOptimizerService', () => {
  const mockUserProfile: UserProfile = {
    userId: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    householdSize: 4,
    weeklyBudget: 100,
    dietaryRestrictions: [],
    cuisinePreferences: ['italian', 'american'],
    cookingSkillLevel: 'intermediate',
    availableCookingTime: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockIngredient: Ingredient = {
    name: 'chicken breast',
    amount: 2,
    unit: 'lbs',
    category: 'meat',
    estimatedPrice: 8.99,
  };

  const mockExpensiveIngredient: Ingredient = {
    name: 'salmon fillet',
    amount: 1.5,
    unit: 'lbs',
    category: 'seafood',
    estimatedPrice: 15.99,
  };

  const mockMeal: Meal = {
    id: 'meal_123',
    recipeId: 'recipe_chicken_pasta',
    dayOfWeek: 1,
    mealType: 'dinner',
    recipeName: 'Chicken Pasta',
    description: 'Delicious chicken pasta dish',
    prepTime: 20,
    cookTime: 25,
    servings: 6,
    estimatedCost: 18.50,
    ingredients: [
      mockIngredient,
      {
        name: 'pasta',
        amount: 1,
        unit: 'lb',
        category: 'pantry',
        estimatedPrice: 2.50,
      },
      {
        name: 'olive oil',
        amount: 3,
        unit: 'tbsp',
        category: 'pantry',
        estimatedPrice: 1.00,
      },
    ],
  };

  const mockExpensiveMeal: Meal = {
    id: 'meal_456',
    recipeId: 'recipe_salmon_dinner',
    dayOfWeek: 2,
    mealType: 'dinner',
    recipeName: 'Grilled Salmon',
    description: 'Premium grilled salmon dinner',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    estimatedCost: 25.99,
    ingredients: [
      mockExpensiveIngredient,
      {
        name: 'asparagus',
        amount: 1,
        unit: 'bunch',
        category: 'produce',
        estimatedPrice: 4.99,
      },
      {
        name: 'lemon',
        amount: 2,
        unit: 'pieces',
        category: 'produce',
        estimatedPrice: 1.50,
      },
    ],
  };

  const mockMealPlan: MealPlan = {
    id: 'plan_123',
    userId: 'test-user-id',
    weekStartDate: new Date('2023-01-01'),
    meals: [mockMeal, mockExpensiveMeal],
    totalEstimatedCost: 44.49,
    budgetStatus: 'under',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockBudgetExceededMealPlan: MealPlan = {
    ...mockMealPlan,
    totalEstimatedCost: 120.00,
    budgetStatus: 'over',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AI service responses
    (aiService.suggestMealSwap as jest.Mock).mockResolvedValue({
      id: 'meal_alt_123',
      recipeId: 'recipe_budget_chicken',
      dayOfWeek: 1,
      mealType: 'dinner',
      recipeName: 'Budget Chicken Stir Fry',
      description: 'Affordable chicken stir fry',
      prepTime: 15,
      cookTime: 15,
      servings: 4,
      estimatedCost: 12.99,
      ingredients: [
        {
          name: 'chicken thighs',
          amount: 1.5,
          unit: 'lbs',
          category: 'meat',
          estimatedPrice: 6.99,
        },
        {
          name: 'mixed vegetables',
          amount: 2,
          unit: 'cups',
          category: 'produce',
          estimatedPrice: 3.99,
        },
      ],
    });

    (aiService.generateContent as jest.Mock).mockResolvedValue(JSON.stringify([
      {
        name: 'chicken thighs',
        estimatedPrice: 6.99,
        description: 'More flavorful and budget-friendly cut',
        confidence: 0.9,
        tips: ['Cook slightly longer than breast meat', 'Great for slow cooking'],
      },
    ]));
  });

  describe('generateOptimizationSuggestions', () => {
    it('should generate ingredient swap suggestions for expensive ingredients', async () => {
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockMealPlan,
        mockUserProfile
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should include ingredient swap suggestions
      const ingredientSwaps = suggestions.filter(s => s.type === 'ingredient_swap');
      expect(ingredientSwaps.length).toBeGreaterThan(0);
      
      // Check that suggestions have required properties
      ingredientSwaps.forEach(suggestion => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('savings');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion.savings).toBeGreaterThan(0);
      });
    });

    it('should generate meal replacement suggestions for expensive meals', async () => {
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockBudgetExceededMealPlan,
        mockUserProfile
      );

      const mealReplacements = suggestions.filter(s => s.type === 'meal_replacement');
      expect(mealReplacements.length).toBeGreaterThan(0);
      
      mealReplacements.forEach(suggestion => {
        expect(suggestion.savings).toBeGreaterThan(2.00);
        expect(suggestion.mealId).toBeDefined();
        expect(suggestion.replacement).toBeDefined();
      });
    });

    it('should generate portion adjustment suggestions for oversized meals', async () => {
      const oversizedMealPlan = {
        ...mockMealPlan,
        meals: [
          {
            ...mockMeal,
            servings: 8, // Much larger than household size of 4
            estimatedCost: 25.00,
          },
        ],
      };

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        oversizedMealPlan,
        mockUserProfile
      );

      const portionAdjustments = suggestions.filter(s => s.type === 'portion_adjustment');
      expect(portionAdjustments.length).toBeGreaterThan(0);
      
      portionAdjustments.forEach(suggestion => {
        expect(suggestion.savings).toBeGreaterThan(0);
        expect(suggestion.difficulty).toBe('easy');
      });
    });

    it('should generate bulk purchase suggestions for frequently used ingredients', async () => {
      const mealPlanWithRepeatedIngredients: MealPlan = {
        ...mockMealPlan,
        meals: [
          mockMeal,
          {
            ...mockMeal,
            id: 'meal_789',
            recipeName: 'Another Chicken Dish',
            ingredients: [
              {
                name: 'chicken breast',
                amount: 1.5,
                unit: 'lbs',
                category: 'meat',
                estimatedPrice: 7.99,
              },
              {
                name: 'olive oil',
                amount: 2,
                unit: 'tbsp',
                category: 'pantry',
                estimatedPrice: 0.75,
              },
            ],
          },
          {
            ...mockMeal,
            id: 'meal_101',
            recipeName: 'Third Chicken Recipe',
            ingredients: [
              {
                name: 'chicken breast',
                amount: 2,
                unit: 'lbs',
                category: 'meat',
                estimatedPrice: 9.99,
              },
            ],
          },
        ],
      };

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mealPlanWithRepeatedIngredients,
        mockUserProfile
      );

      const bulkPurchases = suggestions.filter(s => s.type === 'bulk_purchase');
      expect(bulkPurchases.length).toBeGreaterThan(0);
      
      bulkPurchases.forEach(suggestion => {
        expect(suggestion.savingsPercentage).toBe(15); // Assumed 15% bulk discount
        expect(suggestion.implementation.steps).toContain(
          expect.stringContaining('bulk')
        );
      });
    });

    it('should generate seasonal swap suggestions', async () => {
      // Mock current date to January for seasonal testing
      const originalDate = Date;
      const mockDate = new Date('2023-01-15');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = originalDate.now;

      const mealPlanWithSeasonalIngredients: MealPlan = {
        ...mockMealPlan,
        meals: [
          {
            ...mockMeal,
            ingredients: [
              {
                name: 'tomatoes',
                amount: 4,
                unit: 'pieces',
                category: 'produce',
                estimatedPrice: 6.99,
              },
              {
                name: 'berries',
                amount: 2,
                unit: 'cups',
                category: 'produce',
                estimatedPrice: 8.99,
              },
            ],
          },
        ],
      };

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mealPlanWithSeasonalIngredients,
        mockUserProfile
      );

      const seasonalSwaps = suggestions.filter(s => s.type === 'seasonal_swap');
      expect(seasonalSwaps.length).toBeGreaterThan(0);
      
      seasonalSwaps.forEach(suggestion => {
        expect(suggestion.replacement?.reason).toContain('season');
        expect(suggestion.impact.nutritionChange).toBe('improved');
      });

      // Restore original Date
      global.Date = originalDate;
    });

    it('should filter suggestions by skill level when includeAdvanced is false', async () => {
      const beginnerProfile = {
        ...mockUserProfile,
        cookingSkillLevel: 'beginner' as const,
      };

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockMealPlan,
        beginnerProfile,
        { includeAdvanced: false }
      );

      suggestions.forEach(suggestion => {
        expect(['beginner', 'intermediate']).toContain(suggestion.implementation.skillRequired);
      });
    });

    it('should limit suggestions to maxSuggestions parameter', async () => {
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockMealPlan,
        mockUserProfile,
        { maxSuggestions: 3 }
      );

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should sort suggestions by priority and savings', async () => {
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockBudgetExceededMealPlan,
        mockUserProfile
      );

      if (suggestions.length > 1) {
        for (let i = 0; i < suggestions.length - 1; i++) {
          const current = suggestions[i];
          const next = suggestions[i + 1];
          
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const currentScore = current.savings + (priorityOrder[current.priority] * 0.5);
          const nextScore = next.savings + (priorityOrder[next.priority] * 0.5);
          
          expect(currentScore).toBeGreaterThanOrEqual(nextScore);
        }
      }
    });
  });

  describe('applyOptimizations', () => {
    it('should apply ingredient swap optimizations correctly', async () => {
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockMealPlan,
        mockUserProfile
      );

      const ingredientSwapSuggestion = suggestions.find(s => s.type === 'ingredient_swap');
      
      if (ingredientSwapSuggestion) {
        const result = await costOptimizerService.applyOptimizations(
          mockMealPlan,
          [ingredientSwapSuggestion],
          mockUserProfile
        );

        expect(result.optimizedMealPlan).toBeDefined();
        expect(result.totalSavings).toBeGreaterThan(0);
        expect(result.optimizedCost).toBeLessThan(result.originalCost);
        expect(result.savingsPercentage).toBeGreaterThan(0);
      }
    });

    it('should apply meal replacement optimizations correctly', async () => {
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockBudgetExceededMealPlan,
        mockUserProfile
      );

      const mealReplacementSuggestion = suggestions.find(s => s.type === 'meal_replacement');
      
      if (mealReplacementSuggestion) {
        const result = await costOptimizerService.applyOptimizations(
          mockBudgetExceededMealPlan,
          [mealReplacementSuggestion],
          mockUserProfile
        );

        expect(result.optimizedMealPlan).toBeDefined();
        expect(result.totalSavings).toBeGreaterThan(0);
        expect(aiService.suggestMealSwap).toHaveBeenCalled();
      }
    });

    it('should apply portion adjustment optimizations correctly', async () => {
      const oversizedMealPlan = {
        ...mockMealPlan,
        meals: [
          {
            ...mockMeal,
            servings: 8,
            estimatedCost: 25.00,
          },
        ],
      };

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        oversizedMealPlan,
        mockUserProfile
      );

      const portionAdjustmentSuggestion = suggestions.find(s => s.type === 'portion_adjustment');
      
      if (portionAdjustmentSuggestion) {
        const result = await costOptimizerService.applyOptimizations(
          oversizedMealPlan,
          [portionAdjustmentSuggestion],
          mockUserProfile
        );

        expect(result.optimizedMealPlan).toBeDefined();
        expect(result.optimizedMealPlan.meals[0].servings).toBe(mockUserProfile.householdSize);
        expect(result.totalSavings).toBeGreaterThan(0);
      }
    });

    it('should handle multiple optimizations correctly', async () => {
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockBudgetExceededMealPlan,
        mockUserProfile
      );

      const multipleOptimizations = suggestions.slice(0, 3); // Apply first 3 suggestions
      
      const result = await costOptimizerService.applyOptimizations(
        mockBudgetExceededMealPlan,
        multipleOptimizations,
        mockUserProfile
      );

      expect(result.optimizedMealPlan).toBeDefined();
      expect(result.suggestions).toHaveLength(3);
      expect(result.totalSavings).toBeGreaterThan(0);
      expect(result.optimizedCost).toBeLessThan(result.originalCost);
    });

    it('should handle optimization failures gracefully', async () => {
      // Mock AI service to fail
      (aiService.suggestMealSwap as jest.Mock).mockRejectedValue(new Error('AI service error'));

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockMealPlan,
        mockUserProfile
      );

      const mealReplacementSuggestion = suggestions.find(s => s.type === 'meal_replacement');
      
      if (mealReplacementSuggestion) {
        const result = await costOptimizerService.applyOptimizations(
          mockMealPlan,
          [mealReplacementSuggestion],
          mockUserProfile
        );

        // Should still return a result, even if some optimizations fail
        expect(result).toBeDefined();
        expect(result.optimizedMealPlan).toBeDefined();
      }
    });

    it('should recalculate total cost and budget status correctly', async () => {
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockMealPlan,
        mockUserProfile
      );

      if (suggestions.length > 0) {
        const result = await costOptimizerService.applyOptimizations(
          mockMealPlan,
          suggestions.slice(0, 2),
          mockUserProfile
        );

        expect(result.optimizedMealPlan.totalEstimatedCost).toBe(result.optimizedCost);
        
        // Verify total cost matches sum of meal costs
        const calculatedTotal = result.optimizedMealPlan.meals.reduce(
          (sum, meal) => sum + meal.estimatedCost,
          0
        );
        expect(Math.abs(result.optimizedMealPlan.totalEstimatedCost - calculatedTotal)).toBeLessThan(0.01);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty meal plan gracefully', async () => {
      const emptyMealPlan: MealPlan = {
        ...mockMealPlan,
        meals: [],
        totalEstimatedCost: 0,
      };

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        emptyMealPlan,
        mockUserProfile
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBe(0);
    });

    it('should handle meal plan with no expensive ingredients', async () => {
      const cheapMealPlan: MealPlan = {
        ...mockMealPlan,
        meals: [
          {
            ...mockMeal,
            estimatedCost: 5.99,
            ingredients: [
              {
                name: 'rice',
                amount: 2,
                unit: 'cups',
                category: 'pantry',
                estimatedPrice: 1.99,
              },
              {
                name: 'beans',
                amount: 1,
                unit: 'can',
                category: 'pantry',
                estimatedPrice: 1.50,
              },
            ],
          },
        ],
      };

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        cheapMealPlan,
        mockUserProfile
      );

      // Should have fewer or no ingredient swap suggestions
      const ingredientSwaps = suggestions.filter(s => s.type === 'ingredient_swap');
      expect(ingredientSwaps.length).toBeLessThanOrEqual(1);
    });

    it('should respect dietary restrictions in suggestions', async () => {
      const vegetarianProfile: UserProfile = {
        ...mockUserProfile,
        dietaryRestrictions: ['vegetarian'],
      };

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockMealPlan,
        vegetarianProfile
      );

      // Check that no meat alternatives are suggested for vegetarian users
      suggestions.forEach(suggestion => {
        if (suggestion.replacement) {
          const meatAlternatives = ['ground turkey', 'chicken thighs', 'tilapia', 'canned salmon'];
          expect(meatAlternatives).not.toContain(suggestion.replacement.name.toLowerCase());
        }
      });
    });

    it('should handle AI service failures gracefully', async () => {
      (aiService.generateContent as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));

      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mockMealPlan,
        mockUserProfile
      );

      // Should still return suggestions from predefined substitution map
      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });
});