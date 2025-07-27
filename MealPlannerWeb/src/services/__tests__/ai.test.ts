import { aiService, MealPlanRequest, MealPlanResponse } from '../ai';
import { UserProfile, Meal } from '../../types';

// Mock fetch
global.fetch = jest.fn();

describe('AIService', () => {
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
        category: 'pantry',
        estimatedPrice: 2.50,
      },
      {
        name: 'mixed vegetables',
        amount: 2,
        unit: 'cups',
        category: 'produce',
        estimatedPrice: 4.00,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear the cache before each test
    aiService.clearCache();
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [
          {
            message: {
              content: `
{
  "meals": [
    {
      "dayOfWeek": 1,
      "mealType": "breakfast",
      "recipeName": "Vegetarian Breakfast Burrito",
      "description": "A hearty breakfast burrito filled with scrambled eggs, black beans, and cheese",
      "prepTime": 10,
      "cookTime": 15,
      "servings": 4,
      "estimatedCost": 10.50,
      "ingredients": [
        {
          "name": "eggs",
          "amount": 8,
          "unit": "large",
          "category": "dairy",
          "estimatedPrice": 3.00
        },
        {
          "name": "black beans",
          "amount": 1,
          "unit": "can",
          "category": "pantry",
          "estimatedPrice": 1.00
        }
      ]
    }
  ]
}
              `,
            },
          },
        ],
      }),
    });
  });

  describe('generateMealPlan', () => {
    it('should generate a meal plan based on user profile', async () => {
      const request: MealPlanRequest = {
        userProfile: mockUserProfile,
      };

      const result = await aiService.generateMealPlan(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer '),
          }),
          body: expect.any(String),
        })
      );

      expect(result).toEqual({
        meals: expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            mealType: 'breakfast',
            recipeName: 'Vegetarian Breakfast Burrito',
          }),
        ]),
        totalEstimatedCost: 10.5,
        budgetStatus: 'under',
      });
    });

    it('should use cache for repeated requests', async () => {
      const request: MealPlanRequest = {
        userProfile: mockUserProfile,
      };

      // First call should use the API
      await aiService.generateMealPlan(request);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call with the same request should use cache
      await aiService.generateMealPlan(request);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still just one call
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      });

      const request: MealPlanRequest = {
        userProfile: mockUserProfile,
      };

      await expect(aiService.generateMealPlan(request)).rejects.toThrow(
        'The AI service is currently busy'
      );
    });
  });

  describe('suggestMealSwap', () => {
    beforeEach(() => {
      // Mock meal swap response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: `
{
  "recipeName": "Mushroom Risotto",
  "description": "Creamy Italian rice dish with mushrooms",
  "prepTime": 15,
  "cookTime": 25,
  "estimatedCost": 11.75,
  "ingredients": [
    {
      "name": "arborio rice",
      "amount": 1.5,
      "unit": "cups",
      "category": "pantry",
      "estimatedPrice": 3.50
    },
    {
      "name": "mushrooms",
      "amount": 8,
      "unit": "oz",
      "category": "produce",
      "estimatedPrice": 4.00
    }
  ]
}
                `,
              },
            },
          ],
        }),
      });
    });

    it('should suggest an alternative meal', async () => {
      const result = await aiService.suggestMealSwap(mockMeal, mockUserProfile);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Suggest an alternative'),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          recipeName: 'Mushroom Risotto',
          description: 'Creamy Italian rice dish with mushrooms',
          mealType: 'dinner', // Should preserve the original meal type
          dayOfWeek: 1, // Should preserve the original day
        })
      );
    });
  });

  describe('generateRecipeInstructions', () => {
    beforeEach(() => {
      // Mock recipe instructions response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: `
[
  "Step 1: Bring a large pot of salted water to a boil.",
  "Step 2: Cook pasta according to package instructions until al dente.",
  "Step 3: While pasta is cooking, sauté mixed vegetables in olive oil until tender.",
  "Step 4: Drain pasta and combine with vegetables."
]
                `,
              },
            },
          ],
        }),
      });
    });

    it('should generate recipe instructions', async () => {
      const result = await aiService.generateRecipeInstructions(mockMeal);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('cooking instructions'),
        })
      );

      expect(result).toEqual([
        'Step 1: Bring a large pot of salted water to a boil.',
        'Step 2: Cook pasta according to package instructions until al dente.',
        'Step 3: While pasta is cooking, sauté mixed vegetables in olive oil until tender.',
        'Step 4: Drain pasta and combine with vegetables.',
      ]);
    });
  });

  describe('generateCookingTips', () => {
    beforeEach(() => {
      // Mock cooking tips response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: `
[
  "Tip 1: Prep all vegetables before starting to cook for a smoother workflow.",
  "Tip 2: Salt the pasta water generously for better flavor.",
  "Tip 3: Reserve some pasta water to add to the sauce if it becomes too dry."
]
                `,
              },
            },
          ],
        }),
      });
    });

    it('should generate cooking tips', async () => {
      const result = await aiService.generateCookingTips(mockMeal, mockUserProfile);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('cooking tips'),
        })
      );

      expect(result).toEqual([
        'Tip 1: Prep all vegetables before starting to cook for a smoother workflow.',
        'Tip 2: Salt the pasta water generously for better flavor.',
        'Tip 3: Reserve some pasta water to add to the sauce if it becomes too dry.',
      ]);
    });
  });
});