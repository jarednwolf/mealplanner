import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Meal, UserProfile } from '../types';
import { mealPlanOrchestratorService } from '../services/mealPlanOrchestrator';
import { recipeService } from '../services/recipe';
import { formatCurrency } from '../utils';

interface MealSwapModalProps {
  visible: boolean;
  onClose: () => void;
  originalMeal: Meal;
  userProfile: UserProfile;
  onMealSwapped: (newMeal: Meal) => void;
}

interface SwapOption {
  meal: Meal;
  reason: string;
}

export const MealSwapModal: React.FC<MealSwapModalProps> = ({
  visible,
  onClose,
  originalMeal,
  userProfile,
  onMealSwapped,
}) => {
  const [swapOptions, setSwapOptions] = useState<SwapOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
    maxCost?: number;
    maxPrepTime?: number;
    cuisines: string[];
    excludeIngredients: string[];
  }>({
    cuisines: [],
    excludeIngredients: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (visible) {
      generateSwapOptions();
    }
  }, [visible]);

  const generateSwapOptions = async () => {
    setIsLoading(true);
    try {
      // Generate multiple swap options
      const options: SwapOption[] = [];
      
      // Option 1: Similar cuisine, similar cost
      try {
        const similarMeal = await mealPlanOrchestratorService.swapMeal(
          originalMeal.id,
          userProfile,
          {
            preferredCuisines: userProfile.cuisinePreferences,
            maxCost: originalMeal.estimatedCost * 1.1,
          }
        );
        options.push({
          meal: similarMeal,
          reason: 'Similar cuisine and cost',
        });
      } catch (error) {
        console.log('Failed to generate similar meal option');
      }

      // Option 2: Faster preparation
      try {
        const quickMeal = await mealPlanOrchestratorService.swapMeal(
          originalMeal.id,
          userProfile,
          {
            maxPrepTime: Math.max(15, originalMeal.prepTime - 10),
          }
        );
        options.push({
          meal: quickMeal,
          reason: 'Faster to prepare',
        });
      } catch (error) {
        console.log('Failed to generate quick meal option');
      }

      // Option 3: Budget-friendly
      try {
        const budgetMeal = await mealPlanOrchestratorService.swapMeal(
          originalMeal.id,
          userProfile,
          {
            maxCost: originalMeal.estimatedCost * 0.8,
          }
        );
        options.push({
          meal: budgetMeal,
          reason: 'More budget-friendly',
        });
      } catch (error) {
        console.log('Failed to generate budget meal option');
      }

      // If we have search query, try to find matching recipes
      if (searchQuery.trim()) {
        try {
          const searchResults = await recipeService.searchRecipes({
            query: searchQuery,
            diet: userProfile.dietaryRestrictions,
            maxReadyTime: userProfile.cookingTimePreference.weekday,
            number: 3,
          });

          for (const recipe of searchResults) {
            const adaptedMeal: Meal = {
              id: `meal_${Date.now()}_${Math.random()}`,
              dayOfWeek: originalMeal.dayOfWeek,
              mealType: originalMeal.mealType,
              recipeName: recipe.name,
              description: recipe.description,
              prepTime: recipe.prepTime,
              cookTime: recipe.cookTime,
              servings: userProfile.householdSize,
              estimatedCost: recipe.costEstimate || originalMeal.estimatedCost,
              ingredients: recipe.ingredients.map(ing => ({
                ...ing,
                estimatedPrice: ing.estimatedPrice || 0,
              })),
              recipeId: recipe.id,
            };

            options.push({
              meal: adaptedMeal,
              reason: 'Matches your search',
            });
          }
        } catch (error) {
          console.log('Failed to search recipes');
        }
      }

      setSwapOptions(options);
    } catch (error) {
      console.error('Error generating swap options:', error);
      Alert.alert('Error', 'Failed to generate meal alternatives. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapMeal = (newMeal: Meal) => {
    Alert.alert(
      'Confirm Swap',
      `Replace "${originalMeal.recipeName}" with "${newMeal.recipeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Swap',
          onPress: () => {
            onMealSwapped(newMeal);
            onClose();
          },
        },
      ]
    );
  };

  const toggleCuisineFilter = (cuisine: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine],
    }));
  };

  const applyFilters = () => {
    generateSwapOptions();
    setShowFilters(false);
  };

  const renderMealOption = (option: SwapOption, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.mealOption}
      onPress={() => handleSwapMeal(option.meal)}
    >
      <View style={styles.mealOptionContent}>
        <View style={styles.mealOptionHeader}>
          <Text style={styles.mealOptionName}>{option.meal.recipeName}</Text>
          <Text style={styles.mealOptionReason}>{option.reason}</Text>
        </View>
        
        <Text style={styles.mealOptionDescription} numberOfLines={2}>
          {option.meal.description}
        </Text>
        
        <View style={styles.mealOptionDetails}>
          <Text style={styles.mealOptionDetail}>
            ⏱ {option.meal.prepTime + option.meal.cookTime}min
          </Text>
          <Text style={styles.mealOptionDetail}>
            💰 {formatCurrency(option.meal.estimatedCost)}
          </Text>
          <Text style={styles.mealOptionDetail}>
            🍽 {option.meal.servings} servings
          </Text>
        </View>
        
        <View style={styles.costComparison}>
          {option.meal.estimatedCost < originalMeal.estimatedCost ? (
            <Text style={styles.costSavings}>
              Save {formatCurrency(originalMeal.estimatedCost - option.meal.estimatedCost)}
            </Text>
          ) : option.meal.estimatedCost > originalMeal.estimatedCost ? (
            <Text style={styles.costIncrease}>
              +{formatCurrency(option.meal.estimatedCost - originalMeal.estimatedCost)}
            </Text>
          ) : (
            <Text style={styles.costSame}>Same cost</Text>
          )}
        </View>
      </View>
      
      <View style={styles.swapButtonContainer}>
        <Text style={styles.swapButtonText}>Swap</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Filter Options</Text>
      
      {/* Max Cost Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Max Cost</Text>
        <TextInput
          style={styles.filterInput}
          placeholder={`$${originalMeal.estimatedCost.toFixed(2)}`}
          value={selectedFilters.maxCost?.toString() || ''}
          onChangeText={(text) => {
            const cost = parseFloat(text);
            setSelectedFilters(prev => ({
              ...prev,
              maxCost: isNaN(cost) ? undefined : cost,
            }));
          }}
          keyboardType="numeric"
        />
      </View>

      {/* Max Prep Time Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Max Prep Time (minutes)</Text>
        <TextInput
          style={styles.filterInput}
          placeholder={originalMeal.prepTime.toString()}
          value={selectedFilters.maxPrepTime?.toString() || ''}
          onChangeText={(text) => {
            const time = parseInt(text);
            setSelectedFilters(prev => ({
              ...prev,
              maxPrepTime: isNaN(time) ? undefined : time,
            }));
          }}
          keyboardType="numeric"
        />
      </View>

      {/* Cuisine Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Preferred Cuisines</Text>
        <View style={styles.cuisineFilters}>
          {['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian'].map(cuisine => (
            <TouchableOpacity
              key={cuisine}
              style={[
                styles.cuisineFilter,
                selectedFilters.cuisines.includes(cuisine) && styles.cuisineFilterSelected,
              ]}
              onPress={() => toggleCuisineFilter(cuisine)}
            >
              <Text style={[
                styles.cuisineFilterText,
                selectedFilters.cuisines.includes(cuisine) && styles.cuisineFilterTextSelected,
              ]}>
                {cuisine}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.applyFiltersButton} onPress={applyFilters}>
        <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Swap Meal</Text>
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.originalMealContainer}>
          <Text style={styles.originalMealLabel}>Replacing:</Text>
          <Text style={styles.originalMealName}>{originalMeal.recipeName}</Text>
          <Text style={styles.originalMealDetails}>
            {originalMeal.prepTime + originalMeal.cookTime}min • {formatCurrency(originalMeal.estimatedCost)}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for specific recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={generateSwapOptions}
          />
          <TouchableOpacity style={styles.searchButton} onPress={generateSwapOptions}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {showFilters && renderFilters()}

        <ScrollView style={styles.optionsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Finding alternatives...</Text>
            </View>
          ) : swapOptions.length > 0 ? (
            <>
              <Text style={styles.optionsTitle}>Alternative Meals</Text>
              {swapOptions.map(renderMealOption)}
            </>
          ) : (
            <View style={styles.noOptionsContainer}>
              <Text style={styles.noOptionsText}>No alternatives found</Text>
              <Text style={styles.noOptionsSubtext}>
                Try adjusting your filters or search for something specific
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
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
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  originalMealContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  originalMealLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  originalMealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  originalMealDetails: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 16,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  cuisineFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  cuisineFilterSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  cuisineFilterText: {
    fontSize: 14,
    color: '#666',
  },
  cuisineFilterTextSelected: {
    color: '#fff',
  },
  applyFiltersButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyFiltersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  mealOption: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealOptionContent: {
    flex: 1,
  },
  mealOptionHeader: {
    marginBottom: 8,
  },
  mealOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  mealOptionReason: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  mealOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  mealOptionDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mealOptionDetail: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  costComparison: {
    alignSelf: 'flex-start',
  },
  costSavings: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  costIncrease: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  costSame: {
    fontSize: 12,
    color: '#666',
  },
  swapButtonContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: 12,
  },
  swapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noOptionsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noOptionsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noOptionsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MealSwapModal;