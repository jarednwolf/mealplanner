import { recipeService, RecipeSearchParams } from '../recipe';

// Mock fetch
global.fetch = jest.fn();

describe('RecipeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear the cache before each test
    recipeService.clearCache();
    
    // Mock successful API response for recipe search
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [
          {
            id: 123,
            title: 'Vegetable Pasta',
            summary: 'A delicious vegetable pasta dish',
            readyInMinutes: 30,
            servings: 4,
            vegetarian: true,
            vegan: false,
            glutenFree: false,
            dairyFree: false,
            cuisines: ['Italian'],
            extendedIngredients: [
              {
                name: 'pasta',
                amount: 1,
                unit: 'lb',
                aisle: 'Pasta and Rice',
              },
              {
                name: 'mixed vegetables',
                amount: 2,
                unit: 'cups',
                aisle: 'Produce',
              },
            ],
            analyzedInstructions: [
              {
                steps: [
                  { step: 'Boil water' },
                  { step: 'Cook pasta' },
                  { step: 'Mix with vegetables' },
                ],
              },
            ],
            spoonacularScore: 85,
            pricePerServing: 250,
          },
        ],
      }),
    });
  });

  describe('searchRecipes', () => {
    it('should search for recipes with the given parameters', async () => {
      const params: RecipeSearchParams = {
        query: 'pasta',
        cuisine: ['Italian'],
        diet: ['vegetarian'],
        number: 5,
      };

      const recipes = await recipeService.searchRecipes(params);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.spoonacular.com/recipes/complexSearch'),
        expect.any(Object)
      );

      expect(recipes).toHaveLength(1);
      expect(recipes[0].name).toBe('Vegetable Pasta');
      expect(recipes[0].cuisine).toContain('Italian');
      expect(recipes[0].dietaryTags).toContain('vegetarian');
    });

    it('should use cache for repeated searches', async () => {
      const params: RecipeSearchParams = {
        query: 'pasta',
      };

      // First call should use the API
      await recipeService.searchRecipes(params);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call with the same parameters should use cache
      await recipeService.searchRecipes(params);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still just one call
    });

    it('should handle API errors and fall back to mock data', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const params: RecipeSearchParams = {
        query: 'pasta',
      };

      const recipes = await recipeService.searchRecipes(params);

      // Should still return recipes (from mock data)
      expect(recipes.length).toBeGreaterThan(0);
      expect(recipes[0]).toHaveProperty('name');
      expect(recipes[0]).toHaveProperty('ingredients');
    });
  });

  describe('getRecipeById', () => {
    beforeEach(() => {
      // Mock successful API response for recipe by ID
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 123,
          title: 'Vegetable Pasta',
          summary: 'A delicious vegetable pasta dish',
          readyInMinutes: 30,
          servings: 4,
          vegetarian: true,
          vegan: false,
          glutenFree: false,
          dairyFree: false,
          cuisines: ['Italian'],
          extendedIngredients: [
            {
              name: 'pasta',
              amount: 1,
              unit: 'lb',
              aisle: 'Pasta and Rice',
            },
            {
              name: 'mixed vegetables',
              amount: 2,
              unit: 'cups',
              aisle: 'Produce',
            },
          ],
          analyzedInstructions: [
            {
              steps: [
                { step: 'Boil water' },
                { step: 'Cook pasta' },
                { step: 'Mix with vegetables' },
              ],
            },
          ],
          spoonacularScore: 85,
          pricePerServing: 250,
          nutrition: {
            nutrients: [
              { name: 'Calories', amount: 350 },
              { name: 'Protein', amount: 12 },
              { name: 'Carbohydrates', amount: 60 },
              { name: 'Fat', amount: 8 },
            ],
          },
        }),
      });
    });

    it('should get recipe details by ID', async () => {
      const recipe = await recipeService.getRecipeById('123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.spoonacular.com/recipes/123/information'),
        expect.any(Object)
      );

      expect(recipe.id).toBe('123');
      expect(recipe.name).toBe('Vegetable Pasta');
      expect(recipe.ingredients).toHaveLength(2);
      expect(recipe.nutritionInfo).toBeDefined();
      expect(recipe.nutritionInfo?.calories).toBe(350);
    });

    it('should use cache for repeated recipe requests', async () => {
      // First call should use the API
      await recipeService.getRecipeById('123');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call for the same recipe should use cache
      await recipeService.getRecipeById('123');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still just one call
    });
  });

  describe('getRecipeInstructions', () => {
    beforeEach(() => {
      // Mock successful API response for recipe instructions
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          {
            steps: [
              { step: 'Boil water' },
              { step: 'Cook pasta' },
              { step: 'Mix with vegetables' },
            ],
          },
        ]),
      });
    });

    it('should get recipe instructions by ID', async () => {
      const instructions = await recipeService.getRecipeInstructions('123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.spoonacular.com/recipes/123/analyzedInstructions'),
        expect.any(Object)
      );

      expect(instructions).toHaveLength(3);
      expect(instructions[0]).toBe('Boil water');
      expect(instructions[1]).toBe('Cook pasta');
      expect(instructions[2]).toBe('Mix with vegetables');
    });
  });

  describe('getIngredientPrices', () => {
    it('should return price estimates for ingredients', async () => {
      const ingredients = ['pasta', 'tomatoes', 'cheese'];
      const prices = await recipeService.getIngredientPrices(ingredients);

      expect(Object.keys(prices)).toHaveLength(3);
      expect(prices).toHaveProperty('pasta');
      expect(prices).toHaveProperty('tomatoes');
      expect(prices).toHaveProperty('cheese');
      
      // Check that prices are reasonable (between $0.50 and $10.00)
      Object.values(prices).forEach(price => {
        expect(price).toBeGreaterThanOrEqual(0.5);
        expect(price).toBeLessThanOrEqual(10);
      });
    });
  });
});