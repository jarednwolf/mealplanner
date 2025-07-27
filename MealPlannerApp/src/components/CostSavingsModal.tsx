import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MealPlan, UserProfile } from '../types';
import { costOptimizerService, CostOptimizationSuggestion, OptimizationResult } from '../services/costOptimizer';
import { formatCurrency } from '../utils';

interface CostSavingsModalProps {
  visible: boolean;
  onClose: () => void;
  mealPlan: MealPlan;
  userProfile: UserProfile;
  onOptimizationApplied: (optimizedMealPlan: MealPlan) => void;
}

export const CostSavingsModal: React.FC<CostSavingsModalProps> = ({
  visible,
  onClose,
  mealPlan,
  userProfile,
  onOptimizationApplied,
}) => {
  const [suggestions, setSuggestions] = useState<CostOptimizationSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'preview'>('suggestions');

  useEffect(() => {
    if (visible) {
      loadSuggestions();
    }
  }, [visible]);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      const optimizationSuggestions = await costOptimizerService.generateOptimizationSuggestions(
        mealPlan,
        userProfile,
        {
          maxSuggestions: 15,
          includeAdvanced: userProfile.cookingSkillLevel === 'advanced',
        }
      );
      setSuggestions(optimizationSuggestions);
    } catch (error) {
      console.error('Error loading cost optimization suggestions:', error);
      Alert.alert('Error', 'Failed to load cost-saving suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
    } else {
      newSelected.add(suggestionId);
    }
    setSelectedSuggestions(newSelected);
  };

  const previewOptimizations = async () => {
    if (selectedSuggestions.size === 0) {
      Alert.alert('No Selections', 'Please select at least one suggestion to preview.');
      return;
    }

    try {
      setIsLoading(true);
      const selectedSuggestionObjects = suggestions.filter(s => selectedSuggestions.has(s.id));
      const result = await costOptimizerService.applyOptimizations(
        mealPlan,
        selectedSuggestionObjects,
        userProfile
      );
      setOptimizationResult(result);
      setActiveTab('preview');
    } catch (error) {
      console.error('Error previewing optimizations:', error);
      Alert.alert('Error', 'Failed to preview optimizations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyOptimizations = async () => {
    if (!optimizationResult?.optimizedMealPlan) return;

    Alert.alert(
      'Apply Optimizations',
      `This will save you ${formatCurrency(optimizationResult.totalSavings)} (${optimizationResult.savingsPercentage.toFixed(1)}%). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            try {
              setIsApplying(true);
              onOptimizationApplied(optimizationResult.optimizedMealPlan);
              onClose();
            } catch (error) {
              console.error('Error applying optimizations:', error);
              Alert.alert('Error', 'Failed to apply optimizations. Please try again.');
            } finally {
              setIsApplying(false);
            }
          },
        },
      ]
    );
  };

  const renderSuggestionCard = (suggestion: CostOptimizationSuggestion) => {
    const isSelected = selectedSuggestions.has(suggestion.id);
    
    return (
      <TouchableOpacity
        key={suggestion.id}
        style={[styles.suggestionCard, isSelected && styles.selectedCard]}
        onPress={() => toggleSuggestion(suggestion.id)}
      >
        <View style={styles.suggestionHeader}>
          <View style={styles.suggestionTitleContainer}>
            <Text style={styles.suggestionType}>
              {getSuggestionTypeIcon(suggestion.type)} {getSuggestionTypeLabel(suggestion.type)}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(suggestion.priority) }]}>
              <Text style={styles.priorityText}>{suggestion.priority.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.savingsContainer}>
            <Text style={styles.savingsAmount}>
              Save {formatCurrency(suggestion.savings)}
            </Text>
            <Text style={styles.savingsPercentage}>
              ({suggestion.savingsPercentage.toFixed(1)}%)
            </Text>
          </View>
        </View>

        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        <Text style={styles.suggestionDescription}>{suggestion.description}</Text>

        <View style={styles.suggestionDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Difficulty:</Text>
            <Text style={[styles.detailValue, { color: getDifficultyColor(suggestion.difficulty) }]}>
              {suggestion.difficulty}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {suggestion.implementation.timeRequired}min
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Taste Impact:</Text>
            <Text style={styles.detailValue}>
              {suggestion.impact.tasteChange}
            </Text>
          </View>
        </View>

        {suggestion.replacement && (
          <View style={styles.replacementInfo}>
            <Text style={styles.replacementTitle}>
              Replacement: {suggestion.replacement.name}
            </Text>
            <Text style={styles.replacementReason}>
              {suggestion.replacement.reason}
            </Text>
          </View>
        )}

        <View style={styles.implementationSteps}>
          <Text style={styles.stepsTitle}>Implementation:</Text>
          {suggestion.implementation.steps.slice(0, 2).map((step, index) => (
            <Text key={index} style={styles.stepText}>
              {index + 1}. {step}
            </Text>
          ))}
          {suggestion.implementation.steps.length > 2 && (
            <Text style={styles.moreSteps}>
              +{suggestion.implementation.steps.length - 2} more steps
            </Text>
          )}
        </View>

        <View style={styles.selectionIndicator}>
          <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.selectionText}>
            {isSelected ? 'Selected' : 'Tap to select'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSuggestionsTab = () => (
    <ScrollView style={styles.suggestionsContainer}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Cost Optimization Suggestions</Text>
        <Text style={styles.summarySubtitle}>
          Select suggestions to preview your savings
        </Text>
      </View>

      {suggestions.length === 0 ? (
        <View style={styles.noSuggestionsContainer}>
          <Text style={styles.noSuggestionsTitle}>No Suggestions Available</Text>
          <Text style={styles.noSuggestionsText}>
            Your meal plan is already well-optimized for cost!
          </Text>
        </View>
      ) : (
        <>
          {suggestions.map(renderSuggestionCard)}
          
          {selectedSuggestions.size > 0 && (
            <View style={styles.selectionSummary}>
              <Text style={styles.selectionSummaryText}>
                {selectedSuggestions.size} suggestion{selectedSuggestions.size !== 1 ? 's' : ''} selected
              </Text>
              <Text style={styles.potentialSavings}>
                Potential savings: {formatCurrency(
                  suggestions
                    .filter(s => selectedSuggestions.has(s.id))
                    .reduce((sum, s) => sum + s.savings, 0)
                )}
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderPreviewTab = () => {
    if (!optimizationResult) return null;

    return (
      <ScrollView style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Optimization Preview</Text>
          <Text style={styles.previewSubtitle}>
            Review your optimized meal plan before applying
          </Text>
        </View>

        <View style={styles.savingsSummary}>
          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Original Cost:</Text>
            <Text style={styles.originalCost}>
              {formatCurrency(optimizationResult.originalCost)}
            </Text>
          </View>
          
          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Optimized Cost:</Text>
            <Text style={styles.optimizedCost}>
              {formatCurrency(optimizationResult.optimizedCost)}
            </Text>
          </View>
          
          <View style={[styles.savingsRow, styles.totalSavingsRow]}>
            <Text style={styles.totalSavingsLabel}>Total Savings:</Text>
            <Text style={styles.totalSavingsAmount}>
              {formatCurrency(optimizationResult.totalSavings)} ({optimizationResult.savingsPercentage.toFixed(1)}%)
            </Text>
          </View>
        </View>

        <View style={styles.appliedOptimizations}>
          <Text style={styles.appliedTitle}>Applied Optimizations:</Text>
          {optimizationResult.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.appliedItem}>
              <Text style={styles.appliedItemTitle}>{suggestion.title}</Text>
              <Text style={styles.appliedItemSavings}>
                {formatCurrency(suggestion.savings)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Cost Savings</Text>
          
          <View style={styles.headerActions}>
            {activeTab === 'suggestions' && selectedSuggestions.size > 0 && (
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={previewOptimizations}
                disabled={isLoading}
              >
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
            )}
            
            {activeTab === 'preview' && optimizationResult && (
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={applyOptimizations}
                disabled={isApplying}
              >
                <Text style={styles.applyButtonText}>
                  {isApplying ? 'Applying...' : 'Apply'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'suggestions' && styles.activeTab]}
            onPress={() => setActiveTab('suggestions')}
          >
            <Text style={[styles.tabText, activeTab === 'suggestions' && styles.activeTabText]}>
              Suggestions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
            onPress={() => setActiveTab('preview')}
            disabled={!optimizationResult}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'preview' && styles.activeTabText,
              !optimizationResult && styles.disabledTabText
            ]}>
              Preview
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {activeTab === 'suggestions' ? 'Finding savings opportunities...' : 'Calculating optimizations...'}
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'suggestions' && renderSuggestionsTab()}
            {activeTab === 'preview' && renderPreviewTab()}
          </>
        )}
      </View>
    </Modal>
  );
};

// Helper functions
const getSuggestionTypeIcon = (type: string): string => {
  switch (type) {
    case 'ingredient_swap': return '🔄';
    case 'meal_replacement': return '🍽️';
    case 'portion_adjustment': return '📏';
    case 'bulk_purchase': return '📦';
    case 'seasonal_swap': return '🌱';
    default: return '💰';
  }
};

const getSuggestionTypeLabel = (type: string): string => {
  switch (type) {
    case 'ingredient_swap': return 'Ingredient Swap';
    case 'meal_replacement': return 'Meal Replacement';
    case 'portion_adjustment': return 'Portion Adjustment';
    case 'bulk_purchase': return 'Bulk Purchase';
    case 'seasonal_swap': return 'Seasonal Alternative';
    default: return 'Optimization';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return '#FF3B30';
    case 'medium': return '#FF9500';
    case 'low': return '#34C759';
    default: return '#007AFF';
  }
};

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '#34C759';
    case 'medium': return '#FF9500';
    case 'hard': return '#FF3B30';
    default: return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    width: 80,
    alignItems: 'flex-end',
  },
  previewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
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
  disabledTabText: {
    color: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 16,
    color: '#666',
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionTitleContainer: {
    flex: 1,
  },
  suggestionType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  savingsContainer: {
    alignItems: 'flex-end',
  },
  savingsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  savingsPercentage: {
    fontSize: 12,
    color: '#34C759',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  replacementInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  replacementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  replacementReason: {
    fontSize: 12,
    color: '#666',
  },
  implementationSteps: {
    marginBottom: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  moreSteps: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  selectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkedBox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectionText: {
    fontSize: 14,
    color: '#666',
  },
  selectionSummary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectionSummaryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  potentialSavings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  noSuggestionsContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noSuggestionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noSuggestionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    padding: 16,
  },
  previewHeader: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  savingsSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalSavingsRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  savingsLabel: {
    fontSize: 16,
    color: '#666',
  },
  originalCost: {
    fontSize: 16,
    color: '#333',
    textDecorationLine: 'line-through',
  },
  optimizedCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalSavingsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalSavingsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  appliedOptimizations: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appliedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  appliedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appliedItemTitle: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  appliedItemSavings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
});

export default CostSavingsModal;