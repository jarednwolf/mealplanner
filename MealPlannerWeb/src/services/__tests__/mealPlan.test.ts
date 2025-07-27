import { mealPlanService } from '../mealPlan';
import { aiService } from '../ai';
import { MealPlan, Meal, UserProfile } from '../../types';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore');
jest.mock('../../config/firebase', () => ({
  firestore: {},
}));

// Mock AI service
jest.mock('../ai', () => ({
  aiService: {
    generateMealPlan: jest.fn(),
    suggestMealSwap: jest.fn(),
  },
}));

describe('MealPlanService', () => {
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

  const mockMealPlan: MealPlan = {
    id: 'plan_123',
    userId: 'test-user-id',
    weekStartDate: new Date('2023-01-01'),
    meals: [mockMeal],
    totalEstimatedCost: 12.50,
    budgetStatus: 'under',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firestore document reference
    (doc as jest.Mock).mockReturnValue({
      id: 'plan_123',
    });
    
    // Mock Firestore query
    (query as jest.Mock).mockReturnValue({});
    (where as jest.Mock).mockReturnValue({});
    (orderBy as jest.Mock).mockReturnValue({});
    
    // Mock Firestore document snapshot
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...mockMealPlan,
        weekStartDate: Timestamp.fromDate(mockMealPlan.weekStartDate),
        createdAt: Timestamp.fromDate(mockMealPlan.createdAt),
        updatedAt: Timestamp.fromDate(mockMealPlan.updatedAt),
      }),
    });
    
    // Mock Firestore query snapshot
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          data: () => ({
            ...mockMealPlan,
            weekStartDate: Timestamp.fromDate(mockMealPlan.weekStartDate),
            createdAt: Timestamp.fromDate(mockMealPlan.createdAt),
            updatedAt: Timestamp.fromDate(mockMealPlan.updatedAt),
          }),
        },
      ],
      forEach: function(callback: Function) {
        this.docs.forEach(callback);
      },
    });
    
    // Mock AI service responses
    (aiService.generateMealPlan as jest.Mock).mockResolvedValue({
      meals: [mockMeal],
      totalEstimatedCost: 12.50,
      budgetStatus: 'under',
    });
    
    (aiService.suggestMealSwap as jest.Mock).mockResolvedValue({
      ...mockMeal,
      id: 'meal_456',
      recipeName: 'Mushroom Risotto',
    });
  });

  describe('generateWeeklyPlan', () => {
    it('should generate a weekly meal plan', async () => {
      const result = await mealPlanService.generateWeeklyPlan(mockUserProfile);
      
      expect(aiService.generateMealPlan).toHaveBeenCalledWith({
        userProfile: mockUserProfile,
      });
      
      expect(setDoc).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        userId: mockUserProfile.userId,
        meals: [mockMeal],
        totalEstimatedCost: 12.50,
        budgetStatus: 'under',
      }));
    });
    
    it('should include optional parameters in the request', async () => {
      const options = {
        excludeRecipes: ['Spaghetti'],
        pantryItems: ['pasta', 'tomatoes'],
        preferredCuisines: ['Italian'],
        weekStartDate: new Date('2023-01-01'),
      };
      
      await mealPlanService.generateWeeklyPlan(mockUserProfile, options);
      
      expect(aiService.generateMealPlan).toHaveBeenCalledWith({
        userProfile: mockUserProfile,
        ...options,
      });
    });
  });

  describe('swapMeal', () => {
    beforeEach(() => {
      // Mock finding a meal plan by meal ID
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          {
            ref: { id: 'plan_123' },
            data: () => ({
              ...mockMealPlan,
              weekStartDate: Timestamp.fromDate(mockMealPlan.weekStartDate),
              createdAt: Timestamp.fromDate(mockMealPlan.createdAt),
              updatedAt: Timestamp.fromDate(mockMealPlan.updatedAt),
            }),
          },
        ],
        forEach: function(callback: Function) {
          this.docs.forEach(callback);
        },
      });
    });
    
    it('should swap a meal in a meal plan', async () => {
      const result = await mealPlanService.swapMeal('meal_123', mockUserProfile);
      
      expect(aiService.suggestMealSwap).toHaveBeenCalledWith(
        mockMeal,
        mockUserProfile,
        ['Vegetable Pasta']
      );
      
      expect(updateDoc).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        id: 'meal_456',
        recipeName: 'Mushroom Risotto',
      }));
    });
    
    it('should throw an error if meal is not found', async () => {
      // Mock empty query result
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
        forEach: function(callback: Function) {
          this.docs.forEach(callback);
        },
      });
      
      await expect(mealPlanService.swapMeal('nonexistent_meal', mockUserProfile))
        .rejects.toThrow('Meal not found in any meal plan');
    });
  });

  describe('getMealPlan', () => {
    it('should get a meal plan by ID', async () => {
      const result = await mealPlanService.getMealPlan('plan_123');
      
      expect(getDoc).toHaveBeenCalled();
      
      expect(result).toEqual(expect.objectContaining({
        id: 'plan_123',
        userId: 'test-user-id',
        meals: [mockMeal],
      }));
    });
    
    it('should throw an error if meal plan is not found', async () => {
      // Mock non-existent document
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });
      
      await expect(mealPlanService.getMealPlan('nonexistent_plan'))
        .rejects.toThrow('Meal plan with ID nonexistent_plan not found');
    });
  });

  describe('getUserMealPlans', () => {
    it('should get all meal plans for a user', async () => {
      const result = await mealPlanService.getUserMealPlans('test-user-id');
      
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('userId', '==', 'test-user-id');
      expect(orderBy).toHaveBeenCalledWith('weekStartDate', 'desc');
      expect(getDocs).toHaveBeenCalled();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'plan_123',
        userId: 'test-user-id',
      }));
    });
  });

  describe('saveMealPlan', () => {
    it('should save a meal plan to Firestore', async () => {
      const result = await mealPlanService.saveMealPlan(mockMealPlan);
      
      expect(doc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      
      expect(result).toBe('plan_123');
    });
  });

  describe('deleteMealPlan', () => {
    it('should delete a meal plan', async () => {
      await mealPlanService.deleteMealPlan('plan_123');
      
      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});