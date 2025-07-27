import { MealFeedback, Meal, UserProfile } from '../types';
import { firestore } from '../config/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { aiService } from './ai';

class RecommendationService {
  /**
   * Get personalized meal recommendations based on user feedback history
   * This service works for BOTH mobile and web apps!
   */
  async getPersonalizedRecommendations(
    userId: string,
    userProfile: UserProfile,
    count: number = 5
  ): Promise<Meal[]> {
    try {
      // 1. Fetch user's positive feedback history
      const feedbackQuery = query(
        collection(firestore, 'feedback'),
        where('userId', '==', userId),
        where('rating', '==', 'positive'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const likedMeals: string[] = [];
      
      feedbackSnapshot.forEach(doc => {
        const feedback = doc.data() as MealFeedback;
        likedMeals.push(feedback.mealId);
      });
      
      // 2. Analyze patterns (cuisines, ingredients, etc.)
      const preferences = await this.analyzePreferences(likedMeals);
      
      // 3. Generate recommendations using AI
      // TODO: Add generateRecommendations method to aiService
      // For now, return empty array
      const recommendations: Meal[] = [];
      
      // This would call something like:
      // const recommendations = await aiService.generateRecommendations({
      //   userProfile,
      //   preferredCuisines: preferences.cuisines,
      //   favoriteIngredients: preferences.ingredients,
      //   avoidMeals: [],
      //   count
      // });
      
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Get trending meals based on community feedback
   * Works on both platforms!
   */
  async getTrendingMeals(limit: number = 10): Promise<Meal[]> {
    try {
      // This would query aggregated feedback data
      // For now, returning mock data
      console.log('Fetching trending meals...');
      return [];
    } catch (error) {
      console.error('Error getting trending meals:', error);
      throw error;
    }
  }

  private async analyzePreferences(likedMealIds: string[]) {
    // Analyze patterns in liked meals
    return {
      cuisines: ['Italian', 'Mexican'], // Example
      ingredients: ['chicken', 'pasta'], // Example
    };
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService; 