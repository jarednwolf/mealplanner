import React, { useState, useEffect } from 'react';
import { HouseholdMember, FoodPreferenceFeedback } from '../types';
import { householdMemberService } from '../services/householdMembers';
import {
  XMarkIcon,
  HeartIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface MemberPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: HouseholdMember | null;
}

const MemberPreferencesModal: React.FC<MemberPreferencesModalProps> = ({
  isOpen,
  onClose,
  member
}) => {
  const [feedback, setFeedback] = useState<FoodPreferenceFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'summary' | 'history'>('summary');

  useEffect(() => {
    if (member && isOpen) {
      loadFeedback();
    }
  }, [member, isOpen]);

  const loadFeedback = async () => {
    if (!member) return;
    
    try {
      setLoading(true);
      const memberFeedback = await householdMemberService.getMemberFeedback(member.id);
      setFeedback(memberFeedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load preference history');
    } finally {
      setLoading(false);
    }
  };

  const aggregateIngredientPreferences = () => {
    const likedCounts: { [key: string]: number } = {};
    const dislikedCounts: { [key: string]: number } = {};
    
    feedback.forEach(fb => {
      fb.likedIngredients.forEach(ing => {
        likedCounts[ing] = (likedCounts[ing] || 0) + 1;
      });
      fb.dislikedIngredients.forEach(ing => {
        dislikedCounts[ing] = (dislikedCounts[ing] || 0) + 1;
      });
    });
    
    return {
      topLiked: Object.entries(likedCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      topDisliked: Object.entries(dislikedCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    };
  };

  const getAverageRating = () => {
    if (feedback.length === 0) return '0.0';
    const sum = feedback.reduce((acc, fb) => acc + fb.rating, 0);
    return (sum / feedback.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach(fb => {
      distribution[fb.rating]++;
    });
    return distribution;
  };

  if (!isOpen || !member) return null;

  const { topLiked, topDisliked } = aggregateIngredientPreferences();
  const avgRating = getAverageRating();
  const ratingDist = getRatingDistribution();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {member.name}'s Food Preferences
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Track and learn from meal feedback over time
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50/50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveView('summary')}
                className={`flex-1 py-3 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeView === 'summary'
                    ? 'border-green-500 text-green-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveView('history')}
                className={`flex-1 py-3 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeView === 'history'
                    ? 'border-green-500 text-green-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                History ({feedback.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : activeView === 'summary' ? (
              <div className="space-y-6">
                {/* Static Preferences */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Registered Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</h4>
                      {member.dietaryRestrictions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {member.dietaryRestrictions.map(restriction => (
                            <span key={restriction} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                              {restriction}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">None specified</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Allergens</h4>
                      {member.allergens.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {member.allergens.map(allergen => (
                            <span key={allergen} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">None specified</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Favorite Ingredients</h4>
                      {member.favoriteIngredients.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {member.favoriteIngredients.map(ing => (
                            <span key={ing} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {ing}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">None specified</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Disliked Ingredients</h4>
                      {member.dislikedIngredients.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {member.dislikedIngredients.map(ing => (
                            <span key={ing} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                              {ing}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">None specified</p>
                      )}
                    </div>
                  </div>
                </div>

                {feedback.length > 0 ? (
                  <>
                    {/* Rating Overview */}
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Meal Feedback Summary</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center mb-4">
                            <div className="text-3xl font-bold text-gray-900">{avgRating}</div>
                            <div className="ml-3">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <StarIconSolid
                                    key={star}
                                    className={`h-5 w-5 ${
                                      star <= parseFloat(avgRating) ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">Average rating</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            {Object.entries(ratingDist).reverse().map(([rating, count]) => (
                              <div key={rating} className="flex items-center">
                                <span className="text-sm text-gray-600 w-4">{rating}</span>
                                <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${(count / feedback.length) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 w-8">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Meal Acceptance</p>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {feedback.filter(f => f.wouldEatAgain).length}
                              </div>
                              <p className="text-xs text-gray-600">Would eat again</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">
                                {feedback.filter(f => !f.wouldEatAgain).length}
                              </div>
                              <p className="text-xs text-gray-600">Would not eat again</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Learned Preferences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <HandThumbUpIcon className="h-5 w-5 mr-2 text-green-600" />
                          Discovered Favorites
                        </h4>
                        {topLiked.length > 0 ? (
                          <div className="space-y-2">
                            {topLiked.map(([ingredient, count]) => (
                              <div key={ingredient} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{ingredient}</span>
                                <span className="text-sm text-gray-500">liked {count}x</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No patterns detected yet</p>
                        )}
                      </div>

                      <div className="bg-red-50 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <HandThumbDownIcon className="h-5 w-5 mr-2 text-red-600" />
                          Discovered Dislikes
                        </h4>
                        {topDisliked.length > 0 ? (
                          <div className="space-y-2">
                            {topDisliked.map(([ingredient, count]) => (
                              <div key={ingredient} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{ingredient}</span>
                                <span className="text-sm text-gray-500">disliked {count}x</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No patterns detected yet</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h4>
                    <p className="text-gray-600">
                      Preferences will be tracked as {member.name} rates meals
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // History View
              <div className="space-y-4">
                {feedback.length > 0 ? (
                  feedback.map(fb => (
                    <div key={fb.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Recipe #{fb.recipeId}</h4>
                          <div className="flex items-center mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <StarIconSolid
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= fb.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                              {fb.wouldEatAgain ? 'Would eat again' : 'Would not eat again'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {(fb.likedIngredients.length > 0 || fb.dislikedIngredients.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {fb.likedIngredients.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Liked in this meal:</p>
                              <div className="flex flex-wrap gap-1">
                                {fb.likedIngredients.map(ing => (
                                  <span key={ing} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {fb.dislikedIngredients.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Disliked in this meal:</p>
                              <div className="flex flex-wrap gap-1">
                                {fb.dislikedIngredients.map(ing => (
                                  <span key={ing} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {fb.notes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 italic">"{fb.notes}"</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No history yet</h4>
                    <p className="text-gray-600">
                      Meal feedback will appear here as it's recorded
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberPreferencesModal; 