import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  addDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { HouseholdMember, FoodPreferenceFeedback } from '../types';

const COLLECTION_NAME = 'householdMembers';
const FEEDBACK_COLLECTION = 'foodPreferenceFeedback';

export const householdMemberService = {
  // Get all household members for a user
  async getHouseholdMembers(userId: string): Promise<HouseholdMember[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HouseholdMember));
    } catch (error) {
      console.error('Error fetching household members:', error);
      throw error;
    }
  },

  // Get a single household member
  async getHouseholdMember(memberId: string): Promise<HouseholdMember | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, memberId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as HouseholdMember;
      }
      return null;
    } catch (error) {
      console.error('Error fetching household member:', error);
      throw error;
    }
  },

  // Create a new household member
  async createHouseholdMember(member: Omit<HouseholdMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate required fields
      if (!member.userId) {
        throw new Error('userId is required');
      }
      if (!member.name || member.name.trim() === '') {
        throw new Error('name is required');
      }
      
      // Deep clean function to remove undefined values from nested objects
      const deepClean = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return null;
        }
        
        if (Array.isArray(obj)) {
          return obj;
        }
        
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                cleaned[key] = deepClean(value);
              } else {
                cleaned[key] = value;
              }
            }
          }
          return cleaned;
        }
        
        return obj;
      };
      
      // Clean the member object deeply
      const cleanMember = deepClean(member);
      
      // If advancedNutrition is enabled but has no values, set defaults
      if (cleanMember.advancedNutrition?.enabled && !cleanMember.advancedNutrition.dailyCalories) {
        cleanMember.advancedNutrition.dailyCalories = null;
      }
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...cleanMember,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating household member:', error);
      throw error;
    }
  },

  // Update an existing household member
  async updateHouseholdMember(memberId: string, updates: Partial<HouseholdMember>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, memberId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating household member:', error);
      throw error;
    }
  },

  // Delete a household member
  async deleteHouseholdMember(memberId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, memberId);
      await deleteDoc(docRef);
      
      // Also delete all feedback for this member
      const feedbackQuery = query(
        collection(db, FEEDBACK_COLLECTION),
        where('memberId', '==', memberId)
      );
      const feedbackDocs = await getDocs(feedbackQuery);
      
      const deletePromises = feedbackDocs.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting household member:', error);
      throw error;
    }
  },

  // Add food preference feedback
  async addFoodPreferenceFeedback(feedback: Omit<FoodPreferenceFeedback, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
        ...feedback,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding food preference feedback:', error);
      throw error;
    }
  },

  // Get food preference feedback for a member
  async getMemberFeedback(memberId: string): Promise<FoodPreferenceFeedback[]> {
    try {
      const q = query(
        collection(db, FEEDBACK_COLLECTION),
        where('memberId', '==', memberId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FoodPreferenceFeedback));
    } catch (error) {
      console.error('Error fetching member feedback:', error);
      throw error;
    }
  },

  // Get aggregated preferences for all household members
  async getHouseholdPreferences(userId: string): Promise<{
    allDietaryRestrictions: string[];
    allAllergens: string[];
    allDislikedIngredients: string[];
    cuisinePreferences: { [cuisine: string]: number };
    nutritionRequirements: Array<{
      name: string;
      dailyCalories?: number;
      macros?: {
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
      };
    }>;
  }> {
    try {
      const members = await this.getHouseholdMembers(userId);
      
      const allDietaryRestrictions = new Set<string>();
      const allAllergens = new Set<string>();
      const allDislikedIngredients = new Set<string>();
      const cuisineCount: { [cuisine: string]: number } = {};
      const nutritionRequirements: Array<{
        name: string;
        dailyCalories?: number;
        macros?: {
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
        };
      }> = [];
      
      // If no members, return empty preferences
      if (members.length === 0) {
        return {
          allDietaryRestrictions: [],
          allAllergens: [],
          allDislikedIngredients: [],
          cuisinePreferences: {},
          nutritionRequirements: []
        };
      }
      
      members.forEach(member => {
        member.dietaryRestrictions.forEach(dr => allDietaryRestrictions.add(dr));
        member.allergens.forEach(allergen => allAllergens.add(allergen));
        member.dislikedIngredients.forEach(ingredient => allDislikedIngredients.add(ingredient));
        
        member.cuisinePreferences.forEach(cuisine => {
          cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
        });
        
        // Add nutrition requirements if enabled
        if (member.advancedNutrition?.enabled) {
          nutritionRequirements.push({
            name: member.name,
            dailyCalories: member.advancedNutrition.dailyCalories,
            macros: member.advancedNutrition.macros
          });
        }
      });
      
      return {
        allDietaryRestrictions: Array.from(allDietaryRestrictions),
        allAllergens: Array.from(allAllergens),
        allDislikedIngredients: Array.from(allDislikedIngredients),
        cuisinePreferences: cuisineCount,
        nutritionRequirements
      };
    } catch (error) {
      console.error('Error getting household preferences:', error);
      throw error;
    }
  }
}; 