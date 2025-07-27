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
  limit
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { MealFeedback } from '../types';

class FeedbackService {
  private readonly collectionName = 'mealFeedback';

  /**
   * Submit feedback for a meal
   */
  async submitMealFeedback(
    userId: string,
    mealId: string,
    feedback: Omit<MealFeedback, 'timestamp'>
  ): Promise<string> {
    try {
      const docRef = doc(collection(firestore, this.collectionName));
      const feedbackData = {
        ...feedback,
        userId,
        mealId,
        timestamp: Timestamp.now()
      };
      
      await setDoc(docRef, feedbackData);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting meal feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Get feedback for a specific meal
   */
  async getMealFeedback(userId: string, mealId: string): Promise<MealFeedback | null> {
    try {
      const q = query(
        collection(firestore, this.collectionName),
        where('userId', '==', userId),
        where('mealId', '==', mealId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as MealFeedback;
    } catch (error) {
      console.error('Error getting meal feedback:', error);
      return null;
    }
  }

  /**
   * Get all feedback for a user
   */
  async getUserFeedback(userId: string): Promise<MealFeedback[]> {
    try {
      const q = query(
        collection(firestore, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const feedback: MealFeedback[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        feedback.push({
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as MealFeedback);
      });
      
      return feedback;
    } catch (error) {
      console.error('Error getting user feedback:', error);
      throw new Error('Failed to load feedback');
    }
  }

  /**
   * Get user preferences based on feedback history
   */
  async getUserPreferences(userId: string): Promise<{
    likedIngredients: string[];
    dislikedIngredients: string[];
    preferredCuisines: string[];
    avoidCuisines: string[];
    averageRating: number;
  }> {
    try {
      const feedback = await this.getUserFeedback(userId);
      
      const likedIngredients = new Set<string>();
      const dislikedIngredients = new Set<string>();
      const cuisineRatings = new Map<string, { total: number; count: number }>();
      let totalRating = 0;
      let ratingCount = 0;
      
      feedback.forEach(item => {
        // Track ingredients
        if (item.rating === 'positive') {
          item.reasons.forEach(reason => {
            if (reason.includes('ingredients') || reason.includes('taste')) {
              // In a real app, we'd parse actual ingredients from the meal
              likedIngredients.add(reason);
            }
          });
        } else {
          item.reasons.forEach(reason => {
            if (reason.includes('ingredients') || reason.includes('taste')) {
              dislikedIngredients.add(reason);
            }
          });
        }
        
        // Track ratings (convert positive/negative to numeric)
        const numericRating = item.rating === 'positive' ? 5 : 2;
        totalRating += numericRating;
        ratingCount++;
      });
      
      // Determine preferred cuisines (simplified for now)
      const preferredCuisines: string[] = [];
      const avoidCuisines: string[] = [];
      
      cuisineRatings.forEach((data, cuisine) => {
        const avgRating = data.total / data.count;
        if (avgRating >= 4) {
          preferredCuisines.push(cuisine);
        } else if (avgRating <= 2) {
          avoidCuisines.push(cuisine);
        }
      });
      
      return {
        likedIngredients: Array.from(likedIngredients),
        dislikedIngredients: Array.from(dislikedIngredients),
        preferredCuisines,
        avoidCuisines,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0
      };
    } catch (error) {
      console.error('Error analyzing user preferences:', error);
      return {
        likedIngredients: [],
        dislikedIngredients: [],
        preferredCuisines: [],
        avoidCuisines: [],
        averageRating: 0
      };
    }
  }

  /**
   * Get feedback statistics for a user
   */
  async getFeedbackStats(userId: string): Promise<{
    totalMealsRated: number;
    positiveRatings: number;
    negativeRatings: number;
    mostCommonReasons: string[];
    recentFeedback: MealFeedback[];
  }> {
    try {
      const feedback = await this.getUserFeedback(userId);
      
      const positiveRatings = feedback.filter(f => f.rating === 'positive').length;
      const negativeRatings = feedback.filter(f => f.rating === 'negative').length;
      
      // Count reason frequencies
      const reasonCounts = new Map<string, number>();
      feedback.forEach(item => {
        item.reasons.forEach(reason => {
          reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        });
      });
      
      // Get top 5 most common reasons
      const mostCommonReasons = Array.from(reasonCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason]) => reason);
      
      return {
        totalMealsRated: feedback.length,
        positiveRatings,
        negativeRatings,
        mostCommonReasons,
        recentFeedback: feedback.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return {
        totalMealsRated: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        mostCommonReasons: [],
        recentFeedback: []
      };
    }
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService; 