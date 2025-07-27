import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MealPlan, UserProfile } from '../types';
import { budgetService, BudgetAnalysis, SavingsOpportunity } from '../services/budget';
import { formatCurrency } from '../utils';

interface BudgetTrackerProps {
  mealPlan: MealPlan;
  userProfile: UserProfile;
  onSavingsOpportunityPress?: (opportunity: SavingsOpportunity) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  mealPlan,
  userProfile,
  onSavingsOpportunityPress,
}) => {
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    analyzeBudget();
  }, [mealPlan]);

  const analyzeBudget = async () => {
    try {
      setIsLoading(true);
      const analysis = await budgetService.analyzeBudget(mealPlan, userProfile);
      setBudgetAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBudgetProgress = () => {
    if (!budgetAnalysis) return null;

    const progressWidth = Math.min(budgetAnalysis.budgetPercentage, 100);
    const progressColor = getBudgetProgressColor(budgetAnalysis.budgetStatus);

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Budget Usage</Text>
          <Text style={styles.progressPercentage}>
            {budgetAnalysis.budgetPercentage}%
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progressWidth}%`, 
                backgroundColor: progressColor 
              }
            ]} 
          />
        </View>
        
        <View style={styles.progressFooter}>
          <Text style={styles.progressText}>
            {formatCurrency(budgetAnalysis.totalCost)} of {formatCurrency(userProfile.weeklyBudget)}
          </Text>
          <Text style={[styles.statusText, { color: progressColor }]}>
            {getBudgetStatusText(budgetAnalysis.budgetStatus)}
          </Text>
        </View>
      </View>
    );
  };

  const renderCostBreakdown = () => {
    if (!budgetAnalysis || !showDetails) return null;

    const mealTypes = Object.entries(budgetAnalysis.costBreakdown);
    const categories = Object.entries(budgetAnalysis.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        
        {/* Meal Type Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownSubtitle}>By Meal Type</Text>
          {mealTypes.map(([mealType, cost]) => (
            <View key={mealType} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(cost)}
              </Text>
            </View>
          ))}
        </View>

        {/* Category Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownSubtitle}>By Category</Text>
          {categories.map(([category, cost]) => (
            <View key={category} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>{category}</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(cost)}
              </Text>
            </View>
          ))}
        </View>

        {/* Daily Average */}
        <View style={styles.dailyAverageContainer}>
          <Text style={styles.dailyAverageLabel}>Daily Average</Text>
          <Text style={styles.dailyAverageValue}>
            {formatCurrency(budgetAnalysis.dailyAverage)}
          </Text>
        </View>
      </View>
    );
  };

  const renderSavingsOpportunities = () => {
    if (!budgetAnalysis || budgetAnalysis.savingsOpportunities.length === 0) return null;

    return (
      <View style={styles.savingsContainer}>
        <Text style={styles.sectionTitle}>Savings Opportunities</Text>
        
        {budgetAnalysis.savingsOpportunities.map((opportunity, index) => (
          <TouchableOpacity
            key={index}
            style={styles.savingsItem}
            onPress={() => onSavingsOpportunityPress?.(opportunity)}
          >
            <View style={styles.savingsContent}>
              <View style={styles.savingsHeader}>
                <Text style={styles.savingsType}>
                  {getSavingsTypeIcon(opportunity.type)} {getSavingsTypeLabel(opportunity.type)}
                </Text>
                <Text style={styles.savingsAmount}>
                  Save {formatCurrency(opportunity.potentialSavings)}
                </Text>
              </View>
              
              <Text style={styles.savingsDescription}>
                {opportunity.description}
              </Text>
              
              <Text style={styles.savingsSuggestion}>
                {opportunity.suggestion}
              </Text>
            </View>
            
            <View style={styles.savingsArrow}>
              <Text style={styles.savingsArrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderBudgetRecommendations = () => {
    if (!budgetAnalysis) return null;

    const recommendations = budgetService.getBudgetRecommendations(mealPlan, userProfile);
    
    if (recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>Budget Tips</Text>
        
        {recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationIcon}>💡</Text>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Analyzing budget...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderBudgetProgress()}
      
      <TouchableOpacity 
        style={styles.detailsToggle}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Text>
        <Text style={styles.detailsToggleIcon}>
          {showDetails ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {renderCostBreakdown()}
      {renderSavingsOpportunities()}
      {renderBudgetRecommendations()}
    </ScrollView>
  );
};

// Helper functions
const getBudgetProgressColor = (status: 'under' | 'at' | 'over'): string => {
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

const getSavingsTypeIcon = (type: string): string => {
  switch (type) {
    case 'ingredient_substitution': return '🔄';
    case 'meal_swap': return '🍽️';
    case 'portion_adjustment': return '📏';
    default: return '💰';
  }
};

const getSavingsTypeLabel = (type: string): string => {
  switch (type) {
    case 'ingredient_substitution': return 'Ingredient Swap';
    case 'meal_swap': return 'Meal Replacement';
    case 'portion_adjustment': return 'Portion Adjustment';
    default: return 'Savings';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailsToggleText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 8,
  },
  detailsToggleIcon: {
    fontSize: 12,
    color: '#007AFF',
  },
  breakdownContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  breakdownSection: {
    marginBottom: 20,
  },
  breakdownSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#333',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  dailyAverageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  dailyAverageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dailyAverageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  savingsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  savingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  savingsContent: {
    flex: 1,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savingsType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  savingsAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  savingsDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  savingsSuggestion: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  savingsArrow: {
    marginLeft: 12,
  },
  savingsArrowText: {
    fontSize: 18,
    color: '#ccc',
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default BudgetTracker;