import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MealPlanScreen from '../MealPlanScreen';
import { useAuth } from '../../contexts/AuthContext';
import { mealPlanService } from '../../services/mealPlan';
import { mealPlanOrchestratorService } from '../../services/mealPlanOrchestrator';
import { UserProfile, MealPlan, Meal } from '../../types';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/mealPlan');
jest.mock('../../services/mealPlanOrchestrator');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('MealPlanScreen', () => {
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
    
    (useAuth as jest.Mock).mockReturnValue({
      userProfile: mockUserProfile,
    });
    
    (mealPlanService.getUserMealPlans as jest.Mock).mockResolvedValue([mockMealPlan]);
    (mealPlanOrchestratorService.generateMealPlan as jest.Mock).mockResolvedValue(mockMealPlan);
    (mealPlanOrchestratorService.swapMeal as jest.Mock).mockResolvedValue({
      ...mockMeal,
      id: 'meal_456',
      recipeName: 'Mushroom Risotto',
    });
  });

  it('should render loading state initially', () => {
    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('Loading meal plan...')).toBeTruthy();
  });

  it('should display meal plan when loaded', async () => {
    const { getByText } = render(<MealPlanScreen />);
    
    await waitFor(() => {
      expect(getByText('Weekly Budget')).toBeTruthy();
      expect(getByText('Vegetable Pasta')).toBeTruthy();
      expect(getByText('Under Budget ✓')).toBeTruthy();
    });
  });

  it('should show empty state when no meal plan exists', async () => {
    (mealPlanService.getUserMealPlans as jest.Mock).mockResolvedValue([]);
    
    const { getByText } = render(<MealPlanScreen />);
    
    await waitFor(() => {
      expect(getByText('No Meal Plan Yet')).toBeTruthy();
      expect(getByText('Generate Meal Plan')).toBeTruthy();
    });
  });

  it('should generate new meal plan when button is pressed', async () => {
    (mealPlanService.getUserMealPlans as jest.Mock).mockResolvedValue([]);
    
    const { getByText } = render(<MealPlanScreen />);
    
    await waitFor(() => {
      expect(getByText('Generate Meal Plan')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Generate Meal Plan'));
    
    await waitFor(() => {
      expect(mealPlanOrchestratorService.generateMealPlan).toHaveBeenCalledWith(
        mockUserProfile,
        expect.objectContaining({
          weekStartDate: expect.any(Date),
        })
      );
    });
  });

  it('should display meal details when meal card is pressed', async () => {
    const { getByText } = render(<MealPlanScreen />);
    
    await waitFor(() => {
      expect(getByText('Vegetable Pasta')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Vegetable Pasta'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Vegetable Pasta',
      expect.stringContaining('A simple vegetable pasta dish')
    );
  });

  it('should handle meal swapping', async () => {
    const { getByText } = render(<MealPlanScreen />);
    
    await waitFor(() => {
      expect(getByText('Vegetable Pasta')).toBeTruthy();
    });
    
    // Find and press the swap button (↻)
    const swapButtons = getByText('↻');
    fireEvent.press(swapButtons);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Swap Meal',
      expect.stringContaining('Would you like to swap "Vegetable Pasta"'),
      expect.any(Array)
    );
  });

  it('should navigate between weeks', async () => {
    const { getByText } = render(<MealPlanScreen />);
    
    await waitFor(() => {
      expect(getByText('Next ›')).toBeTruthy();
      expect(getByText('‹ Previous')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Next ›'));
    
    // Should call getUserMealPlans again with new week
    await waitFor(() => {
      expect(mealPlanService.getUserMealPlans).toHaveBeenCalledTimes(2);
    });
  });

  it('should display budget status correctly', async () => {
    const overBudgetPlan = {
      ...mockMealPlan,
      totalEstimatedCost: 200,
      budgetStatus: 'over' as const,
    };
    
    (mealPlanService.getUserMealPlans as jest.Mock).mockResolvedValue([overBudgetPlan]);
    
    const { getByText } = render(<MealPlanScreen />);
    
    await waitFor(() => {
      expect(getByText('Over Budget')).toBeTruthy();
    });
  });

  it('should handle errors gracefully', async () => {
    (mealPlanService.getUserMealPlans as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );
    
    const { getByText } = render(<MealPlanScreen />);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to load meal plan. Please try again.'
      );
    });
  });

  it('should show loading spinner when user profile is not available', () => {
    (useAuth as jest.Mock).mockReturnValue({
      userProfile: null,
    });
    
    const { getByText } = render(<MealPlanScreen />);
    
    expect(getByText('Loading your profile...')).toBeTruthy();
  });
});