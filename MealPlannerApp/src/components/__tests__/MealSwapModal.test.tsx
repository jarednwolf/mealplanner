import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { MealSwapModal } from '../MealSwapModal';
import { mealPlanOrchestratorService } from '../../services/mealPlanOrchestrator';
import { recipeService } from '../../services/recipe';
import { UserProfile, Meal } from '../../types';

// Mock dependencies
jest.mock('../../services/mealPlanOrchestrator');
jest.mock('../../services/recipe');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('MealSwapModal', () => {
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

  const mockOriginalMeal: Meal = {
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

  const mockSwapMeal: Meal = {
    id: 'meal_456',
    recipeId: 'recipe_mushroom_risotto',
    dayOfWeek: 1,
    mealType: 'dinner',
    recipeName: 'Mushroom Risotto',
    description: 'Creamy Italian rice dish with mushrooms',
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    estimatedCost: 11.75,
    ingredients: [
      {
        name: 'arborio rice',
        amount: 1.5,
        unit: 'cups',
        category: 'pantry',
        estimatedPrice: 3.50,
      },
    ],
  };

  const mockOnClose = jest.fn();
  const mockOnMealSwapped = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (mealPlanOrchestratorService.swapMeal as jest.Mock).mockResolvedValue(mockSwapMeal);
    (recipeService.searchRecipes as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Search Result Recipe',
        description: 'A recipe from search',
        prepTime: 20,
        cookTime: 15,
        servings: 4,
        costEstimate: 10.00,
        ingredients: [
          {
            name: 'ingredient',
            amount: 1,
            unit: 'cup',
            category: 'produce',
            estimatedPrice: 2.00,
          },
        ],
      },
    ]);
  });

  it('should render modal when visible', () => {
    const { getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    expect(getByText('Swap Meal')).toBeTruthy();
    expect(getByText('Replacing:')).toBeTruthy();
    expect(getByText('Vegetable Pasta')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <MealSwapModal
        visible={false}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    expect(queryByText('Swap Meal')).toBeNull();
  });

  it('should call onClose when close button is pressed', () => {
    const { getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    fireEvent.press(getByText('✕'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should generate swap options when modal opens', async () => {
    render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    await waitFor(() => {
      expect(mealPlanOrchestratorService.swapMeal).toHaveBeenCalledWith(
        mockOriginalMeal.id,
        mockUserProfile,
        expect.objectContaining({
          preferredCuisines: mockUserProfile.cuisinePreferences,
        })
      );
    });
  });

  it('should display alternative meals', async () => {
    const { getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    await waitFor(() => {
      expect(getByText('Alternative Meals')).toBeTruthy();
      expect(getByText('Mushroom Risotto')).toBeTruthy();
      expect(getByText('Similar cuisine and cost')).toBeTruthy();
    });
  });

  it('should show confirmation dialog when swapping meal', async () => {
    const { getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    await waitFor(() => {
      expect(getByText('Mushroom Risotto')).toBeTruthy();
    });

    // Find and press the swap button for the meal option
    const swapButtons = getByText('Swap');
    fireEvent.press(swapButtons);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirm Swap',
      'Replace "Vegetable Pasta" with "Mushroom Risotto"?',
      expect.any(Array)
    );
  });

  it('should handle search functionality', async () => {
    const { getByPlaceholderText, getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    const searchInput = getByPlaceholderText('Search for specific recipes...');
    fireEvent.changeText(searchInput, 'chicken');
    fireEvent.press(getByText('🔍'));

    await waitFor(() => {
      expect(recipeService.searchRecipes).toHaveBeenCalledWith({
        query: 'chicken',
        diet: mockUserProfile.dietaryRestrictions,
        maxReadyTime: mockUserProfile.cookingTimePreference.weekday,
        number: 3,
      });
    });
  });

  it('should toggle filters visibility', () => {
    const { getByText, queryByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    // Filters should not be visible initially
    expect(queryByText('Filter Options')).toBeNull();

    // Press filters button
    fireEvent.press(getByText('Filters'));

    // Filters should now be visible
    expect(getByText('Filter Options')).toBeTruthy();
    expect(getByText('Max Cost')).toBeTruthy();
    expect(getByText('Max Prep Time (minutes)')).toBeTruthy();
    expect(getByText('Preferred Cuisines')).toBeTruthy();
  });

  it('should handle cuisine filter selection', () => {
    const { getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    // Open filters
    fireEvent.press(getByText('Filters'));

    // Select Italian cuisine
    const italianFilter = getByText('Italian');
    fireEvent.press(italianFilter);

    // Apply filters
    fireEvent.press(getByText('Apply Filters'));

    // Should regenerate options with filters applied
    expect(mealPlanOrchestratorService.swapMeal).toHaveBeenCalled();
  });

  it('should display cost comparison correctly', async () => {
    const { getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    await waitFor(() => {
      // Should show savings since mockSwapMeal costs less than original
      expect(getByText('Save $0.75')).toBeTruthy();
    });
  });

  it('should handle loading state', () => {
    const { getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    // Should show loading initially
    expect(getByText('Finding alternatives...')).toBeTruthy();
  });

  it('should handle empty results', async () => {
    (mealPlanOrchestratorService.swapMeal as jest.Mock).mockRejectedValue(
      new Error('No alternatives found')
    );

    const { getByText } = render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    await waitFor(() => {
      expect(getByText('No alternatives found')).toBeTruthy();
      expect(getByText('Try adjusting your filters or search for something specific')).toBeTruthy();
    });
  });

  it('should handle errors gracefully', async () => {
    (mealPlanOrchestratorService.swapMeal as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <MealSwapModal
        visible={true}
        onClose={mockOnClose}
        originalMeal={mockOriginalMeal}
        userProfile={mockUserProfile}
        onMealSwapped={mockOnMealSwapped}
      />
    );

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to generate meal alternatives. Please try again.'
      );
    });
  });
});