import { MealPlan, Meal, Ingredient, UserProfile } from '../types';
import { recipeService } from './recipe';

export interface BudgetAnalysis {
  totalCost: number;
  budgetStatus: 'under' | 'at' | 'over';
  budgetPercentage: number;
  dailyAverage: number;
  costBreakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  categoryBreakdown: {
    [category: string]: number;
  };
  savingsOpportunities: SavingsOpportunity[];
}

export interface SavingsOpportunity {
  type: 'ingredient_substitution' | 'meal_swap' | 'portion_adjustment';
  description: string;
  potentialSavings: number;
  mealId?: string;
  ingredientName?: string;
  suggestion: string;
}

export interface PriceComparison {
  ingredient: string;
  currentPrice: number;
  averagePrice: number;
  isExpensive: boolean;
  alternatives: Array<{
    name: string;
    price: number;
    savings: number;
  }>;
}

class BudgetService {
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Analyze the budget for a meal plan
   */
  async analyzeBudget(mealPlan: MealPlan, userProfile: UserProfile): Promise<BudgetAnalysis> {
    const totalCost = mealPlan.totalEstimatedCost;
    const budgetPercentage = Math.round((totalCost / userProfile.weeklyBudget) * 100);
    const dailyAverage = totalCost / 7;

    // Calculate cost breakdown by meal type
    const costBreakdown = this.calculateMealTypeBreakdown(mealPlan.meals);
    
    // Calculate cost breakdown by ingredient category
    const categoryBreakdown = await this.calculateCategoryBreakdown(mealPlan.meals);
    
    // Identify savings opportunities
    const savingsOpportunities = await this.identifySavingsOpportunities(mealPlan, userProfile);

    return {
      totalCost,
      budgetStatus: this.calculateBudgetStatus(totalCost, userProfile.weeklyBudget),
      budgetPercentage,
      dailyAverage,
      costBreakdown,
      categoryBreakdown,
      savingsOpportunities,
    };
  }

  /**
   * Get updated price estimates for ingredients
   */
  async updateIngredientPrices(ingredients: Ingredient[]): Promise<Ingredient[]> {
    const updatedIngredients: Ingredient[] = [];

    for (const ingredient of ingredients) {
      const cachedPrice = this.getCachedPrice(ingredient.name);
      
      if (cachedPrice !== null) {
        updatedIngredients.push({
          ...ingredient,
          estimatedPrice: cachedPrice,
        });
      } else {
        try {
          // Get price from recipe service or external price API
          const prices = await recipeService.getIngredientPrices([ingredient.name]);
          const newPrice = prices[ingredient.name] || ingredient.estimatedPrice;
          
          this.setCachedPrice(ingredient.name, newPrice);
          updatedIngredients.push({
            ...ingredient,
            estimatedPrice: newPrice,
          });
        } catch (error) {
          console.log(`Failed to update price for ${ingredient.name}, using cached price`);
          updatedIngredients.push(ingredient);
        }
      }
    }

    return updatedIngredients;
  }

  /**
   * Compare ingredient prices and suggest alternatives
   */
  async compareIngredientPrices(ingredients: Ingredient[]): Promise<PriceComparison[]> {
    const comparisons: PriceComparison[] = [];

    for (const ingredient of ingredients) {
      try {
        // Get current and average prices
        const prices = await recipeService.getIngredientPrices([ingredient.name]);
        const currentPrice = prices[ingredient.name] || ingredient.estimatedPrice;
        
        // For demo purposes, calculate average as 90% of current price
        // In a real app, this would come from historical price data
        const averagePrice = currentPrice * 0.9;
        const isExpensive = currentPrice > averagePrice * 1.2;

        // Generate alternatives (simplified for demo)
        const alternatives = this.generateIngredientAlternatives(ingredient, currentPrice);

        comparisons.push({
          ingredient: ingredient.name,
          currentPrice,
          averagePrice,
          isExpensive,
          alternatives,
        });
      } catch (error) {
        console.log(`Failed to compare prices for ${ingredient.name}`);
      }
    }

    return comparisons;
  }

  /**
   * Calculate budget status based on total cost and budget
   */
  private calculateBudgetStatus(totalCost: number, budget: number): 'under' | 'at' | 'over' {
    const ratio = totalCost / budget;
    if (ratio <= 0.95) return 'under';
    if (ratio <= 1.05) return 'at';
    return 'over';
  }

  /**
   * Calculate cost breakdown by meal type
   */
  private calculateMealTypeBreakdown(meals: Meal[]): { breakfast: number; lunch: number; dinner: number } {
    const breakdown = { breakfast: 0, lunch: 0, dinner: 0 };

    meals.forEach(meal => {
      breakdown[meal.mealType] += meal.estimatedCost;
    });

    return breakdown;
  }

  /**
   * Calculate cost breakdown by ingredient category
   */
  private async calculateCategoryBreakdown(meals: Meal[]): Promise<{ [category: string]: number }> {
    const breakdown: { [category: string]: number } = {};

    meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const category = ingredient.category || 'Other';
        breakdown[category] = (breakdown[category] || 0) + ingredient.estimatedPrice;
      });
    });

    return breakdown;
  }

  /**
   * Identify potential savings opportunities
   */
  private async identifySavingsOpportunities(
    mealPlan: MealPlan, 
    userProfile: UserProfile
  ): Promise<SavingsOpportunity[]> {
    const opportunities: SavingsOpportunity[] = [];

    // Check if over budget
    if (mealPlan.budgetStatus === 'over') {
      const overage = mealPlan.totalEstimatedCost - userProfile.weeklyBudget;
      
      opportunities.push({
        type: 'meal_swap',
        description: 'Replace expensive meals with budget-friendly alternatives',
        potentialSavings: overage * 0.6,
        suggestion: 'Consider swapping your most expensive meals for similar but cheaper options',
      });
    }

    // Find expensive ingredients
    const allIngredients = mealPlan.meals.flatMap(meal => meal.ingredients);
    const expensiveIngredients = allIngredients
      .filter(ing => ing.estimatedPrice > 5.00)
      .sort((a, b) => b.estimatedPrice - a.estimatedPrice)
      .slice(0, 3);

    expensiveIngredients.forEach(ingredient => {
      opportunities.push({
        type: 'ingredient_substitution',
        description: `${ingredient.name} is expensive - consider alternatives`,
        potentialSavings: ingredient.estimatedPrice * 0.3,
        ingredientName: ingredient.name,
        suggestion: this.getIngredientSubstitutionSuggestion(ingredient.name),
      });
    });

    // Check for portion adjustments
    const largeMeals = mealPlan.meals.filter(meal => 
      meal.servings > userProfile.householdSize && meal.estimatedCost > 15
    );

    largeMeals.forEach(meal => {
      const potentialSavings = meal.estimatedCost * 0.2;
      opportunities.push({
        type: 'portion_adjustment',
        description: `${meal.recipeName} portions could be reduced`,
        potentialSavings,
        mealId: meal.id,
        suggestion: `Adjust serving size from ${meal.servings} to ${userProfile.householdSize} people`,
      });
    });

    return opportunities.slice(0, 5); // Return top 5 opportunities
  }

  /**
   * Generate ingredient alternatives with price comparisons
   */
  private generateIngredientAlternatives(
    ingredient: Ingredient, 
    currentPrice: number
  ): Array<{ name: string; price: number; savings: number }> {
    // This is a simplified implementation
    // In a real app, this would query a comprehensive ingredient database
    const alternatives: { [key: string]: string[] } = {
      'chicken breast': ['chicken thighs', 'ground chicken', 'turkey breast'],
      'beef': ['ground turkey', 'chicken', 'lentils'],
      'salmon': ['tilapia', 'cod', 'canned tuna'],
      'organic vegetables': ['regular vegetables', 'frozen vegetables'],
      'pine nuts': ['almonds', 'sunflower seeds', 'walnuts'],
      'parmesan cheese': ['romano cheese', 'nutritional yeast'],
    };

    const ingredientAlts = alternatives[ingredient.name.toLowerCase()] || [];
    
    return ingredientAlts.map(alt => ({
      name: alt,
      price: currentPrice * (0.6 + Math.random() * 0.3), // Random price between 60-90% of original
      savings: currentPrice * (0.1 + Math.random() * 0.3), // Random savings
    }));
  }

  /**
   * Get substitution suggestion for expensive ingredients
   */
  private getIngredientSubstitutionSuggestion(ingredientName: string): string {
    const suggestions: { [key: string]: string } = {
      'chicken breast': 'Try chicken thighs - they\'re more flavorful and cost 30% less',
      'beef': 'Ground turkey or lentils can provide similar protein at lower cost',
      'salmon': 'Tilapia or cod offer similar nutrition for half the price',
      'organic vegetables': 'Regular or frozen vegetables provide the same nutrition',
      'pine nuts': 'Almonds or sunflower seeds work great in most recipes',
      'parmesan cheese': 'Romano cheese or nutritional yeast are budget-friendly alternatives',
    };

    return suggestions[ingredientName.toLowerCase()] || 
           'Look for seasonal alternatives or buy in bulk to save money';
  }

  /**
   * Get cached price for an ingredient
   */
  private getCachedPrice(ingredientName: string): number | null {
    const cached = this.priceCache.get(ingredientName.toLowerCase());
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.priceCache.delete(ingredientName.toLowerCase());
      return null;
    }

    return cached.price;
  }

  /**
   * Cache price for an ingredient
   */
  private setCachedPrice(ingredientName: string, price: number): void {
    this.priceCache.set(ingredientName.toLowerCase(), {
      price,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear price cache
   */
  public clearPriceCache(): void {
    this.priceCache.clear();
  }

  /**
   * Calculate cost per serving for a meal
   */
  public calculateCostPerServing(meal: Meal): number {
    return meal.estimatedCost / meal.servings;
  }

  /**
   * Calculate weekly cost projection based on current spending
   */
  public calculateWeeklyCostProjection(meals: Meal[], daysCompleted: number): number {
    if (daysCompleted === 0) return 0;
    
    const completedCost = meals
      .filter(meal => meal.dayOfWeek < daysCompleted)
      .reduce((sum, meal) => sum + meal.estimatedCost, 0);
    
    return (completedCost / daysCompleted) * 7;
  }

  /**
   * Get budget recommendations based on spending patterns
   */
  public getBudgetRecommendations(
    mealPlan: MealPlan, 
    userProfile: UserProfile
  ): string[] {
    const recommendations: string[] = [];
    const analysis = this.calculateBudgetStatus(mealPlan.totalEstimatedCost, userProfile.weeklyBudget);

    if (analysis === 'over') {
      recommendations.push('Your meal plan is over budget. Consider swapping expensive meals.');
      recommendations.push('Look for seasonal ingredients which are typically cheaper.');
      recommendations.push('Buy ingredients in bulk when possible to reduce per-unit cost.');
    } else if (analysis === 'under') {
      recommendations.push('Great job staying under budget! You have room for premium ingredients.');
      recommendations.push('Consider adding more variety or organic options within your budget.');
    }

    // Add cooking skill-based recommendations
    if (userProfile.cookingSkillLevel === 'beginner') {
      recommendations.push('Simple ingredients like rice, beans, and seasonal vegetables are budget-friendly and easy to cook.');
    } else if (userProfile.cookingSkillLevel === 'advanced') {
      recommendations.push('You can save money by buying whole ingredients and preparing them yourself.');
    }

    return recommendations;
  }
}

export const budgetService = new BudgetService();
export default budgetService;