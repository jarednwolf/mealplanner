import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner, MealSwapModal, BudgetTracker, CostSavingsModal } from '../components';
import { MealPlan, Meal } from '../types';
import { mealPlanOrchestratorService } from '../services/mealPlanOrchestrator';
import { mealPlanService } from '../services/mealPlan';
import { formatDate, formatCurrency, addDays, getWeekStartDate } from '../utils';

type MealPlanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MealPlan'>;
type MealPlanScreenRouteProp = RouteProp<RootStackParamList, 'MealPlan'>;

const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<MealPlanScreenNavigationProp>();
  const route = useRoute<MealPlanScreenRouteProp>();
  const { userProfile } = useAuth();

  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date>(getWeekStartDate());
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [mealToSwap, setMealToSwap] = useState<Meal | null>(null);
  const [undoStack, setUndoStack] = useState<MealPlan[]>([]);
  const [costSavingsModalVisible, setCostSavingsModalVisible] = useState(false);

  useEffect(() => {
    loadMealPlan();
  }, [selectedWeek]);

  const loadMealPlan = async () => {
    if (!userProfile) return;

    try {
      setIsLoading(true);
      
      // Try to load existing meal plan for the selected week
      const userMealPlans = await mealPlanService.getUserMealPlans(userProfile.userId);
      const weekPlan = userMealPlans.find(plan => 
        plan.weekStartDate.toDateString() === selectedWeek.toDateString()
      );

      if (weekPlan) {
        setMealPlan(weekPlan);
      } else {
        setMealPlan(null);
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
      Alert.alert('Error', 'Failed to load meal plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewMealPlan = async () => {
    if (!userProfile) return;

    try {
      setIsGenerating(true);
      
      const newMealPlan = await mealPlanOrchestratorService.generateMealPlan(userProfile, {
        weekStartDate: selectedWeek,
      });

      setMealPlan(newMealPlan);
      
      Alert.alert(
        'Success!', 
        'Your new meal plan has been generated. Total estimated cost: ' + 
        formatCurrency(newMealPlan.totalEstimatedCost)
      );
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMealPlan();
    setIsRefreshing(false);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
  };

  const handleMealPress = (meal: Meal) => {
    // TODO: Navigate to recipe detail screen when implemented
    Alert.alert(
      meal.recipeName,
      `${meal.description}\n\nPrep: ${meal.prepTime}min | Cook: ${meal.cookTime}min\nCost: ${formatCurrency(meal.estimatedCost)}`
    );
  };

  const handleSwapMeal = (meal: Meal) => {
    setMealToSwap(meal);
    setSwapModalVisible(true);
  };

  const handleMealSwapped = (newMeal: Meal) => {
    if (!mealPlan || !mealToSwap) return;

    // Save current state to undo stack
    setUndoStack(prev => [...prev.slice(-4), mealPlan]); // Keep last 5 states

    // Update the meal plan with the new meal
    const updatedMeals = mealPlan.meals.map(m => 
      m.id === mealToSwap.id ? { ...newMeal, id: mealToSwap.id } : m
    );
    
    // Recalculate total cost and budget status
    const totalEstimatedCost = updatedMeals.reduce((sum, m) => sum + m.estimatedCost, 0);
    const budgetStatus = totalEstimatedCost <= userProfile!.weeklyBudget * 0.95 ? 'under' :
                        totalEstimatedCost <= userProfile!.weeklyBudget * 1.05 ? 'at' : 'over';
    
    const updatedPlan: MealPlan = {
      ...mealPlan,
      meals: updatedMeals,
      totalEstimatedCost,
      budgetStatus,
      updatedAt: new Date(),
    };
    
    setMealPlan(updatedPlan);
    
    // Update the meal plan in storage
    mealPlanService.saveMealPlan(updatedPlan).catch(error => {
      console.error('Error saving updated meal plan:', error);
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    
    setUndoStack(newUndoStack);
    setMealPlan(previousState);
    
    // Update the meal plan in storage
    mealPlanService.saveMealPlan(previousState).catch(error => {
      console.error('Error saving reverted meal plan:', error);
    });
  };

  const handleOptimizationApplied = (optimizedMealPlan: MealPlan) => {
    if (!mealPlan) return;

    // Save current state to undo stack
    setUndoStack(prev => [...prev.slice(-4), mealPlan]);

    // Update with optimized meal plan
    setMealPlan(optimizedMealPlan);
    
    // Update the meal plan in storage
    mealPlanService.saveMealPlan(optimizedMealPlan).catch(error => {
      console.error('Error saving optimized meal plan:', error);
    });
  };

  if (!userProfile) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading meal plan..." />;
  }

  return (
    <View style={styles.container}>
      {/* Week Navigation Header */}
      <View style={styles.weekHeader}>
        <TouchableOpacity 
          style={styles.weekNavButton} 
          onPress={() => navigateWeek('prev')}
        >
          <Text style={styles.weekNavText}>‹ Previous</Text>
        </TouchableOpacity>
        
        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>Week of</Text>
          <Text style={styles.weekDate}>{formatDate(selectedWeek)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.weekNavButton} 
          onPress={() => navigateWeek('next')}
        >
          <Text style={styles.weekNavText}>Next ›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {mealPlan ? (
          <>
            {/* Budget Summary */}
            <View style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetTitle}>Weekly Budget</Text>
                <View style={styles.budgetActions}>
                  {mealPlan.budgetStatus === 'over' && (
                    <TouchableOpacity 
                      style={styles.savingsButton} 
                      onPress={() => setCostSavingsModalVisible(true)}
                    >
                      <Text style={styles.savingsButtonText}>💰 Save Money</Text>
                    </TouchableOpacity>
                  )}
                  {undoStack.length > 0 && (
                    <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
                      <Text style={styles.undoButtonText}>↶ Undo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Estimated Cost:</Text>
                <Text style={[
                  styles.budgetAmount,
                  { color: mealPlan.budgetStatus === 'over' ? '#FF3B30' : '#34C759' }
                ]}>
                  {formatCurrency(mealPlan.totalEstimatedCost)}
                </Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Your Budget:</Text>
                <Text style={styles.budgetAmount}>
                  {formatCurrency(userProfile.weeklyBudget)}
                </Text>
              </View>
              <View style={[
                styles.budgetStatus,
                { backgroundColor: getBudgetStatusColor(mealPlan.budgetStatus) }
              ]}>
                <Text style={styles.budgetStatusText}>
                  {getBudgetStatusText(mealPlan.budgetStatus)}
                </Text>
              </View>
            </View>

            {/* Meal Plan Calendar */}
            <View style={styles.calendarContainer}>
              {renderWeeklyCalendar(mealPlan, selectedWeek, handleMealPress, handleSwapMeal)}
            </View>
          </>
        ) : (
          /* No Meal Plan State */
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Meal Plan Yet</Text>
            <Text style={styles.emptyDescription}>
              Generate a personalized meal plan for this week based on your preferences and budget.
            </Text>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={generateNewMealPlan}
              disabled={isGenerating}
            >
              <Text style={styles.generateButtonText}>
                {isGenerating ? 'Generating...' : 'Generate Meal Plan'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Generate New Plan Button */}
        {mealPlan && (
          <TouchableOpacity 
            style={styles.regenerateButton}
            onPress={generateNewMealPlan}
            disabled={isGenerating}
          >
            <Text style={styles.regenerateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate New Plan'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Meal Swap Modal */}
      {mealToSwap && userProfile && (
        <MealSwapModal
          visible={swapModalVisible}
          onClose={() => {
            setSwapModalVisible(false);
            setMealToSwap(null);
          }}
          originalMeal={mealToSwap}
          userProfile={userProfile}
          onMealSwapped={handleMealSwapped}
        />
      )}
    </View>
  );
};

// Helper function to render the weekly calendar
const renderWeeklyCalendar = (
  mealPlan: MealPlan,
  weekStart: Date,
  onMealPress: (meal: Meal) => void,
  onSwapMeal: (meal: Meal) => void
) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner'];

  return days.map((dayName, dayIndex) => {
    const dayDate = addDays(weekStart, dayIndex);
    const dayMeals = mealPlan.meals.filter(meal => meal.dayOfWeek === dayIndex);

    return (
      <View key={dayIndex} style={styles.dayContainer}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.dayDate}>{formatDate(dayDate)}</Text>
        </View>

        <View style={styles.mealsContainer}>
          {mealTypes.map(mealType => {
            const meal = dayMeals.find(m => m.mealType === mealType);
            
            return (
              <View key={mealType} style={styles.mealSlot}>
                <Text style={styles.mealTypeLabel}>
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </Text>
                
                {meal ? (
                  <TouchableOpacity 
                    style={styles.mealCard}
                    onPress={() => onMealPress(meal)}
                  >
                    <View style={styles.mealCardContent}>
                      <Text style={styles.mealName}>{meal.recipeName}</Text>
                      <Text style={styles.mealDetails}>
                        {meal.prepTime + meal.cookTime}min • {formatCurrency(meal.estimatedCost)}
                      </Text>
                      <Text style={styles.mealDescription} numberOfLines={2}>
                        {meal.description}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.swapButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        onSwapMeal(meal);
                      }}
                    >
                      <Text style={styles.swapButtonText}>↻</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyMealSlot}>
                    <Text style={styles.emptyMealText}>No meal planned</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  });
};

// Helper functions
const getBudgetStatusColor = (status: 'under' | 'at' | 'over'): string => {
  switch (status) {
    case 'under': return '#34C759';
    case 'at': return '#FF9500';
    case 'over': return '#FF3B30';
    default: return '#34C759';
  }
};

const getBudgetStatusText = (status: 'under' | 'at' | 'over'): string => {
  switch (status) {
    case 'under': return 'Under Budget ✓';
    case 'at': return 'At Budget';
    case 'over': return 'Over Budget';
    default: return 'Under Budget ✓';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#007AFF',
  },
  weekNavButton: {
    padding: 8,
  },
  weekNavText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekTitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  weekDate: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  budgetCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  savingsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  undoButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  undoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 16,
    color: '#666',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetStatus: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  budgetStatusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  calendarContainer: {
    paddingHorizontal: 16,
  },
  dayContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mealsContainer: {
    padding: 12,
  },
  mealSlot: {
    marginBottom: 12,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  mealCardContent: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mealDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  swapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyMealSlot: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  emptyMealText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  regenerateButton: {
    backgroundColor: '#34C759',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MealPlanScreen;