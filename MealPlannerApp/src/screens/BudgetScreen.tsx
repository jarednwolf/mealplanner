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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner, BudgetTracker } from '../components';
import { MealPlan } from '../types';
import { mealPlanService } from '../services/mealPlan';
import { budgetService, SavingsOpportunity, PriceComparison } from '../services/budget';
import { formatCurrency, formatDate } from '../utils';

type BudgetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Budget'>;

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<BudgetScreenNavigationProp>();
  const { userProfile } = useAuth();

  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [recentMealPlans, setRecentMealPlans] = useState<MealPlan[]>([]);
  const [priceComparisons, setPriceComparisons] = useState<PriceComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'current' | 'history' | 'prices'>('current');

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    if (!userProfile) return;

    try {
      setIsLoading(true);
      
      // Load recent meal plans
      const userMealPlans = await mealPlanService.getUserMealPlans(userProfile.userId);
      const sortedPlans = userMealPlans.sort((a, b) => 
        b.weekStartDate.getTime() - a.weekStartDate.getTime()
      );
      
      setCurrentMealPlan(sortedPlans[0] || null);
      setRecentMealPlans(sortedPlans.slice(0, 8)); // Last 8 weeks
      
      // Load price comparisons for current meal plan
      if (sortedPlans[0]) {
        const allIngredients = sortedPlans[0].meals.flatMap(meal => meal.ingredients);
        const uniqueIngredients = allIngredients.filter((ingredient, index, self) =>
          index === self.findIndex(i => i.name === ingredient.name)
        );
        
        const comparisons = await budgetService.compareIngredientPrices(uniqueIngredients);
        setPriceComparisons(comparisons);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      Alert.alert('Error', 'Failed to load budget data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBudgetData();
    setIsRefreshing(false);
  };

  const handleSavingsOpportunityPress = (opportunity: SavingsOpportunity) => {
    Alert.alert(
      'Savings Opportunity',
      `${opportunity.description}\n\n${opportunity.suggestion}\n\nPotential savings: ${formatCurrency(opportunity.potentialSavings)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Suggestion',
          onPress: () => {
            // TODO: Implement applying savings suggestions
            Alert.alert('Feature Coming Soon', 'Automatic savings application will be available soon!');
          },
        },
      ]
    );
  };

  const renderCurrentBudget = () => {
    if (!currentMealPlan || !userProfile) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Current Meal Plan</Text>
          <Text style={styles.emptyDescription}>
            Create a meal plan to start tracking your budget
          </Text>
          <TouchableOpacity 
            style={styles.createPlanButton}
            onPress={() => navigation.navigate('MealPlan', {})}
          >
            <Text style={styles.createPlanButtonText}>Create Meal Plan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.currentBudgetContainer}>
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>Current Week</Text>
          <Text style={styles.planDate}>
            {formatDate(currentMealPlan.weekStartDate)}
          </Text>
        </View>
        
        <BudgetTracker
          mealPlan={currentMealPlan}
          userProfile={userProfile}
          onSavingsOpportunityPress={handleSavingsOpportunityPress}
        />
      </View>
    );
  };

  const renderBudgetHistory = () => {
    if (recentMealPlans.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Budget History</Text>
          <Text style={styles.emptyDescription}>
            Your budget history will appear here as you create meal plans
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Budget History</Text>
        
        {recentMealPlans.map((plan, index) => (
          <View key={plan.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyWeek}>
                Week of {formatDate(plan.weekStartDate)}
              </Text>
              <Text style={[
                styles.historyStatus,
                { color: getBudgetStatusColor(plan.budgetStatus) }
              ]}>
                {getBudgetStatusText(plan.budgetStatus)}
              </Text>
            </View>
            
            <View style={styles.historyDetails}>
              <Text style={styles.historyDetail}>
                Spent: {formatCurrency(plan.totalEstimatedCost)}
              </Text>
              <Text style={styles.historyDetail}>
                Budget: {formatCurrency(userProfile?.weeklyBudget || 0)}
              </Text>
              <Text style={styles.historyDetail}>
                {plan.budgetStatus === 'over' 
                  ? `Over by: ${formatCurrency(plan.totalEstimatedCost - (userProfile?.weeklyBudget || 0))}`
                  : `Saved: ${formatCurrency((userProfile?.weeklyBudget || 0) - plan.totalEstimatedCost)}`
                }
              </Text>
            </View>
            
            <View style={styles.historyProgress}>
              <View 
                style={[
                  styles.historyProgressBar,
                  { 
                    width: `${Math.min((plan.totalEstimatedCost / (userProfile?.weeklyBudget || 1)) * 100, 100)}%`,
                    backgroundColor: getBudgetStatusColor(plan.budgetStatus)
                  }
                ]}
              />
            </View>
          </View>
        ))}
        
        {/* Budget Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>8-Week Summary</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Average Weekly Spend</Text>
              <Text style={styles.summaryStatValue}>
                {formatCurrency(
                  recentMealPlans.reduce((sum, plan) => sum + plan.totalEstimatedCost, 0) / 
                  recentMealPlans.length
                )}
              </Text>
            </View>
            
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Total Saved</Text>
              <Text style={[styles.summaryStatValue, { color: '#34C759' }]}>
                {formatCurrency(
                  recentMealPlans.reduce((sum, plan) => {
                    const saved = (userProfile?.weeklyBudget || 0) - plan.totalEstimatedCost;
                    return sum + (saved > 0 ? saved : 0);
                  }, 0)
                )}
              </Text>
            </View>
            
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Weeks Under Budget</Text>
              <Text style={styles.summaryStatValue}>
                {recentMealPlans.filter(plan => plan.budgetStatus === 'under').length} / {recentMealPlans.length}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPriceComparisons = () => {
    if (priceComparisons.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Price Data</Text>
          <Text style={styles.emptyDescription}>
            Price comparisons will appear here when you have a meal plan
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.pricesContainer}>
        <Text style={styles.sectionTitle}>Ingredient Price Analysis</Text>
        
        {priceComparisons.map((comparison, index) => (
          <View key={index} style={styles.priceItem}>
            <View style={styles.priceHeader}>
              <Text style={styles.priceIngredient}>{comparison.ingredient}</Text>
              <View style={styles.priceStatus}>
                {comparison.isExpensive ? (
                  <Text style={styles.expensiveTag}>Expensive</Text>
                ) : (
                  <Text style={styles.goodPriceTag}>Good Price</Text>
                )}
              </View>
            </View>
            
            <View style={styles.priceDetails}>
              <Text style={styles.priceDetail}>
                Current: {formatCurrency(comparison.currentPrice)}
              </Text>
              <Text style={styles.priceDetail}>
                Average: {formatCurrency(comparison.averagePrice)}
              </Text>
            </View>
            
            {comparison.alternatives.length > 0 && (
              <View style={styles.alternativesContainer}>
                <Text style={styles.alternativesTitle}>Alternatives:</Text>
                {comparison.alternatives.slice(0, 2).map((alt, altIndex) => (
                  <View key={altIndex} style={styles.alternativeItem}>
                    <Text style={styles.alternativeName}>{alt.name}</Text>
                    <Text style={styles.alternativePrice}>
                      {formatCurrency(alt.price)} (Save {formatCurrency(alt.savings)})
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  if (!userProfile) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading budget data..." />;
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'current' && styles.activeTab]}
          onPress={() => setSelectedTab('current')}
        >
          <Text style={[styles.tabText, selectedTab === 'current' && styles.activeTabText]}>
            Current
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'prices' && styles.activeTab]}
          onPress={() => setSelectedTab('prices')}
        >
          <Text style={[styles.tabText, selectedTab === 'prices' && styles.activeTabText]}>
            Prices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'current' && renderCurrentBudget()}
        {selectedTab === 'history' && renderBudgetHistory()}
        {selectedTab === 'prices' && renderPriceComparisons()}
      </ScrollView>
    </View>
  );
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
    case 'under': return 'Under Budget';
    case 'at': return 'At Budget';
    case 'over': return 'Over Budget';
    default: return 'Under Budget';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  currentBudgetContainer: {
    padding: 16,
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  planDate: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createPlanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPlanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyWeek: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyDetail: {
    fontSize: 12,
    color: '#666',
  },
  historyProgress: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  historyProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pricesContainer: {
    padding: 16,
  },
  priceItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceIngredient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceStatus: {
    alignItems: 'flex-end',
  },
  expensiveTag: {
    backgroundColor: '#FF3B30',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  goodPriceTag: {
    backgroundColor: '#34C759',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceDetail: {
    fontSize: 14,
    color: '#666',
  },
  alternativesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  alternativeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alternativeName: {
    fontSize: 14,
    color: '#333',
  },
  alternativePrice: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
});

export default BudgetScreen;