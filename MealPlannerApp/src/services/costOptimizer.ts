import { MealPlan, Meal, Ingredient, UserProfile } from '../types';
import { aiService } from './ai';
import { recipeService } from './recipe';
import { budgetService } from './budget';

export interface CostOptimizationSuggestion {
  id: string;
  type: 'ingredient_swap' | 'meal_replacement' | 'portion_adjustment' | 'bulk_purchase' | 'seasonal_swap';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  mealId?: string;
  ingredientName?: string;
  replacement?: {
    name: string;
    reason: string;
    nutritionalImpact: 'none' | 'minimal' | 'moderate';
  };
  implementation: {
    steps: string[];
    timeRequired: number; // minutes
    skillRequired: 'beginner' | 'intermediate' | 'advanced';
  };
  impact: {
    tasteChange: 'none' | 'minimal' | 'noticeable' | 'significant';
    nutritionChange: 'improved' | 'same' | 'slightly_reduced' | 'reduced';
    cookingTimeChange: number; // minutes difference
  };
}

export interface OptimizationResult {
  originalCost: number;
  optimizedCost: number;
  totalSavings: number;
  savingsPercentage: number;
  suggestions: CostOptimizationSuggestion[];
  optimizedMealPlan?: MealPlan;
}

class CostOptimizerService {
  /**
   * Analyze meal plan and generate cost-saving suggestions
   */
  async generateOptimizationSuggestions(
    mealPlan: MealPlan,
    userProfile: UserProfile,
    options: {
      maxSuggestions?: number;
      priorityThreshold?: 'high' | 'medium' | 'low';
      includeAdvanced?: boolean;
    } = {}
  ): Promise<CostOptimizationSuggestion[]> {
    const {
      maxSuggestions = 10,
      priorityThreshold = 'low',
      includeAdvanced = true,
    } = options;

    const suggestions: CostOptimizationSuggestion[] = [];

    // Generate different types of suggestions
    const ingredientSuggestions = await this.generateIngredientSwapSuggestions(mealPlan, userProfile);
    const mealReplacementSuggestions = await this.generateMealReplacementSuggestions(mealPlan, userProfile);
    const portionSuggestions = this.generatePortionAdjustmentSuggestions(mealPlan, userProfile);
    const bulkPurchaseSuggestions = this.generateBulkPurchaseSuggestions(mealPlan);
    const seasonalSuggestions = await this.generateSeasonalSwapSuggestions(mealPlan);

    suggestions.push(
      ...ingredientSuggestions,
      ...mealReplacementSuggestions,
      ...portionSuggestions,
      ...bulkPurchaseSuggestions,
      ...seasonalSuggestions
    );

    // Filter by skill level if needed
    const filteredSuggestions = includeAdvanced 
      ? suggestions 
      : suggestions.filter(s => s.implementation.skillRequired !== 'advanced' || userProfile.cookingSkillLevel === 'advanced');

    // Sort by priority and savings
    const sortedSuggestions = filteredSuggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.savings - a.savings;
      })
      .slice(0, maxSuggestions);

    return sortedSuggestions;
  }

  /**
   * Apply optimization suggestions to create an optimized meal plan
   */
  async applyOptimizations(
    mealPlan: MealPlan,
    suggestions: CostOptimizationSuggestion[],
    userProfile: UserProfile
  ): Promise<OptimizationResult> {
    let optimizedMealPlan = { ...mealPlan };
    let totalSavings = 0;

    for (const suggestion of suggestions) {
      try {
        const result = await this.applySingleOptimization(optimizedMealPlan, suggestion, userProfile);
        optimizedMealPlan = result.mealPlan;
        totalSavings += result.savings;
      } catch (error) {
        console.log(`Failed to apply optimization: ${suggestion.title}`);
      }
    }

    // Recalculate total cost
    const optimizedCost = optimizedMealPlan.meals.reduce((sum, meal) => sum + meal.estimatedCost, 0);
    const savingsPercentage = ((mealPlan.totalEstimatedCost - optimizedCost) / mealPlan.totalEstimatedCost) * 100;

    return {
      originalCost: mealPlan.totalEstimatedCost,
      optimizedCost,
      totalSavings,
      savingsPercentage,
      suggestions,
      optimizedMealPlan,
    };
  }

  /**
   * Generate ingredient swap suggestions
   */
  private async generateIngredientSwapSuggestions(
    mealPlan: MealPlan,
    userProfile: UserProfile
  ): Promise<CostOptimizationSuggestion[]> {
    const suggestions: CostOptimizationSuggestion[] = [];
    const expensiveIngredients = this.findExpensiveIngredients(mealPlan);

    for (const { ingredient, meal } of expensiveIngredients.slice(0, 5)) {
      const alternatives = await this.findIngredientAlternatives(ingredient, userProfile);
      
      for (const alternative of alternatives.slice(0, 2)) {
        const savings = ingredient.estimatedPrice - alternative.price;
        if (savings > 1.00) { // Only suggest if savings > $1
          suggestions.push({
            id: `ingredient_${ingredient.name}_${alternative.name}`,
            type: 'ingredient_swap',
            priority: savings > 3 ? 'high' : savings > 1.5 ? 'medium' : 'low',
            title: `Replace ${ingredient.name} with ${alternative.name}`,
            description: `Save money by using ${alternative.name} instead of ${ingredient.name} in ${meal.recipeName}`,
            currentCost: ingredient.estimatedPrice,
            optimizedCost: alternative.price,
            savings,
            savingsPercentage: (savings / ingredient.estimatedPrice) * 100,
            difficulty: this.getSwapDifficulty(ingredient.name, alternative.name),
            mealId: meal.id,
            ingredientName: ingredient.name,
            replacement: {
              name: alternative.name,
              reason: alternative.reason,
              nutritionalImpact: alternative.nutritionalImpact,
            },
            implementation: {
              steps: [
                `Remove ${ingredient.name} from your shopping list`,
                `Add ${alternative.name} to your shopping list`,
                `Use ${alternative.name} in the same quantity as ${ingredient.name}`,
                alternative.cookingTip || `Cook ${alternative.name} the same way as ${ingredient.name}`,
              ],
              timeRequired: 0,
              skillRequired: 'beginner',
            },
            impact: {
              tasteChange: alternative.tasteImpact,
              nutritionChange: alternative.nutritionalImpact === 'none' ? 'same' : 'slightly_reduced',
              cookingTimeChange: 0,
            },
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate meal replacement suggestions
   */
  private async generateMealReplacementSuggestions(
    mealPlan: MealPlan,
    userProfile: UserProfile
  ): Promise<CostOptimizationSuggestion[]> {
    const suggestions: CostOptimizationSuggestion[] = [];
    const expensiveMeals = mealPlan.meals
      .filter(meal => meal.estimatedCost > userProfile.weeklyBudget / 21 * 1.5) // 50% above average
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
      .slice(0, 3);

    for (const meal of expensiveMeals) {
      try {
        // Generate a budget-friendly alternative
        const alternativeMeal = await aiService.suggestMealSwap(meal, userProfile, [meal.recipeName]);
        const savings = meal.estimatedCost - alternativeMeal.estimatedCost;

        if (savings > 2.00) {
          suggestions.push({
            id: `meal_${meal.id}_replacement`,
            type: 'meal_replacement',
            priority: savings > 8 ? 'high' : savings > 4 ? 'medium' : 'low',
            title: `Replace ${meal.recipeName} with ${alternativeMeal.recipeName}`,
            description: `Switch to a more budget-friendly ${meal.mealType} option`,
            currentCost: meal.estimatedCost,
            optimizedCost: alternativeMeal.estimatedCost,
            savings,
            savingsPercentage: (savings / meal.estimatedCost) * 100,
            difficulty: 'easy',
            mealId: meal.id,
            replacement: {
              name: alternativeMeal.recipeName,
              reason: 'More budget-friendly option with similar nutrition',
              nutritionalImpact: 'minimal',
            },
            implementation: {
              steps: [
                `Remove ingredients for ${meal.recipeName} from shopping list`,
                `Add ingredients for ${alternativeMeal.recipeName}`,
                `Follow the new recipe for ${alternativeMeal.recipeName}`,
              ],
              timeRequired: Math.abs(alternativeMeal.prepTime + alternativeMeal.cookTime - meal.prepTime - meal.cookTime),
              skillRequired: userProfile.cookingSkillLevel,
            },
            impact: {
              tasteChange: 'noticeable',
              nutritionChange: 'same',
              cookingTimeChange: (alternativeMeal.prepTime + alternativeMeal.cookTime) - (meal.prepTime + meal.cookTime),
            },
          });
        }
      } catch (error) {
        console.log(`Failed to generate alternative for ${meal.recipeName}`);
      }
    }

    return suggestions;
  }

  /**
   * Generate portion adjustment suggestions
   */
  private generatePortionAdjustmentSuggestions(
    mealPlan: MealPlan,
    userProfile: UserProfile
  ): CostOptimizationSuggestion[] {
    const suggestions: CostOptimizationSuggestion[] = [];
    
    const oversizedMeals = mealPlan.meals.filter(meal => 
      meal.servings > userProfile.householdSize && meal.estimatedCost > 10
    );

    for (const meal of oversizedMeals) {
      const optimalServings = userProfile.householdSize;
      const reductionRatio = optimalServings / meal.servings;
      const optimizedCost = meal.estimatedCost * reductionRatio;
      const savings = meal.estimatedCost - optimizedCost;

      if (savings > 2.00) {
        suggestions.push({
          id: `portion_${meal.id}`,
          type: 'portion_adjustment',
          priority: savings > 5 ? 'medium' : 'low',
          title: `Reduce ${meal.recipeName} portion size`,
          description: `Adjust serving size from ${meal.servings} to ${optimalServings} people`,
          currentCost: meal.estimatedCost,
          optimizedCost,
          savings,
          savingsPercentage: (savings / meal.estimatedCost) * 100,
          difficulty: 'easy',
          mealId: meal.id,
          implementation: {
            steps: [
              `Reduce all ingredient quantities by ${Math.round((1 - reductionRatio) * 100)}%`,
              `Adjust cooking times if necessary`,
              `Store recipe with new serving size`,
            ],
            timeRequired: 5,
            skillRequired: 'beginner',
          },
          impact: {
            tasteChange: 'none',
            nutritionChange: 'same',
            cookingTimeChange: -5,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate bulk purchase suggestions
   */
  private generateBulkPurchaseSuggestions(mealPlan: MealPlan): CostOptimizationSuggestion[] {
    const suggestions: CostOptimizationSuggestion[] = [];
    const ingredientUsage = this.calculateIngredientUsage(mealPlan);

    // Find ingredients used multiple times that could benefit from bulk purchase
    const bulkCandidates = Object.entries(ingredientUsage)
      .filter(([, usage]) => usage.totalQuantity > 2 && usage.totalCost > 8)
      .sort(([, a], [, b]) => b.totalCost - a.totalCost)
      .slice(0, 3);

    for (const [ingredientName, usage] of bulkCandidates) {
      const bulkSavings = usage.totalCost * 0.15; // Assume 15% bulk discount
      
      if (bulkSavings > 2.00) {
        suggestions.push({
          id: `bulk_${ingredientName}`,
          type: 'bulk_purchase',
          priority: bulkSavings > 5 ? 'medium' : 'low',
          title: `Buy ${ingredientName} in bulk`,
          description: `Purchase ${ingredientName} in larger quantities to save money`,
          currentCost: usage.totalCost,
          optimizedCost: usage.totalCost - bulkSavings,
          savings: bulkSavings,
          savingsPercentage: 15,
          difficulty: 'easy',
          ingredientName,
          implementation: {
            steps: [
              `Look for bulk or family-size packages of ${ingredientName}`,
              `Compare unit prices to ensure savings`,
              `Store excess ${ingredientName} properly to prevent spoilage`,
            ],
            timeRequired: 10,
            skillRequired: 'beginner',
          },
          impact: {
            tasteChange: 'none',
            nutritionChange: 'same',
            cookingTimeChange: 0,
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate seasonal swap suggestions
   */
  private async generateSeasonalSwapSuggestions(mealPlan: MealPlan): Promise<CostOptimizationSuggestion[]> {
    const suggestions: CostOptimizationSuggestion[] = [];
    const currentMonth = new Date().getMonth();
    const seasonalAlternatives = this.getSeasonalAlternatives(currentMonth);

    const allIngredients = mealPlan.meals.flatMap(meal => 
      meal.ingredients.map(ing => ({ ingredient: ing, meal }))
    );

    for (const { ingredient, meal } of allIngredients) {
      const seasonal = seasonalAlternatives[ingredient.name.toLowerCase()];
      if (seasonal && seasonal.savings > 1.00) {
        suggestions.push({
          id: `seasonal_${ingredient.name}_${seasonal.alternative}`,
          type: 'seasonal_swap',
          priority: seasonal.savings > 3 ? 'medium' : 'low',
          title: `Use seasonal ${seasonal.alternative} instead of ${ingredient.name}`,
          description: `${seasonal.alternative} is in season and costs less than ${ingredient.name}`,
          currentCost: ingredient.estimatedPrice,
          optimizedCost: ingredient.estimatedPrice - seasonal.savings,
          savings: seasonal.savings,
          savingsPercentage: (seasonal.savings / ingredient.estimatedPrice) * 100,
          difficulty: 'easy',
          mealId: meal.id,
          ingredientName: ingredient.name,
          replacement: {
            name: seasonal.alternative,
            reason: `${seasonal.alternative} is in peak season`,
            nutritionalImpact: 'none',
          },
          implementation: {
            steps: [
              `Replace ${ingredient.name} with ${seasonal.alternative}`,
              `Look for ${seasonal.alternative} in the seasonal produce section`,
              `Adjust cooking time if needed for ${seasonal.alternative}`,
            ],
            timeRequired: 0,
            skillRequired: 'beginner',
          },
          impact: {
            tasteChange: 'minimal',
            nutritionChange: 'improved',
            cookingTimeChange: 0,
          },
        });
      }
    }

    return suggestions.slice(0, 3); // Limit seasonal suggestions
  }

  /**
   * Apply a single optimization to a meal plan
   */
  private async applySingleOptimization(
    mealPlan: MealPlan,
    suggestion: CostOptimizationSuggestion,
    userProfile: UserProfile
  ): Promise<{ mealPlan: MealPlan; savings: number }> {
    const updatedMealPlan = { ...mealPlan };
    let actualSavings = 0;

    switch (suggestion.type) {
      case 'ingredient_swap':
        if (suggestion.mealId && suggestion.ingredientName && suggestion.replacement) {
          const mealIndex = updatedMealPlan.meals.findIndex(m => m.id === suggestion.mealId);
          if (mealIndex !== -1) {
            const meal = { ...updatedMealPlan.meals[mealIndex] };
            const ingredientIndex = meal.ingredients.findIndex(i => i.name === suggestion.ingredientName);
            
            if (ingredientIndex !== -1) {
              const oldIngredient = meal.ingredients[ingredientIndex];
              meal.ingredients[ingredientIndex] = {
                ...oldIngredient,
                name: suggestion.replacement.name,
                estimatedPrice: suggestion.optimizedCost,
              };
              
              meal.estimatedCost = meal.estimatedCost - suggestion.currentCost + suggestion.optimizedCost;
              updatedMealPlan.meals[mealIndex] = meal;
              actualSavings = suggestion.savings;
            }
          }
        }
        break;

      case 'meal_replacement':
        if (suggestion.mealId && suggestion.replacement) {
          try {
            const mealIndex = updatedMealPlan.meals.findIndex(m => m.id === suggestion.mealId);
            if (mealIndex !== -1) {
              const originalMeal = updatedMealPlan.meals[mealIndex];
              const newMeal = await aiService.suggestMealSwap(originalMeal, userProfile, [originalMeal.recipeName]);
              updatedMealPlan.meals[mealIndex] = { ...newMeal, id: originalMeal.id };
              actualSavings = suggestion.savings;
            }
          } catch (error) {
            console.log('Failed to apply meal replacement');
          }
        }
        break;

      case 'portion_adjustment':
        if (suggestion.mealId) {
          const mealIndex = updatedMealPlan.meals.findIndex(m => m.id === suggestion.mealId);
          if (mealIndex !== -1) {
            const meal = { ...updatedMealPlan.meals[mealIndex] };
            meal.estimatedCost = suggestion.optimizedCost;
            meal.servings = userProfile.householdSize;
            updatedMealPlan.meals[mealIndex] = meal;
            actualSavings = suggestion.savings;
          }
        }
        break;
    }

    // Recalculate total cost
    updatedMealPlan.totalEstimatedCost = updatedMealPlan.meals.reduce(
      (sum, meal) => sum + meal.estimatedCost, 
      0
    );

    return { mealPlan: updatedMealPlan, savings: actualSavings };
  }

  /**
   * Helper methods
   */
  private findExpensiveIngredients(mealPlan: MealPlan): Array<{ ingredient: Ingredient; meal: Meal }> {
    const allIngredients: Array<{ ingredient: Ingredient; meal: Meal }> = [];
    
    mealPlan.meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        allIngredients.push({ ingredient, meal });
      });
    });

    return allIngredients
      .filter(({ ingredient }) => ingredient.estimatedPrice > 3.00)
      .sort((a, b) => b.ingredient.estimatedPrice - a.ingredient.estimatedPrice);
  }

  private async findIngredientAlternatives(ingredient: Ingredient, userProfile: UserProfile) {
    // This would integrate with a comprehensive ingredient database
    // For now, using simplified alternatives
    const alternatives: Array<{
      name: string;
      price: number;
      reason: string;
      nutritionalImpact: 'none' | 'minimal' | 'moderate';
      tasteImpact: 'none' | 'minimal' | 'noticeable' | 'significant';
      cookingTip?: string;
    }> = [];

    const ingredientName = ingredient.name.toLowerCase();
    const currentPrice = ingredient.estimatedPrice;

    // Add specific alternatives based on ingredient
    if (ingredientName.includes('chicken breast')) {
      alternatives.push({
        name: 'chicken thighs',
        price: currentPrice * 0.7,
        reason: 'More flavorful and tender',
        nutritionalImpact: 'minimal',
        tasteImpact: 'minimal',
        cookingTip: 'Cook slightly longer than breast meat',
      });
    }

    if (ingredientName.includes('beef')) {
      alternatives.push({
        name: 'ground turkey',
        price: currentPrice * 0.8,
        reason: 'Leaner protein option',
        nutritionalImpact: 'none',
        tasteImpact: 'noticeable',
      });
    }

    // Add more alternatives based on dietary restrictions
    if (!userProfile.dietaryRestrictions.includes('vegetarian')) {
      // Add meat alternatives
    }

    return alternatives;
  }

  private getSwapDifficulty(original: string, replacement: string): 'easy' | 'medium' | 'hard' {
    // Simple logic - in a real app this would be more sophisticated
    const difficultSwaps = ['flour', 'eggs', 'butter'];
    if (difficultSwaps.some(item => original.toLowerCase().includes(item))) {
      return 'medium';
    }
    return 'easy';
  }

  private calculateIngredientUsage(mealPlan: MealPlan): Record<string, { totalQuantity: number; totalCost: number; meals: string[] }> {
    const usage: Record<string, { totalQuantity: number; totalCost: number; meals: string[] }> = {};

    mealPlan.meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        if (!usage[ingredient.name]) {
          usage[ingredient.name] = { totalQuantity: 0, totalCost: 0, meals: [] };
        }
        usage[ingredient.name].totalQuantity += ingredient.amount;
        usage[ingredient.name].totalCost += ingredient.estimatedPrice;
        usage[ingredient.name].meals.push(meal.recipeName);
      });
    });

    return usage;
  }

  private getSeasonalAlternatives(month: number): Record<string, { alternative: string; savings: number }> {
    // Simplified seasonal data - in a real app this would be comprehensive
    const seasonalData: Record<number, Record<string, { alternative: string; savings: number }>> = {
      0: { // January
        'tomatoes': { alternative: 'canned tomatoes', savings: 2.00 },
        'berries': { alternative: 'frozen berries', savings: 3.00 },
      },
      1: { // February
        'asparagus': { alternative: 'broccoli', savings: 1.50 },
        'strawberries': { alternative: 'apples', savings: 2.00 },
      },
      // Add more months...
    };

    return seasonalData[month] || {};
  }
}

export const costOptimizerService = new CostOptimizerService();
export default costOptimizerService;