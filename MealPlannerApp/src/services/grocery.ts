import { 
  MealPlan, 
  GroceryList, 
  GroceryItem, 
  CostSavingSwap,
  PantryItem,
  Ingredient
} from '../types';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { costOptimizerService } from './costOptimizer';

interface AggregatedIngredient {
  name: string;
  totalAmount: number;
  unit: string;
  category: string;
  totalPrice: number;
  sources: Array<{ mealId: string; mealName: string; amount: number }>;
}

class GroceryService {
  private readonly collectionName = 'groceryLists';

  /**
   * Generate a grocery list from a meal plan
   */
  async generateGroceryList(
    mealPlan: MealPlan,
    pantryItems: PantryItem[] = []
  ): Promise<GroceryList> {
    try {
      // Step 1: Aggregate all ingredients from meals
      const aggregatedIngredients = this.aggregateIngredients(mealPlan);

      // Step 2: Filter out pantry items
      const filteredIngredients = this.filterPantryItems(aggregatedIngredients, pantryItems);

      // Step 3: Convert to grocery items and organize by category
      const groceryItems = this.createGroceryItems(filteredIngredients, pantryItems);

      // Step 4: Calculate total cost
      const totalCost = groceryItems.reduce((sum, item) => sum + item.estimatedPrice, 0);

      // Step 5: Generate cost-saving suggestions if over budget
      let suggestedSwaps: CostSavingSwap[] = [];
      const weeklyBudget = mealPlan.budgetStatus === 'over' ? mealPlan.totalEstimatedCost * 0.9 : mealPlan.totalEstimatedCost;
      
      if (totalCost > weeklyBudget) {
        suggestedSwaps = await this.generateCostSavingSwaps(groceryItems, totalCost - weeklyBudget);
      }

      // Step 6: Create grocery list object
      const groceryList: GroceryList = {
        id: `grocery_${Date.now()}`,
        mealPlanId: mealPlan.id,
        items: groceryItems,
        totalCost,
        budgetComparison: totalCost - weeklyBudget,
        suggestedSwaps: suggestedSwaps.length > 0 ? suggestedSwaps : undefined,
      };

      // Save to Firestore
      await this.saveGroceryList(groceryList);

      return groceryList;
    } catch (error) {
      console.error('Error generating grocery list:', error);
      throw new Error('Failed to generate grocery list');
    }
  }

  /**
   * Aggregate ingredients from all meals in the plan
   */
  private aggregateIngredients(mealPlan: MealPlan): Map<string, AggregatedIngredient> {
    const aggregated = new Map<string, AggregatedIngredient>();

    mealPlan.meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const key = this.normalizeIngredientName(ingredient.name);
        
        if (aggregated.has(key)) {
          const existing = aggregated.get(key)!;
          
          // If units match, add amounts
          if (existing.unit === ingredient.unit) {
            existing.totalAmount += ingredient.amount;
            existing.totalPrice += ingredient.estimatedPrice;
          } else {
            // If units don't match, create a new entry with unit in the name
            const newKey = `${key} (${ingredient.unit})`;
            if (aggregated.has(newKey)) {
              const existingWithUnit = aggregated.get(newKey)!;
              existingWithUnit.totalAmount += ingredient.amount;
              existingWithUnit.totalPrice += ingredient.estimatedPrice;
              existingWithUnit.sources.push({
                mealId: meal.id,
                mealName: meal.recipeName,
                amount: ingredient.amount
              });
            } else {
              aggregated.set(newKey, {
                name: `${ingredient.name} (${ingredient.unit})`,
                totalAmount: ingredient.amount,
                unit: ingredient.unit,
                category: ingredient.category,
                totalPrice: ingredient.estimatedPrice,
                sources: [{
                  mealId: meal.id,
                  mealName: meal.recipeName,
                  amount: ingredient.amount
                }]
              });
            }
          }
          
          existing.sources.push({
            mealId: meal.id,
            mealName: meal.recipeName,
            amount: ingredient.amount
          });
        } else {
          aggregated.set(key, {
            name: ingredient.name,
            totalAmount: ingredient.amount,
            unit: ingredient.unit,
            category: ingredient.category,
            totalPrice: ingredient.estimatedPrice,
            sources: [{
              mealId: meal.id,
              mealName: meal.recipeName,
              amount: ingredient.amount
            }]
          });
        }
      });
    });

    return aggregated;
  }

  /**
   * Filter out items that are already in the pantry
   */
  private filterPantryItems(
    aggregatedIngredients: Map<string, AggregatedIngredient>,
    pantryItems: PantryItem[]
  ): Map<string, AggregatedIngredient> {
    const filtered = new Map<string, AggregatedIngredient>();
    
    aggregatedIngredients.forEach((ingredient, key) => {
      const pantryItem = pantryItems.find(
        item => this.normalizeIngredientName(item.name) === key
      );
      
      if (!pantryItem) {
        // Not in pantry, add to grocery list
        filtered.set(key, ingredient);
      } else {
        // In pantry, check if we need more
        const pantryAmount = this.parseQuantity(pantryItem.quantity);
        
        if (pantryAmount < ingredient.totalAmount) {
          // Need more than what's in pantry
          const needed = {
            ...ingredient,
            totalAmount: ingredient.totalAmount - pantryAmount,
            totalPrice: ingredient.totalPrice * ((ingredient.totalAmount - pantryAmount) / ingredient.totalAmount)
          };
          filtered.set(key, needed);
        }
        // If pantry has enough, don't add to grocery list
      }
    });
    
    return filtered;
  }

  /**
   * Convert aggregated ingredients to grocery items
   */
  private createGroceryItems(
    filteredIngredients: Map<string, AggregatedIngredient>,
    pantryItems: PantryItem[]
  ): GroceryItem[] {
    const items: GroceryItem[] = [];
    
    filteredIngredients.forEach(ingredient => {
      const pantryItem = pantryItems.find(
        item => this.normalizeIngredientName(item.name) === this.normalizeIngredientName(ingredient.name)
      );
      
      items.push({
        name: ingredient.name,
        quantity: `${this.formatAmount(ingredient.totalAmount)} ${ingredient.unit}`,
        category: ingredient.category,
        estimatedPrice: ingredient.totalPrice,
        isInPantry: false,
        pantryQuantity: pantryItem?.quantity
      });
    });
    
    // Sort by category for organized shopping
    return items.sort((a, b) => {
      const categoryOrder = ['produce', 'meat', 'dairy', 'pantry', 'frozen', 'other'];
      const aIndex = categoryOrder.indexOf(a.category.toLowerCase());
      const bIndex = categoryOrder.indexOf(b.category.toLowerCase());
      
      if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
  }

  /**
   * Generate cost-saving swap suggestions
   */
  private async generateCostSavingSwaps(
    groceryItems: GroceryItem[],
    targetSavings: number
  ): Promise<CostSavingSwap[]> {
    const swaps: CostSavingSwap[] = [];
    let currentSavings = 0;
    
    // Sort items by price to target expensive items first
    const sortedItems = [...groceryItems].sort((a, b) => b.estimatedPrice - a.estimatedPrice);
    
    for (const item of sortedItems) {
      if (currentSavings >= targetSavings) break;
      
      // Generate swap suggestions for expensive items
      if (item.estimatedPrice > 5) {
        const alternatives = await this.findCheaperAlternatives(item);
        
        if (alternatives.length > 0) {
          const bestAlternative = alternatives[0];
          const savings = item.estimatedPrice - bestAlternative.price;
          
          swaps.push({
            originalItem: item.name,
            suggestedItem: bestAlternative.name,
            savings,
            reason: bestAlternative.reason
          });
          
          currentSavings += savings;
        }
      }
    }
    
    return swaps;
  }

  /**
   * Find cheaper alternatives for an ingredient
   */
  private async findCheaperAlternatives(
    item: GroceryItem
  ): Promise<Array<{ name: string; price: number; reason: string }>> {
    // This is a simplified implementation
    // In production, this would query a comprehensive database
    const alternatives: Record<string, Array<{ name: string; priceRatio: number; reason: string }>> = {
      'chicken breast': [
        { name: 'chicken thighs', priceRatio: 0.7, reason: 'More affordable cut with similar protein' },
        { name: 'ground chicken', priceRatio: 0.8, reason: 'Versatile and budget-friendly' }
      ],
      'beef': [
        { name: 'ground beef', priceRatio: 0.6, reason: 'More affordable option' },
        { name: 'chicken', priceRatio: 0.5, reason: 'Leaner and cheaper protein' }
      ],
      'salmon': [
        { name: 'tilapia', priceRatio: 0.4, reason: 'Budget-friendly white fish' },
        { name: 'canned salmon', priceRatio: 0.5, reason: 'Affordable with same omega-3s' }
      ],
      'organic': [
        { name: 'conventional', priceRatio: 0.6, reason: 'Same nutrition at lower cost' }
      ]
    };
    
    const normalizedName = item.name.toLowerCase();
    let matches: Array<{ name: string; price: number; reason: string }> = [];
    
    Object.entries(alternatives).forEach(([key, alts]) => {
      if (normalizedName.includes(key)) {
        matches = alts.map(alt => ({
          name: normalizedName.replace(key, alt.name),
          price: item.estimatedPrice * alt.priceRatio,
          reason: alt.reason
        }));
      }
    });
    
    return matches.sort((a, b) => a.price - b.price);
  }

  /**
   * Save grocery list to Firestore
   */
  async saveGroceryList(groceryList: GroceryList): Promise<string> {
    try {
      const docRef = doc(collection(firestore, this.collectionName), groceryList.id);
      await setDoc(docRef, this.convertToFirestore(groceryList));
      return groceryList.id;
    } catch (error) {
      console.error('Error saving grocery list:', error);
      throw new Error('Failed to save grocery list');
    }
  }

  /**
   * Get a grocery list by ID
   */
  async getGroceryList(id: string): Promise<GroceryList> {
    try {
      const docRef = doc(firestore, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Grocery list not found');
      }
      
      return this.convertFromFirestore(docSnap.data());
    } catch (error) {
      console.error('Error getting grocery list:', error);
      throw new Error('Failed to retrieve grocery list');
    }
  }

  /**
   * Get all grocery lists for a user
   */
  async getUserGroceryLists(userId: string): Promise<GroceryList[]> {
    try {
      // First get user's meal plans
      const mealPlansQuery = query(
        collection(firestore, 'mealPlans'),
        where('userId', '==', userId)
      );
      const mealPlansSnapshot = await getDocs(mealPlansQuery);
      const mealPlanIds = mealPlansSnapshot.docs.map(doc => doc.id);
      
      if (mealPlanIds.length === 0) {
        return [];
      }
      
      // Then get grocery lists for those meal plans
      const groceryListsQuery = query(
        collection(firestore, this.collectionName),
        where('mealPlanId', 'in', mealPlanIds),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(groceryListsQuery);
      const groceryLists: GroceryList[] = [];
      
      querySnapshot.forEach(doc => {
        groceryLists.push(this.convertFromFirestore(doc.data()));
      });
      
      return groceryLists;
    } catch (error) {
      console.error('Error getting user grocery lists:', error);
      throw new Error('Failed to retrieve grocery lists');
    }
  }

  /**
   * Update a grocery item (e.g., mark as purchased)
   */
  async updateGroceryItem(
    groceryListId: string,
    itemName: string,
    updates: Partial<GroceryItem>
  ): Promise<void> {
    try {
      const groceryList = await this.getGroceryList(groceryListId);
      const itemIndex = groceryList.items.findIndex(item => item.name === itemName);
      
      if (itemIndex === -1) {
        throw new Error('Item not found in grocery list');
      }
      
      groceryList.items[itemIndex] = { ...groceryList.items[itemIndex], ...updates };
      
      await this.saveGroceryList(groceryList);
    } catch (error) {
      console.error('Error updating grocery item:', error);
      throw new Error('Failed to update grocery item');
    }
  }

  /**
   * Optimize budget for a grocery list
   */
  async optimizeBudget(groceryList: GroceryList, budget: number): Promise<GroceryList> {
    // This would integrate with the cost optimizer service
    // For now, return the original list
    return groceryList;
  }

  /**
   * Helper method to normalize ingredient names
   */
  private normalizeIngredientName(name: string): string {
    return name.toLowerCase().trim().replace(/s$/, ''); // Remove trailing 's' for simple pluralization
  }

  /**
   * Helper method to parse quantity strings
   */
  private parseQuantity(quantity: string): number {
    const match = quantity.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Helper method to format amounts
   */
  private formatAmount(amount: number): string {
    if (amount === Math.floor(amount)) {
      return amount.toString();
    }
    return amount.toFixed(2).replace(/\.?0+$/, '');
  }

  /**
   * Convert GroceryList to Firestore format
   */
  private convertToFirestore(groceryList: GroceryList): any {
    return {
      ...groceryList,
      createdAt: Timestamp.now(),
    };
  }

  /**
   * Convert from Firestore format to GroceryList
   */
  private convertFromFirestore(data: any): GroceryList {
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  }
}

export const groceryService = new GroceryService();
export default groceryService; 