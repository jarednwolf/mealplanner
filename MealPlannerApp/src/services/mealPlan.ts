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
import { firestore } from '../config/firebase';
import { MealPlan, Meal, UserProfile } from '../types';
import { aiService, MealPlanRequest } from './ai';
import { MealPlanService } from './index';

class MealPlanServiceImpl implements MealPlanService {
  private readonly collectionName = 'mealPlans';

  /**
   * Generate a weekly meal plan based on user profile
   */
  async generateWeeklyPlan(userProfile: UserProfile, options: {
    excludeRecipes?: string[];
    pantryItems?: string[];
    preferredCuisines?: string[];
    weekStartDate?: Date;
  } = {}): Promise<MealPlan> {
    try {
      const request: MealPlanRequest = {
        userProfile,
        ...options
      };

      const response = await aiService.generateMealPlan(request);
      
      const weekStartDate = options.weekStartDate || new Date();
      
      // Create a meal plan object
      const mealPlan: MealPlan = {
        id: `plan_${Date.now()}`,
        userId: userProfile.userId,
        weekStartDate,
        meals: response.meals,
        totalEstimatedCost: response.totalEstimatedCost,
        budgetStatus: response.budgetStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save the meal plan to Firestore
      await this.saveMealPlan(mealPlan);
      
      return mealPlan;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw new Error('Failed to generate meal plan. Please try again.');
    }
  }

  /**
   * Swap a meal in an existing meal plan
   */
  async swapMeal(mealId: string, userProfile: UserProfile): Promise<Meal> {
    try {
      // Find the meal plan containing this meal
      const mealPlanDoc = await this.findMealPlanByMealId(mealId);
      
      if (!mealPlanDoc) {
        throw new Error('Meal not found in any meal plan');
      }
      
      const mealPlan = mealPlanDoc.data() as MealPlan;
      const meal = mealPlan.meals.find(m => m.id === mealId);
      
      if (!meal) {
        throw new Error('Meal not found in meal plan');
      }
      
      // Get all recipe names to exclude (to avoid suggesting the same recipe)
      const excludeRecipes = mealPlan.meals.map(m => m.recipeName);
      
      // Generate a new meal suggestion
      const newMeal = await aiService.suggestMealSwap(meal, userProfile, excludeRecipes);
      
      // Update the meal plan with the new meal
      const updatedMeals = mealPlan.meals.map(m => 
        m.id === mealId ? newMeal : m
      );
      
      // Recalculate total cost
      const totalEstimatedCost = updatedMeals.reduce((sum, m) => sum + m.estimatedCost, 0);
      
      // Determine budget status
      let budgetStatus: 'under' | 'at' | 'over';
      if (totalEstimatedCost <= userProfile.weeklyBudget) {
        budgetStatus = 'under';
      } else if (totalEstimatedCost <= userProfile.weeklyBudget * 1.05) {
        budgetStatus = 'at';
      } else {
        budgetStatus = 'over';
      }
      
      // Update the meal plan in Firestore
      await updateDoc(mealPlanDoc.ref, {
        meals: updatedMeals,
        totalEstimatedCost,
        budgetStatus,
        updatedAt: new Date()
      });
      
      return newMeal;
    } catch (error) {
      console.error('Error swapping meal:', error);
      throw new Error('Failed to swap meal. Please try again.');
    }
  }

  /**
   * Get a meal plan by ID
   */
  async getMealPlan(id: string): Promise<MealPlan> {
    try {
      const docRef = doc(firestore, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Meal plan with ID ${id} not found`);
      }
      
      return this.convertFromFirestore(docSnap.data() as FirestoreMealPlan);
    } catch (error) {
      console.error('Error getting meal plan:', error);
      throw new Error('Failed to retrieve meal plan');
    }
  }

  /**
   * Get all meal plans for a user
   */
  async getUserMealPlans(userId: string): Promise<MealPlan[]> {
    try {
      const q = query(
        collection(firestore, this.collectionName),
        where('userId', '==', userId),
        orderBy('weekStartDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const mealPlans: MealPlan[] = [];
      
      querySnapshot.forEach(doc => {
        mealPlans.push(this.convertFromFirestore(doc.data() as FirestoreMealPlan));
      });
      
      return mealPlans;
    } catch (error) {
      console.error('Error getting user meal plans:', error);
      throw new Error('Failed to retrieve meal plans');
    }
  }

  /**
   * Save a meal plan to Firestore
   */
  async saveMealPlan(mealPlan: MealPlan): Promise<string> {
    try {
      const docRef = doc(firestore, this.collectionName, mealPlan.id);
      
      await setDoc(docRef, this.convertToFirestore(mealPlan));
      
      return mealPlan.id;
    } catch (error) {
      console.error('Error saving meal plan:', error);
      throw new Error('Failed to save meal plan');
    }
  }

  /**
   * Delete a meal plan
   */
  async deleteMealPlan(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      throw new Error('Failed to delete meal plan');
    }
  }

  /**
   * Find a meal plan containing a specific meal ID
   */
  private async findMealPlanByMealId(mealId: string) {
    const q = query(
      collection(firestore, this.collectionName)
    );
    
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      const mealPlan = doc.data() as FirestoreMealPlan;
      if (mealPlan.meals.some((meal: any) => meal.id === mealId)) {
        return doc;
      }
    }
    
    return null;
  }

  /**
   * Convert a MealPlan to Firestore format
   */
  private convertToFirestore(mealPlan: MealPlan): FirestoreMealPlan {
    return {
      ...mealPlan,
      weekStartDate: Timestamp.fromDate(mealPlan.weekStartDate),
      createdAt: Timestamp.fromDate(mealPlan.createdAt),
      updatedAt: Timestamp.fromDate(mealPlan.updatedAt),
    };
  }

  /**
   * Convert from Firestore format to MealPlan
   */
  private convertFromFirestore(data: FirestoreMealPlan): MealPlan {
    return {
      ...data,
      weekStartDate: data.weekStartDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
}

// Firestore representation of MealPlan with Timestamp instead of Date
interface FirestoreMealPlan extends Omit<MealPlan, 'weekStartDate' | 'createdAt' | 'updatedAt'> {
  weekStartDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const mealPlanService = new MealPlanServiceImpl();
export default mealPlanService;