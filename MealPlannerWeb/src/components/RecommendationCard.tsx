import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { recommendationService } from '../services/recommendation';
import { Meal } from '../types';
import { Clock } from 'lucide-react';

export const RecommendationCard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [recommendations, setRecommendations] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    if (!user || !userProfile) return;
    
    try {
      setLoading(true);
      // Using the SAME service as the mobile app!
      const meals = await recommendationService.getPersonalizedRecommendations(
        user.uid,
        userProfile,
        5
      );
      setRecommendations(meals);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded-lg h-48"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
      {/* React Web specific UI with Tailwind CSS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {recommendations.map((meal) => (
          <div
            key={meal.id}
            className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-800 mb-2">{meal.recipeName}</h3>
            <div className="flex items-center text-gray-600 text-sm">
              <Clock className="w-4 h-4 mr-1" />
              <span>{meal.prepTime + meal.cookTime} min</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
              {meal.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}; 