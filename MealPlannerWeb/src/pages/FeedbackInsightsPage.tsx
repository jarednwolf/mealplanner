import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { feedbackService } from '../services/feedback';
import { MealFeedback } from '../types';
import { 
  ChartBarIcon,
  HandThumbUpIcon,
  SparklesIcon,
  HeartIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as ThumbUpSolid,
  HandThumbDownIcon as ThumbDownSolid 
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const FeedbackInsightsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalMealsRated: number;
    positiveRatings: number;
    negativeRatings: number;
    mostCommonReasons: string[];
    recentFeedback: MealFeedback[];
  } | null>(null);
  const [preferences, setPreferences] = useState<{
    likedIngredients: string[];
    dislikedIngredients: string[];
    preferredCuisines: string[];
    avoidCuisines: string[];
    averageRating: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const [statsData, prefsData] = await Promise.all([
        feedbackService.getFeedbackStats(user!.uid),
        feedbackService.getUserPreferences(user!.uid)
      ]);
      setStats(statsData);
      setPreferences(prefsData);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast.error('Failed to load feedback insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const positivePercentage = stats && stats.totalMealsRated > 0 
    ? Math.round((stats.positiveRatings / stats.totalMealsRated) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Food Preferences</h1>
            <p className="mt-2 text-sm text-gray-600">
              Insights based on your meal ratings help us suggest better meals for you
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <ChartBarIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalMealsRated || 0}
              </div>
              <div className="text-sm text-gray-600">Meals Rated</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <ThumbUpSolid className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">
                {stats?.positiveRatings || 0}
              </div>
              <div className="text-sm text-gray-600">Liked</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <ThumbDownSolid className="h-8 w-8 text-red-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">
                {stats?.negativeRatings || 0}
              </div>
              <div className="text-sm text-gray-600">Disliked</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <SparklesIcon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">
                {positivePercentage}%
              </div>
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Common Feedback Reasons */}
              {stats && stats.mostCommonReasons.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    What You Usually Say
                  </h2>
                  <div className="space-y-3">
                    {stats.mostCommonReasons.map((reason, index) => (
                      <div key={index} className="flex items-center">
                        <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="ml-3 text-gray-700">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Feedback */}
              {stats && stats.recentFeedback.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Ratings
                  </h2>
                  <div className="space-y-3">
                    {stats.recentFeedback.map((feedback, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                        {feedback.rating === 'positive' ? (
                          <ThumbUpSolid className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <ThumbDownSolid className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4" />
                            {new Date(feedback.timestamp).toLocaleDateString()}
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            {feedback.reasons.join(', ')}
                          </div>
                          {feedback.comment && (
                            <p className="mt-1 text-sm text-gray-600 italic">
                              "{feedback.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Preferences */}
              {preferences && (
                <>
                  {/* Liked Ingredients */}
                  {preferences.likedIngredients.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center mb-4">
                        <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">
                          Things You Like
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preferences.likedIngredients.map((item, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disliked Ingredients */}
                  {preferences.dislikedIngredients.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center mb-4">
                        <XMarkIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">
                          Things to Avoid
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preferences.dislikedIngredients.map((item, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {(!stats || stats.totalMealsRated === 0) && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <HandThumbUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    No Feedback Yet
                  </h2>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    Start rating your meals to help us learn your preferences and suggest better recipes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackInsightsPage; 