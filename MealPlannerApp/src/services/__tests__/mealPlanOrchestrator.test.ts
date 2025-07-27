import { mealPlanOrchestratorService } from '../mealPlanOrchestrator';
import { aiService } from '../ai';
import { recipeService } from '../recipe';
import { mealPlanService } from '../mealPlan';
import { UserProfile, Meal } from '../../types';

// Mock services
jest.mock('../ai', () => ({
  aiService: {
    generateMealPlan: jest.fn(),
    generateRecipeInstructions: jest.fn(),
    generateCookingTips: jest.fn(),
  },
}));

jest.mock('../recipe', () => ({
  recipeService: {
    getRecipeById: jest.fn(),
    getRecipeInstructions: jest.fn(),
  },
}));

jest.mock('../mealPlan', () => ({
  mealPlanService: {
    saveMealPlan: jest.fn(),
    swapMeal: jest.fn(),
  },
}));

describe('MealPlanOrchestratorService', () => {
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
    
    // Mock AI service responses
    (aiService.generateMealPlan as jest.Mock).mockResolvedValue({
      meals: [mockMeal],
      totalEstimatedCost: 12.50,
      budgetStatus: 'under',
    });
    
    (aiService.generateRecipeInstructions as jest.Mock).mockResolvedValue([
      'Boil water',
      'Cook pasta',
      'Mix with vegetables',
    ]);
    
    (aiService.generateCookingTips as jest.Mock).mockResolvedValue([
      'Tip 1: Salt the pasta water',
      'Tip 2: Don\'t overcook the pasta',
    ]);
    
    // Mock recipe service responses
    (recipeService.getRecipeById as jest.Mock).mockResolvedValue({
      id: 'vegetable_pasta',
      name: 'Vegetable Pasta',
      description: 'Enhanced description from recipe service',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      difficulty: 'easy',
      cuisine: ['Italian'],
      dietaryTags: ['vegetarian'],
      ingredients: mockMeal.ingredients,
      instructions: [
        'Boil water',
        'Cook pasta',
        'Mix with vegetables',
      ],
    });
    
    (recipeService.getRecipeInstructions as jest.Mock).mockResolvedValue([
      'Boil water',
      'Cook pasta',
      'Mix with vegetables',
    ]);
    
    // Mock meal plan service responses
    (mealPlanService.saveMealPlan as jest.Mock).mockResolvedValue('plan_123');
    
    (mealPlanService.swapMeal as jest.Mock).mockResolvedValue({
      ...mockMeal,
      id: 'meal_456',
      recipeName: 'Mushroom Risotto',
    });
  });

  describe('generateMealPlan', () => {
    it('should orchestrate meal plan generation', async () => {
      const result = await mealPlanOrchestratorService.generateMealPlan(mockUserProfile);
      
      expect(aiService.generateMealPlan).toHaveBeenCalledWith({
        userProfile: mockUserProfile,
        excludeRecipes: [],
        pantryItems: [],
        preferredCuisines: [],
        weekStartDate: expect.any(Date),
      });
      
      expect(recipeService.getRecipeById).toHaveBeenCalled();
      expect(mealPlanService.saveMealPlan).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        userId: mockUserProfile.userId,
        meals: expect.arrayContaining([
          expect.objectContaining({
            id: mockMeal.id,
            recipeName: mockMeal.recipeName,
          }),
        ]),
        totalEstimatedCost: expect.any(Number),
        budgetStatus: expect.stringMatching(/under|at|over/),
      }));
    });
    
    it('should retry generation if over budget', async () => {
      // First response is over budget, second is under budget
      (aiService.generateMealPlan as jest.Mock)
        .mockResolvedValueOnce({
          meals: [mockMeal],
          totalEstimatedCost: 200, // Over budget
          budgetStatus: 'over',
        })
        .mockResolvedValueOnce({
          meals: [mockMeal],
          totalEstimatedCost: 120, // Under budget
          budgetStatus: 'under',
        });
      
      await mealPlanOrchestratorService.generateMealPlan(mockUserProfile);
      
      // Should be called twice - once for initial attempt, once for retry
      expect(aiService.generateMealPlan).toHaveBeenCalledTimes(2);
      
      // Second call should use reduced budget target
      expect(aiService.generateMealPlan).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userProfile: expect.objectContaining({
            weeklyBudget: mockUserProfile.weeklyBudget * 0.9,
          }),
        })
      );
    });
    
    it('should respect pantry items', async () => {
      const pantryItems = [
        { name: 'pasta', quantity: '1 lb', purchaseDate: new Date(), category: 'Pantry' },
        { name: 'tomatoes', quantity: '3', purchaseDate: new Date(), category: 'Produce' },
      ];
      
      await mealPlanOrchestratorService.generateMealPlan(mockUserProfile, { pantryItems });
      
      expect(aiService.generateMealPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          pantryItems: ['pasta', 'tomatoes'],
        })
      );
    });
  });

  describe('swapMeal', () => {
    it('should orchestrate meal swapping', async () => {
      const result = await mealPlanOrchestratorService.swapMeal('meal_123', mockUserProfile);
      
      expect(mealPlanService.swapMeal).toHaveBeenCalledWith('meal_123', mockUserProfile);
      expect(recipeService.getRecipeById).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        id: 'meal_456',
        recipeName: 'Mushroom Risotto',
      }));
    });
  });

  describe('getMealInstructions', () => {
    it('should get instructions from recipe service', async () => {
      const instructions = await mealPlanOrchestratorService.getMealInstructions(mockMeal);
      
      expect(recipeService.getRecipeInstructions).toHaveBeenCalledWith('recipe_vegetable_pasta');
      expect(aiService.generateRecipeInstructions).not.toHaveBeenCalled();
      
      expect(instructions).toEqual([
        'Boil water',
        'Cook pasta',
        'Mix with vegetables',
      ]);
    });
    
    it('should fall back to AI service if recipe service fails', async () => {
      // Make recipe service fail
      (recipeService.getRecipeInstructions as jest.Mock).mockRejectedValue(new Error('Not found'));
      
      const instructions = await mealPlanOrchestratorService.getMealInstructions(mockMeal);
      
      expect(recipeService.getRecipeInstructions).toHaveBeenCalled();
      expect(aiService.generateRecipeInstructions).toHaveBeenCalledWith(mockMeal);
      
      expect(instructions).toEqual([
        'Boil water',
        'Cook pasta',
        'Mix with vegetables',
      ]);
    });
  });

  describe('getMealCookingTips', () => {
    it('should get cooking tips from AI service', async () => {
      const tips = await mealPlanOrchestratorService.getMealCookingTips(mockMeal, mockUserProfile);
      
      expect(aiService.generateCookingTips).toHaveBeenCalledWith(mockMeal, mockUserProfile);
      
      expect(tips).toEqual([
        'Tip 1: Salt the pasta water',
        'Tip 2: Don\'t overcook the pasta',
      ]);
    });
  });
});