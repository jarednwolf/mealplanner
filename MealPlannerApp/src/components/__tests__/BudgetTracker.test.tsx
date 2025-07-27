import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BudgetTracker } from '../BudgetTracker';
import { budgetService } from '../../services/budget';
import { MealPlan, UserProfile } from '../../types';

// Mock budget service
jest.mock('../../services/budget', () => ({
  budgetService: {
    analyzeBudget: jest.fn(),
    getBudgetRecommendations: jest.fn(),
  },
}));

describe('BudgetTracker', () => {
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

  const mockMealPlan: MealPlan = {
    id: 'plan_123',
    userId: 'test-user-id',
    weekStartDate: new Date('2023-01-01'),
    meals: [],
    totalEstimatedCost: 120,
    budgetStatus: 'under',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockBudgetAnalysis = {
    totalCost: 120,
    budgetStatus: 'under' as const,
    budgetPercentage: 80,
    dailyAverage: 17.14,
    costBreakdown: {
      breakfast: 30,
      lunch: 40,
      dinner: 50,
    },
    categoryBreakdown: {
      'Produce': 40,
      'Meat & Seafood': 35,
      'Pantry': 25,
      'Dairy & Eggs': 20,
    },
    savingsOpportunities: [
      {
        type: 'ingredient_substitution' as const,
        description: 'Chicken breast is expensive - consider alternatives',
        potentialSavings: 5.00,
        ingredientName: 'chicken breast',
        suggestion: 'Try chicken thighs - they\'re more flavorful and cost 30% less',
      },
      {
        type: 'meal_swap' as const,
        description: 'Replace expensive meals with budget-friendly alternatives',
        potentialSavings: 8.00,
        suggestion: 'Consider swapping your most expensive meals for similar but cheaper options',
      },
    ],
  };

  const mockOnSavingsOpportunityPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (budgetService.analyzeBudget as jest.Mock).mockResolvedValue(mockBudgetAnalysis);
    (budgetService.getBudgetRecommendations as jest.Mock).mockReturnValue([
      'Great job staying under budget! You have room for premium ingredients.',
      'Consider adding more variety or organic options within your budget.',
    ]);
  });

  it('should render budget progress correctly', async () => {
    const { getByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(getByText('Budget Usage')).toBeTruthy();
      expect(getByText('80%')).toBeTruthy();
      expect(getByText('$120.00 of $150.00')).toBeTruthy();
      expect(getByText('Under Budget')).toBeTruthy();
    });
  });

  it('should show loading state initially', () => {
    const { getByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    expect(getByText('Analyzing budget...')).toBeTruthy();
  });

  it('should call budget analysis service on mount', async () => {
    render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(budgetService.analyzeBudget).toHaveBeenCalledWith(mockMealPlan, mockUserProfile);
    });
  });

  it('should toggle details visibility', async () => {
    const { getByText, queryByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(getByText('Show Details')).toBeTruthy();
    });

    // Details should not be visible initially
    expect(queryByText('Cost Breakdown')).toBeNull();

    // Press show details
    fireEvent.press(getByText('Show Details'));

    // Details should now be visible
    expect(getByText('Cost Breakdown')).toBeTruthy();
    expect(getByText('Hide Details')).toBeTruthy();
  });

  it('should display cost breakdown when details are shown', async () => {
    const { getByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(getByText('Show Details')).toBeTruthy();
    });

    // Show details
    fireEvent.press(getByText('Show Details'));

    // Check meal type breakdown
    expect(getByText('By Meal Type')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('$30.00')).toBeTruthy();
    expect(getByText('Lunch')).toBeTruthy();
    expect(getByText('$40.00')).toBeTruthy();
    expect(getByText('Dinner')).toBeTruthy();
    expect(getByText('$50.00')).toBeTruthy();

    // Check category breakdown
    expect(getByText('By Category')).toBeTruthy();
    expect(getByText('Produce')).toBeTruthy();
    expect(getByText('Meat & Seafood')).toBeTruthy();

    // Check daily average
    expect(getByText('Daily Average')).toBeTruthy();
    expect(getByText('$17.14')).toBeTruthy();
  });

  it('should display savings opportunities', async () => {
    const { getByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(getByText('Savings Opportunities')).toBeTruthy();
      expect(getByText('🔄 Ingredient Swap')).toBeTruthy();
      expect(getByText('Save $5.00')).toBeTruthy();
      expect(getByText('Chicken breast is expensive - consider alternatives')).toBeTruthy();
      
      expect(getByText('🍽️ Meal Replacement')).toBeTruthy();
      expect(getByText('Save $8.00')).toBeTruthy();
      expect(getByText('Replace expensive meals with budget-friendly alternatives')).toBeTruthy();
    });
  });

  it('should call onSavingsOpportunityPress when savings item is pressed', async () => {
    const { getByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(getByText('Savings Opportunities')).toBeTruthy();
    });

    // Find and press a savings opportunity
    const savingsItem = getByText('Chicken breast is expensive - consider alternatives');
    fireEvent.press(savingsItem.parent?.parent || savingsItem);

    expect(mockOnSavingsOpportunityPress).toHaveBeenCalledWith(
      mockBudgetAnalysis.savingsOpportunities[0]
    );
  });

  it('should display budget recommendations', async () => {
    const { getByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(getByText('Budget Tips')).toBeTruthy();
      expect(getByText('Great job staying under budget! You have room for premium ingredients.')).toBeTruthy();
      expect(getByText('Consider adding more variety or organic options within your budget.')).toBeTruthy();
    });
  });

  it('should handle over-budget status correctly', async () => {
    const overBudgetAnalysis = {
      ...mockBudgetAnalysis,
      budgetStatus: 'over' as const,
      budgetPercentage: 120,
      totalCost: 180,
    };

    (budgetService.analyzeBudget as jest.Mock).mockResolvedValue(overBudgetAnalysis);

    const { getByText } = render(
      <BudgetTracker
        mealPlan={{ ...mockMealPlan, totalEstimatedCost: 180, budgetStatus: 'over' }}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(getByText('120%')).toBeTruthy();
      expect(getByText('Over Budget')).toBeTruthy();
    });
  });

  it('should handle at-budget status correctly', async () => {
    const atBudgetAnalysis = {
      ...mockBudgetAnalysis,
      budgetStatus: 'at' as const,
      budgetPercentage: 100,
      totalCost: 150,
    };

    (budgetService.analyzeBudget as jest.Mock).mockResolvedValue(atBudgetAnalysis);

    const { getByText } = render(
      <BudgetTracker
        mealPlan={{ ...mockMealPlan, totalEstimatedCost: 150, budgetStatus: 'at' }}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(getByText('100%')).toBeTruthy();
      expect(getByText('At Budget')).toBeTruthy();
    });
  });

  it('should handle empty savings opportunities', async () => {
    const noSavingsAnalysis = {
      ...mockBudgetAnalysis,
      savingsOpportunities: [],
    };

    (budgetService.analyzeBudget as jest.Mock).mockResolvedValue(noSavingsAnalysis);

    const { queryByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    await waitFor(() => {
      expect(queryByText('Savings Opportunities')).toBeNull();
    });
  });

  it('should handle budget analysis errors gracefully', async () => {
    (budgetService.analyzeBudget as jest.Mock).mockRejectedValue(
      new Error('Budget analysis failed')
    );

    const { getByText } = render(
      <BudgetTracker
        mealPlan={mockMealPlan}
        userProfile={mockUserProfile}
        onSavingsOpportunityPress={mockOnSavingsOpportunityPress}
      />
    );

    // Should show loading initially
    expect(getByText('Analyzing budget...')).toBeTruthy();

    // After error, should not crash and should stop loading
    await waitFor(() => {
      expect(getByText('Show Details')).toBeTruthy();
    }, { timeout: 3000 });
  });
});