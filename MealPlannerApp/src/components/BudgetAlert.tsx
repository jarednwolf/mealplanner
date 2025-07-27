import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { MealPlan, UserProfile } from '../types';
import { costOptimizerService, CostOptimizationSuggestion } from '../services/costOptimizer';
import { formatCurrency } from '../utils';

interface BudgetAlertProps {
  mealPlan: MealPlan;
  userProfile: UserProfile;
  onOptimizationRequested: () => void;
  onDismiss?: () => void;
}

export const BudgetAlert: React.FC<BudgetAlertProps> = ({
  mealPlan,
  userProfile,
  onOptimizationRequested,
  onDismiss,
}) => {
  const [quickSuggestions, setQuickSuggestions] = useState<CostOptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [isVisible, setIsVisible] = useState(false);

  const budgetExcess = mealPlan.totalEstimatedCost - userProfile.weeklyBudget;
  const isOverBudget = budgetExcess > 0;
  const isNearBudget = budgetExcess > -10 && budgetExcess <= 0; // Within $10 of budget

  useEffect(() => {
    if (isOverBudget || isNearBudget) {
      setIsVisible(true);
      loadQuickSuggestions();
      
      // Animate in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      setIsVisible(false);
    }
  }, [mealPlan.totalEstimatedCost, userProfile.weeklyBudget]);

  const loadQuickSuggestions = async () => {
    try {
      setIsLoading(true);
      const suggestions = await costOptimizerService.generateOptimizationSuggestions(
        mealPlan,
        userProfile,
        { maxSuggestions: 3, priorityThreshold: 'medium' }
      );
      setQuickSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading quick suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  const handleViewAllSuggestions = () => {
    onOptimizationRequested();
  };

  const handleQuickFix = () => {
    if (quickSuggestions.length === 0) {
      Alert.alert(
        'No Quick Fixes Available',
        'Let\'s look at all available cost-saving options.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Options', onPress: onOptimizationRequested },
        ]
      );
      return;
    }

    const topSuggestion = quickSuggestions[0];
    Alert.alert(
      'Quick Fix Suggestion',
      `${topSuggestion.title}\n\n${topSuggestion.description}\n\nThis could save you ${formatCurrency(topSuggestion.savings)}.`,
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'View All Options', onPress: onOptimizationRequested },
      ]
    );
  };

  if (!isVisible) {
    return null;
  }

  const getAlertStyle = () => {
    if (isOverBudget) {
      return {
        backgroundColor: '#FFE5E5',
        borderColor: '#FF6B6B',
        iconColor: '#FF6B6B',
        textColor: '#D63031',
      };
    } else {
      return {
        backgroundColor: '#FFF3CD',
        borderColor: '#FFD93D',
        iconColor: '#FFD93D',
        textColor: '#856404',
      };
    }
  };

  const alertStyle = getAlertStyle();
  const potentialSavings = quickSuggestions.reduce((sum, s) => sum + s.savings, 0);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: alertStyle.backgroundColor,
          borderColor: alertStyle.borderColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { color: alertStyle.iconColor }]}>
            {isOverBudget ? '⚠️' : '💡'}
          </Text>
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: alertStyle.textColor }]}>
            {isOverBudget ? 'Over Budget' : 'Budget Alert'}
          </Text>
          <Text style={[styles.subtitle, { color: alertStyle.textColor }]}>
            {isOverBudget
              ? `You're ${formatCurrency(budgetExcess)} over your weekly budget`
              : `You're close to your budget limit`
            }
          </Text>
        </View>
        
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.budgetBreakdown}>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>Current Total:</Text>
            <Text style={[styles.budgetValue, { color: alertStyle.textColor }]}>
              {formatCurrency(mealPlan.totalEstimatedCost)}
            </Text>
          </View>
          
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>Weekly Budget:</Text>
            <Text style={styles.budgetValue}>
              {formatCurrency(userProfile.weeklyBudget)}
            </Text>
          </View>
          
          {potentialSavings > 0 && (
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Potential Savings:</Text>
              <Text style={[styles.budgetValue, styles.savingsValue]}>
                {formatCurrency(potentialSavings)}
              </Text>
            </View>
          )}
        </View>

        {quickSuggestions.length > 0 && (
          <View style={styles.quickSuggestion}>
            <Text style={styles.quickSuggestionTitle}>Quick Fix:</Text>
            <Text style={styles.quickSuggestionText}>
              {quickSuggestions[0].title} - Save {formatCurrency(quickSuggestions[0].savings)}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleQuickFix}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>
              {isLoading ? 'Loading...' : 'Quick Fix'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleViewAllSuggestions}
          >
            <Text style={styles.primaryButtonText}>View All Options</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  budgetBreakdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  savingsValue: {
    color: '#34C759',
  },
  quickSuggestion: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  quickSuggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  quickSuggestionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BudgetAlert;